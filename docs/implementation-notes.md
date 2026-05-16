# Implementation Notes

Updated: 2026-05-16.

## Batch 1 Implemented Rules

The solver now has registered, data-driven implementations for:

- `precision`: fixed region area candidate filtering.
- `shape_bank`: reusable allowed-shape candidate source. Optional future use-limit fields remain validation-only metadata unless supplied and implemented later.
- `rose_window`: required symbol counts per region.
- `gemini`: same-shape two-region relation clue.
- `delta`: different-shape two-region relation clue.
- `difference`: absolute area-difference two-region relation clue.
- `area_number`: cell clue whose value must equal the containing region area.
- `polyomino`: cell clue whose shape must match the containing region shape.

`area_number` and `polyomino` can also act as candidate sources when there is no Precision area and no Shape Bank:

- Area Number generates connected candidates for the distinct clue areas.
- Polyomino generates reusable placements from the clue shapes.

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
    allowRotations: false,
    allowReflections: false
  }
}
```

Gemini, Delta, and Difference use generic relation clues with `regionRefs`, so they are not tied permanently to edge-only UI placement.

## Remaining Limitations

- The UI does not yet expose editors for Area Number or Polyomino clues. JSON import/export preserves those generic clues.
- Mingle Shape remains `ready` but not implemented in this batch because it is not listed in the batch-1 prompt.
- Area Number candidate sourcing is conservative: without Precision or Shape Bank, it generates candidates for clue areas. Puzzles with unclued regions of other sizes will need another candidate source.
- Polyomino candidate sourcing uses clue shapes as reusable placement sources. If later evidence shows consumable or grouped shape behavior, that should be added explicitly.
- Blocked rules remain validation-only and are rejected by the solver with a semantics-unverified message.

