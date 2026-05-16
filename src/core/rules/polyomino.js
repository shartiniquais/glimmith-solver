import { canonicalShapeKey, hasBit, normalizeShape } from "../geometry.js";
import { clueCell, cluesForRule } from "./clue-helpers.js";

export const polyominoRule = {
  id: "polyomino",
  label: "Polyomino",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    shape: "polyomino_cell_coordinates",
    location: "cell",
    allowRotations: "boolean",
    allowReflections: "boolean"
  },

  validatePuzzle(context) {
    const clues = polyominoClues(context);
    if (clues.length === 0) return ['Rule "polyomino" requires at least one polyomino clue.'];

    const errors = [];
    for (const clue of clues) {
      const cell = clueCell(clue);
      if (cell === null) errors.push(`Polyomino clue "${clue.id}" requires a cell location.`);
      const cells = polyominoShapeCells(clue);
      if (cells.length === 0) errors.push(`Polyomino clue "${clue.id}" requires a non-empty shape.`);
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    for (const clue of polyominoClues(context)) {
      const cell = clueCell(clue);
      if (cell === null || !hasBit(candidate.mask, cell)) continue;
      const clueKey = polyominoShapeKey(clue, context);
      if (!clueKey || candidatePolyominoKey(candidate, clue, context) !== clueKey) return false;
    }
    return true;
  },

  explainElimination(candidate, context) {
    for (const clue of polyominoClues(context)) {
      const cell = clueCell(clue);
      if (cell !== null && hasBit(candidate.mask, cell) && candidatePolyominoKey(candidate, clue, context) !== polyominoShapeKey(clue, context)) {
        return `Candidate shape does not match Polyomino clue "${clue.id}".`;
      }
    }
    return null;
  }
};

export function polyominoCandidateShapes(context) {
  return polyominoClues(context)
    .map((clue, index) => {
      const cells = polyominoShapeCells(clue);
      if (cells.length === 0) return null;
      return {
        name: String(clue.params?.name ?? clue.name ?? clue.id ?? `polyomino_${index + 1}`),
        cells,
        options: polyominoOptions(clue, context),
        matchOptions: polyominoOptions(clue, context)
      };
    })
    .filter(Boolean);
}

function polyominoClues(context) {
  return cluesForRule(context, "polyomino");
}

function candidatePolyominoKey(candidate, clue, context) {
  return canonicalShapeKey(candidate.shapeCells, candidate.matchOptions ?? polyominoOptions(clue, context));
}

function polyominoShapeKey(clue, context) {
  const cells = polyominoShapeCells(clue);
  if (cells.length === 0) return "";
  return canonicalShapeKey(cells, polyominoOptions(clue, context));
}

function polyominoOptions(clue, context) {
  const config = context.ruleConfigs.polyomino ?? {};
  const allowRotations = clue.params?.allowRotations ?? config.allowRotations ?? context.puzzle.shapeBank?.allowRotations ?? true;
  const allowReflections = clue.params?.allowReflections ?? config.allowReflections ?? context.puzzle.shapeBank?.allowReflections;
  return {
    allowRotations: allowRotations !== false,
    allowReflections: allowReflections === true
  };
}

function polyominoShapeCells(clue) {
  const raw = clue.params?.shape ?? clue.params?.cells ?? clue.shape ?? clue.cells;
  if (!Array.isArray(raw)) return [];
  const cells = raw
    .map((cell) => (Array.isArray(cell) ? [Number(cell[0]), Number(cell[1])] : null))
    .filter((cell) => cell && Number.isInteger(cell[0]) && Number.isInteger(cell[1]));
  return normalizeShape(cells);
}
