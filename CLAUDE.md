# Bash Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `OMDB_API_KEY=xxx TMDB_API_KEY=yyy node scripts/buildMovieData.js` — regenerate movies.json (owner only). OMDb covers cast/rating/box office; TMDb fills in studio via production_companies.

# Architecture Notes
- All movie data lives in src/data/movies.json (pre-committed, not generated at runtime)
- ratings.csv is bundled in src/data/ and maintained by the app owner — users never touch it
- Game logic is in src/hooks/useGameState.js
- Tile comparison logic is in src/utils/compareMovies.js
- No backend — fully static app

# Code Style
- React functional components with hooks only
- Tailwind for all styling (no CSS files)
- Use ES modules (import/export), not CommonJS

# Key Rules
- NEVER modify movies.json by hand — always regenerate via the build script
- Daily puzzle must be deterministic by date (same movie for everyone on the same day)
- Game state must persist across page refreshes via localStorage
- The OMDb API key must never be committed — it is only used at build time

# Build Order
1. Build and test scripts/buildMovieData.js first, verify movies.json output
2. Build src/utils/compareMovies.js with unit tests for each tile's comparison logic
3. Build src/hooks/useGameState.js
4. Build UI components last
