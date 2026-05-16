import { hasBit } from "../geometry.js";
import { relationReferenceCells, validateEdgeAdjacentRelationCells } from "./relations.js";

export const inequalityRule = {
  id: "inequality",
  label: "Inequality",
  scope: "relation",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    direction: "lt_or_gt"
  },

  validatePuzzle(context) {
    const errors = [];
    for (const clue of inequalityClues(context)) {
      const refs = relationReferenceCells(clue);
      if (!refs) errors.push(`Inequality clue "${clue.id}" must reference two region cells.`);
      else errors.push(...validateEdgeAdjacentRelationCells(clue, refs, context, "Inequality"));
      if (!["lt", "gt"].includes(inequalityDirection(clue))) {
        errors.push(`Inequality clue "${clue.id}" requires params.direction "lt" or "gt".`);
      }
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    return candidateKeepsRelationRefsSeparate(candidate, context);
  },

  explainElimination(candidate, context) {
    for (const clue of inequalityClues(context)) {
      const refs = relationReferenceCells(clue);
      if (!refs) continue;
      if (refs.every((cell) => hasBit(candidate.mask, cell))) {
        return `Inequality clue "${clue.id}" references two regions, so one candidate region cannot contain both referenced cells.`;
      }
    }
    return null;
  },

  addConstraints(model, context) {
    for (const clue of inequalityClues(context)) {
      const refs = relationReferenceCells(clue);
      const direction = inequalityDirection(clue);
      if (!refs || !["lt", "gt"].includes(direction)) continue;
      addRelationPairConstraints(model, context, refs, (left, right) =>
        direction === "lt" ? left.area < right.area : left.area > right.area
      );
    }
  }
};

function inequalityClues(context) {
  return (context.puzzle.clues ?? []).filter((clue) => clue.ruleId === "inequality" && clue.type === "relation");
}

function inequalityDirection(clue) {
  return String(clue.params?.direction ?? clue.direction ?? "");
}

function candidateKeepsRelationRefsSeparate(candidate, context) {
  for (const clue of inequalityClues(context)) {
    const refs = relationReferenceCells(clue);
    if (!refs) continue;
    if (refs.every((cell) => hasBit(candidate.mask, cell))) return false;
  }
  return true;
}

function addRelationPairConstraints(model, context, refs, isValid) {
  const [a, b] = refs;
  const aCandidates = context.candidates.filter((candidate) => hasBit(candidate.mask, a) && !hasBit(candidate.mask, b));
  const bCandidates = context.candidates.filter((candidate) => hasBit(candidate.mask, b) && !hasBit(candidate.mask, a));

  for (const left of aCandidates) {
    for (const right of bCandidates) {
      if (!isValid(left, right)) model.addInvalidPair(left.id, right.id);
    }
  }
}
