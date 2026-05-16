You are working in the `glimmith-solver` repository. Read `AGENTS.md` and `README.md` before editing. Run `npm test` before and after your changes.

Goal: continue the visual solver MVP for The Artisan of Glimmith-style region-division puzzles without introducing framework dependencies yet.

Implement the next useful feature: screenshot tracing.

Requirements:

1. Add an image upload control to the UI.
2. Render the uploaded image behind the SVG puzzle grid as a low-opacity background.
3. Add controls for image opacity, x offset, y offset, and scale.
4. Keep the image data out of exported puzzle JSON by default, but keep tracing settings in memory while the page is open.
5. Do not change the core solver API unless strictly necessary.
6. Keep `npm test` passing.
7. Add or update README instructions explaining how to use screenshot tracing.

Implementation hints:

- Most changes should be in `index.html`, `styles.css`, and `src/ui/app.js`.
- Use `URL.createObjectURL(file)` for the uploaded image.
- Render the image as an SVG `<image>` element before the cell rectangles.
- The current board rendering uses `CELL` and `SVG_PAD`; tracing transforms should be independent from puzzle cell coordinates.
- Preserve the current tools: active cells, symbols, and edge cycling.

Acceptance criteria:

- I can upload a screenshot and see it behind the grid.
- I can adjust opacity, offset, and scale from the UI.
- Solver behavior is unchanged.
- `npm test` passes.
- The README documents the new feature.
