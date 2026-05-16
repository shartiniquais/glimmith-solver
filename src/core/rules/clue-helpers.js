export function clueCell(clue) {
  const value = clue.location?.cell ?? clue.cell;
  const cell = Number(value);
  return Number.isInteger(cell) ? cell : null;
}

export function cluesForRule(context, ruleId) {
  return (context.puzzle.clues ?? []).filter((clue) => clue.ruleId === ruleId);
}

