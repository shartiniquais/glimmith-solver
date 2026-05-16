# The Artisan of Glimmith Rule Inventory

Updated: 2026-05-16.

This inventory now combines the original external-source research with user-confirmed in-game observations from the project conversation. The confirmed mechanics below are authoritative project knowledge; `sourceUrls` remain as historical research references, not as the authority for the newly confirmed semantics.

Implementation status means:

- `ready`: Mechanics are verified enough to implement now; ready does not imply solver support is already implemented.
- `experimental`: Mechanics are likely, but unresolved edge cases remain.
- `blocked`: Exact semantics are not verified enough for faithful solving.

Current status summary: 22 ready, 0 experimental, 0 blocked. 9 rules are implemented in the solver; 13 are ready-but-not-implemented and should validate as known but unsupported until solver work lands.

## Rule Table

| ID | Canonical rule | Status | Implemented | Player-facing meaning | Scope | Editor input | Solver encoding | Rotations/reflections | Local candidate elimination | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `precision` | Precision | ready | Yes | Global rule: every region must have area exactly N. Only one Precision rule can be active at a time; this is distinct from Area Number cell clues. | Global Rule, All Regions, Numbers | Single Global Area Integer | Candidate Filter | Not Relevant | Yes | high |
| `shape_bank` | Shape Bank | ready | Yes | Global rule: every region must match one shape from the displayed shape list. Shapes are reusable unlimited times and may be unused; rotations and reflections are allowed. | Global Rule, Shape Bank, All Regions, Shapes | Displayed Shape List, Allow Rotations, Allow Reflections | Candidate Filter | Rotations And Reflections Allowed | Yes | high |
| `rose_window` | Rose Windows | ready | Yes | Every region needs exactly one of each listed Rose symbol and no extra Rose symbols. Multiple symbol families/colors are not distinct for solver purposes. | Global Rule, Symbols Inside Regions, All Regions | Rose Symbol Grid, Listed Rose Symbols | Candidate Filter, Symbol Count Constraint | Not Relevant | Yes | high |
| `gemini` | Gemini | ready | Yes | Edge relation clue: compares the two regions on opposite sides of the edge and requires them to have the same shape. The same region cannot be on both sides; rotations and reflections count as the same shape. | Edge Relation Clue, Two Adjacent Regions, Shapes | Same Shape Edge Relation Marker | Pairwise Candidate Compatibility | Rotations And Reflections Count Same | Partial | high |
| `delta` | Delta | ready | Yes | Edge relation clue: current interpretation is that the two regions on opposite sides of the edge must have different shapes. The same region cannot be on both sides; rotations and reflections count as the same shape. | Edge Relation Clue, Two Adjacent Regions, Shapes | Different Shape Edge Relation Marker | Pairwise Candidate Incompatibility | Rotations And Reflections Count Same | Partial | high |
| `polyomino` | Polyomino | ready | Yes | Cell clue: the region containing the clue must match the clue shape. Multiple same-shape Polyomino clues may share a region, but different Polyomino shapes cannot share a region. Drawn orientation does not matter because rotations and reflections are allowed. | Cell Clue, One Region, Shapes | Shape Clue Cells | Candidate Filter | Rotations And Reflections Allowed | Yes | high |
| `mingle_shape` | Mingle Shape | ready | Yes | Global rule: edge-adjacent regions must not have the same shape. Corner-touching does not count. Rotations and reflections count as the same shape. | Global Rule, Two Adjacent Regions, All Regions, Shapes | Global Rule Toggle | Pairwise Candidate Incompatibility | Rotations And Reflections Count Same | Partial | high |
| `area_number` | Area Number | ready | Yes | Cell clue: a region containing an Area Number clue must have that area. Multiple Area Number clues in one region must agree. Values are positive integers only. | Cell Clue, One Region, Numbers | Positive Integer Number Clue Cells | Candidate Filter | Not Relevant | Yes | high |
| `palisade` | Palisade | ready | No | Cell clue: describes which sides around the clue cell are borders. Icon rotation does not matter. Types are empty, one_sided, corner, opposite, three_sided, and full. | Cell Clue, Edges Or Walls, Local Border Pattern | Palisade Clue Type | Candidate Filter, Local Border Pattern Constraint | Icon Rotation Does Not Matter | Partial | high |
| `match` | Match | ready | No | Global rule: all regions in the puzzle must have the same shape. There are no groups/subsets. Rotations and reflections count as the same shape. | Global Rule, All Regions, Shapes | Global Rule Toggle | Global All Same Shape Constraint | Rotations And Reflections Count Same | No | high |
| `mismatch` | Mismatch | ready | No | Global rule: all regions in the puzzle must have distinct shapes. Rotations and reflections count as the same shape. | Global Rule, All Regions, Shapes | Global Rule Toggle | Global All Different Shape Constraint | Rotations And Reflections Count Same | No | high |
| `range` | Range | ready | No | Global rule: every region area must be within an inclusive range. It supports min-only, max-only, or min+max; complex disjoint ranges are not part of the mechanic. | Global Rule, All Regions, Numbers | Optional Minimum Area, Optional Maximum Area | Candidate Filter | Not Relevant | Yes | high |
| `solitude` | Solitude | ready | No | Global rule: every region must contain exactly one counted cell symbol or clue. Counted things are cell-based clues/symbols; Rose Windows count only when the Rose rule has a single symbol type. Global rule cards do not count. | Global Rule, Symbols Inside Regions, Cell Clues | Counted Cell Clue Or Symbol Set | Candidate Filter, Exactly One Counted Cell Constraint | Not Relevant | Yes | high |
| `size_separation` | Size Separation | ready | No | Global rule: edge-adjacent regions must have different areas. Corner-touching does not count. | Global Rule, Two Adjacent Regions, Numbers | Global Rule Toggle | Pairwise Candidate Incompatibility | Not Relevant | Partial | high |
| `boxy` | Boxy | ready | No | Global rule: every region must be a filled rectangle. 1xN bars and single cells count as boxy; holes are not allowed. | Global Rule, One Region, Shapes | Global Rule Toggle | Candidate Filter | Not Relevant Beyond Rectangle Detection | Yes | high |
| `non_boxy` | Non-Boxy | ready | No | Global rule: opposite of Boxy. Filled rectangles, bars, and single cells are forbidden. It can coexist with Shape Bank. | Global Rule, One Region, Shapes | Global Rule Toggle | Candidate Filter | Not Relevant Beyond Rectangle Detection | Yes | high |
| `bricky` | Bricky | ready | No | Global boundary-graph rule: forbids exactly four border segments meeting at a grid vertex, corresponding to four region corners meeting. It can include outer border, though outer border usually cannot reach degree 4. | Global Rule, Boundary Graph, Grid Vertices | Global Rule Toggle | Boundary Graph Constraint | Not Relevant | Partial | high |
| `loopy` | Loopy | ready | No | Global boundary-graph rule: forbids exactly three border segments meeting at a grid vertex. It forbids T-junctions, cares about outer boundary, does not require loops, and allows degree 4 vertices when Bricky is not active. | Global Rule, Boundary Graph, Grid Vertices | Global Rule Toggle | Boundary Graph Constraint | Not Relevant | Partial | high |
| `inequality` | Inequality | ready | No | Edge relation clue: compares adjacent region areas with strict inequality. The narrow/small side points to the smaller region; equality is invalid. | Edge Relation Clue, Two Adjacent Regions, Numbers | Oriented Inequality Edge Marker | Pairwise Candidate Incompatibility | Not Relevant | Partial | high |
| `difference` | Difference | ready | Yes | Edge relation clue: compares adjacent regions by absolute area-size difference. A value of 0 means equal area, not necessarily same shape. | Edge Relation Clue, Two Adjacent Regions, Numbers | Difference Edge Relation Marker, Nonnegative Integer Difference | Pairwise Candidate Incompatibility | Not Relevant | Partial | high |
| `watchtower` | Watchtower | ready | No | Vertex/corner clue: counts how many distinct regions touch the clue vertex. Values are 1 to 4; a value of 1 means all existing cells around the vertex belong to the same region. | Vertex Clue, Corner Clue, Grid Vertices, Region Count | Watchtower Vertex Value 1 To 4 | Boundary Vertex Region Count Constraint | Not Relevant | Partial | high |
| `compass` | Compass | ready | No | Cell clue: counts cells of the clue's own region in four half-plane directions N, E, S, and W. Diagonal cells contribute to both relevant directions, the clue cell itself does not count, and missing directions impose no restriction. | Cell Clue, Numbers, Directions, One Region | Compass Directional Numbers N E S W | Candidate Filter | Absolute Directions Matter | Yes | high |

