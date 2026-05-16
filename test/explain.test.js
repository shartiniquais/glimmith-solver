import assert from "node:assert/strict";
import test from "node:test";
import { hasBit, maskFromIndexes } from "../src/core/geometry.js";
import { createPuzzle, normalizePuzzle } from "../src/core/puzzle.js";
import { solvePuzzle } from "../src/core/solver.js";
import {
  applyLogicalStep,
  describeCandidatesForCell,
  explainCandidateViolations,
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

test("direct Rose Window candidate violation can be explained", () => {
  const puzzle = createPuzzle(3, 1);
  puzzle.rules.area = 2;
  puzzle.rules.roseLabels = "AB";
  puzzle.symbols = { 0: "A", 1: "A", 2: "B" };

  const [step] = explainCandidateViolations(puzzle);

  assert.equal(step.type, "candidate_eliminated");
  assert.equal(step.ruleId, "rose_window");
  assert.match(step.reason, /Rose Window|symbol counts/);
});

test("direct Area Number candidate violation can be explained", () => {
  const puzzle = createPuzzle(3, 1);
  puzzle.rules.area = 2;
  puzzle.clues = [{ id: "one", type: "cell", ruleId: "area_number", value: 1, location: { type: "cell", cell: 0 } }];

  const [step] = explainCandidateViolations(puzzle);

  assert.equal(step.type, "candidate_eliminated");
  assert.equal(step.ruleId, "area_number");
  assert.match(step.reason, /Area Number|area/);
});

test("direct Polyomino candidate violation can be explained", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 0;
  puzzle.rules.polyomino = { allowRotations: false, allowReflections: false };
  puzzle.clues = [
    {
      id: "vertical",
      type: "cell",
      ruleId: "polyomino",
      location: { type: "cell", cell: 0 },
      params: { shape: [[0, 0], [0, 1]], allowRotations: false, allowReflections: false }
    },
    {
      id: "horizontal",
      type: "cell",
      ruleId: "polyomino",
      location: { type: "cell", cell: 1 },
      params: { shape: [[0, 0], [1, 0]], allowRotations: false, allowReflections: false }
    }
  ];

  const [step] = explainCandidateViolations(puzzle);

  assert.equal(step.type, "candidate_eliminated");
  assert.equal(step.ruleId, "polyomino");
  assert.match(step.reason, /Polyomino|shape/);
});

test("direct candidate violation is preferred before contradiction elimination", () => {
  const puzzle = createPuzzle(3, 1);
  puzzle.rules.area = 2;
  puzzle.rules.roseLabels = "AB";
  puzzle.symbols = { 0: "A", 1: "A", 2: "B" };

  const result = findNextLogicalStep(puzzle);

  assert.equal(result.status, "step");
  assert.equal(result.step.type, "candidate_eliminated");
  assert.equal(result.step.ruleId, "rose_window");
});

test("multiple completions sharing one border produce all-completions-agree step", () => {
  const puzzle = normalizePuzzle({
    width: 3,
    height: 3,
    activeCells: [0, 1, 2, 3, 4, 5],
    rules: { area: 3 }
  });

  const result = findNextLogicalStep(puzzle, { completionLimit: 20 });

  assert.equal(result.status, "step");
  assert.equal(result.base.solutions.length, 3);
  assert.equal(result.step.type, "forced_cut");
  assert.deepEqual(result.step.edge, [1, 4]);
  assert.equal(result.step.proof.result, "all_completions_agree");
});

test("candidate elimination metadata removes the candidate from future candidate lists", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  const mask = maskFromIndexes([0, 1]).toString();
  const before = solvePuzzle(puzzle);
  assert.ok(before.candidates.some((candidate) => candidate.mask.toString() === mask));

  const next = applyLogicalStep(puzzle, {
    type: "candidate_eliminated",
    region: { mask }
  });
  const after = solvePuzzle(next);

  assert.deepEqual(next.metadata.excludedCandidateMasks, [mask]);
  assert.ok(after.candidates.every((candidate) => candidate.mask.toString() !== mask));
  assert.ok(after.candidates.every((candidate) => !hasBit(candidate.mask, 0) || !hasBit(candidate.mask, 1)));
});
