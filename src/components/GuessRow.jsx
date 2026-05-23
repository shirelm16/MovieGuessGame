const STATUS_BG = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  gray:   'bg-slate-700',
};

function StatTile({ label, value, hint, status = 'gray' }) {
  return (
    <div className={`${STATUS_BG[status]} rounded-lg px-3 py-2.5 flex flex-col items-center justify-center min-h-[4rem]`}>
      <span className="text-[10px] uppercase tracking-widest text-white/70 font-semibold mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-white font-bold text-sm sm:text-base leading-tight">{value}</span>
        {hint && <span className="text-white font-bold text-sm">{hint}</span>}
      </div>
    </div>
  );
}

function formatBoxOffice(n) {
  if (!n) return 'N/A';
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e8)  return `$${Math.round(n / 1e6)}M`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e6).toFixed(2)}M`;
}

export function GuessRow({ movie, comparison }) {
  const { director, cast, year, boxOffice, imdbScore, rating, genres, studio } = comparison;

  const matchedGenreSet = new Set((genres.matchedGenres ?? []).map(g => g.toLowerCase()));
  const allGenresMatch = genres.status === 'green';

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      <div className="flex">

        {/* Poster */}
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-24 sm:w-32 object-cover flex-shrink-0 self-stretch"
          />
        ) : (
          <div className="w-24 sm:w-32 bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">🎬</span>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col gap-3">

          {/* Title + genre pills */}
          <div>
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight mb-2">
              {movie.title}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(movie.genres ?? []).map(g => {
                const matched = allGenresMatch || matchedGenreSet.has(g.toLowerCase());
                return (
                  <span
                    key={g}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      matched ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'
                    }`}
                  >
                    {g}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile
              label="Year"
              value={movie.year ?? '?'}
              hint={year.hint}
              status={year.status}
            />
            <StatTile
              label="Box Office"
              value={formatBoxOffice(movie.boxOffice)}
              hint={boxOffice.hint}
              status={boxOffice.status}
            />
            <StatTile
              label="Rated"
              value={movie.rating ?? 'N/A'}
              status={rating.status}
            />
            <StatTile
              label="IMDb"
              value={movie.imdbScore != null ? `${movie.imdbScore.toFixed(1)}/10` : 'N/A'}
              hint={imdbScore.hint}
              status={imdbScore.status}
            />
          </div>

          {/* Director / Cast / Studio — text only */}
          <div className="grid grid-cols-3 gap-3 text-xs border-t border-slate-700 pt-3">
            <div>
              <p className="uppercase tracking-widest text-slate-400 text-[10px] mb-1">Director</p>
              <p className={`font-medium truncate ${director.status === 'green' ? 'text-green-400' : 'text-slate-300'}`}>
                {movie.director ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-slate-400 text-[10px] mb-1">Cast</p>
              <div className="flex flex-col gap-0.5">
                {(movie.cast ?? []).map((actor, i) => (
                  <span
                    key={actor}
                    className={`font-medium truncate ${cast[i]?.status === 'green' ? 'text-green-400' : 'text-slate-300'}`}
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="uppercase tracking-widest text-slate-400 text-[10px] mb-1">Studio</p>
              <p className={`font-medium truncate ${studio.status === 'green' ? 'text-green-400' : 'text-slate-300'}`}>
                {movie.studio ?? 'N/A'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
