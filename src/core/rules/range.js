export const rangeRule = {
  id: "range",
  label: "Range",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    min: "optional_positive_integer",
    max: "optional_positive_integer"
  },

  validatePuzzle(context) {
    const config = rangeConfig(context);
    if (!config) return [];
    const errors = [];
    if (config.min === null && config.max === null) {
      errors.push('Rule "range" requires at least one of `min` or `max`.');
    }
    if (config.min !== null && (!Number.isInteger(config.min) || config.min <= 0)) {
      errors.push('Rule "range" `min` must be a positive integer when supplied.');
    }
    if (config.max !== null && (!Number.isInteger(config.max) || config.max <= 0)) {
      errors.push('Rule "range" `max` must be a positive integer when supplied.');
    }
    if (Number.isInteger(config.min) && Number.isInteger(config.max) && config.min > config.max) {
      errors.push('Rule "range" requires `min` to be less than or equal to `max`.');
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    const config = rangeConfig(context);
    if (!config) return true;
    if (config.min !== null && candidate.area < config.min) return false;
    if (config.max !== null && candidate.area > config.max) return false;
    return true;
  },

  explainElimination(candidate, context) {
    const config = rangeConfig(context);
    if (!config || this.candidateFilter(candidate, context)) return null;
    if (config.min !== null && config.max !== null) {
      return `Region area ${candidate.area} is outside Range ${config.min}..${config.max}.`;
    }
    if (config.min !== null) return `Region area ${candidate.area} is below Range minimum ${config.min}.`;
    return `Region area ${candidate.area} is above Range maximum ${config.max}.`;
  }
};

export function rangeCandidateAreas(context) {
  const config = rangeConfig(context);
  if (!config) return { areas: [], errors: [] };
  const activeCount = context.puzzle.activeCells.length;
  const min = config.min ?? 1;
  const max = config.max ?? activeCount;
  if (!Number.isInteger(min) || min <= 0 || !Number.isInteger(max) || max <= 0 || min > max) {
    return { areas: [], errors: [] };
  }
  const errors = [];
  if (config.max === null && max - min + 1 > 12) {
    errors.push("Range has only a minimum bound; using the active-cell count as a conservative candidate-source maximum.");
  }
  return {
    areas: Array.from({ length: max - min + 1 }, (_, index) => min + index),
    errors
  };
}

function rangeConfig(context) {
  const raw = context.ruleConfigs.range;
  if (!raw) return null;
  const min = raw.min === undefined || raw.min === null || raw.min === "" ? null : Number(raw.min);
  const max = raw.max === undefined || raw.max === null || raw.max === "" ? null : Number(raw.max);
  return { min, max };
}
