import { hasBit } from "../geometry.js";
import { clueCell, cluesForRule } from "./clue-helpers.js";

export const areaNumberRule = {
  id: "area_number",
  label: "Area Number",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    value: "positive_integer",
    location: "cell"
  },

  validatePuzzle(context) {
    const clues = areaNumberClues(context);
    if (clues.length === 0) return ['Rule "area_number" requires at least one area number clue.'];

    const errors = [];
    for (const clue of clues) {
      const cell = clueCell(clue);
      if (cell === null) errors.push(`Area Number clue "${clue.id}" requires a cell location.`);
      const value = areaNumberValue(clue);
      if (!Number.isInteger(value) || value <= 0) {
        errors.push(`Area Number clue "${clue.id}" requires a positive integer value.`);
      }
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    for (const clue of areaNumberClues(context)) {
      const cell = clueCell(clue);
      if (cell === null || !hasBit(candidate.mask, cell)) continue;
      if (candidate.area !== areaNumberValue(clue)) return false;
    }
    return true;
  },

  explainElimination(candidate, context) {
    for (const clue of areaNumberClues(context)) {
      const cell = clueCell(clue);
      const value = areaNumberValue(clue);
      if (cell !== null && hasBit(candidate.mask, cell) && candidate.area !== value) {
        return `Area Number clue ${value} requires a region of area ${value}, not ${candidate.area}.`;
      }
    }
    return null;
  }
};

export function areaNumberCandidateAreas(context) {
  return [...new Set(areaNumberClues(context).map(areaNumberValue).filter((value) => Number.isInteger(value) && value > 0))].sort(
    (a, b) => a - b,
  );
}

function areaNumberClues(context) {
  return cluesForRule(context, "area_number");
}

function areaNumberValue(clue) {
  return Number(clue.value ?? clue.params?.area ?? clue.params?.value ?? clue.number);
}

