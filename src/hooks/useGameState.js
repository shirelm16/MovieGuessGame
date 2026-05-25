import { useState, useEffect } from 'react';
import { hashDate, getTodayString } from '../utils/dateHash';
import { compareMovies } from '../utils/compareMovies';
import movies from '../data/movies.json';

const MAX_GUESSES = 10;
const STORAGE_KEY = 'movie-game-state';

function getTodaysMovie() {
  const today = getTodayString();
  const index = hashDate(today) % movies.length;
  return movies[index];
}

const movieById = Object.fromEntries(movies.map(m => [m.id, m]));

function getInitialState(today, answer) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.date === today) {
      // Re-hydrate guesses from current movies.json using stored IDs so
      // any data updates (e.g. studio added) are reflected immediately.
      const guesses = (saved.guessIds ?? []).map(id => movieById[id]).filter(Boolean);
      const comparisons = guesses.map(g => compareMovies(g, answer));
      let status = saved.status;
      // Recalculate status in case it was corrupted
      if (status !== 'won' && status !== 'lost') status = 'playing';
      return { date: today, answerId: answer.id, guessIds: saved.guessIds ?? [], guesses, comparisons, status };
    }
  } catch {}
  return {
    date: today,
    answerId: answer.id,
    guessIds: [],
    guesses: [],
    comparisons: [],
    status: 'playing',
  };
}

export function useGameState() {
  const today = getTodayString();
  const answer = getTodaysMovie();

  const [state, setState] = useState(() => getInitialState(today, answer));

  useEffect(() => {
    // Only persist IDs — full objects are re-hydrated from movies.json on load
    const { guesses: _g, comparisons: _c, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [state]);

  function submitGuess(movie) {
    if (state.status !== 'playing') return;
    if (state.guesses.some(g => g.id === movie.id)) return;

    const comparison = compareMovies(movie, answer);
    const newGuesses = [...state.guesses, movie];
    const newComparisons = [...state.comparisons, comparison];
    const newGuessIds = [...state.guessIds, movie.id];

    let status = 'playing';
    if (movie.id === answer.id) status = 'won';
    else if (newGuesses.length >= MAX_GUESSES) status = 'lost';

    setState(prev => ({
      ...prev,
      guessIds: newGuessIds,
      guesses: newGuesses,
      comparisons: newComparisons,
      status,
    }));
  }

  function giveUp() {
    if (state.status !== 'playing') return;
    setState(prev => ({ ...prev, status: 'lost' }));
  }

  const puzzleNumber = hashDate(today) % 10000;

  return {
    answer,
    today,
    guesses: state.guesses,
    comparisons: state.comparisons,
    status: state.status,
    guessesLeft: MAX_GUESSES - state.guesses.length,
    puzzleNumber,
    submitGuess,
    giveUp,
    movies,
  };
}
