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

Only implemented rules should affect solving. Experimental or blocked rules are registered so validation can reject them clearly instead of silently ignoring them.

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

Manual `cut`/`join` edge constraints are handled by `edgeConstraintsRule`. They are editor givens, not Glimmith rule cards.

## Solver Pipeline

`solvePuzzle(rawPuzzle, options)` in `src/core/solver.js` follows this sequence:

1. Normalize the puzzle to version 2.
2. Validate schema, rules, clues, edge constraints, shape bank entries, and unsupported rules.
3. Build a rule context from active registered rules.
4. Generate candidate regions:
   - reusable shape-bank placements when a shape bank is present,
   - otherwise connected regions of the Precision area.
5. Apply candidate filters from manual edge constraints and active rule modules.
6. Build exact-cover cell coverage buckets.
7. Let rule modules add pairwise/global incompatibilities through a constraint model.
8. Run exact-cover search.
9. Extract solutions using the configured shape-comparison equivalence.

Candidate generation lives in `src/core/candidates.js`. Pairwise/global incompatibility storage lives in `src/core/constraints.js`.

`buildCandidateGenerationPlan(puzzle, context)` is the candidate-source extension point. Today it chooses reusable Shape Bank placements, fixed-area Precision regions, Area Number clue areas, or Polyomino clue shapes. Future rules should extend that source plan or add local candidate filters there, without adding rule-specific logic to the exact-cover search.

## Validation

`validatePuzzle(rawPuzzle)` in `src/core/validation.js` reports:

- unknown rule IDs,
- missing or invalid rule parameters,
- invalid clue references,
- invalid edge constraints,
- impossible shape-bank entries,
- impossible legacy or v2 board masks,
- blocked or unimplemented rule IDs.

Blocked rules from the research inventory, such as Palisade, Bricky, Loopy, Compass, and Watchtower, should not be guessed. If they appear in puzzle data, solving returns `no_solution` with a not-implemented/semantics-unverified message. UI placeholders are acceptable only if they do not imply solver support.

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

Do not add guessed blocked-rule mechanics. Start with validation and UI placeholders until the rule's exact semantics are verified.
