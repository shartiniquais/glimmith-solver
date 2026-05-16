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

test("shape comparison defaults match confirmed game semantics", () => {
  const puzzle = createPuzzle(2, 2);
  assert.equal(puzzle.rules.allowRotations, true);
  assert.equal(puzzle.rules.allowReflections, true);
  assert.equal(puzzle.rules.shapeEquivalenceAllowRotations, true);
  assert.equal(puzzle.rules.shapeEquivalenceAllowReflections, true);
  assert.equal(puzzle.shapeBank.allowRotations, true);
  assert.equal(puzzle.shapeBank.allowReflections, true);
  assert.equal(puzzle.shapeBank.shapeEquivalenceAllowRotations, true);
  assert.equal(puzzle.shapeBank.shapeEquivalenceAllowReflections, true);

  const explicitOverride = normalizePuzzle({
    width: 2,
    height: 2,
    rules: {
      allowRotations: false,
      allowReflections: false,
      shapeEquivalenceAllowRotations: false,
      shapeEquivalenceAllowReflections: false
    }
  });
  assert.equal(explicitOverride.rules.allowRotations, false);
  assert.equal(explicitOverride.rules.allowReflections, false);
  assert.equal(explicitOverride.rules.shapeEquivalenceAllowRotations, false);
  assert.equal(explicitOverride.rules.shapeEquivalenceAllowReflections, false);
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

test("edge relation clues must reference orthogonally adjacent cells", () => {
  for (const ruleId of ["gemini", "delta", "difference", "inequality"]) {
    const clue = {
      id: `non_adjacent_${ruleId}`,
      type: "relation",
      ruleId,
      regionRefs: [{ cell: 0 }, { cell: 3 }]
    };
    if (ruleId === "difference") clue.value = 1;
    if (ruleId === "inequality") clue.params = { direction: "lt" };

    const result = validatePuzzle({
      width: 2,
      height: 2,
      rules: { area: 2, [ruleId]: {} },
      clues: [clue]
    });

    assert.equal(result.ok, false, `${ruleId} should reject diagonal refs`);
    assert.match(result.errors.join("\n"), /must reference two orthogonally adjacent cells/, ruleId);
  }
});

test("edge relation clues can use adjacent edge locations as region references", () => {
  for (const ruleId of ["gemini", "delta", "difference", "inequality"]) {
    const clue = {
      id: `edge_${ruleId}`,
      type: "relation",
      ruleId,
      location: { type: "edge", cells: [0, 1] }
    };
    if (ruleId === "difference") clue.value = 1;
    if (ruleId === "inequality") clue.params = { direction: "lt" };

    const result = validatePuzzle({
      width: 2,
      height: 2,
      rules: { area: 2, [ruleId]: {} },
      clues: [clue]
    });

    assert.doesNotMatch(result.errors.join("\n"), /must reference two orthogonally adjacent cells/, ruleId);
    assert.doesNotMatch(result.errors.join("\n"), /must reference two region cells/, ruleId);
  }
});

test("validation reports unknown rules, invalid clues, and impossible masks", () => {
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
      bricky: {}
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
  assert.match(result.errors.join("\n"), /Relation clue "bad_relation".*outside the board/);
  assert.match(result.errors.join("\n"), /Shape Bank entry "TooBig" has more cells than the active board/);
});

test("validation distinguishes unknown and implemented known rules", () => {
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

  const palisade = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "full", type: "cell", ruleId: "palisade", location: { type: "cell", cell: 0 }, params: { pattern: "full" } }]
  });
  assert.equal(palisade.ok, true);

  const compass = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "blank", type: "cell", ruleId: "compass", location: { type: "cell", cell: 0 }, params: {} }]
  });
  assert.equal(compass.ok, true);

  const watchtower = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "one", type: "vertex", ruleId: "watchtower", location: { type: "vertex", x: 0, y: 0 }, value: 1 }]
  });
  assert.equal(watchtower.ok, true);

  const bricky = validatePuzzle({
    width: 1,
    height: 1,
    rules: {
      bricky: {}
    }
  });
  assert.equal(bricky.ok, true);

  const loopy = validatePuzzle({
    width: 1,
    height: 1,
    rules: {
      loopy: {}
    }
  });
  assert.equal(loopy.ok, true);
});

test("Palisade, Compass, and Watchtower validate rule-specific clue data", () => {
  const palisade = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "bad_pattern", type: "cell", ruleId: "palisade", location: { type: "cell", cell: 0 }, params: { pattern: "diagonal" } }]
  });
  assert.equal(palisade.ok, false);
  assert.match(palisade.errors.join("\n"), /requires a valid pattern/);

  const compass = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "bad_north", type: "cell", ruleId: "compass", location: { type: "cell", cell: 0 }, params: { N: -1 } }]
  });
  assert.equal(compass.ok, false);
  assert.match(compass.errors.join("\n"), /direction N requires a non-negative integer value/);

  const watchtowerValue = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "five", type: "vertex", ruleId: "watchtower", location: { type: "vertex", x: 0, y: 0 }, value: 5 }]
  });
  assert.equal(watchtowerValue.ok, false);
  assert.match(watchtowerValue.errors.join("\n"), /requires an integer value from 1 to 4/);

  const watchtowerLocation = validatePuzzle({
    width: 1,
    height: 1,
    clues: [{ id: "outside", type: "vertex", ruleId: "watchtower", location: { type: "vertex", x: 2, y: 0 }, value: 1 }]
  });
  assert.equal(watchtowerLocation.ok, false);
  assert.match(watchtowerLocation.errors.join("\n"), /vertex is outside the board/);
});
