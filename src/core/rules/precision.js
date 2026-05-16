export const precisionRule = {
  id: "precision",
  label: "Precision",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    area: "positive_integer"
  },

  validatePuzzle(context) {
    const config = context.ruleConfigs.precision;
    if (!config) return [];
    if (!Number.isInteger(config.area) || config.area <= 0) {
      return ['Rule "precision" requires a positive integer `area` parameter.'];
    }
    return [];
  },

  candidateFilter(candidate, context) {
    const config = context.ruleConfigs.precision;
    return !config || candidate.area === config.area;
  },

  explainElimination(candidate, context) {
    const area = context.ruleConfigs.precision?.area;
    return area && candidate.area !== area ? `Region area ${candidate.area} is not Precision ${area}.` : null;
  }
};

