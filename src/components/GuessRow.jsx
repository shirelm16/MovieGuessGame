import { AttributeTile } from './AttributeTile';

const ATTRS = [
  { key: 'director', label: 'Director' },
  { key: 'cast', label: 'Cast' },
  { key: 'year', label: 'Year' },
  { key: 'boxOffice', label: 'Box Office' },
  { key: 'imdbScore', label: 'IMDb' },
  { key: 'rating', label: 'Rating' },
  { key: 'genres', label: 'Genres' },
  { key: 'studio', label: 'Studio' },
];

function formatValue(movie, key) {
  switch (key) {
    case 'director': return movie.director ?? 'Unknown';
    case 'year': return movie.year?.toString() ?? '?';
    case 'boxOffice': {
      const n = movie.boxOffice;
      if (!n) return 'N/A';
      if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
      return `$${Math.round(n / 1e6)}M`;
    }
    case 'imdbScore': return movie.imdbScore != null ? movie.imdbScore.toFixed(1) : 'N/A';
    case 'rating': return movie.rating ?? 'N/A';
    case 'studio': return movie.studio ?? 'N/A';
    default: return null;
  }
}

export function GuessRow({ movie, comparison, rowIndex }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        {movie.poster && (
          <img src={movie.poster} alt={movie.title} className="w-12 h-16 object-cover rounded" />
        )}
        <div>
          <p className="font-semibold text-white">{movie.title}</p>
          <p className="text-gray-400 text-sm">{movie.year}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ATTRS.map((attr, i) => (
          <AttributeTile
            key={attr.key}
            label={attr.label}
            result={comparison[attr.key]}
            value={formatValue(movie, attr.key)}
            animDelay={rowIndex * 200 + i * 120}
          />
        ))}
      </div>
    </div>
  );
}
