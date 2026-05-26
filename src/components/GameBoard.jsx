import { useState, useEffect, useRef } from 'react';
import { GuessInput } from './GuessInput';
import { GuessRow } from './GuessRow';
import { HowToPlay } from './HowToPlay';
import { ResultModal } from './ResultModal';
import { HintDialog } from './HintDialog';
import { HintCard } from './HintCard';
import { useGameState } from '../hooks/useGameState';
import { useHints } from '../hooks/useHints';

export function GameBoard() {
  const { answer, today, guesses, comparisons, status, guessesLeft, puzzleNumber, submitGuess, giveUp, movies } = useGameState();
  const [showHelp, setShowHelp] = useState(false);
  const [showResult, setShowResult] = useState(status !== 'playing');
  const [showHintDialog, setShowHintDialog] = useState(false);
  const lastAutoOpenTrigger = useRef(null);
  const hintTimerRef = useRef(null);

  const { slotsLeft, hintsChosen, hintsChosenAt, pendingTrigger, hintsCountdown, chooseHint, disableHints } =
    useHints(guesses.length, today);

  const usedIds = new Set(guesses.map(g => g.id));
  const gameOver = status !== 'playing';

  // Auto-open dialog 800ms after a NEW trigger threshold is crossed
  useEffect(() => {
    clearTimeout(hintTimerRef.current);
    if (pendingTrigger && !gameOver && pendingTrigger !== lastAutoOpenTrigger.current) {
      lastAutoOpenTrigger.current = pendingTrigger;
      hintTimerRef.current = setTimeout(() => setShowHintDialog(true), 800);
    }
    return () => clearTimeout(hintTimerRef.current);
  }, [pendingTrigger, gameOver]);

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

  function handleHintChoose(type) {
    chooseHint(type);
    setShowHintDialog(false);
  }

  function handleHintDisable() {
    disableHints();
    setShowHintDialog(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={() => setShowHelp(true)}
          className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors"
        >
          How to Play
        </button>
        <h1 className="text-xl font-bold tracking-tight">🎬 FilmGuess</h1>

        {/* Hint badge */}
        <div className="flex justify-end" style={{ minWidth: '72px' }}>
          {pendingTrigger && !gameOver ? (
            // Hint available — active button with yellow lightbulb
            <button
              onClick={() => setShowHintDialog(true)}
              className="flex items-center gap-1.5 bg-gray-800 border-2 border-yellow-500/60 hover:bg-gray-700 hover:border-yellow-400/80 text-white text-xs font-medium px-2.5 py-1 rounded-lg transition-colors shadow-[0_0_10px_rgba(234,179,8,0.35)] hover:shadow-[0_0_14px_rgba(234,179,8,0.5)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Hint
            </button>
          ) : hintsCountdown && !gameOver ? (
            // Hint locked — muted countdown badge
            <span className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-lg select-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
              </svg>
              Hint in {hintsCountdown}
            </span>
          ) : !gameOver ? (
            // Hints exhausted — greyed-out lightbulb
            <span className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-lg select-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Hint
            </span>
          ) : (
            <div />
          )}
        </div>
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

        {/* Active hint cards */}
        {hintsChosen.length > 0 && (
          <div className="space-y-2">
            {hintsChosen.map((type, i) => (
              <HintCard key={i} type={type} answer={answer} />
            ))}
          </div>
        )}

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

      {showHintDialog && pendingTrigger && (
        <HintDialog
          slotsLeft={slotsLeft}
          hintsChosen={hintsChosen}
          answer={answer}
          onChoose={handleHintChoose}
          onDismiss={() => setShowHintDialog(false)}
          onDisable={handleHintDisable}
        />
      )}

      {showResult && gameOver && (
        <ResultModal
          answer={answer}
          guesses={guesses}
          comparisons={comparisons}
          status={status}
          puzzleNumber={puzzleNumber}
          hintsChosenAt={hintsChosenAt}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  );
}
