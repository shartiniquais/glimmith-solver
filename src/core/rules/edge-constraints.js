import { hasBit, parseEdgeKey } from "../geometry.js";

export const edgeConstraintsRule = {
  id: "edge_constraints",
  label: "Manual edge constraints",
  scope: "candidate",
  implemented: true,

  candidateFilter(candidate, context) {
    for (const [key, constraint] of Object.entries(context.puzzle.edgeConstraints ?? {})) {
      const [a, b] = parseEdgeKey(key);
      const hasA = hasBit(candidate.mask, a);
      const hasB = hasBit(candidate.mask, b);
      if (constraint.state === "join" && hasA !== hasB) return false;
      if (constraint.state === "cut" && hasA && hasB) return false;
      if (constraint.relation && hasA && hasB) return false;
    }
    return true;
  },

  explainElimination(candidate, context) {
    for (const [key, constraint] of Object.entries(context.puzzle.edgeConstraints ?? {})) {
      const [a, b] = parseEdgeKey(key);
      const hasA = hasBit(candidate.mask, a);
      const hasB = hasBit(candidate.mask, b);
      if (constraint.state === "join" && hasA !== hasB) return `Manual join ${key} requires both cells in the same region.`;
      if (constraint.state === "cut" && hasA && hasB) return `Manual cut ${key} forbids both cells in the same region.`;
      if (constraint.relation && hasA && hasB) return `Relation edge ${key} must reference two different regions.`;
    }
    return null;
  }
};
