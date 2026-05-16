import assert from "node:assert/strict";
import test from "node:test";
import { buildCandidateGenerationPlan } from "../src/core/candidates.js";
import { normalizePuzzle } from "../src/core/puzzle.js";

test("candidate generation plan uses shape bank when shapeBankText is present", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 1,
    rules: {
      shapeBankText: "M1: 0,0"
    }
  });

  const plan = buildCandidateGenerationPlan(puzzle);
  assert.equal(plan.kind, "shape_bank");
});

test("candidate generation plan uses fixed area for Precision without shape bank", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 2,
    rules: {
      area: 2
    }
  });

  const plan = buildCandidateGenerationPlan(puzzle);
  assert.equal(plan.kind, "fixed_area");
});

test("candidate generation plan reports missing source without Precision or shape bank", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 2,
    rules: {
      area: 0,
      shapeBankText: ""
    }
  });

  const plan = buildCandidateGenerationPlan(puzzle);
  assert.equal(plan.kind, "missing_source");
});

test("candidate generation plan can use area number clues as a source", () => {
  const puzzle = normalizePuzzle({
    width: 3,
    height: 1,
    clues: [{ id: "area_2", type: "cell", ruleId: "area_number", value: 2, location: { type: "cell", cell: 0 } }]
  });

  const plan = buildCandidateGenerationPlan(puzzle);
  assert.equal(plan.kind, "area_number_clues");
  assert.deepEqual(plan.areas, [2]);
});

test("candidate generation plan can use polyomino clues as a source", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 2,
    clues: [
      {
        id: "domino",
        type: "cell",
        ruleId: "polyomino",
        location: { type: "cell", cell: 0 },
        params: { shape: [[0, 0], [1, 0]] }
      }
    ]
  });

  const plan = buildCandidateGenerationPlan(puzzle);
  assert.equal(plan.kind, "polyomino_clues");
  assert.equal(plan.shapes.length, 1);
});