## Implementation Policy

- Ready-but-not-implemented rules should fail validation/solving with `reject_known_ready_not_implemented`; they are known rules, not unknown rule IDs.
- Blocked-rule behavior remains `reject_not_implemented_semantics_unverified` for any future rule whose semantics become unverified again. No current inventory rule is blocked.
- Blocked-rule UI policy remains `placeholder_only_if_useful` for future use.
- Shape comparison: Support configurable rotation/reflection equivalence; confirmed shape-comparison rules count rotations and reflections as the same shape.
- Relation clues: Model relation clues as constraints between two regions, not as simple edge states only; confirmed relation clues are edge/vertex/cell clues that reference adjacent or touching regions as specified.
- Shape Bank means a reusable allowed-shape set: entries may be reused unlimited times and may also be unused. Optional `exactUses` and `maxUses` fields remain future extension points and should not be enforced unless explicitly implemented.
- Rose Windows use listed symbols/counts and, per confirmed mechanics, every region needs exactly one of each listed Rose symbol and no extras.
- Match and Mismatch are global rules only; do not add group/subset behavior for the faithful solver.

## Ready But Not Implemented

- `palisade`: Cell clue: describes which sides around the clue cell are borders. Icon rotation does not matter. Types are empty, one_sided, corner, opposite, three_sided, and full.
- `match`: Global rule: all regions in the puzzle must have the same shape. There are no groups/subsets. Rotations and reflections count as the same shape.
- `mismatch`: Global rule: all regions in the puzzle must have distinct shapes. Rotations and reflections count as the same shape.
- `range`: Global rule: every region area must be within an inclusive range. It supports min-only, max-only, or min+max; complex disjoint ranges are not part of the mechanic.
- `solitude`: Global rule: every region must contain exactly one counted cell symbol or clue. Counted things are cell-based clues/symbols; Rose Windows count only when the Rose rule has a single symbol type. Global rule cards do not count.
- `size_separation`: Global rule: edge-adjacent regions must have different areas. Corner-touching does not count.
- `boxy`: Global rule: every region must be a filled rectangle. 1xN bars and single cells count as boxy; holes are not allowed.
- `non_boxy`: Global rule: opposite of Boxy. Filled rectangles, bars, and single cells are forbidden. It can coexist with Shape Bank.
- `bricky`: Global boundary-graph rule: forbids exactly four border segments meeting at a grid vertex, corresponding to four region corners meeting. It can include outer border, though outer border usually cannot reach degree 4.
- `loopy`: Global boundary-graph rule: forbids exactly three border segments meeting at a grid vertex. It forbids T-junctions, cares about outer boundary, does not require loops, and allows degree 4 vertices when Bricky is not active.
- `inequality`: Edge relation clue: compares adjacent region areas with strict inequality. The narrow/small side points to the smaller region; equality is invalid.
- `watchtower`: Vertex/corner clue: counts how many distinct regions touch the clue vertex. Values are 1 to 4; a value of 1 means all existing cells around the vertex belong to the same region.
- `compass`: Cell clue: counts cells of the clue's own region in four half-plane directions N, E, S, and W. Diagonal cells contribute to both relevant directions, the clue cell itself does not count, and missing directions impose no restriction.

