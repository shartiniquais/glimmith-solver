import { candidateShapeForComparison } from "../shape-comparison.js";

export const matchRule = {
  id: "match",
  label: "Match",
  scope: "global",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {},

  validatePuzzle() {
    return [];
  },

  addConstraints(model, context) {
    forEachCandidatePair(context.candidates ?? [], (left, right) => {
      if (candidateShapeForComparison(context.puzzle, left) !== candidateShapeForComparison(context.puzzle, right)) {
        model.addInvalidPair(left.id, right.id);
      }
    });
  }
};

export const mismatchRule = {
  id: "mismatch",
  label: "Mismatch",
  scope: "global",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {},

  validatePuzzle() {
    return [];
  },

  addConstraints(model, context) {
    forEachCandidatePair(context.candidates ?? [], (left, right) => {
      if (candidateShapeForComparison(context.puzzle, left) === candidateShapeForComparison(context.puzzle, right)) {
        model.addInvalidPair(left.id, right.id);
      }
    });
  }
};

function forEachCandidatePair(candidates, callback) {
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      callback(candidates[i], candidates[j]);
    }
  }
}
