# Codex prompt 04 — Improve next-step logic and explanations

You are working in the `glimmith-solver` repository.

Goal: improve the solver so it can explain the solution as a sequence of logical steps, not just output the final partition.

Core idea:

At any partial puzzle state, use contradiction checks over the exact-cover model:

- If assuming an edge is joined gives zero solutions, the edge must be cut.
- If assuming an edge is cut gives zero solutions, the edge must be joined.
- If every solution contains the same complete region, that region is forced.
- If a candidate region appears in no valid completion, it can be eliminated.
- If a clue leaves only one compatible pair of regions, that relation is forced.

Required features:

1. Step types

Implement structured step objects:

```js
{
  type: 'forced_cut' | 'forced_join' | 'forced_region' | 'candidate_eliminated' | 'contradiction' | 'rule_application',
  cells: [],
  edge: null,
  region: null,
  ruleId: null,
  beforeState: {},
  afterState: {},
  reason: 'human-readable explanation',
  proof: {
    assumption: {},
    result: 'no_solution' | 'unique_completion' | 'all_completions_agree'
  }
}
```

2. Human-readable explanations

For each implemented rule, provide explanation snippets:

- why a candidate region violates the rule,
- why two regions are incompatible,
- why a clue is satisfied or unsatisfied.

3. Difficulty ordering

When several forced steps exist, prefer simpler local explanations:

1. candidate directly violates one rule,
2. cell has only one candidate region,
3. clue has only one compatible region pair,
4. edge forced by all completions,
5. contradiction proof requiring solving.

4. UI

Add buttons:

- `Next step`,
- `Explain all`,
- `Apply step`,
- `Show candidates for selected cell`.

Acceptance criteria:

- The app can solve a small puzzle step-by-step.
- Every step references a rule or contradiction proof.
- The final explanation trace can be exported as JSON or copied as text.
- `npm test` passes.
