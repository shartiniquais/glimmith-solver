export const RULE_HELP = Object.freeze({
  precision: "Every region must have exactly this many cells.",
  shape_bank: "Every region must match one of the allowed drawn shapes.",
  rose_window: "Every region must contain the required symbol counts.",
  gemini: "A relation clue requiring two referenced regions to have the same shape.",
  delta: "A relation clue requiring two referenced regions to have different shapes.",
  difference: "A relation clue requiring two referenced regions to differ by a fixed area.",
  area_number: "A cell clue forcing its region to have the shown area.",
  polyomino: "A cell clue forcing its region to match a drawn polyomino.",
  mingle_shape: "Adjacent selected regions cannot have the same shape.",
  match: "Experimental rule with unresolved edge cases.",
  mismatch: "Experimental rule with unresolved edge cases.",
  range: "Experimental rule with unresolved edge cases.",
  size_separation: "Experimental rule with unresolved edge cases.",
  boxy: "Experimental rule with unresolved edge cases.",
  non_boxy: "Experimental rule with unresolved edge cases.",
  inequality: "Experimental relation rule with unresolved edge cases.",
  solitude: "Experimental rule with unresolved edge cases.",
  palisade: "Blocked until exact semantics are verified.",
  bricky: "Blocked until exact semantics are verified.",
  loopy: "Blocked until exact semantics are verified.",
  compass: "Blocked until exact semantics are verified.",
  watchtower: "Blocked until exact semantics are verified."
});

export const IMPLEMENTED_RULE_VISUALS = Object.freeze({
  precision: { type: "field", target: "areaInput" },
  shape_bank: { type: "editor", target: "shapeMiniGrid" },
  rose_window: { type: "field", target: "roseInput" },
  gemini: { type: "placementTool", target: "relation" },
  delta: { type: "placementTool", target: "relation" },
  difference: { type: "placementTool", target: "relation" },
  area_number: { type: "placementTool", target: "areaNumber" },
  polyomino: { type: "placementTool", target: "polyomino" },
  mingle_shape: { type: "paletteToggle", target: "rulePalette" }
});

export const RULE_GROUPS = Object.freeze([
  Object.freeze({
    title: "Region size",
    ids: Object.freeze(["precision", "area_number", "difference", "range", "size_separation"])
  }),
  Object.freeze({
    title: "Shapes",
    ids: Object.freeze([
      "shape_bank",
      "polyomino",
      "gemini",
      "delta",
      "mingle_shape",
      "match",
      "mismatch",
      "boxy",
      "non_boxy"
    ])
  }),
  Object.freeze({
    title: "Symbols / clues",
    ids: Object.freeze(["rose_window", "solitude"])
  }),
  Object.freeze({
    title: "Borders / graph rules",
    ids: Object.freeze(["palisade", "bricky", "loopy"])
  }),
  Object.freeze({
    title: "Direction / visibility",
    ids: Object.freeze(["compass", "watchtower", "inequality"])
  })
]);
