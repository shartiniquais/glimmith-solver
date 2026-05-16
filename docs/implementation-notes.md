# Implementation Notes

Updated: 2026-05-16.

## Implemented Rules

The solver now has registered, data-driven implementations for:

- `precision`: fixed region area candidate filtering.
- `shape_bank`: reusable allowed-shape candidate source. Optional future use-limit fields remain validation-only metadata unless supplied and implemented later.
- `rose_window`: required symbol counts per region.
- `gemini`: same-shape two-region relation clue.
- `delta`: different-shape two-region relation clue.
- `difference`: absolute area-difference two-region relation clue.
- `area_number`: cell clue whose value must equal the containing region area.
- `polyomino`: cell clue whose shape must match the containing region shape.
- `mingle_shape`: pairwise constraint rejecting orthogonally adjacent duplicate shapes. Corner-only contact is not treated as adjacency.
- `match`: global constraint requiring all selected regions to share one shape key.
- `mismatch`: global constraint requiring all selected regions to have distinct shape keys.
- `range`: inclusive min/max candidate filter and candidate source when no stronger source exists.
- `solitude`: candidate filter requiring exactly one counted cell clue or eligible Rose symbol per region.
- `size_separation`: pairwise constraint rejecting equal-area orthogonally adjacent regions.
- `boxy`: candidate filter for regions that exactly fill their bounding rectangle.
- `non_boxy`: candidate filter rejecting filled rectangles, bars, and single cells.
- `inequality`: strict area inequality relation clue between two referenced regions.
- `palisade`: cell clue requiring a local side-border pattern around the clue cell.
- `compass`: cell clue counting own-region cells in N/E/S/W half-planes.
- `watchtower`: vertex clue counting distinct selected regions touching a grid vertex.

`area_number`, `polyomino`, and `range` can also act as candidate sources when there is no Precision area and no Shape Bank:

- Area Number generates connected candidates for the distinct clue areas.
- Polyomino generates reusable placements from the clue shapes.
- Range generates connected candidates for inclusive min/max area bounds.

Candidate filters still enforce the clue semantics after generation.

## Clue Data Shapes

Area Number clue:

```js
{
  id: "area_2",
  type: "cell",
  ruleId: "area_number",
  value: 2,
  location: { type: "cell", cell: 0 }
}
```

Polyomino clue:

```js
{
  id: "vertical_domino",
  type: "cell",
  ruleId: "polyomino",
  location: { type: "cell", cell: 0 },
  params: {
    shape: [[0, 0], [0, 1]],
    allowRotations: true,
    allowReflections: true
  }
}
```

Gemini, Delta, Difference, and Inequality use generic relation clues with `regionRefs` internally. Their confirmed game-facing semantics are edge-adjacent, so validation requires the referenced cells or edge-location cells to share an orthogonal edge.

Palisade clue:

```js
{
  id: "palisade_0",
  type: "cell",
  ruleId: "palisade",
  location: { type: "cell", cell: 0 },
  params: { pattern: "full" }
}
```

Compass clue:

```js
{
  id: "compass_0",
  type: "cell",
  ruleId: "compass",
  location: { type: "cell", cell: 0 },
  params: { N: 1, E: 2 }
}
```

Watchtower clue:

```js
{
  id: "watchtower_1_1",
  type: "vertex",
  ruleId: "watchtower",
  location: { type: "vertex", x: 1, y: 1 },
  value: 3
}
```

## Remaining Limitations

- Area Number candidate sourcing is conservative: without Precision or Shape Bank, it generates candidates for clue areas. Puzzles with unclued regions of other sizes will need another candidate source.
- Polyomino candidate sourcing uses clue shapes as reusable placement sources. If later evidence shows consumable or grouped shape behavior, that should be added explicitly.
- Bricky and Loopy remain validation-only and are rejected by the solver with a known-ready/not-implemented message until their boundary-graph modules are added.
- Solitude currently counts Palisade and Compass as cell clues. Watchtower is a vertex clue and does not count for Solitude in the current implementation.
