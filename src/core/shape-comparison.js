import { canonicalShapeKey } from "./geometry.js";

export function shapeComparisonOptions(puzzle) {
  return {
    allowRotations: puzzle.rules?.shapeEquivalenceAllowRotations !== false,
    allowReflections: puzzle.rules?.shapeEquivalenceAllowReflections === true
  };
}

export function candidateShapeForComparison(puzzle, candidate) {
  const options = shapeComparisonOptions(puzzle);
  if (options.allowRotations && options.allowReflections && candidate.shapeKeyWithReflections) {
    return candidate.shapeKeyWithReflections;
  }
  if (options.allowRotations && !options.allowReflections && candidate.shapeKey) {
    return candidate.shapeKey;
  }
  return canonicalShapeKey(candidate.shapeCells ?? [], options);
}

