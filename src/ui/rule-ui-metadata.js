export const RULE_HELP = Object.freeze({
  precision: "Every region must have exactly this many cells.",
  shape_bank: "Every region must match one of the allowed drawn shapes.",
  rose_window: "Every region must contain the required symbol counts.",
  gemini: "An edge-adjacent relation clue requiring two referenced regions to have the same shape.",
  delta: "An edge-adjacent relation clue requiring two referenced regions to have different shapes.",
  difference: "An edge-adjacent relation clue requiring two referenced regions to differ by a fixed area.",
  area_number: "A cell clue forcing its region to have the shown area.",
  polyomino: "A cell clue forcing its region to match a drawn polyomino.",
  mingle_shape: "Adjacent selected regions cannot have the same shape.",
  match: "Every region must have the same shape.",
  mismatch: "Every region must have a distinct shape.",
  range: "Every region area must be inside an inclusive range.",
  size_separation: "Edge-adjacent regions must have different areas.",
  boxy: "Every region must be a filled rectangle.",
  non_boxy: "Filled rectangles, bars, and single cells are forbidden.",
  inequality: "An edge-adjacent relation clue requiring adjacent region areas to satisfy a strict inequality.",
  solitude: "Every region must contain exactly one counted cell clue or symbol.",
  palisade: "Ready cell clue: border pattern around the clue cell; solver support is not implemented yet.",
  bricky: "Ready boundary rule: forbids degree-4 border vertices; solver support is not implemented yet.",
  loopy: "Ready boundary rule: forbids degree-3 border vertices; solver support is not implemented yet.",
  compass: "Ready cell clue: counts own-region cells in N/E/S/W half-planes; solver support is not implemented yet.",
  watchtower: "Ready vertex clue: counts distinct regions touching the clue vertex; solver support is not implemented yet."
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
  mingle_shape: { type: "paletteToggle", target: "rulePalette" },
  match: { type: "paletteToggle", target: "rulePalette" },
  mismatch: { type: "paletteToggle", target: "rulePalette" },
  range: { type: "field", target: "rulePalette" },
  solitude: { type: "paletteToggle", target: "rulePalette" },
  size_separation: { type: "paletteToggle", target: "rulePalette" },
  boxy: { type: "paletteToggle", target: "rulePalette" },
  non_boxy: { type: "paletteToggle", target: "rulePalette" },
  inequality: { type: "placementTool", target: "relation" }
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