## Rule Details

### `precision`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Every region must have area exactly N.
  - Only one Precision rule can be active at a time.
  - Do not confuse Precision with Area Number clues.
- Test idea: Use a 2 by 3 board where only two triomino regions satisfy precision = 3.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-precision-window-puzzle-solutions/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none.

### `shape_bank`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Every region must match one shape from the displayed shape list.
  - Shapes are reusable unlimited times.
  - A listed shape may be used zero times.
  - Rotations and reflections are allowed.
- Test idea: Allow only a straight triomino in the bank and reject an otherwise valid L-triomino region.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://gamefaqs.gamespot.com/pc/607835-the-artisan-of-glimmith/achievements, https://camzillasmom.com/the-artisan-of-glimmith-mingle-shape-window-puzzle-solutions/
- Open questions: none.

### `rose_window`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Every region needs exactly one of each listed Rose symbol.
  - No extra Rose symbols in a region.
  - No multiple symbol families/colors for solver purposes.
- Test idea: With symbols A, A, B, B, reject any candidate region that lacks one A and one B.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-mingle-shape-window-puzzle-solutions/, https://www.gamespew.com/2026/03/the-artisan-of-glimmith-review/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none.

### `gemini`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Edge relation clue.
  - Compares the two regions on opposite sides of the edge.
  - The same region cannot be on both sides of the edge.
  - Rotations and reflections count as the same shape.
