# Codex prompt 03 — Add a visual rule palette/editor for all researched rules

You are working in the `glimmith-solver` repository. Use the implemented rule registry and `docs/rules-inventory.*`.

Goal: make the visual editor capable of creating puzzles using every high-confidence implemented rule, while showing unsupported/ambiguous rules as disabled with a note.

Required UI features:

1. Rule palette

Add a sidebar or panel listing rules from the rule registry:

- implemented rules are selectable,
- unsupported rules are visible but disabled,
- each rule has a short help tooltip/paraphrased explanation,
- rule parameters can be edited visually.

2. Symbol/clue palette

Support symbols and clue placement needed by the implemented rules:

- cell symbols,
- edge constraints,
- edge relation clues,
- vertex clues if any researched high-confidence rule needs them,
- outside clues if any researched high-confidence rule needs them,
- region-local numeric clues if needed.

3. Shape-bank editor

Do not require users to type coordinate lists forever. Add a small mini-grid editor where users can draw allowed polyominoes, name them, and set rotation/reflection options.

4. Screenshot tracing mode

Add an optional background image:

- upload screenshot,
- adjust opacity,
- move/scale/rotate the grid overlay if practical,
- trace active cells and clues manually.

Do not attempt full OCR or automatic recognition in this task.

5. Validation UX

When the puzzle is incomplete or invalid, show actionable messages:

- missing Precision number,
- no active cells,
- shape bank empty,
- clue references invalid,
- unsupported rule selected,
- rule currently researched but not implemented.

Acceptance criteria:

- The user can create and solve a puzzle with Precision + Rose Windows from the UI.
- The user can create and solve a puzzle with Shape Bank + Gemini/Delta from the UI.
- The user can export/import JSON and recover the same puzzle.
- `npm test` passes.
