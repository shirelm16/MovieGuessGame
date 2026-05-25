// Priority order — first 3 with available data are shown
const HINT_TYPES = [
  { id: 'tagline',     label: '💬 Tagline',              desc: "The movie's tagline" },
  { id: 'actorPhoto',  label: '⭐ Lead actor photo',      desc: 'A photo of the lead actor' },
  { id: 'filmography', label: "🎬 Director's other film", desc: 'Another movie by the same director' },
  { id: 'cast',        label: '🎭 Cast member',           desc: 'The name of one cast member' },
  { id: 'runtime',     label: '⏱️ Runtime',               desc: 'How long the movie is' },
];

function hasData(hintId, answer) {
  if (hintId === 'tagline')     return !!answer?.tagline;
  if (hintId === 'actorPhoto')  return !!answer?.leadActorPhoto;
  if (hintId === 'filmography') return !!answer?.filmographyTitle;
  if (hintId === 'cast')        return Array.isArray(answer?.cast) && answer.cast.length > 0;
  if (hintId === 'runtime')     return !!answer?.runtime;
  return false;
}

export function HintDialog({ slotsLeft, hintsChosen = [], answer, onChoose, onDismiss, onDisable }) {
  // Pick the best 3 hint types that have real data for this movie
  const displayed = HINT_TYPES.filter(h => hasData(h.id, answer)).slice(0, 3);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onDismiss}
    >
      <div
        className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold text-white">Use a Hint?</h2>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          {slotsLeft} hint{slotsLeft !== 1 ? 's' : ''} remaining — choose one to reveal:
        </p>

        <div className="space-y-2 mb-5">
          {displayed.map(h => {
            const used = hintsChosen.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => !used && onChoose(h.id)}
                disabled={used}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  used
                    ? 'bg-slate-900 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-500'
                }`}
              >
                <span className={`font-medium text-sm ${used ? 'text-gray-600' : 'text-white'}`}>{h.label}</span>
                <p className={`text-xs mt-0.5 ${used ? 'text-gray-600 uppercase tracking-widest font-semibold' : 'text-gray-400'}`}>
                  {used ? 'USED' : h.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 text-sm py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Keep Guessing
          </button>
          <button
            onClick={onDisable}
            className="text-sm py-2 px-3 rounded-lg text-gray-600 hover:text-gray-400 transition-colors"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