- Test idea: Place a Gemini marker between a straight triomino candidate and an L-triomino candidate and reject the mixed assignment.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-window-3-watermill-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-precision-window-puzzle-solutions/
- Open questions: none.

### `delta`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Keep current interpretation as different-shape edge relation unless explicitly corrected.
  - Edge relation clue.
  - The same region cannot be on both sides of the edge.
  - Rotations and reflections count as the same shape.
- Test idea: Place a Delta marker between two domino regions and reject assignments where both are the same shape class.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-window-3-watermill-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-precision-window-puzzle-solutions/
- Open questions: none.

### `polyomino`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Cell clue.
  - Region containing the clue must match the clue shape.
  - If multiple Polyomino clues of the same shape are in one region, that is okay.
  - A region cannot contain two different Polyomino clue shapes.
  - Polyomino clues may be rotated and reflected.
  - Drawn orientation does not matter.
- Test idea: A region containing an L-triomino clue should reject straight-triomino candidates.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-polyomino-window-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-forest-entrance-window-puzzle-solutions/
- Open questions: none.

### `mingle_shape`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Edge-adjacent regions must not have the same shape.
  - Corner-touching does not count.
  - Rotations/reflections count as the same shape.
- Test idea: Reject two edge-adjacent regions with the same tetromino while allowing non-adjacent duplicates.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-mingle-shape-window-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-forest-entrance-window-puzzle-solutions/
- Open questions: none.

### `area_number`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Cell clue.
  - A region containing an Area Number clue must have that area.
  - If a region contains multiple Area Number clues, they must agree.
  - Values are positive integers only.
- Test idea: Reject candidates containing a number 4 clue unless their area is exactly 4.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-area-number-window-puzzle-solutions/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none.

### `palisade`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Cell clue.
  - Describes which sides around the clue cell are borders.
  - Rotation of the icon does not matter.
  - empty: 0 border sides around the clue cell.
  - one_sided: exactly 1 border side.
  - corner: exactly 2 adjacent border sides.
  - opposite: exactly 2 opposite border sides.
  - three_sided: exactly 3 border sides.
  - full: exactly 4 border sides, a lonely cell.
  - This is a local candidate/border-pattern rule.
- Test idea: Reject a partition around a cross-style clue unless all four required adjacent walls are present.
- Source URLs: https://www.reddit.com/r/TheArtisanOfGlimmith/comments/1s0nkfi/how_was_i_supposed_to_solve_this_puzzle/, https://steamcommunity.com/app/4160210/discussions/search/?q=Palisade, https://steamdb.info/patchnotes/22658641/
- Open questions: none.

### `match`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - All regions in the puzzle must have the same shape.
  - No groups/subsets.
  - Rotations/reflections count as the same shape.
- Test idea: Reject a three-region solution where two regions are L triominoes and the third is a straight triomino.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/796716542888872782/, https://steamcommunity.com/app/4160210/?curator_clanid=7048508, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none.

### `mismatch`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - All regions in the puzzle must have distinct shapes.
  - Rotations/reflections count as the same shape.
- Test idea: Reject a solution where two regions are the same pentomino shape.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/841752762653913411/, https://steamcommunity.com/app/4160210/reviews/?browsefilter=toprated, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none.

### `range`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Every region area must be in an inclusive range.
  - Supports min-only, max-only, or min+max.
  - No complex disjoint ranges.
- Test idea: With range 2..3, reject monomino and tetromino candidates.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Range
- Open questions: none.

### `solitude`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Every region must contain exactly one counted cell symbol/clue.
  - Counted things are cell-based clues/symbols, e.g. Area Number, Palisade, Polyomino, Compass, Watchtower if represented on a cell/vertex as appropriate.
  - Rose Windows can count only when the Rose rule has a single symbol type.
  - Global rule cards do not count.
- Test idea: Reject a candidate region containing zero counted clues or two counted clues if the rule is exactly-one.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Solitude, https://steamcommunity.com/app/4160210/discussions/0/796715232585227442/
- Open questions: none.

### `size_separation`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Edge-adjacent regions must have different areas.
  - Corner-touching does not count.
- Test idea: Reject adjacent regions of areas 3 and 3 while allowing 3 and 4.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Size%20Separation
- Open questions: none.

### `boxy`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Every region must be a filled rectangle.
  - 1xN bars count as boxy.
  - A single cell counts as boxy.
  - No holes.
- Test idea: Keep a 2 by 3 rectangle candidate and reject a bent six-cell candidate.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/841752762653913411/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none.

