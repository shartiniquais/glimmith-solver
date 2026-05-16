export const roseWindowRule = {
  id: "rose_window",
  label: "Rose Windows",
  scope: "region",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    requiredSymbolCounts: "object_of_positive_integers"
  },

  validatePuzzle(context) {
    const config = context.ruleConfigs.rose_window;
    if (!config) return [];
    const counts = config.requiredSymbolCounts ?? {};
    if (Object.keys(counts).length === 0) {
      return ['Rule "rose_window" requires non-empty `requiredSymbolCounts`.'];
    }
    const errors = [];
    for (const [symbol, count] of Object.entries(counts)) {
      if (!symbol || !Number.isInteger(count) || count <= 0) {
        errors.push(`Rule "rose_window" has an invalid required count for symbol "${symbol}".`);
      }
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    const config = context.ruleConfigs.rose_window;
    if (!config) return true;
    const required = config.requiredSymbolCounts ?? {};
    const labels = Object.keys(required);
    if (labels.length === 0) return true;

    const requiredSet = new Set(labels);
    const counts = Object.fromEntries(labels.map((label) => [label, 0]));

    for (const cell of candidate.cells) {
      const symbol = context.puzzle.symbols[cell];
      if (!symbol) continue;
      if (!requiredSet.has(symbol)) return false;
      counts[symbol] += 1;
    }

    return labels.every((label) => counts[label] === required[label]);
  },

  explainElimination(candidate, context) {
    return this.candidateFilter(candidate, context) ? null : "Region does not satisfy the required Rose Window symbol counts.";
  }
};

