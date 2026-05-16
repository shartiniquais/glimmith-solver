export const shapeBankRule = {
  id: "shape_bank",
  label: "Shape Bank",
  scope: "shape_bank",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    entries: "reusable_allowed_shape_set",
    exactUses: "optional_future_integer",
    maxUses: "optional_future_integer"
  },

  validatePuzzle(context) {
    const config = context.ruleConfigs.shape_bank;
    if (!config) return [];
    const errors = [];
    for (const field of ["exactUses", "maxUses"]) {
      if (config[field] === undefined || config[field] === null) continue;
      if (!Number.isInteger(config[field]) || config[field] < 0) {
        errors.push(`Shape Bank optional field \`${field}\` must be a non-negative integer when supplied.`);
      }
    }
    return errors;
  }
};

