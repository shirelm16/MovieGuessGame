import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../src/data/ratings.csv');
const OUT_PATH = path.join(__dirname, '../src/data/movies.json');

const OMDB_KEY = process.env.OMDB_API_KEY;
const TMDB_KEY = process.env.TMDB_API_KEY;

if (!OMDB_KEY) {
  console.error('Missing OMDB_API_KEY. Run: OMDB_API_KEY=xxx TMDB_API_KEY=yyy node scripts/buildMovieData.js');
  process.exit(1);
}

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.split('\n').filter(Boolean);
  const headers = parseCsvRow(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCsvRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

function parseCsvRow(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// ── OMDb ───────────────────────────────────────────────────────────────────────

// Throws with code 'RATE_LIMITED' when the daily quota is exhausted so callers
// can fall back to TMDb instead of skipping the movie entirely.
async function fetchOmdb(imdbId) {
  const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`);
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch (_) {}
    const msg = body.Error ?? `HTTP ${res.status}`;
    if (res.status === 401 && /limit/i.test(msg)) {
      const err = new Error(`OMDb rate limit reached`);
      err.code = 'RATE_LIMITED';
      throw err;
    }
    throw new Error(`OMDb ${res.status}: ${msg}`);
  }
  return res.json();
}

function parseBoxOffice(str) {
  if (!str || str === 'N/A') return null;
  return parseInt(str.replace(/[$,]/g, ''), 10) || null;
}

function parseActors(str) {
  if (!str || str === 'N/A') return [];
  return str.split(',').map(s => s.trim()).slice(0, 4);
}

function parseGenres(str) {
  if (!str || str === 'N/A') return [];
  return str.split(',').map(s => s.trim());
}

// ── TMDb (studio + box office + hints enrichment) ─────────────────────────────

async function fetchTmdbData(imdbId) {
  // Step 1: resolve IMDb ID → TMDb ID
  const findRes = await fetch(
    `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&api_key=${TMDB_KEY}`
  );
  if (!findRes.ok) return null;
  const findData = await findRes.json();
  const tmdbId = findData.movie_results?.[0]?.id;
  if (!tmdbId) return null;

  // Step 2: get details + credits in one call
  const detailRes = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=credits`
  );
  if (!detailRes.ok) return null;
  const detail = await detailRes.json();

  const director = detail.credits?.crew?.find(c => c.job === 'Director');
  const leadActor = detail.credits?.cast?.[0];
  const cast = (detail.credits?.cast ?? []).slice(0, 4).map(a => a.name);

  return {
    studio: detail.production_companies?.[0]?.name ?? null,
    boxOffice: detail.revenue > 0 ? detail.revenue : null,
    tagline: detail.tagline || null,
    directorId: director?.id ?? null,
    director: director?.name ?? null,
    cast,
    poster: detail.poster_path
      ? `https://image.tmdb.org/t/p/w300${detail.poster_path}`
      : null,
    leadActorPhoto: leadActor?.profile_path
      ? `https://image.tmdb.org/t/p/w185${leadActor.profile_path}`
      : null,
    tmdbId,
  };
}

// Per-director filmography cache — avoids redundant API calls for shared directors
const directorFilmographyCache = {};

async function getFilmographyData(directorId, currentTmdbId) {
  if (!directorId) return null;
  if (!(directorId in directorFilmographyCache)) {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${directorId}/movie_credits?api_key=${TMDB_KEY}`
    );
    await new Promise(r => setTimeout(r, 200));
    if (!res.ok) {
      directorFilmographyCache[directorId] = [];
    } else {
      const data = await res.json();
      directorFilmographyCache[directorId] = (data.crew ?? [])
        .filter(c => c.job === 'Director' && c.vote_count > 100)
        .sort((a, b) => b.vote_count - a.vote_count)
        .map(c => ({ id: c.id, title: c.title, posterPath: c.poster_path ?? null }));
    }
  }
  const other = directorFilmographyCache[directorId].find(f => f.id !== currentTmdbId);
  if (!other) return null;
  return {
    title: other.title,
    poster: other.posterPath ? `https://image.tmdb.org/t/p/w92${other.posterPath}` : null,
  };
}

async function enrichFromTmdb(results) {
  if (!TMDB_KEY) {
    console.log('\nNo TMDB_API_KEY — skipping TMDb enrichment.');
    return results;
  }

  const toEnrich = results.filter(m => !m.studio || !m.boxOffice || !('tagline' in m) || !('filmographyPoster' in m) || !m.cast?.length || !m.poster);
  console.log(`\nEnriching ${toEnrich.length} movies via TMDb...`);

  let studioCount = 0, boxOfficeCount = 0, taglineCount = 0, photoCount = 0, filmographyCount = 0;
  for (let i = 0; i < results.length; i++) {
    const movie = results[i];
    if (movie.studio && movie.boxOffice && 'tagline' in movie && 'filmographyPoster' in movie && movie.cast?.length && movie.poster) continue;

    try {
      process.stdout.write(`\r  [${i + 1}/${results.length}] ${movie.title}          `);
      const tmdb = await fetchTmdbData(movie.id);
      if (tmdb) {
        const updated = { ...movie };
        if (!movie.studio && tmdb.studio)         { updated.studio = tmdb.studio; studioCount++; }
        if (!movie.boxOffice && tmdb.boxOffice)   { updated.boxOffice = tmdb.boxOffice; boxOfficeCount++; }
        if (!movie.cast?.length && tmdb.cast?.length) updated.cast = tmdb.cast;
        if (!movie.director && tmdb.director)     updated.director = tmdb.director;
        if (!movie.poster && tmdb.poster)         updated.poster = tmdb.poster;
        updated.tagline = tmdb.tagline;
        if (tmdb.tagline) taglineCount++;
        updated.directorId = tmdb.directorId;
        updated.leadActorPhoto = tmdb.leadActorPhoto;
        if (tmdb.leadActorPhoto) photoCount++;
        updated.tmdbId = tmdb.tmdbId;
        const filmography = await getFilmographyData(tmdb.directorId, tmdb.tmdbId);
        updated.filmographyTitle = filmography?.title ?? null;
        updated.filmographyPoster = filmography?.poster ?? null;
        if (updated.filmographyTitle) filmographyCount++;
        results[i] = updated;
      }
      // TMDb free tier: 40 req/10s. Two calls per movie → ~3 movies/s
      await new Promise(r => setTimeout(r, 350));
    } catch (err) {
      // non-fatal — leave fields as null
    }
  }

  console.log(`\nTMDb — studio: ${studioCount}, box office: ${boxOfficeCount}, taglines: ${taglineCount}, photos: ${photoCount}, filmography: ${filmographyCount}`);
  return results;
}

// ── Wikidata fallback (box office only) ────────────────────────────────────────
// Catches limited/foreign releases that TMDb lists as revenue=0

async function fetchWikidataBoxOffice(imdbId) {
  const query = `
    SELECT ?boxOffice WHERE {
      ?film wdt:P345 "${imdbId}" .
      ?film wdt:P2142 ?boxOffice .
    } LIMIT 1
  `;
  const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(query) + '&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'FilmGuess/1.0' } });
  if (!res.ok) return null;
  const data = await res.json();
  const val = data.results?.bindings?.[0]?.boxOffice?.value;
  return val ? Math.round(parseFloat(val)) : null;
}

async function enrichBoxOfficeFromWikidata(results) {
  const toEnrich = results.filter(m => !m.boxOffice);
  if (!toEnrich.length) return results;

  console.log(`\nFetching box office for ${toEnrich.length} remaining movies via Wikidata...`);
  let filled = 0;

  for (let i = 0; i < results.length; i++) {
    const movie = results[i];
    if (movie.boxOffice) continue;

    try {
      process.stdout.write(`\r  [${i + 1}/${results.length}] ${movie.title}          `);
      const boxOffice = await fetchWikidataBoxOffice(movie.id);
      if (boxOffice) {
        results[i] = { ...movie, boxOffice };
        filled++;
      }
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      // non-fatal
    }
  }

  console.log(`\nWikidata — box office filled: ${filled}/${toEnrich.length}`);
  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(csv);
  const movies = rows.filter(r => r['Title Type'] === 'Movie' || r['Title Type'] === 'movie');
  console.log(`Found ${movies.length} movies in CSV`);

  let existing = {};
  if (fs.existsSync(OUT_PATH)) {
    const prev = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    existing = Object.fromEntries(prev.map(m => [m.id, m]));
    console.log(`Loaded ${prev.length} cached entries`);
  }

  const results = [];
  const seen = new Set();
  let omdbRateLimited = false;

  // Phase 1: OMDb fetch (skips cached entries; falls back to CSV stub on rate limit)
  for (let i = 0; i < movies.length; i++) {
    const row = movies[i];
    const id = row['Const'];
    if (!id || seen.has(id)) continue;
    seen.add(id);

    if (existing[id]) {
      results.push(existing[id]);
      process.stdout.write(`\r[${i + 1}/${movies.length}] cached: ${row['Title']}          `);
      continue;
    }

    if (omdbRateLimited) {
      // OMDb quota exhausted — build a stub from CSV; TMDb will fill the rest
      results.push({
        id,
        title: row['Title'],
        year: parseInt(row['Year']) || null,
        director: row['Directors'] || null,
        cast: [],
        genres: parseGenres(row['Genres']),
        rating: null,
        imdbScore: parseFloat(row['IMDb Rating']) || null,
        boxOffice: null,
        studio: null,
        poster: null,
      });
      continue;
    }

    try {
      process.stdout.write(`\r[${i + 1}/${movies.length}] fetching: ${row['Title']}          `);
      const omdb = await fetchOmdb(id);

      if (omdb.Response === 'False') {
        console.log(`\nOMDb miss for ${id} (${row['Title']}), skipping`);
        continue;
      }

      results.push({
        id,
        title: row['Title'] || omdb.Title,
        year: parseInt(row['Year']) || parseInt(omdb.Year) || null,
        director: row['Directors'] || omdb.Director || null,
        cast: parseActors(omdb.Actors),
        genres: parseGenres(omdb.Genre || row['Genres']),
        rating: omdb.Rated !== 'N/A' ? omdb.Rated : null,
        imdbScore: parseFloat(row['IMDb Rating']) || parseFloat(omdb.imdbRating) || null,
        boxOffice: parseBoxOffice(omdb.BoxOffice),
        studio: omdb.Production !== 'N/A' ? omdb.Production : null,
        poster: omdb.Poster !== 'N/A' ? omdb.Poster : null,
      });

      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      if (err.code === 'RATE_LIMITED') {
        console.log(`\nOMDb daily limit reached — switching to CSV+TMDb fallback for remaining movies`);
        omdbRateLimited = true;
        // Still add this movie via CSV stub
        results.push({
          id,
          title: row['Title'],
          year: parseInt(row['Year']) || null,
          director: row['Directors'] || null,
          cast: [],
          genres: parseGenres(row['Genres']),
          rating: null,
          imdbScore: parseFloat(row['IMDb Rating']) || null,
          boxOffice: null,
          studio: null,
          poster: null,
        });
      } else {
        console.log(`\nError for ${id}: ${err.message}`);
      }
    }
  }

  // Phase 2: TMDb enrichment — fills studio + box office
  const tmdbEnriched = await enrichFromTmdb(results);

  // Phase 3: Wikidata fallback — box office for anything TMDb still couldn't fill
  const enriched = await enrichBoxOfficeFromWikidata(tmdbEnriched);

  console.log(`\nWriting ${enriched.length} movies to ${OUT_PATH}`);
  fs.writeFileSync(OUT_PATH, JSON.stringify(enriched, null, 2));
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
