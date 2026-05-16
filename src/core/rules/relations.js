import { hasBit } from "../geometry.js";
import { candidateShapeForComparison } from "../shape-comparison.js";

export const geminiRule = makeShapeRelationRule({
  id: "gemini",
  label: "Gemini",
  relation: "same_shape",
  isValid(left, right, context) {
    return candidateShapeForComparison(context.puzzle, left) === candidateShapeForComparison(context.puzzle, right);
  }
});

export const deltaRule = makeShapeRelationRule({
  id: "delta",
  label: "Delta",
  relation: "different_shape",
  isValid(left, right, context) {
    return candidateShapeForComparison(context.puzzle, left) !== candidateShapeForComparison(context.puzzle, right);
  }
});

export const differenceRule = {
  id: "difference",
  label: "Difference",
  scope: "relation",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {
    value: "non_negative_integer"
  },

  validatePuzzle(context) {
    const errors = [];
    for (const clue of relationClues(context, "difference")) {
      const refs = relationCells(clue);
      if (!refs) errors.push(`Difference clue "${clue.id}" must reference two region cells.`);
      const value = Number(clue.value ?? clue.params?.difference);
      if (!Number.isInteger(value) || value < 0) {
        errors.push(`Difference clue "${clue.id}" requires a non-negative integer value.`);
      }
    }
    return errors;
  },

  candidateFilter(candidate, context) {
    return candidateKeepsRelationRefsSeparate(candidate, context, "difference");
  },

  explainElimination(candidate, context) {
    return explainRelationCandidateElimination(candidate, context, "difference", "Difference");
  },

  addConstraints(model, context) {
    for (const clue of relationClues(context, "difference")) {
      const refs = relationCells(clue);
      if (!refs) continue;
      const difference = Number(clue.value ?? clue.params?.difference);
      if (!Number.isInteger(difference) || difference < 0) continue;
      addRelationPairConstraints(model, context, refs, (left, right) => Math.abs(left.area - right.area) === difference);
    }
  }
};

function makeShapeRelationRule({ id, label, relation, isValid }) {
  return {
    id,
    label,
    scope: "relation",
    implementationStatus: "ready",
    implemented: true,
    paramsSchema: {
      relation
    },

    validatePuzzle(context) {
      const errors = [];
      for (const clue of relationClues(context, id)) {
        if (!relationCells(clue)) errors.push(`${label} clue "${clue.id}" must reference two region cells.`);
      }
      return errors;
    },

    candidateFilter(candidate, context) {
      return candidateKeepsRelationRefsSeparate(candidate, context, id);
    },

    explainElimination(candidate, context) {
      return explainRelationCandidateElimination(candidate, context, id, label);
    },

    addConstraints(model, context) {
      for (const clue of relationClues(context, id)) {
        const refs = relationCells(clue);
        if (!refs) continue;
        addRelationPairConstraints(model, context, refs, (left, right) => isValid(left, right, context));
      }
    }
  };
}

function explainRelationCandidateElimination(candidate, context, ruleId, label) {
  for (const clue of relationClues(context, ruleId)) {
    const refs = relationCells(clue);
    if (!refs) continue;
    if (refs.every((cell) => hasBit(candidate.mask, cell))) {
      return `${label} clue "${clue.id}" references two regions, so one candidate region cannot contain both referenced cells.`;
    }
  }
  return null;
}

function candidateKeepsRelationRefsSeparate(candidate, context, ruleId) {
  for (const clue of relationClues(context, ruleId)) {
    const refs = relationCells(clue);
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

function relationClues(context, ruleId) {
  return (context.puzzle.clues ?? []).filter((clue) => clue.ruleId === ruleId && clue.type === "relation");
}

function relationCells(clue) {
  const refs = clue.regionRefs ?? clue.regions;
  if (Array.isArray(refs) && refs.length === 2) {
    const cells = refs.map((ref) => Number(typeof ref === "object" ? ref.cell : ref));
    return cells.every(Number.isInteger) ? cells : null;
  }
  if (Array.isArray(clue.cells) && clue.cells.length === 2) {
    const cells = clue.cells.map(Number);
    return cells.every(Number.isInteger) ? cells : null;
  }
  if (Array.isArray(clue.location?.cells) && clue.location.cells.length === 2) {
    const cells = clue.location.cells.map(Number);
    return cells.every(Number.isInteger) ? cells : null;
  }
  return null;
}

export function relationReferenceCells(clue) {
  return relationCells(clue);
}
