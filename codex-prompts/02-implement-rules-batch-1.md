# Codex prompt 02 — Implement high-confidence Glimmith rules, batch 1

You are working in the `glimmith-solver` repository. Use the researched `docs/rules-inventory.*` files and the modular rule engine from the previous task.

Goal: implement the first batch of high-confidence rules only. Do not implement ambiguous rules until their meaning is confirmed.

Rules to implement if marked high-confidence in the inventory:

1. Precision / exact area
2. Shape Bank / allowed shapes
3. Rose Windows / required symbol set per region
4. Gemini / same shape relation
5. Delta / different shape relation
6. Area Number, only if the inventory has a precise definition
7. Polyomino, only if the inventory has a precise definition

Implementation requirements:

- Rules must be data-driven and registered in the rule registry.
- Each rule must have validation, candidate filtering or constraints, and explanation text.
- Rotations/reflections must be handled according to the researched game behavior. If uncertain, expose explicit options:
  - `allowRotations`
  - `allowReflections`
- Relation rules such as Gemini/Delta must not assume a single UI placement forever. They should be able to refer to two region references derived from an edge clue, vertex clue, or other relation clue once the UI supports it.
- If a relation clue currently cannot be represented perfectly, implement a conservative model and document the limitation in `docs/rules-inventory.md` and `docs/implementation-notes.md`.

Add tests:

- Unit tests for each rule module.
- At least one tiny artificial puzzle per rule.
- Tests for impossible puzzles.
- Tests for multiple-solution detection where relevant.
- Tests for rule interactions, especially:
  - Precision + Rose Windows
  - Shape Bank + Gemini
  - Shape Bank + Delta
  - Precision + Area Number, if implemented

Acceptance criteria:

- `npm test` passes.
- Existing UI still works.
- JSON export/import includes the implemented rule parameters.
- `docs/implementation-notes.md` records what was implemented and what remains ambiguous.
