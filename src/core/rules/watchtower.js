import { cellsAroundVertex, distinctRegionsTouchingVertex, regionContainsCell } from "../boundary.js";
import { cluesForRule } from "./clue-helpers.js";

export const watchtowerRule = {
  id: "watchtower",
  label: "Watchtower",
  scope: "vertex",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    value: "integer_1_to_4",
    location: "vertex"
  },

  validatePuzzle(context) {
    const errors = [];
    for (const clue of watchtowerClues(context)) {
      const vertex = watchtowerVertex(clue);
      if (!vertex || clue.type !== "vertex" || clue.location?.type !== "vertex") {
        errors.push(`Watchtower clue "${clue.id}" requires a vertex location.`);
      } else if (vertex.x < 0 || vertex.x > context.puzzle.width || vertex.y < 0 || vertex.y > context.puzzle.height) {
        errors.push(`Watchtower clue "${clue.id}" vertex is outside the board.`);
      }
      const value = watchtowerValue(clue);
      if (!Number.isInteger(value) || value < 1 || value > 4) {
        errors.push(`Watchtower clue "${clue.id}" requires an integer value from 1 to 4.`);
      }
    }
    return errors;
  },

  addConstraints(model, context) {
    const clues = watchtowerClues(context)
      .map((clue) => ({
        clue,
        vertex: watchtowerVertex(clue),
        value: watchtowerValue(clue)
      }))
      .filter((item) => item.vertex && Number.isInteger(item.value) && item.value >= 1 && item.value <= 4);

    if (clues.length === 0) return;

    model.addSelectionValidator((selectedCandidates) => {
      for (const item of clues) {
        const cells = cellsAroundVertex(context.puzzle, item.vertex);
        const touchingCount = distinctRegionsTouchingVertex(selectedCandidates, context.puzzle, item.vertex);
        if (touchingCount > item.value) return false;
        const covered = new Set();
        for (const candidate of selectedCandidates) {
          for (const cell of cells) {
            if (regionContainsCell(candidate, cell)) covered.add(cell);
          }
        }
        if (covered.size === cells.length && touchingCount !== item.value) return false;
      }
      return true;
    });
  }
};

function watchtowerClues(context) {
  return cluesForRule(context, "watchtower");
}

function watchtowerVertex(clue) {
  const x = Number(clue.location?.x ?? clue.x);
  const y = Number(clue.location?.y ?? clue.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  return { x, y };
}

function watchtowerValue(clue) {
  return Number(clue.value ?? clue.params?.value);
}
