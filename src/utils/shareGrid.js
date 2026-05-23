const EMOJI = { green: '🟩', yellow: '🟨', gray: '⬛' };

const APP_URL = 'https://candid-twilight-b4b8a6.netlify.app';

export function buildShareText(guesses, comparisons, puzzleNumber) {
  const lines = [`FilmGuess #${puzzleNumber}`];

  // One emoji per guess — summarise the best tile result for that guess
  const row = comparisons.map(comp => {
    const statuses = [
      comp.director.status,
      bestCastStatus(comp.cast),
      comp.year.status,
      comp.boxOffice.status,
      comp.imdbScore.status,
      comp.rating.status,
      comp.genres.status,
      comp.studio.status,
    ];
    if (statuses.every(s => s === 'green')) return EMOJI.green;
    return EMOJI.gray;
  });

  lines.push(row.join(''));
  lines.push('');
  lines.push(APP_URL);
  return lines.join('\n');
}

function bestCastStatus(castArr) {
  if (!Array.isArray(castArr)) return 'gray';
  if (castArr.some(c => c.status === 'green')) return 'green';
  if (castArr.some(c => c.status === 'yellow')) return 'yellow';
  return 'gray';
}
