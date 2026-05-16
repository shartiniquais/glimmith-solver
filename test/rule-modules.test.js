import assert from "node:assert/strict";
import test from "node:test";
import { createConstraintModel } from "../src/core/constraints.js";
import { canonicalShapeKey, maskFromIndexes } from "../src/core/geometry.js";
import { normalizePuzzle } from "../src/core/puzzle.js";
import { areaNumberRule } from "../src/core/rules/area-number.js";
import { mingleShapeRule } from "../src/core/rules/mingle-shape.js";
import { deltaRule, differenceRule, geminiRule } from "../src/core/rules/relations.js";
import { polyominoRule } from "../src/core/rules/polyomino.js";
import { precisionRule } from "../src/core/rules/precision.js";
import { createRuleContext } from "../src/core/rules/registry.js";
import { roseWindowRule } from "../src/core/rules/rose-window.js";
import { shapeBankRule } from "../src/core/rules/shape-bank.js";

test("Precision rule filters by candidate area", () => {
  const context = createRuleContext(normalizePuzzle({ width: 2, height: 2, rules: { area: 2 } }));

  assert.equal(precisionRule.candidateFilter({ area: 2 }, context), true);
  assert.equal(precisionRule.candidateFilter({ area: 3 }, context), false);
});

test("Rose Window rule filters by required symbol counts", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 1,
    symbols: { 0: "A", 1: "B" },
    rules: { roseLabels: "AB" }
  });
  const context = createRuleContext(puzzle);

  assert.equal(roseWindowRule.candidateFilter(candidate([0, 1], 2), context), true);
  assert.equal(roseWindowRule.candidateFilter(candidate([0], 2), context), false);
});

test("Shape Bank rule validates optional future use limits", () => {
  const puzzle = normalizePuzzle({
    width: 1,
    height: 1,
    shapeBank: { text: "M1: 0,0", exactUses: -1 }
  });
  const context = createRuleContext(puzzle);

  assert.match(shapeBankRule.validatePuzzle(context).join("\n"), /exactUses/);
});

test("Area Number rule filters candidates containing number clues", () => {
  const puzzle = normalizePuzzle({
    width: 3,
    height: 1,
    clues: [{ id: "area_2", type: "cell", ruleId: "area_number", value: 2, location: { type: "cell", cell: 0 } }]
  });
  const context = createRuleContext(puzzle);

  assert.equal(areaNumberRule.candidateFilter(candidate([0, 1], 3), context), true);
  assert.equal(areaNumberRule.candidateFilter(candidate([0], 3), context), false);
  assert.equal(areaNumberRule.candidateFilter(candidate([1], 3), context), true);
});

test("Polyomino rule filters candidates containing shape clues", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 2,
    rules: { polyomino: { allowRotations: false, allowReflections: false } },
    clues: [
      {
        id: "vertical_domino",
        type: "cell",
        ruleId: "polyomino",
        location: { type: "cell", cell: 0 },
        params: { shape: [[0, 0], [0, 1]] }
      }
    ]
  });
  const context = createRuleContext(puzzle);

  assert.equal(polyominoRule.candidateFilter(candidate([0, 2], 2), context), true);
  assert.equal(polyominoRule.candidateFilter(candidate([0, 1], 2), context), false);
});

test("Gemini, Delta, and Difference relation rules add pairwise incompatibilities", () => {
  const candidates = [
    { ...candidate([0], 3), id: 0, shapeKey: "mono", shapeKeyWithReflections: "mono" },
    { ...candidate([1], 3), id: 1, shapeKey: "mono", shapeKeyWithReflections: "mono" },
    { ...candidate([1, 2], 3), id: 2, shapeKey: "domino", shapeKeyWithReflections: "domino" }
  ];

  assertInvalidPairs(geminiRule, "gemini", {}, candidates, [[0, 2]]);
  assertInvalidPairs(deltaRule, "delta", {}, candidates, [[0, 1]]);
  assertInvalidPairs(differenceRule, "difference", { value: 1 }, candidates, [[0, 1]]);
});

test("Mingle Shape rejects orthogonally adjacent same-shape candidate pairs", () => {
  const puzzle = normalizePuzzle({
    width: 4,
    height: 1,
    rules: { mingle_shape: {} }
  });
  const candidates = [
    { ...candidate([0, 1], 4), id: 0, shapeKey: "domino", shapeKeyWithReflections: "domino" },
    { ...candidate([2, 3], 4), id: 1, shapeKey: "domino", shapeKeyWithReflections: "domino" }
  ];
  const context = createRuleContext(puzzle, { candidates });
  const model = createConstraintModel();

  mingleShapeRule.addConstraints(model, context);

  assert.equal(model.invalidPairs.get(0)?.has(1), true);
});

