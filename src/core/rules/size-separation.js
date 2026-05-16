import { orthogonalNeighbors } from "../geometry.js";

export const sizeSeparationRule = {
  id: "size_separation",
  label: "Size Separation",
  scope: "pairwise",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {},

  validatePuzzle() {
    return [];
  },

  addConstraints(model, context) {
    const candidates = context.candidates ?? [];
    for (let i = 0; i < candidates.length; i += 1) {
      for (let j = i + 1; j < candidates.length; j += 1) {
        const left = candidates[i];
        const right = candidates[j];
        if ((left.mask & right.mask) !== 0n) continue;
        if (left.area !== right.area) continue;
        if (areOrthogonallyAdjacent(left, right, context.puzzle)) model.addInvalidPair(left.id, right.id);
      }
    }
  }
};

function areOrthogonallyAdjacent(left, right, puzzle) {
  const rightCells = new Set(right.cells);
  for (const cell of left.cells) {
    for (const neighbor of orthogonalNeighbors(cell, puzzle.width, puzzle.height)) {
      if (rightCells.has(neighbor)) return true;
    }
  }
  return false;
}
