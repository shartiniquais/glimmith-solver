import { hasBit } from "../geometry.js";
import { clueCell } from "./clue-helpers.js";

const COUNTED_CELL_CLUE_RULES = new Set(["area_number", "polyomino", "palisade", "compass"]);

export const solitudeRule = {
  id: "solitude",
  label: "Solitude",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {},

  validatePuzzle() {
    return [];
  },

  candidateFilter(candidate, context) {
    let count = 0;
    for (const cell of countedCells(context)) {
      if (hasBit(candidate.mask, cell)) count += 1;
      if (count > 1) return false;
    }
    return count === 1;
  },

  explainElimination(candidate, context) {
    let count = 0;
    for (const cell of countedCells(context)) {
      if (hasBit(candidate.mask, cell)) count += 1;
    }
    return count === 1 ? null : `Solitude requires exactly one counted clue or symbol in each region; this candidate contains ${count}.`;
  }
};

function countedCells(context) {
  const cells = new Set();
  for (const clue of context.puzzle.clues ?? []) {
    if (!COUNTED_CELL_CLUE_RULES.has(clue.ruleId)) continue;
    const cell = clueCell(clue);
    if (cell !== null) cells.add(cell);
  }

  const required = context.ruleConfigs.rose_window?.requiredSymbolCounts ?? {};
  const symbols = Object.keys(required);
  if (symbols.length === 1) {
    const symbol = symbols[0];
    for (const [cell, value] of Object.entries(context.puzzle.symbols ?? {})) {
      if (value === symbol) cells.add(Number(cell));
    }
  }

  return cells;
}
