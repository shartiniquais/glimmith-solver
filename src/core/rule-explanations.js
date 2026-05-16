export const RULE_EXPLANATION_SNIPPETS = Object.freeze({
  precision: {
    candidateViolation: "The candidate region has the wrong area for Precision.",
    clueSatisfied: "The region area matches the Precision value.",
    clueUnsatisfied: "The region area does not match the Precision value."
  },
  shape_bank: {
    candidateViolation: "The candidate shape is not in the reusable Shape Bank.",
    clueSatisfied: "The region matches one allowed Shape Bank entry.",
    clueUnsatisfied: "The region does not match any allowed Shape Bank entry."
  },
  rose_window: {
    candidateViolation: "The candidate does not contain the required Rose Window symbol counts.",
    clueSatisfied: "The region contains exactly the required Rose Window symbols.",
    clueUnsatisfied: "The region is missing required symbols or contains an extra disallowed symbol."
  },
  gemini: {
    pairIncompatible: "Gemini requires the two referenced regions to have the same shape.",
    clueSatisfied: "The referenced regions have matching shapes.",
    clueUnsatisfied: "The referenced regions do not have matching shapes."
  },
  delta: {
    pairIncompatible: "Delta requires the two referenced regions to have different shapes.",
    clueSatisfied: "The referenced regions have different shapes.",
    clueUnsatisfied: "The referenced regions have the same shape."
  },
  difference: {
    pairIncompatible: "Difference requires the referenced region areas to differ by the clue value.",
    clueSatisfied: "The referenced region areas have the required difference.",
    clueUnsatisfied: "The referenced region areas do not have the required difference."
  },
  area_number: {
    candidateViolation: "The candidate containing an Area Number clue has the wrong area.",
    clueSatisfied: "The clue's region has the shown area.",
    clueUnsatisfied: "The clue's region does not have the shown area."
  },
  polyomino: {
    candidateViolation: "The candidate containing a Polyomino clue has the wrong shape.",
    clueSatisfied: "The clue's region matches the drawn polyomino.",
    clueUnsatisfied: "The clue's region does not match the drawn polyomino."
  },
  mingle_shape: {
    pairIncompatible: "Mingle Shape forbids orthogonally adjacent regions with the same shape.",
    clueSatisfied: "Adjacent regions do not repeat the same shape.",
    clueUnsatisfied: "Two adjacent regions repeat the same shape."
  }
});

export function ruleExplanationSnippet(ruleId, kind) {
  return RULE_EXPLANATION_SNIPPETS[ruleId]?.[kind] ?? "";
}