test("Mingle Shape allows adjacent different-shape candidate pairs", () => {
  const puzzle = normalizePuzzle({
    width: 3,
    height: 2,
    rules: { mingle_shape: {} }
  });
  const candidates = [
    { ...candidate([0, 1], 3), id: 0, shapeKey: "domino", shapeKeyWithReflections: "domino" },
    { ...candidate([2, 5], 3), id: 1, shapeKey: "vertical", shapeKeyWithReflections: "vertical" }
  ];
  const context = createRuleContext(puzzle, { candidates });
  const model = createConstraintModel();

  mingleShapeRule.addConstraints(model, context);

  assert.equal(model.invalidPairs.get(0)?.has(1), undefined);
});

test("Mingle Shape allows non-adjacent duplicate shapes", () => {
  const puzzle = normalizePuzzle({
    width: 5,
    height: 1,
    rules: { mingle_shape: {} }
  });
  const candidates = [
    { ...candidate([0, 1], 5), id: 0, shapeKey: "domino", shapeKeyWithReflections: "domino" },
    { ...candidate([3, 4], 5), id: 1, shapeKey: "domino", shapeKeyWithReflections: "domino" }
  ];
  const context = createRuleContext(puzzle, { candidates });
  const model = createConstraintModel();

  mingleShapeRule.addConstraints(model, context);

  assert.equal(model.invalidPairs.size, 0);
});

test("Mingle Shape rule-specific reflection setting overrides global shape comparison", () => {
  const puzzle = normalizePuzzle({
    width: 6,
    height: 2,
    rules: {
      mingle_shape: { allowReflections: true },
      shapeEquivalenceAllowReflections: false
    }
  });
  const candidates = [
    { ...candidate([1, 2, 6, 7], 6), id: 0 },
    { ...candidate([3, 4, 10, 11], 6), id: 1 }
  ];
  const context = createRuleContext(puzzle, { candidates });
  const model = createConstraintModel();

  mingleShapeRule.addConstraints(model, context);

  assert.equal(model.invalidPairs.get(0)?.has(1), true);
});

test("Mingle Shape falls back to global reflection setting without override", () => {
  const puzzle = normalizePuzzle({
    width: 6,
    height: 2,
    rules: {
      mingle_shape: {},
      shapeEquivalenceAllowReflections: true
    }
  });
  const candidates = [
    { ...candidate([1, 2, 6, 7], 6), id: 0 },
    { ...candidate([3, 4, 10, 11], 6), id: 1 }
  ];
  const context = createRuleContext(puzzle, { candidates });
  const model = createConstraintModel();

  mingleShapeRule.addConstraints(model, context);

  assert.equal(model.invalidPairs.get(0)?.has(1), true);
});

test("Mingle Shape rule-specific reflection false overrides global true", () => {
  const puzzle = normalizePuzzle({
    width: 6,
    height: 2,
    rules: {
      mingle_shape: { allowReflections: false },
      shapeEquivalenceAllowReflections: true
    }
  });
  const candidates = [
    { ...candidate([1, 2, 6, 7], 6), id: 0 },
    { ...candidate([3, 4, 10, 11], 6), id: 1 }
  ];
  const context = createRuleContext(puzzle, { candidates });
  const model = createConstraintModel();

  mingleShapeRule.addConstraints(model, context);

  assert.equal(model.invalidPairs.size, 0);
});

function assertInvalidPairs(rule, ruleId, cluePatch, candidates, expectedPairs) {
  const puzzle = normalizePuzzle({
    width: 3,
    height: 1,
    clues: [
      {
        id: `${ruleId}_relation`,
        type: "relation",
        ruleId,
        location: { type: "edge", cells: [0, 1] },
        regionRefs: [{ cell: 0 }, { cell: 1 }],
        ...cluePatch
      }
    ]
  });
  const context = createRuleContext(puzzle, { candidates });
  const model = createConstraintModel();
  rule.addConstraints(model, context);

  for (const [left, right] of expectedPairs) {
    assert.equal(model.invalidPairs.get(left)?.has(right), true, `${ruleId} should reject ${left}-${right}`);
  }
}

function candidate(cells, width) {
  const shapeCells = cells.map((cell) => [cell % width, Math.floor(cell / width)]);
  return {
    id: -1,
    cells,
    mask: maskFromIndexes(cells),
    area: cells.length,
    shapeCells,
    shapeKey: canonicalShapeKey(shapeCells, { allowRotations: true, allowReflections: false }),
    shapeKeyWithReflections: canonicalShapeKey(shapeCells, { allowRotations: true, allowReflections: true })
  };
}
