# Solver Architecture

This prototype uses a versioned puzzle schema plus a registry of rule modules. The goal is to let new Glimmith rules plug into the solver without scattering rule-specific code across candidate generation, exact-cover search, UI state, and explanations.

## Puzzle Schema

`normalizePuzzle(raw)` in `src/core/puzzle.js` returns the canonical version 2 shape:

```js
{
  version: 2,
  width,
  height,
  activeCells,
  active,
  symbols,
  clues,
  edgeConstraints,
  edges,
  rules,
  shapeBank,
  metadata
}
```

`active`, `edges`, and legacy rule fields such as `rules.area`, `rules.roseLabels`, and `rules.shapeBankText` remain as compatibility aliases for the current UI. New core code should prefer `activeCells`, `edgeConstraints`, generic `clues`, canonical rule IDs, and `shapeBank`.

`clues` are generic objects. A clue can be a cell clue, edge clue, vertex clue, outside clue, or relation clue. Relation clues use `type: "relation"` and `regionRefs`, for example:

```js
{
  id: "edge:0-1:gemini",
  type: "relation",
  ruleId: "gemini",
  location: { type: "edge", cells: [0, 1] },
  regionRefs: [{ cell: 0 }, { cell: 1 }]
}
```

Legacy `sameShape` and `differentShape` edge relations are migrated into Gemini and Delta relation clues during normalization. Future relation rules should use the same two-region clue shape even when the visual clue is not placed on a simple cell edge.

Game-facing Gemini, Delta, Difference, and Inequality clues are edge clues. The schema still models them as generic two-region relation clues with `regionRefs`, but validation requires those references or edge-location cells to be orthogonally adjacent.

## Rule Registry

Rule modules live under `src/core/rules/`. The registry is exported from `src/core/rules/registry.js`.

A rule module can provide:

```js
{
  id,
  label,
  scope,
  implementationStatus,
  implemented,
  paramsSchema,
  validatePuzzle(context) {},
  candidateFilter(candidate, context) {},
  addConstraints(model, context) {},
  explainElimination(candidate, context) {}
}
```

Only implemented rules should affect solving. If a future ready-but-not-implemented rule is added, it should be registered so validation can reject it clearly as a known unsupported rule instead of treating it as an unknown ID. There are currently no blocked rules in the inventory after the 2026-05-16 user-confirmed mechanics update, and all known inventory rules are implemented.

Currently implemented rule modules:

- `precision`: candidate filter by region area.
- `shape_bank`: reusable allowed-shape source, with optional future `exactUses` and `maxUses` metadata only.
- `rose_window`: candidate filter by required symbol counts.
- `gemini`: two-region same-shape relation constraint.
- `delta`: two-region different-shape relation constraint.
- `difference`: two-region area-difference relation constraint.
- `area_number`: cell clue requiring the containing region to have the clue's area.
- `polyomino`: cell clue requiring the containing region to match the clue shape.
- `mingle_shape`: pairwise constraint rejecting orthogonally adjacent same-shape regions.
- `match`: global same-shape constraint across all selected regions.
- `mismatch`: global distinct-shape constraint across all selected regions.
- `range`: inclusive min/max area candidate filter and candidate source when no stronger source exists.
- `solitude`: candidate filter requiring exactly one counted cell clue or eligible Rose symbol per region.
- `size_separation`: pairwise constraint rejecting equal-area edge-adjacent regions.
- `boxy`: candidate filter requiring each region to fill its bounding rectangle.
- `non_boxy`: candidate filter rejecting filled rectangles, bars, and single-cell regions.
- `inequality`: two-region strict area inequality relation constraint.
- `palisade`: cell clue requiring a specific side-border pattern around the clue cell.
- `compass`: cell clue counting own-region cells in N/E/S/W half-planes.
- `watchtower`: vertex clue counting distinct selected regions touching a grid vertex.
- `bricky`: boundary-vertex rule forbidding exactly four border segments meeting at a vertex.
- `loopy`: boundary-vertex rule forbidding exactly three border segments meeting at a vertex.

Manual `cut`/`join` edge constraints are handled by `edgeConstraintsRule`. They are editor givens, not Glimmith rule cards.

## Solver Pipeline

`solvePuzzle(rawPuzzle, options)` in `src/core/solver.js` follows this sequence:

1. Normalize the puzzle to version 2.
2. Validate schema, rules, clues, edge constraints, shape bank entries, and unsupported rules.
3. Build a rule context from active registered rules.
4. Generate candidate regions:
   - reusable shape-bank placements when a shape bank is present,
   - otherwise connected regions of the Precision area,
   - otherwise Polyomino clue shapes, Area Number clue areas, or Range area bounds when available.
5. Apply candidate filters from manual edge constraints and active rule modules.
6. Build exact-cover cell coverage buckets.
7. Let rule modules add pairwise/global incompatibilities through a constraint model.
8. Run exact-cover search.
9. Extract solutions using the configured shape-comparison equivalence.

Candidate generation lives in `src/core/candidates.js`. Pairwise/global incompatibility storage lives in `src/core/constraints.js`.
Rules that cannot be expressed as pairwise incompatibilities can add selection validators through the same constraint model. The solver calls those validators during exact-cover search and at completion. Watchtower uses this hook to count distinct selected regions touching a vertex; Bricky and Loopy use it to reject completed partitions with forbidden boundary-vertex degrees.

Local side and vertex geometry helpers live in `src/core/boundary.js`.

`buildCandidateGenerationPlan(puzzle, context)` is the candidate-source extension point. Today it chooses reusable Shape Bank placements, fixed-area Precision regions, Polyomino clue shapes, Area Number clue areas, or Range area bounds. Future rules should extend that source plan or add local candidate filters there, without adding rule-specific logic to the exact-cover search.

## Validation

`validatePuzzle(rawPuzzle)` in `src/core/validation.js` reports:

- unknown rule IDs,
- missing or invalid rule parameters,
- invalid clue references,
- invalid edge constraints,
- impossible shape-bank entries,
- impossible legacy or v2 board masks,
- ready-but-not-implemented rule IDs.

There are no ready-but-not-implemented inventory rules at this point. Future unsupported rules should not affect solving until their modules are implemented; if they appear in puzzle data, solving should return `no_solution` with a known-ready/not-implemented message.

## Adding A Rule

1. Add or update the rule in `docs/rules-inventory.json`.
2. Add a module under `src/core/rules/`.
3. Register it in `src/core/rules/registry.js`.
4. Define validation first.
5. Add one or more of:
   - `candidateFilter` for local region filtering,
   - `addConstraints` for pairwise or global constraints,
   - a shape-bank or candidate-source extension if candidate generation must change.
6. Add tests that prove the rule eliminates an otherwise valid solution.

Do not add solver behavior without tests proving the rule eliminates an otherwise valid solution. For ready-but-not-implemented rules, start with validation and UI placeholders, then add focused mechanics in dedicated implementation steps.
