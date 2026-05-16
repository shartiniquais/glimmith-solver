export function createConstraintModel() {
  const invalidPairs = new Map();
  const selectionValidators = [];

  return {
    invalidPairs,
    selectionValidators,
    addInvalidPair(a, b) {
      if (!invalidPairs.has(a)) invalidPairs.set(a, new Set());
      if (!invalidPairs.has(b)) invalidPairs.set(b, new Set());
      invalidPairs.get(a).add(b);
      invalidPairs.get(b).add(a);
    },
    addSelectionValidator(validator) {
      if (typeof validator === "function") selectionValidators.push(validator);
    }
  };
}
