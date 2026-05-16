import assert from "node:assert/strict";
import test from "node:test";
import { createPuzzle } from "../src/core/puzzle.js";
import {
  applyLogicalStep,
  describeCandidatesForCell,
  explainAllLogicalSteps,
  findNextLogicalStep,
  isStepApplyable
} from "../src/core/explain.js";
import { RULE_EXPLANATION_SNIPPETS } from "../src/core/rule-explanations.js";
import { RULE_REGISTRY } from "../src/core/rules/registry.js";

test("next logical step is a structured forced-region explanation", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 4;

  const result = findNextLogicalStep(puzzle);

  assert.equal(result.status, "step");
  assert.equal(result.step.type, "forced_region");
  assert.deepEqual(result.step.edge, null);
  assert.deepEqual(result.step.cells, [0, 1, 2, 3]);
  assert.equal(result.step.ruleId, "precision");
  assert.match(result.step.reason, /only be covered/);
  assert.equal(result.step.proof.result, "all_completions_agree");
});

test("applyLogicalStep applies forced region borders", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 4;
  const { step } = findNextLogicalStep(puzzle);

  const next = applyLogicalStep(puzzle, step);

  assert.equal(next.edges["0-1"].state, "join");
  assert.equal(next.edges["0-2"].state, "join");
  assert.equal(next.edges["1-3"].state, "join");
  assert.equal(next.edges["2-3"].state, "join");
});

test("describeCandidatesForCell lists candidates for a selected cell", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;

  const result = describeCandidatesForCell(puzzle, 0);

  assert.equal(result.label, "A1");
  assert.equal(result.count, 2);
  assert.deepEqual(result.candidates.map((candidate) => candidate.cells), [[0, 1], [0, 2]]);
});

test("explainAllLogicalSteps returns an applyable trace", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 4;

  const result = explainAllLogicalSteps(puzzle);

  assert.ok(result.steps.length >= 1);
  assert.equal(isStepApplyable(result.steps[0]), true);
  assert.match(result.text, /Force region/);
});

test("implemented rules have explanation snippets", () => {
  const implementedIds = Object.values(RULE_REGISTRY)
    .filter((rule) => rule.implemented)
    .map((rule) => rule.id)
    .sort();

  assert.deepEqual(Object.keys(RULE_EXPLANATION_SNIPPETS).sort(), implementedIds);
  for (const [ruleId, snippets] of Object.entries(RULE_EXPLANATION_SNIPPETS)) {
    assert.ok(
      snippets.candidateViolation || snippets.pairIncompatible,
      `${ruleId} needs a candidate or pair explanation`
    );
    assert.ok(snippets.clueSatisfied, `${ruleId} needs a satisfied clue explanation`);
    assert.ok(snippets.clueUnsatisfied, `${ruleId} needs an unsatisfied clue explanation`);
  }
});
