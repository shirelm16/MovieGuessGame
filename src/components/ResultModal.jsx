import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { buildShareText } from '../utils/shareGrid';

export function ResultModal({ answer, guesses, comparisons, status, puzzleNumber, hintsChosenAt = [], onClose }) {
  const won = status === 'won';

  useEffect(() => {
    if (won) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [won]);

  function handleShare() {
    const text = buildShareText(guesses, comparisons, puzzleNumber, hintsChosenAt);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
    } else {
      alert(text);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-4xl mb-2">{won ? '🎉' : '😞'}</div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {won ? 'You got it!' : 'Better luck tomorrow!'}
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          {won
            ? `Solved in ${guesses.length}/10 guesses`
            : `The answer was:`}
        </p>

        {answer.poster && (
          <img src={answer.poster} alt={answer.title} className="w-28 mx-auto rounded-lg mb-3 shadow-lg" />
        )}
        <p className="text-white font-semibold text-lg">{answer.title}</p>
        <p className="text-gray-400 text-sm mb-6">{answer.year} · {answer.director}</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Share Result
          </button>
          <p className="text-gray-500 text-xs">Come back tomorrow for a new puzzle!</p>
        </div>
      </div>
    </div>
  );
}
