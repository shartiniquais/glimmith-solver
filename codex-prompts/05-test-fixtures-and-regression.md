# Codex prompt 05 — Build rule fixtures and regression tests

You are working in the `glimmith-solver` repository.

Goal: create a robust test suite so future rule additions do not break the solver.

Use `docs/rules-inventory.*` and the current rule registry.

Required work:

1. Create `test/fixtures/`.

For each implemented rule, add small JSON fixtures:

- one valid unique-solution puzzle,
- one valid multi-solution puzzle if meaningful,
- one impossible puzzle,
- one puzzle with invalid schema/input.

2. Add fixture metadata.

Each fixture should include:

```json
{
  "name": "precision-2x2-unique",
  "rulesCovered": ["precision"],
  "expectedStatus": "unique_solution",
  "expectedRegionCount": 2,
  "expectedForcedSteps": ["forced_cut", "forced_join"]
}
```

3. Add regression tests.

Tests must check:

- solver status,
- number of solutions up to a small cap,
- whether known forced edges are found,
- validation errors,
- JSON export/import roundtrip,
- rule registry coverage.

4. Add a coverage map.

Create/update `docs/test-coverage.md` showing every researched rule and whether it has:

- implementation,
- unit tests,
- fixture tests,
- UI support,
- explanation support.

Acceptance criteria:

- `npm test` passes.
- Every implemented rule has at least one fixture.
- The docs make it obvious which Glimmith rules are not implemented yet.
