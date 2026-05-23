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

async function fetchOmdb(imdbId) {
  const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`);
  if (!res.ok) throw new Error(`OMDb ${res.status} for ${imdbId}`);
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

// ── TMDb (studio enrichment) ───────────────────────────────────────────────────

async function fetchTmdbStudio(imdbId) {
  // Step 1: resolve IMDb ID → TMDb ID
  const findRes = await fetch(
    `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&api_key=${TMDB_KEY}`
  );
  if (!findRes.ok) return null;
  const findData = await findRes.json();
  const tmdbId = findData.movie_results?.[0]?.id;
  if (!tmdbId) return null;

  // Step 2: get production companies from movie details
  const detailRes = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}`
  );
  if (!detailRes.ok) return null;
  const detail = await detailRes.json();
  const companies = detail.production_companies ?? [];
  return companies[0]?.name ?? null;
}

async function enrichStudios(results) {
  if (!TMDB_KEY) {
    console.log('\nNo TMDB_API_KEY — skipping studio enrichment.');
    return results;
  }

  const missing = results.filter(m => !m.studio);
  console.log(`\nEnriching studio for ${missing.length} movies via TMDb...`);

  let enriched = 0;
  for (let i = 0; i < results.length; i++) {
    const movie = results[i];
    if (movie.studio) continue;

    try {
      process.stdout.write(`\r  [${i + 1}/${results.length}] ${movie.title}          `);
      const studio = await fetchTmdbStudio(movie.id);
      if (studio) {
        results[i] = { ...movie, studio };
        enriched++;
      }
      // TMDb free tier: 40 req/10s. Two calls per movie → stay at ~3 movies/s
      await new Promise(r => setTimeout(r, 350));
    } catch (err) {
      // non-fatal — leave studio as null
    }
  }

  console.log(`\nStudio enriched: ${enriched}/${missing.length} movies`);
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

  // Phase 1: OMDb fetch (skips cached entries)
  for (let i = 0; i < movies.length; i++) {
    const row = movies[i];
    const id = row['Const'];
    if (!id) continue;

    if (existing[id]) {
      results.push(existing[id]);
      process.stdout.write(`\r[${i + 1}/${movies.length}] cached: ${row['Title']}          `);
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
      console.log(`\nError for ${id}: ${err.message}`);
    }
  }

  // Phase 2: TMDb studio enrichment for any movie still missing studio
  const enriched = await enrichStudios(results);

  console.log(`\nWriting ${enriched.length} movies to ${OUT_PATH}`);
  fs.writeFileSync(OUT_PATH, JSON.stringify(enriched, null, 2));
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
