import { borderSidesAroundCell, palisadePatternFromSides } from "../boundary.js";
import { hasBit } from "../geometry.js";
import { clueCell, cluesForRule } from "./clue-helpers.js";

const PALISADE_PATTERNS = new Set(["empty", "one_sided", "corner", "opposite", "three_sided", "full"]);

export const palisadeRule = {
  id: "palisade",
  label: "Palisade",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    pattern: "empty|one_sided|corner|opposite|three_sided|full",
    location: "cell"
  },

  validatePuzzle(context) {
    const errors = [];
    for (const clue of palisadeClues(context)) {
      const cell = clueCell(clue);
      if (cell === null) errors.push(`Palisade clue "${clue.id}" requires a cell location.`);
      if (!PALISADE_PATTERNS.has(palisadePattern(clue))) {
        errors.push(`Palisade clue "${clue.id}" requires a valid pattern.`);
      }
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    for (const clue of palisadeClues(context)) {
      const cell = clueCell(clue);
      if (cell === null || !hasBit(candidate.mask, cell)) continue;
      if (candidatePalisadePattern(candidate, context.puzzle, cell) !== palisadePattern(clue)) return false;
    }
    return true;
  },

  explainElimination(candidate, context) {
    for (const clue of palisadeClues(context)) {
      const cell = clueCell(clue);
      if (cell === null || !hasBit(candidate.mask, cell)) continue;
      const actual = candidatePalisadePattern(candidate, context.puzzle, cell);
      const expected = palisadePattern(clue);
      if (actual !== expected) {
        return `Palisade clue "${clue.id}" requires pattern ${expected}, not ${actual}.`;
      }
    }
    return null;
  }
};

export function candidatePalisadePattern(candidate, puzzle, cell) {
  return palisadePatternFromSides(borderSidesAroundCell(candidate, puzzle, cell));
}

function palisadeClues(context) {
  return cluesForRule(context, "palisade");
}

function palisadePattern(clue) {
  return String(clue.params?.pattern ?? clue.pattern ?? "");
}
