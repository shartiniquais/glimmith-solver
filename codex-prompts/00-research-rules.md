# Codex prompt 00 — Research every The Artisan of Glimmith puzzle/rule type

You are working in the `glimmith-solver` repository. Your job in this task is research and documentation only. Do not modify the solver implementation yet.

Goal: build a complete, sourced inventory of puzzle types and rule cards/mechanics used in *The Artisan of Glimmith*, including demo/current-release content if available.

Use internet research. Start from these seed queries and pages, but do not assume they are complete:

- `The Artisan of Glimmith puzzle rules`
- `The Artisan of Glimmith how puzzle rules work`
- `The Artisan of Glimmith Precision Window puzzle solutions`
- `The Artisan of Glimmith Rose Windows puzzle solutions`
- `The Artisan of Glimmith Gemini Delta puzzle rules`
- `The Artisan of Glimmith Shape Bank puzzle solutions`
- `The Artisan of Glimmith Polyomino puzzle solutions`
- `The Artisan of Glimmith Area Number puzzle solutions`
- `The Artisan of Glimmith Match Mismatch puzzle solutions`
- `The Artisan of Glimmith Solitude puzzle solutions`
- `The Artisan of Glimmith Palisade puzzle solutions`
- Steam store page for The Artisan of Glimmith
- Casual Game Guides pages for The Artisan of Glimmith
- Camzillasmom pages for The Artisan of Glimmith
- Steam community guides, developer posts, screenshots, and videos if needed

Output files to create/update:

1. `docs/rules-inventory.md`
2. `docs/rules-inventory.json`
3. `docs/research-notes.md`

For each discovered rule type, document:

- Canonical rule name used in the game.
- Alternate names used by guides or players.
- Exact player-facing meaning, paraphrased in your own words.
- Whether it constrains:
  - one region,
  - two adjacent regions,
  - all regions globally,
  - a shape bank,
  - symbols inside regions,
  - edges/walls,
  - numbers,
  - colors,
  - clue cells,
  - clue vertices,
  - or something else.
- Required user input for the visual editor.
- Proposed solver encoding:
  - candidate filter,
  - exact-cover constraint,
  - pairwise candidate incompatibility,
  - global all-different/same constraint,
  - cardinality constraint,
  - graph constraint,
  - or custom constraint.
- Whether rotations/reflections matter.
- Whether the rule can be explained by local candidate elimination.
- At least one small artificial test puzzle idea.
- Source URLs used.
- Confidence level: `high`, `medium`, or `low`.
- Open questions.

Important research constraints:

- Do not copy long text from guides. Paraphrase.
- Prefer official/dev/Steam sources, then high-quality guide pages, then videos/screenshots.
- If sources disagree, record the disagreement and mark confidence lower.
- If a rule is seen only in a solution screenshot but not explained in text, mark it as `low` confidence and describe what still needs verification.
- The inventory must distinguish rule *names* from puzzle/window names. Example: a page title may say `Mingle Shape Window`, but the actual rule cards may be different.

Expected seed rule names to verify, not blindly trust:

- Precision / exact area
- Shape Bank / allowed shapes
- Rose Windows / symbol set per region
- Gemini / same shape
- Delta / different shape
- Polyomino
- Area Number
- Match
- Mismatch
- Solitude
- Palisade

Acceptance criteria:

- `docs/rules-inventory.md` has a clear table of all discovered rule types.
- `docs/rules-inventory.json` is machine-readable and includes IDs suitable for the app, for example `precision`, `shape_bank`, `rose_window`, `gemini`, `delta`.
- Every high-confidence rule has at least two independent sources or one very explicit source.
- Unknown/ambiguous rules are not implemented yet; they are listed with open questions.
- No solver code is changed in this task.
