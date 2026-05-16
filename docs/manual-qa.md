# Manual QA Checklist

Use this checklist when entering a real in-game puzzle and checking whether the solver/UI workflow is usable.

## Entry Workflow

- Load or trace a screenshot.
- Fit the image to the board, adjust transform, then lock the image while drawing.
- Set board width and height.
- Activate holes/inactive cells until the board mask matches the puzzle.
- Select the puzzle rules in the rule palette.
- Enter global rule settings such as Precision area, Range bounds, Rose symbols, or Shape Bank shapes.
- Place cell clues: Area Number, Polyomino, Palisade, and Compass.
- Place edge relation clues: Gemini, Delta, Difference, and Inequality.
- Place vertex Watchtower clues.
- Use undo/redo after several representative edits.

## Validation

- Confirm validation updates after each edit.
- If validation fails, check the latest-change line and fix the referenced cell, clue, rule, or shape-bank entry.
- Copy the validation report and confirm it includes active rules and actionable messages.

## Solving

- Run Solve.
- If a solution appears, inspect region colors and borders.
- Enable Show boundary graph and verify degree 3/4 vertex highlights are readable.
- Run Next step and Explain all on a small puzzle to confirm explanation output is still usable.

## No-Solution Debugging

- For an intentionally impossible puzzle, confirm the no-solution panel lists:
  - validation errors, if any,
  - candidate-source plan,
  - generated and accepted candidate counts,
  - cells with zero candidates,
  - direct candidate rejections,
  - active rules.

## Persistence

- Save the current puzzle with a local name.
- Reload the page and load the saved puzzle.
- Export all saved puzzles to JSON.
- Delete a saved puzzle.
- Re-import the exported saved-puzzle collection.

## JSON Round Trip

- Export puzzle JSON.
- Clear or load a different example.
- Import the exported JSON.
- Validate and solve again.
