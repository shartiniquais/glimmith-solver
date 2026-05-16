import assert from "node:assert/strict";
import test from "node:test";
import { createPuzzle, setEdgeState, setEdgeRelation } from "../src/core/puzzle.js";
import { solvePuzzle } from "../src/core/solver.js";
import { findNextLogicalStep } from "../src/core/explain.js";

test("2x2 Precision(4) has one four-cell region", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 4;
  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.equal(result.solutions[0].regions.length, 1);
  assert.deepEqual(result.solutions[0].regions[0].cells, [0, 1, 2, 3]);
});

test("2x2 Precision(2) has multiple domino partitions", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "multiple_solutions");
  assert.equal(result.solutions[0].regions.length, 2);
});

test("given join constraint can force a unique domino partition", () => {
  let puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  puzzle = setEdgeState(puzzle, 0, 1, "join");
  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 1], [2, 3]]);
});

test("Rose labels require one of each listed symbol per region", () => {
  const puzzle = createPuzzle(4, 1);
  puzzle.rules.area = 2;
  puzzle.rules.roseLabels = "AB";
  puzzle.symbols = { 0: "A", 1: "B", 2: "A", 3: "B" };
  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 1], [2, 3]]);
});

test("shape bank placements solve a simple square", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 4;
  puzzle.rules.shapeBankText = "O4: 0,0 1,0 0,1 1,1";
  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.equal(result.solutions[0].regions.length, 1);
});

test("same-shape relation filters candidate pairs", () => {
  let puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  puzzle = setEdgeRelation(puzzle, 0, 1, "sameShape");
  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 2], [1, 3]]);
});

test("different-shape relation can prove no solution", () => {
  let puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  puzzle = setEdgeRelation(puzzle, 0, 1, "differentShape");
  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "no_solution");
});

test("next-step explainer finds a forced join", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 4;
  const result = findNextLogicalStep(puzzle);
  assert.equal(result.status, "step");
  assert.equal(result.step.state, "join");
});
