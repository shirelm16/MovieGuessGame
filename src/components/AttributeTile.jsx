const STATUS_BG = {
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
  gray: 'bg-gray-600',
};

export function AttributeTile({ label, result, value, animDelay = 0 }) {
  const isArray = Array.isArray(result);

  if (label === 'Cast' && isArray) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <div className="flex flex-wrap gap-1">
          {result.map((r, i) => (
            <span
              key={i}
              className={`${STATUS_BG[r.status]} text-white text-xs px-2 py-1 rounded font-medium tile-flip`}
              style={{ animationDelay: `${animDelay + i * 80}ms` }}
            >
              {r.actor}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (label === 'Genres') {
    const { status, genres = [], matchedGenres = [] } = result;
    const matched = matchedGenres.map(s => s.toLowerCase());
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <div className="flex flex-wrap gap-1">
          {genres.map((g, i) => {
            const isMatch = matched.includes(g.toLowerCase());
            const bg = status === 'green' ? 'bg-green-600' : isMatch ? 'bg-green-600' : 'bg-gray-600';
            return (
              <span
                key={i}
                className={`${bg} text-white text-xs px-2 py-1 rounded font-medium tile-flip`}
                style={{ animationDelay: `${animDelay + i * 80}ms` }}
              >
                {g}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  const { status, hint } = result;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <div
        className={`${STATUS_BG[status]} text-white rounded px-2 py-2 text-xs font-semibold flex items-center justify-center gap-1 tile-flip min-h-[2.5rem] text-center leading-tight`}
        style={{ animationDelay: `${animDelay}ms` }}
      >
        <span className="truncate">{value ?? '—'}</span>
        {hint && <span className="shrink-0 text-sm">{hint}</span>}
      </div>
    </div>
  );
}
