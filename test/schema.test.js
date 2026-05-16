import assert from "node:assert/strict";
import test from "node:test";
import { createPuzzle, normalizePuzzle, setEdgeRelation } from "../src/core/puzzle.js";
import { solvePuzzle } from "../src/core/solver.js";
import { validatePuzzle } from "../src/core/validation.js";

test("legacy puzzle shape normalizes to canonical version 2 schema", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 2,
    active: [true, true, false, true],
    symbols: { 0: "a", 3: "b" },
    edges: { "0-1": { state: "join" } },
    rules: {
      area: 2,
      roseLabels: "ab",
      allowRotations: true,
      allowReflections: false,
      shapeEquivalenceAllowReflections: true
    }
  });

  assert.equal(puzzle.version, 2);
  assert.deepEqual(puzzle.activeCells, [0, 1, 3]);
  assert.deepEqual(puzzle.active, [true, true, false, true]);
  assert.deepEqual(puzzle.symbols, { 0: "A", 3: "B" });
  assert.deepEqual(puzzle.edgeConstraints, { "0-1": { state: "join", relation: null } });
  assert.equal(puzzle.edges, puzzle.edgeConstraints);
  assert.deepEqual(puzzle.rules.precision, { area: 2 });
  assert.deepEqual(puzzle.rules.rose_window, { requiredSymbolCounts: { A: 1, B: 1 } });
  assert.deepEqual(puzzle.clues, []);
  assert.deepEqual(puzzle.metadata, {});
});

test("legacy edge relation is represented as a generic relation clue", () => {
  let puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  puzzle = setEdgeRelation(puzzle, 0, 1, "sameShape");

  const clue = puzzle.clues.find((item) => item.ruleId === "gemini");
  assert.ok(clue);
  assert.equal(clue.type, "relation");
  assert.deepEqual(clue.location, { type: "edge", cells: [0, 1] });
  assert.deepEqual(clue.regionRefs, [{ cell: 0 }, { cell: 1 }]);

  const result = solvePuzzle(puzzle, { limit: 2 });
  assert.equal(result.status, "unique_solution");
});

test("legacy differentShape edge relation becomes a Delta relation clue", () => {
  let puzzle = createPuzzle(2, 2);
  puzzle.rules.area = 2;
  puzzle = setEdgeRelation(puzzle, 0, 1, "differentShape");

  const clue = puzzle.clues.find((item) => item.ruleId === "delta");
  assert.ok(clue);
  assert.equal(clue.type, "relation");
  assert.deepEqual(clue.location, { type: "edge", cells: [0, 1] });
  assert.deepEqual(clue.regionRefs, [{ cell: 0 }, { cell: 1 }]);
});

test("validation reports unknown rules, blocked rules, invalid clues, and impossible masks", () => {
  const result = validatePuzzle({
    version: 2,
    width: 2,
    height: 2,
    activeCells: [0, 1, 1, 9],
    symbols: { 3: "A" },
    clues: [
      {
        id: "bad_relation",
        type: "relation",
        ruleId: "gemini",
        regionRefs: [{ cell: 0 }, { cell: 9 }]
      }
    ],
    edgeConstraints: {
      "0-3": { state: "join" }
    },
    rules: {
      unknown_rule: {},
      compass: {}
    },
    shapeBank: {
      text: "TooBig: 0,0 1,0 2,0"
    }
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /outside the 2 by 2 board/);
  assert.match(result.errors.join("\n"), /appears more than once/);
  assert.match(result.errors.join("\n"), /Symbol cell 3 is not active/);
  assert.match(result.errors.join("\n"), /must reference orthogonally adjacent cells/);
  assert.match(result.errors.join("\n"), /Unknown rule id "unknown_rule"/);
  assert.match(result.errors.join("\n"), /Rule "compass".*semantics are unverified/);
  assert.match(result.errors.join("\n"), /Relation clue "bad_relation".*outside the board/);
  assert.match(result.errors.join("\n"), /Shape Bank entry "TooBig" has more cells than the active board/);
});

test("validation distinguishes unknown, ready-unimplemented, and blocked rules", () => {
  const unknown = validatePuzzle({
    width: 1,
    height: 1,
    rules: {
      imaginary_rule: {}
    }
  });
  assert.match(unknown.errors.join("\n"), /Unknown rule id "imaginary_rule"/);

  const mingleShape = validatePuzzle({
    width: 1,
    height: 1,
    rules: {
      mingle_shape: {}
    }
  });
  assert.equal(mingleShape.ok, true);

  const areaNumber = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "area_1", type: "cell", ruleId: "area_number", value: 1, location: { type: "cell", cell: 0 } }]
  });
  assert.equal(areaNumber.ok, true);

  const polyomino = validatePuzzle({
    width: 1,
    height: 1,
    clues: [
      {
        id: "mono",
        type: "cell",
        ruleId: "polyomino",
        location: { type: "cell", cell: 0 },
        params: { shape: [[0, 0]] }
      }
    ]
  });
  assert.equal(polyomino.ok, true);

  for (const id of ["palisade", "bricky", "loopy", "compass", "watchtower"]) {
    const result = validatePuzzle({
      width: 1,
      height: 1,
      rules: {
        [id]: {}
      }
    });
    assert.doesNotMatch(result.errors.join("\n"), /Unknown rule id/);
    assert.match(result.errors.join("\n"), /not implemented because its semantics are unverified/);
  }
});

test("blocked rules are rejected by the solver with a clear validation message", () => {
  const puzzle = createPuzzle(2, 2);
  puzzle.rules.compass = {};

  const result = solvePuzzle(puzzle);
  assert.equal(result.status, "no_solution");
  assert.match(result.errors.join("\n"), /Rule "compass".*semantics are unverified/);
});
