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
  },
  match: {
    pairIncompatible: "Match requires every selected region to have the same shape.",
    clueSatisfied: "The selected regions all share one shape.",
    clueUnsatisfied: "At least one selected region has a different shape."
  },
  mismatch: {
    pairIncompatible: "Mismatch requires every selected region to have a distinct shape.",
    clueSatisfied: "The selected regions have distinct shapes.",
    clueUnsatisfied: "At least two selected regions share the same shape."
  },
  range: {
    candidateViolation: "The candidate region area is outside the Range bounds.",
    clueSatisfied: "The region area is inside the inclusive Range bounds.",
    clueUnsatisfied: "The region area is outside the inclusive Range bounds."
  },
  solitude: {
    candidateViolation: "The candidate region does not contain exactly one counted clue or symbol.",
    clueSatisfied: "The region contains exactly one counted clue or symbol.",
    clueUnsatisfied: "The region contains zero or multiple counted clues/symbols."
  },
  size_separation: {
    pairIncompatible: "Size Separation forbids orthogonally adjacent regions with equal area.",
    clueSatisfied: "Adjacent regions have different areas.",
    clueUnsatisfied: "Two adjacent regions have the same area."
  },
  boxy: {
    candidateViolation: "The candidate region does not exactly fill its bounding rectangle.",
    clueSatisfied: "The region is a filled rectangle.",
    clueUnsatisfied: "The region is not a filled rectangle."
  },
  non_boxy: {
    candidateViolation: "The candidate region is a filled rectangle, bar, or single cell.",
    clueSatisfied: "The region is not boxy.",
    clueUnsatisfied: "The region is boxy."
  },
  inequality: {
    pairIncompatible: "Inequality requires the referenced region areas to satisfy the strict direction.",
    clueSatisfied: "The referenced region areas satisfy the strict inequality.",
    clueUnsatisfied: "The referenced region areas do not satisfy the strict inequality."
  },
  palisade: {
    candidateViolation: "The candidate border pattern around the Palisade clue cell does not match the clue.",
    clueSatisfied: "The clue cell has the required side-border pattern.",
    clueUnsatisfied: "The clue cell does not have the required side-border pattern."
  },
  compass: {
    candidateViolation: "The candidate does not match the Compass directional counts.",
    clueSatisfied: "The clue's region has the required directional counts.",
    clueUnsatisfied: "The clue's region does not have the required directional counts."
  },
  watchtower: {
    pairIncompatible: "Watchtower requires the selected regions touching a vertex to match the clue count.",
    clueSatisfied: "The vertex touches the required number of distinct regions.",
    clueUnsatisfied: "The vertex touches the wrong number of distinct regions."
  }
});

export function ruleExplanationSnippet(ruleId, kind) {
  return RULE_EXPLANATION_SNIPPETS[ruleId]?.[kind] ?? "";
}