### `non_boxy`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global rule.
  - Opposite of Boxy.
  - Filled rectangles, bars, and single cells are forbidden.
  - Can coexist with Shape Bank.
- Test idea: Reject a 2 by 2 square and allow an L-tetromino.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://gamefaqs.gamespot.com/pc/607835-the-artisan-of-glimmith/achievements
- Open questions: none.

### `bricky`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global boundary-graph rule.
  - Forbids exactly 4 border segments meeting at a grid vertex.
  - This corresponds to four region corners meeting.
  - It can include outer border, but outer border usually cannot reach 4.
- Test idea: Reject four regions meeting around one interior vertex.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/796716542888934780/, https://steamcommunity.com/app/4160210?l=hungarian, https://steamdb.info/patchnotes/22541095/
- Open questions: none.

### `loopy`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Global boundary-graph rule.
  - Forbids exactly 3 border segments meeting at a grid vertex.
  - It does not require loops.
  - It forbids T-junctions.
  - It cares about outer boundary.
  - If Loopy is active but Bricky is not, degree 4 vertices are allowed.
- Test idea: Reject a partition with a T-junction boundary vertex.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/796716542888934780/, https://steamdb.info/patchnotes/22541095/, https://steamcommunity.com/app/4160210?l=indonesian
- Open questions: none.

### `inequality`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Edge relation clue.
  - Compares adjacent region areas.
  - Strict inequality only.
  - Narrow/small side points to the smaller region.
  - Equality is invalid.
- Test idea: Reject a `>` assignment where the left region area is less than or equal to the right region area.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Inequality
- Open questions: none.

### `difference`

- Implementation status: ready; implemented: Yes.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Edge relation clue.
  - Compares adjacent regions.
  - Value is absolute area-size difference.
  - 0 means equal area, not necessarily same shape.
- Test idea: With difference 2, allow adjacent areas 3 and 5 and reject 3 and 4.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/840628131190565348/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none.

### `watchtower`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Vertex/corner clue.
  - Counts how many distinct regions touch the clue vertex.
  - Value is 1 to 4.
  - A 1 means all cells around the vertex that exist belong to the same region.
  - A 2 means exactly two distinct regions touch that vertex, etc.
  - User provided tutorial screenshot: "Counts how many regions are touching the clue."
- Test idea: Deferred until rule text is captured; likely use a small clue-cell visibility board.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://www.reddit.com/r/TheArtisanOfGlimmith/comments/1sm7y2o/loved_this_puzzle_watchtower_rose_windows/
- Open questions: none.

### `compass`

- Implementation status: ready; implemented: No.
- Confirmation basis: Confirmed directly by the user from in-game observations in project conversation; sourceUrls remain historical external research references, not the authority for these mechanics.
- Confirmed mechanics:
  - Cell clue.
  - Counts cells of the clue's own region in four directions: N, E, S, W.
  - Direction means half-plane, not just a ray.
  - East count = all own-region cells with x greater than clue x.
  - West count = all own-region cells with x less than clue x.
  - North count = all own-region cells with y less than clue y.
  - South count = all own-region cells with y greater than clue y.
  - A northeast cell contributes to both North and East.
  - The clue cell itself does not count.
  - Missing directions mean no restriction.
  - A fully blank Compass means no directional restriction, but still counts as a clue/symbol for Solitude.
- Test idea: With an east count of 2, accept only candidates with exactly two region cells in the clue's east sector.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/search/?q=Compass, https://steamcommunity.com/app/4160210/discussions/0/796715232585227442/, https://steamdb.info/patchnotes/22658641/
- Open questions: none.

## Names Not Treated As Rules Yet

| Name | Reason |
| --- | --- |
| Forest Entrance | Area/progression name from achievements and guides, not a distinct rule mechanic. |
| Castle Entrance | Area/progression name from achievements and guides, not a distinct rule mechanic. |
| Market | Area/progression name from achievements and guides, not a distinct rule mechanic. |
| Town | Area/progression name from achievements and guides, not a distinct rule mechanic. |
| Forest | Area/progression name from achievements and guides, not a distinct rule mechanic. |
| Hedge Maze | Confirmed as a window name, but sources did not establish a separate rule beyond nearby advanced mechanics. |
| Spiral Island | Confirmed as a window or area name, with no separate mechanic found in text sources. |
| Secret Garden | Appears to be a location or puzzle area label. |
| Secluded Garden | Appears to be a location or puzzle area label. |
