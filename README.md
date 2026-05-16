# Glimmith Solver Prototype

A small browser-based prototype for solving **The Artisan of Glimmith-style** region-division puzzles.

The goal is not to be a complete game solver yet. This repository gives you a working foundation:

- draw an active/inactive stained-glass grid;
- add symbols to cells;
- add manual border givens: cut, join, Gemini/same-shape, Delta/different-shape;
- solve with an exact-cover region solver;
- ask for the next forced border using contradiction checks;
- export/import puzzle JSON.

The app has no runtime dependencies. It is plain HTML/CSS/JavaScript with Node's built-in test runner for the solver tests.

## Run locally

```bash
cd glimmith-solver
npm test
npm start
```

Then open:

```text
http://localhost:5173
```

`npm start` uses a tiny Node static server in `scripts/serve.mjs`, so it works on Windows, macOS, and Linux without installing extra packages.

## What works today

### Rules implemented

| Rule | Status | Notes |
|---|---:|---|
| Active/inactive cells | Implemented | Draw holes or irregular board masks. |
| Precision / exact area | Implemented | Every region candidate must have exactly `area` cells. |
| Shape bank | Implemented | Enter polyomino coordinates; rotations/reflections are optional. |
| Rose labels | Implemented | Each region must contain exactly one of every listed label, such as `ABCD`. |
| Manual cut/join borders | Implemented | Click borders with the edge tool. |
| Gemini / same shape | Implemented | Modeled as a relation on an edge between two regions. |
| Delta / different shape | Implemented | Modeled as a relation on an edge between two regions. |
| Next logic step | Implemented | Tests unknown borders by contradiction and returns a forced join/cut. |

### Shape bank format

Each shape is one line. Coordinates are local `x,y` cells.

```text
O4: 0,0 1,0 0,1 1,1
L4: 0,0 0,1 0,2 1,2
T4: 0,0 1,0 2,0 1,1
```

The shape name is optional but useful for solution summaries.

## How the solver works

The core solver generates possible region candidates, then solves an exact-cover problem:

```text
Choose region candidates so every active cell is covered exactly once.
```

Local rules, such as area, shape bank, Rose labels, and cut/join borders, filter individual candidates. Gemini/Delta-style shape relations are checked as pairwise constraints between selected candidates.

The explanation engine currently uses a reliable but simple technique:

1. choose an unknown border;
2. assume it is joined;
3. check whether the puzzle still has any solution;
4. assume it is cut;
5. check whether the puzzle still has any solution;
6. when one assumption has zero solutions, the opposite border is forced.

This is not yet a human-style explanation engine, but it gives sound logical steps for many small and medium puzzles.

## Repository layout

```text
.
├── index.html                  # browser app shell
├── styles.css                  # app styling
├── scripts/serve.mjs           # tiny local static server
├── AGENTS.md                   # instructions for coding agents
├── codex-prompts/
│   └── 01-continue-mvp.md      # prompt for continuing the project with Codex
├── src/
│   ├── core/
│   │   ├── candidates.js       # region candidate generation and local filters
│   │   ├── explain.js          # forced-border explanation search
│   │   ├── geometry.js         # grid, shape, mask helpers
│   │   ├── puzzle.js           # puzzle model, JSON normalization, shape parsing
│   │   └── solver.js           # exact-cover backtracking solver
│   └── ui/
│       └── app.js              # SVG editor and UI event handling
└── test/
    └── solver.test.js          # core solver tests
```

## Recommended next milestones

1. **Screenshot tracing**: allow importing a screenshot as a low-opacity background behind the SVG grid, with grid offset/scale controls.
2. **Visual shape-bank editor**: let the user draw allowed shapes instead of typing coordinate lines.
3. **Rule plug-in interface**: formalize the current filters and pairwise constraints into classes/functions so new Glimmith rules are easy to add.
4. **More explanation types**: explain candidate eliminations, forced regions, and symbol-set deductions, not only forced borders.
5. **More game rules**: add Area Number, Match/Mismatch, Polyomino-specific constraints, Solitude/Palisade-like constraints if needed.
6. **Performance**: add better pruning and optional Web Worker execution so bigger boards do not freeze the UI.

## Known limitations

- The UI is manual drawing only; there is no OCR or automatic screenshot parsing yet.
- Gemini/Delta clues are modeled as edge relations between adjacent cells. If the game uses a clue placement that refers to regions in a different geometric way, add that interpretation as a new relation type.
- Candidate generation can grow quickly for large area-only boards. Shape-bank puzzles are much faster because placements are finite and constrained.
- The app currently uses square cells. If a puzzle has non-rectangular visual artwork, represent it as a square-grid mask for now.

## Development notes

Run tests after solver changes:

```bash
npm test
```

The project intentionally avoids a build system. If you add TypeScript, React, OR-Tools, Vite, or a backend, do it as a conscious architecture change and update this README.
