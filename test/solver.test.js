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

test("generic Difference relation filters candidate pairs", () => {
  const puzzle = createPuzzle(3, 1);
  puzzle.rules.area = 0;
  puzzle.rules.shapeBankText = "M1: 0,0\nI2: 0,0 1,0";
  puzzle.clues = [
    {
      id: "difference_0_1",
      type: "relation",
      ruleId: "difference",
      value: 1,
      location: { type: "outside", side: "top" },
      regionRefs: [{ cell: 0 }, { cell: 1 }]
    }
  ];
  puzzle.rules.difference = {};

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0], [1, 2]]);
});

test("Area Number clues can source and filter candidates", () => {
  const puzzle = createPuzzle(3, 1);
  puzzle.rules.area = 0;
  puzzle.clues = [
    { id: "one", type: "cell", ruleId: "area_number", value: 1, location: { type: "cell", cell: 0 } },
    { id: "two", type: "cell", ruleId: "area_number", value: 2, location: { type: "cell", cell: 1 } }
  ];

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0], [1, 2]]);
});

test("Precision and Area Number can prove an impossible puzzle", () => {
  const puzzle = createPuzzle(2, 1);
  puzzle.rules.area = 2;
  puzzle.clues = [{ id: "one", type: "cell", ruleId: "area_number", value: 1, location: { type: "cell", cell: 0 } }];

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "no_solution");
});

test("Polyomino clues can source and filter shape candidates", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 0;
  puzzle.rules.polyomino = { allowRotations: false, allowReflections: false };
  puzzle.clues = [
    {
      id: "vertical_domino",
      type: "cell",
      ruleId: "polyomino",
      location: { type: "cell", cell: 0 },
      params: { shape: [[0, 0], [0, 1]] }
    }
  ];

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 2], [1, 3]]);
});

test("Polyomino rejects impossible clue shapes", () => {
  const puzzle = createPuzzle(2, 1);
  puzzle.rules.area = 0;
  puzzle.clues = [
    {
      id: "too_large",
      type: "cell",
      ruleId: "polyomino",
      location: { type: "cell", cell: 0 },
      params: { shape: [[0, 0], [1, 0], [2, 0]] }
    }
  ];

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "no_solution");
});

test("Shape Bank and Gemini interact through configurable shape comparison", () => {
  let puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  puzzle.rules.shapeBankText = "I2: 0,0 1,0";
  puzzle = setEdgeRelation(puzzle, 0, 1, "sameShape");

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 2], [1, 3]]);
});

test("Shape Bank and Delta can prove no solution", () => {
  let puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  puzzle.rules.shapeBankText = "I2: 0,0 1,0";
  puzzle = setEdgeRelation(puzzle, 0, 1, "differentShape");

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "no_solution");
});

test("Mingle Shape rejects adjacent same-shape regions", () => {
  const puzzle = createPuzzle(4, 1);
  puzzle.rules.area = 2;
  puzzle.rules.mingle_shape = {};

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "no_solution");
});

test("Mingle Shape allows adjacent different-shape regions", () => {
  let puzzle = createPuzzle(3, 3);
  puzzle.rules.area = 3;
  puzzle.rules.mingle_shape = {};
  puzzle.active = [true, true, true, true, true, false, true, false, false];
  puzzle.activeCells = [0, 1, 2, 3, 4, 6];
  puzzle = setEdgeState(puzzle, 0, 3, "join");
  puzzle = setEdgeState(puzzle, 3, 6, "join");
  puzzle = setEdgeState(puzzle, 1, 2, "join");
  puzzle = setEdgeState(puzzle, 1, 4, "join");
  puzzle = setEdgeState(puzzle, 0, 1, "cut");
  puzzle = setEdgeState(puzzle, 3, 4, "cut");

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 3, 6], [1, 2, 4]]);
});

test("Mingle Shape allows non-adjacent duplicate shapes", () => {
  const puzzle = createPuzzle(5, 1);
  puzzle.rules.area = 2;
  puzzle.rules.mingle_shape = {};
  puzzle.active[2] = false;
  puzzle.activeCells = [0, 1, 3, 4];

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 1], [3, 4]]);
});

test("Mingle Shape respects reflection equivalence", () => {
  const withoutReflections = solvePuzzle(mirroredMinglePuzzle({ allowReflections: false }), { limit: 2 });
  assert.equal(withoutReflections.status, "unique_solution");
  assert.deepEqual(withoutReflections.solutions[0].regions.map((region) => region.cells), [
    [1, 2, 6, 7],
    [3, 4, 10, 11]
  ]);

  const withReflections = solvePuzzle(mirroredMinglePuzzle({ allowReflections: true }), { limit: 2 });
  assert.equal(withReflections.status, "no_solution");
});

function mirroredMinglePuzzle(mingleConfig) {
  let puzzle = createPuzzle(6, 2);
  puzzle.rules.area = 4;
  puzzle.rules.mingle_shape = mingleConfig;
  puzzle.rules.shapeEquivalenceAllowReflections = false;
  puzzle.active = [
    false, true, true, true, true, false,
    true, true, false, false, true, true
  ];
  puzzle.activeCells = [1, 2, 3, 4, 6, 7, 10, 11];
  puzzle = setEdgeState(puzzle, 1, 2, "join");
  puzzle = setEdgeState(puzzle, 1, 7, "join");
  puzzle = setEdgeState(puzzle, 6, 7, "join");
  puzzle = setEdgeState(puzzle, 3, 4, "join");
  puzzle = setEdgeState(puzzle, 4, 10, "join");
  puzzle = setEdgeState(puzzle, 10, 11, "join");
  puzzle = setEdgeState(puzzle, 2, 3, "cut");
  return puzzle;
}

test("Polyomino clue placement uses clue reflection settings", () => {
  const basePuzzle = createPuzzle(3, 3);
  basePuzzle.rules.area = 0;
  basePuzzle.rules.polyomino = { allowRotations: false, allowReflections: false };
  basePuzzle.active = [true, true, true, false, true, true, false, false, true];
  basePuzzle.activeCells = [0, 1, 2, 4, 5, 8];
  basePuzzle.clues = [
    {
      id: "left_chiral",
      type: "cell",
      ruleId: "polyomino",
      location: { type: "cell", cell: 0 },
      params: { shape: [[0, 0], [1, 0], [0, 1]], allowRotations: false, allowReflections: false }
    },
    {
      id: "vertical",
      type: "cell",
      ruleId: "polyomino",
      location: { type: "cell", cell: 2 },
      params: { shape: [[0, 0], [0, 1], [0, 2]], allowRotations: false, allowReflections: false }
    }
  ];

  const withoutReflections = solvePuzzle(basePuzzle, { limit: 2 });
  assert.equal(withoutReflections.status, "no_solution");

  const withReflections = createPuzzle(3, 2);
  Object.assign(withReflections, basePuzzle);
  withReflections.clues = [
    {
      ...basePuzzle.clues[0],
      params: { ...basePuzzle.clues[0].params, allowReflections: true }
    },
    basePuzzle.clues[1]
  ];

  const result = solvePuzzle(withReflections, { limit: 2 });
  assert.equal(result.status, "unique_solution");
  assert.deepEqual(result.solutions[0].regions.map((region) => region.cells), [[0, 1, 4], [2, 5, 8]]);
});

test("next-step explainer finds a forced join", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 4;
  const result = findNextLogicalStep(puzzle);
  assert.equal(result.status, "step");
  assert.equal(result.step.type, "forced_region");
  assert.equal(result.step.proof.result, "all_completions_agree");
  assert.deepEqual(result.step.cells, [0, 1, 2, 3]);
});
