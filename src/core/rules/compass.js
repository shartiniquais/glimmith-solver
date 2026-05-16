import { hasBit, xy } from "../geometry.js";
import { clueCell, cluesForRule } from "./clue-helpers.js";

const DIRECTIONS = Object.freeze(["N", "E", "S", "W"]);

export const compassRule = {
  id: "compass",
  label: "Compass",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    N: "optional_non_negative_integer",
    E: "optional_non_negative_integer",
    S: "optional_non_negative_integer",
    W: "optional_non_negative_integer",
    location: "cell"
  },

  validatePuzzle(context) {
    const errors = [];
    for (const clue of compassClues(context)) {
      const cell = clueCell(clue);
      if (cell === null) errors.push(`Compass clue "${clue.id}" requires a cell location.`);
      for (const direction of DIRECTIONS) {
        const value = compassValue(clue, direction);
        if (value !== null && (!Number.isInteger(value) || value < 0)) {
          errors.push(`Compass clue "${clue.id}" direction ${direction} requires a non-negative integer value.`);
        }
      }
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    for (const clue of compassClues(context)) {
      const cell = clueCell(clue);
      if (cell === null || !hasBit(candidate.mask, cell)) continue;
      const counts = compassCounts(candidate, context.puzzle, cell);
      for (const direction of DIRECTIONS) {
        const expected = compassValue(clue, direction);
        if (expected !== null && counts[direction] !== expected) return false;
      }
    }
    return true;
  },

  explainElimination(candidate, context) {
    for (const clue of compassClues(context)) {
      const cell = clueCell(clue);
      if (cell === null || !hasBit(candidate.mask, cell)) continue;
      const counts = compassCounts(candidate, context.puzzle, cell);
      for (const direction of DIRECTIONS) {
        const expected = compassValue(clue, direction);
        if (expected !== null && counts[direction] !== expected) {
          return `Compass clue "${clue.id}" requires ${direction} count ${expected}, not ${counts[direction]}.`;
        }
      }
    }
    return null;
  }
};

export function compassCounts(candidate, puzzle, clueCellIndex) {
  const clue = xy(clueCellIndex, puzzle.width);
  const counts = { N: 0, E: 0, S: 0, W: 0 };
  for (const cell of candidate.cells ?? []) {
    if (cell === clueCellIndex) continue;
    const point = xy(cell, puzzle.width);
    if (point.y < clue.y) counts.N += 1;
    if (point.y > clue.y) counts.S += 1;
    if (point.x < clue.x) counts.W += 1;
    if (point.x > clue.x) counts.E += 1;
  }
  return counts;
}

function compassClues(context) {
  return cluesForRule(context, "compass");
}

function compassValue(clue, direction) {
  const value = clue.params?.[direction] ?? clue.params?.[direction.toLowerCase()] ?? clue[direction] ?? clue[direction.toLowerCase()];
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
}
