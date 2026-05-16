export function hasUiCandidateSource(puzzle) {
  return (
    Number(puzzle.rules?.precision?.area ?? puzzle.rules?.area) > 0 ||
    Boolean(puzzle.shapeBank?.text?.trim()) ||
    (puzzle.shapeBank?.entries ?? []).length > 0 ||
    (puzzle.clues ?? []).some((clue) => clue.ruleId === "area_number" || clue.ruleId === "polyomino") ||
    hasValidRangeCandidateSource(puzzle.rules?.range)
  );
}

export function hasValidRangeCandidateSource(rangeConfig) {
  if (!rangeConfig || typeof rangeConfig !== "object" || rangeConfig.enabled === false) return false;
  const min = positiveIntegerOrNull(rangeConfig.min);
  const max = positiveIntegerOrNull(rangeConfig.max);
  if (min === null && max === null) return false;
  if (min !== null && max !== null && min > max) return false;
  return true;
}

function positiveIntegerOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}
