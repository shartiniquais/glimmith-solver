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
  match: "Ready rule: every region must have the same shape; solver support is not implemented yet.",
  mismatch: "Ready rule: every region must have a distinct shape; solver support is not implemented yet.",
  range: "Ready rule: every region area must be inside an inclusive range; solver support is not implemented yet.",
  size_separation: "Ready rule: edge-adjacent regions must have different areas; solver support is not implemented yet.",
  boxy: "Ready rule: every region must be a filled rectangle; solver support is not implemented yet.",
  non_boxy: "Ready rule: filled rectangles, bars, and single cells are forbidden; solver support is not implemented yet.",
  inequality: "Ready relation clue: adjacent region areas must satisfy a strict inequality; solver support is not implemented yet.",
  solitude: "Ready rule: every region must contain exactly one counted cell clue or symbol; solver support is not implemented yet.",
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
