import { orthogonalNeighbors } from "../geometry.js";
import { candidateShapeForComparison } from "../shape-comparison.js";

export const mingleShapeRule = {
  id: "mingle_shape",
  label: "Mingle Shape",
  scope: "pairwise",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    allowRotations: "boolean",
    allowReflections: "boolean"
  },

  validatePuzzle() {
    return [];
  },

  addConstraints(model, context) {
    const candidates = context.candidates ?? [];
    const shapeOptions = mingleShapeOptions(context);
    for (let i = 0; i < candidates.length; i += 1) {
      for (let j = i + 1; j < candidates.length; j += 1) {
        const left = candidates[i];
        const right = candidates[j];
        if ((left.mask & right.mask) !== 0n) continue;
        if (!areOrthogonallyAdjacent(left, right, context.puzzle)) continue;
        if (
          candidateShapeForComparison(context.puzzle, left, shapeOptions) ===
          candidateShapeForComparison(context.puzzle, right, shapeOptions)
        ) {
          model.addInvalidPair(left.id, right.id);
        }
      }
    }
  },

  explainElimination(candidate, context) {
    const shape = candidateShapeForComparison(context.puzzle, candidate, mingleShapeOptions(context));
    return `Mingle Shape rejects orthogonally adjacent regions with matching shape ${shape}.`;
  }
};

function mingleShapeOptions(context) {
  const config = context.ruleConfigs.mingle_shape;
  return {
    allowRotations: config?.allowRotations,
    allowReflections: config?.allowReflections
  };
}

function areOrthogonallyAdjacent(left, right, puzzle) {
  const rightCells = new Set(right.cells);
  for (const cell of left.cells) {
    for (const neighbor of orthogonalNeighbors(cell, puzzle.width, puzzle.height)) {
      if (rightCells.has(neighbor)) return true;
    }
  }
  return false;
}
