import { useState, useRef, useEffect } from 'react';

export function GuessInput({ movies, onGuess, usedIds, disabled }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    const seen = new Set();
    const matches = movies
      .filter(m => {
        if (usedIds.has(m.id)) return false;
        if (!m.title.toLowerCase().includes(q)) return false;
        const key = `${m.title}|${m.year}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
    setSuggestions(matches);
    setActiveIdx(-1);
  }, [query, movies, usedIds]);

  function selectMovie(movie) {
    onGuess(movie);
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && activeIdx >= 0) { selectMovie(suggestions[activeIdx]); }
    if (e.key === 'Escape') { setSuggestions([]); }
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Game over' : 'Search for a movie…'}
        className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-base disabled:opacity-50"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
          {suggestions.map((movie, i) => (
            <li
              key={movie.id}
              onMouseDown={() => selectMovie(movie)}
              className={`px-4 py-2 cursor-pointer flex justify-between items-center text-sm ${
                i === activeIdx ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">{movie.title}</span>
              <span className="text-gray-400 ml-2">{movie.year}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
