import { useState } from 'react';
import { GuessInput } from './GuessInput';
import { GuessRow } from './GuessRow';
import { HowToPlay } from './HowToPlay';
import { ResultModal } from './ResultModal';
import { useGameState } from '../hooks/useGameState';

export function GameBoard() {
  const { answer, guesses, comparisons, status, guessesLeft, puzzleNumber, submitGuess, giveUp, movies } = useGameState();
  const [showHelp, setShowHelp] = useState(false);
  const [showResult, setShowResult] = useState(status !== 'playing');

  const usedIds = new Set(guesses.map(g => g.id));
  const gameOver = status !== 'playing';

  function handleGuess(movie) {
    submitGuess(movie);
    if (movie.id === answer.id || guesses.length + 1 >= 10) {
      setTimeout(() => setShowResult(true), 1800);
    }
  }

  function handleGiveUp() {
    giveUp();
    setTimeout(() => setShowResult(true), 300);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button onClick={() => setShowHelp(true)} className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors">
          How to Play
        </button>
        <h1 className="text-xl font-bold tracking-tight">🎬 FilmGuess</h1>
        {/* spacer to keep title centred */}
        <div className="w-[72px]" />
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Guess counter */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Puzzle <span className="text-white font-medium">#{puzzleNumber}</span>
            {' · '}
            <span className={guessesLeft <= 2 ? 'text-red-400 font-medium' : 'text-white'}>
              {guessesLeft} guess{guessesLeft !== 1 ? 'es' : ''} left
            </span>
          </p>
          {/* Guess pips */}
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i < guesses.length
                    ? guesses[i]?.id === answer.id
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Input + Give up */}
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <div className="flex-1">
            <GuessInput
              movies={movies}
              onGuess={handleGuess}
              usedIds={usedIds}
              disabled={gameOver}
            />
          </div>
          <button
            onClick={handleGiveUp}
            disabled={gameOver}
            className="shrink-0 text-sm px-3 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Give up
          </button>
        </div>

        {/* Guess history (newest first) */}
        <div className="space-y-4">
          {[...guesses].reverse().map((movie, i) => {
            const idx = guesses.length - 1 - i;
            return (
              <GuessRow
                key={movie.id}
                movie={movie}
                comparison={comparisons[idx]}
                rowIndex={i}
              />
            );
          })}
        </div>
      </main>

      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
      {showResult && gameOver && (
        <ResultModal
          answer={answer}
          guesses={guesses}
          comparisons={comparisons}
          status={status}
          puzzleNumber={puzzleNumber}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  );
}
