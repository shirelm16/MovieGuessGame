const RULES = [
  { emoji: '🎬', label: 'Director', green: 'Same director', yellow: null, gray: 'Different director' },
  { emoji: '🎭', label: 'Cast', green: 'Actor in both', yellow: null, gray: 'Actor not in cast' },
  { emoji: '📅', label: 'Year', green: 'Exact year', yellow: 'Within 5 years (↑↓)', gray: '>5 years off' },
  { emoji: '💰', label: 'Box Office', green: 'Exact match', yellow: 'Within 50% (↑↓)', gray: '>50% off' },
  { emoji: '⭐', label: 'IMDb Score', green: 'Exact match', yellow: 'Within 1.0 (↑↓)', gray: '>1.0 off' },
  { emoji: '🔞', label: 'Rating', green: 'Exact match', yellow: null, gray: 'Different' },
  { emoji: '🎞️', label: 'Genres', green: 'All match', yellow: 'Partial match', gray: 'No match' },
  { emoji: '🏢', label: 'Studio', green: 'Same studio', yellow: null, gray: 'Different studio' },
];

export function HowToPlay({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">How to Play</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Guess the mystery movie in <strong className="text-white">10 tries</strong>. After each guess, 8 attribute tiles reveal how close you are.
        </p>
        <div className="flex gap-3 mb-5 text-sm">
          <span className="bg-green-600 text-white px-3 py-1 rounded font-medium">🟩 Exact</span>
          <span className="bg-yellow-500 text-white px-3 py-1 rounded font-medium">🟨 Close</span>
          <span className="bg-gray-600 text-white px-3 py-1 rounded font-medium">⬛ No match</span>
        </div>
        <div className="space-y-2">
          {RULES.map(r => (
            <div key={r.label} className="grid grid-cols-[2rem_5rem_1fr] gap-2 text-sm items-start">
              <span>{r.emoji}</span>
              <span className="text-white font-medium">{r.label}</span>
              <span className="text-gray-400">
                <span className="text-green-400">{r.green}</span>
                {r.yellow && <> · <span className="text-yellow-400">{r.yellow}</span></>}
                {r.gray && <> · <span className="text-gray-400">{r.gray}</span></>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
