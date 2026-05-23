const EMOJI = { green: '🟩', yellow: '🟨', gray: '⬛' };

export function buildShareText(guesses, comparisons, puzzleNumber, won) {
  const lines = [`🎬 My Movie Game #${puzzleNumber}`];

  comparisons.forEach(comp => {
    const tiles = [
      comp.director.status,
      // cast: use best status across all actors
      bestCastStatus(comp.cast),
      comp.year.status,
      comp.boxOffice.status,
      comp.imdbScore.status,
      comp.rating.status,
      comp.genres.status,
      comp.studio.status,
    ];
    lines.push(tiles.map(s => EMOJI[s]).join(''));
  });

  const result = won ? `Guessed in ${guesses.length}/10` : 'X/10 — better luck tomorrow!';
  lines.push(result);
  return lines.join('\n');
}

function bestCastStatus(castArr) {
  if (!Array.isArray(castArr)) return 'gray';
  if (castArr.some(c => c.status === 'green')) return 'green';
  if (castArr.some(c => c.status === 'yellow')) return 'yellow';
  return 'gray';
}
