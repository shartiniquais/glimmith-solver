import { canonicalShapeKey } from "./geometry.js";

export function shapeComparisonOptions(puzzle, overrides = {}) {
  const allowRotations = overrides.allowRotations ?? puzzle.rules?.shapeEquivalenceAllowRotations;
  const allowReflections = overrides.allowReflections ?? puzzle.rules?.shapeEquivalenceAllowReflections;
  return {
    allowRotations: allowRotations !== false,
    allowReflections: allowReflections === true
  };
}

export function candidateShapeForComparison(puzzle, candidate, overrides = {}) {
  const options = shapeComparisonOptions(puzzle, overrides);
  if (options.allowRotations && options.allowReflections && candidate.shapeKeyWithReflections) {
    return candidate.shapeKeyWithReflections;
  }
  if (options.allowRotations && !options.allowReflections && candidate.shapeKey) {
    return candidate.shapeKey;
  }
  return canonicalShapeKey(candidate.shapeCells ?? [], options);
}
