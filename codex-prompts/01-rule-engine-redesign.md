# Codex prompt 01 — Redesign the rule engine around the researched inventory

You are working in the `glimmith-solver` repository. Use `docs/rules-inventory.md` and `docs/rules-inventory.json` from the previous research task.

Goal: redesign the solver and puzzle model so every Glimmith rule can be added as a modular rule plugin, without hardcoding UI details into the core solver.

Do not try to implement all rules yet. Focus on architecture, schema, and tests for the rules already implemented.

Required changes:

1. Create or update a canonical puzzle schema.

The schema must support at least:

```js
{
  version: 2,
  width,
  height,
  activeCells,
  symbols,
  clues,
  edgeConstraints,
  rules,
  shapeBank,
  metadata
}
```

`clues` must be generic enough for clue cells, edge clues, vertex clues, outside clues, and relation clues. Do not assume every clue is located on an edge between two adjacent cells.

2. Create a rule registry.

Recommended shape:

```js
const RULE_REGISTRY = {
  precision: {
    id: 'precision',
    label: 'Precision',
    scope: 'region',
    paramsSchema: {...},
    validatePuzzle(puzzle) {},
    candidateFilter(candidate, context) {},
    addConstraints(model, context) {},
    explainElimination(candidate, context) {}
  }
}
```

Adjust this shape if the current solver architecture needs a different model, but keep the same idea: data-driven rule modules.

3. Separate solver concepts:

- puzzle normalization,
- candidate region generation,
- rule-based candidate filtering,
- exact-cover constraints,
- pairwise/global incompatibility constraints,
- solution extraction,
- explanation generation.

4. Add validation.

When the user imports/exports JSON or edits the puzzle, the app should be able to report:

- unknown rule IDs,
- missing rule parameters,
- invalid clue references,
- impossible shape bank entries,
- impossible board masks,
- unsupported low-confidence rules from the inventory.

5. Preserve existing behavior.

Existing tests must still pass. Add tests for schema migration if the current schema changes.

Acceptance criteria:

- `npm test` passes.
- There is a clear `src/core/rules/` or equivalent directory.
- Adding a new rule no longer requires editing the main solver in many places.
- `docs/architecture.md` explains the new model in a way future Codex sessions can follow.
