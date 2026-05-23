// Returns { status: 'green'|'yellow'|'gray', hint?: '↑'|'↓'|number }
// for each of the 8 attributes.

export function compareMovies(guess, answer) {
  if (guess.id === answer.id) {
    return {
      director: { status: 'green' },
      cast: (guess.cast ?? []).map(actor => ({ actor, status: 'green' })),
      year: { status: 'green' },
      boxOffice: { status: 'green' },
      imdbScore: { status: 'green' },
      rating: { status: 'green' },
      genres: { status: 'green', genres: guess.genres ?? [], matchedGenres: (guess.genres ?? []).map(g => g.toLowerCase()) },
      studio: { status: 'green' },
    };
  }
  return {
    director: compareDirector(guess, answer),
    cast: compareCast(guess, answer),
    year: compareYear(guess, answer),
    boxOffice: compareBoxOffice(guess, answer),
    imdbScore: compareImdbScore(guess, answer),
    rating: compareRating(guess, answer),
    genres: compareGenres(guess, answer),
    studio: compareStudio(guess, answer),
  };
}

function compareDirector(guess, answer) {
  if (!guess.director || !answer.director) return { status: 'gray' };
  if (normalize(guess.director) === normalize(answer.director)) return { status: 'green' };
  return { status: 'gray' };
}

function compareCast(guess, answer) {
  const gCast = guess.cast ?? [];
  const aCast = (answer.cast ?? []).map(normalize);
  return gCast.map(actor => {
    const norm = normalize(actor);
    if (aCast.includes(norm)) return { actor, status: 'green' };
    return { actor, status: 'gray' };
  });
}

function compareYear(guess, answer) {
  if (!guess.year || !answer.year) return { status: 'gray' };
  const diff = Math.abs(guess.year - answer.year);
  if (diff === 0) return { status: 'green' };
  if (diff <= 5) return { status: 'yellow', hint: guess.year < answer.year ? '↑' : '↓' };
  return { status: 'gray', hint: guess.year < answer.year ? '↑' : '↓' };
}

function compareBoxOffice(guess, answer) {
  if (!guess.boxOffice || !answer.boxOffice) return { status: 'gray' };
  const hint = guess.boxOffice < answer.boxOffice ? '↑' : '↓';
  if (guess.boxOffice === answer.boxOffice) return { status: 'green' };
  const pctOff = Math.abs(guess.boxOffice / answer.boxOffice - 1);
  if (pctOff <= 0.50) return { status: 'yellow', hint };
  return { status: 'gray', hint };
}

function compareImdbScore(guess, answer) {
  if (!guess.imdbScore || !answer.imdbScore) return { status: 'gray' };
  const diff = Math.abs(guess.imdbScore - answer.imdbScore);
  const hint = guess.imdbScore < answer.imdbScore ? '↑' : '↓';
  if (diff === 0) return { status: 'green' };
  if (diff <= 1.0) return { status: 'yellow', hint };
  return { status: 'gray', hint };
}

function compareRating(guess, answer) {
  if (!guess.rating || !answer.rating) return { status: 'gray' };
  if (guess.rating === answer.rating) return { status: 'green' };
  return { status: 'gray' };
}

function compareGenres(guess, answer) {
  const gGenres = (guess.genres ?? []).map(normalize);
  const aGenres = (answer.genres ?? []).map(normalize);
  const matches = gGenres.filter(g => aGenres.includes(g));
  if (matches.length > 0 && matches.length === gGenres.length && gGenres.length === aGenres.length) {
    return { status: 'green', matchCount: matches.length, genres: guess.genres ?? [] };
  }
  if (matches.length > 0) {
    return { status: 'yellow', matchCount: matches.length, genres: guess.genres ?? [], matchedGenres: matches };
  }
  return { status: 'gray', matchCount: 0, genres: guess.genres ?? [] };
}

function compareStudio(guess, answer) {
  if (!guess.studio || !answer.studio) return { status: 'gray' };
  if (normalize(guess.studio) === normalize(answer.studio)) return { status: 'green' };
  return { status: 'gray' };
}

function normalize(str) {
  return str.toLowerCase().trim();
}
