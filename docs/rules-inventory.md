# The Artisan of Glimmith Rule Inventory

Research date: 2026-05-16.

This is a documentation-only inventory for future solver work. It treats Steam achievement/window names as discovery signals, then separates them from actual rule mechanics where possible. Confidence means:

- `high`: explicit rule wording was found, or two independent sources agree.
- `medium`: the rule exists and the core mechanic is strongly suggested, but edge cases need in-game verification.
- `low`: the name is confirmed, but the mechanic is inferred or not yet explained by text sources.

Implementation status means:

- `ready`: mechanics are verified enough to implement now.
- `experimental`: mechanics are likely, but unresolved edge cases remain.
- `blocked`: exact semantics are not verified enough for faithful solving.

## Rule Table

| ID | Canonical rule | implementationStatus | Alternate names | Player-facing meaning | Scope | Editor input | Solver encoding | Rotations/reflections | Local candidate elimination | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `precision` | Precision | ready | Exact area, No More No Less | Every region must contain exactly `N` cells. | One region, all regions, numbers | Global area integer | Candidate filter | Not relevant | Yes | high |
| `shape_bank` | Shape Bank | ready | Allowed shapes, bank | Every region must match one of the displayed shapes. | Shape bank, all regions | Reusable allowed polyomino set, symmetry flags, optional future use limits | Candidate filter; optional shape-use cardinality only when `exactUses` or `maxUses` is supplied | Yes, configurable | Yes | high |
| `rose_window` | Rose Windows | ready | Rose Window, one of each symbol | Every region must satisfy required symbol counts. | Symbols inside regions, all regions | Symbol grid and required symbol-count map | Candidate filter; exact-cover-like symbol counts | Not relevant | Yes | high |
| `gemini` | Gemini | ready | Same-shape relation clue | The two regions referenced by the clue must have the same shape. | Two regions, shape relation, clue edge/vertex | Two-region relation marker and shape-equivalence settings | Pairwise candidate compatibility | Yes, configurable | Partial | high |
| `delta` | Delta | ready | Different-shape relation clue | The two regions referenced by the clue must have different shapes. | Two regions, shape relation, clue edge/vertex | Two-region relation marker and shape-equivalence settings | Pairwise candidate incompatibility | Yes, configurable | Partial | high |
| `polyomino` | Polyomino | ready | Required shape clue | A region containing a shape clue must have that shape; monominoes may be implied in early puzzles. | One region, clue cells, shapes | Shape clue cells and shape-equivalence settings | Candidate filter | Yes, configurable | Yes | high |
| `mingle_shape` | Mingle Shape | ready | Neighboring regions different shapes | Neighboring regions must not have the same shape. | Two adjacent regions, all adjacencies, shapes | Global toggle and shape-equivalence settings | Pairwise candidate incompatibility for adjacent candidates | Yes, configurable | Partial | high |
| `area_number` | Area Number | ready | Number clue, area clue | A number inside a region gives that region's area. | One region, clue cells, numbers | Number clue cells | Candidate filter | Not relevant | Yes | high |
| `palisade` | Palisade | blocked | Wall-pattern clue, fence clue | Likely local wall/border pattern clues, but exact semantics are unverified. | Edges/walls, clue cells, clue vertices | Placeholder only until verified | Reject with not-implemented/semantics-unverified message | Unknown | Unknown | medium |
| `match` | Match | experimental | Uniformity, same shape globally | Regions in the same group must share the same shape. | Region groups, shapes | Group field, default global group, shape-equivalence settings | Global all-same shape constraint | Yes, configurable | No | high |
| `mismatch` | Mismatch | experimental | Uniqueness, all different shapes | Regions in the same group must have distinct shapes under the active equivalence settings. | Region groups, shapes | Group field, default global group, shape-equivalence settings | Global all-different shape constraint | Yes, configurable | No | medium |
| `range` | Range | experimental | Area range | Every region's area must be inside an inclusive numeric range, for example 6 to 7. | One region, all regions, numbers | Minimum and maximum area | Candidate filter | Not relevant | Yes | medium |
| `solitude` | Solitude | experimental | Lonely Island, one symbol/clue per region | Each region appears to contain exactly one clue/symbol, not one of each symbol. Exact-vs-at-most wording needs verification. | Symbols inside regions, clue cells | Set of counted clue/symbol cells | Candidate filter; possibly exact-cover clue coverage | Not relevant | Yes | medium |
| `size_separation` | Size Separation | experimental | Different neighboring sizes | Adjacent regions must have different areas. | Two adjacent regions, numbers | Global toggle | Pairwise candidate incompatibility by area | Not relevant | Partial | medium |
| `boxy` | Boxy | experimental | Rectangles | Regions must be rectangular boxes. | One region, shapes | Global toggle, optional allowed dimensions | Candidate filter | Reflections/rotations collapse by rectangle dimensions | Yes | medium |
| `non_boxy` | Non-Boxy | experimental | Not rectangles | Regions must not be rectangular boxes. | One region, shapes | Global toggle | Candidate filter | Not relevant beyond rectangle detection | Yes | medium |
| `bricky` | Bricky | blocked | No four-way corners, no corner touching | Likely a boundary-vertex rule, but exact semantics are unverified. | Edges/walls, clue vertices, all regions | Placeholder only until verified | Reject with not-implemented/semantics-unverified message | Unknown | Unknown | medium |
| `loopy` | Loopy | blocked | No T-junctions, loops | Likely a boundary-vertex rule, but exact semantics are unverified. | Edges/walls, clue vertices, all regions | Placeholder only until verified | Reject with not-implemented/semantics-unverified message | Unknown | Unknown | medium |
| `inequality` | Inequality | experimental | Greater-than relation clue, scales | A relation clue between two regions orders their areas; the narrow tip indicates the smaller side. | Two regions, numbers, clue edge/vertex | Two-region relation marker | Pairwise candidate incompatibility by area comparison | Not relevant | Partial | medium |
| `difference` | Difference | ready | Area difference relation clue | A numeric relation clue between two regions gives the absolute difference between their areas. `0` means equal area but not necessarily same shape. | Two regions, numbers, clue edge/vertex | Difference marker and integer | Pairwise candidate incompatibility by area difference | Not relevant | Partial | high |
| `watchtower` | Watchtower | blocked | Keeping Watch | Confirmed as a window/rule name, but the exact mechanic was not found in text sources. | Unknown | Placeholder only until verified | Reject with not-implemented/semantics-unverified message | Unknown | Unknown | low |
| `compass` | Compass | blocked | Pointing the Way, compass clue | Likely counts cells of its own region in directional sectors, but exact sector semantics are unverified. | Clue cells, numbers, directions | Placeholder only until verified | Reject with not-implemented/semantics-unverified message | Unknown | Unknown | medium |

## Implementation Constraints

- Shape Bank initially means a reusable allowed-shape set. JSON includes optional future `exactUses` and `maxUses` fields, but those limits should not be enforced unless supplied.
- Rose Windows must use required symbol counts, not a hard-coded single symbol family.
- Shape comparison must support configurable rotation and reflection equivalence wherever shapes are compared.
- Gemini, Delta, Difference, and Inequality are relation clues between two regions. They should not be modeled only as simple edge states.
- Match and Mismatch must support a `group` field; the first implementation may use a single default `global` group.
- Palisade, Bricky, Loopy, Compass, and Watchtower are blocked for solving. UI placeholders are acceptable only if useful, and solving should reject them with a clear not-implemented/semantics-unverified message.

## Rule Details

### `precision`

- Test idea: a 2 by 3 board with candidate splits of areas 2 and 4; `precision = 3` should eliminate both and allow only two triomino regions.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-precision-window-puzzle-solutions/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: none for the prototype.

### `shape_bank`

- Test idea: a 3 by 3 board where both an L triomino and a straight triomino could cover a clue-free region; a bank containing only the straight triomino should eliminate the L.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://gamefaqs.gamespot.com/pc/607835-the-artisan-of-glimmith/achievements, https://camzillasmom.com/the-artisan-of-glimmith-mingle-shape-window-puzzle-solutions/
- Open questions: confirm whether a banked shape may be reused unlimited times in all game contexts, or whether some puzzles limit each bank entry to one use.

### `rose_window`

- Test idea: a 4-cell board with symbols A, A, B, B; require each region to contain one A and one B, eliminating same-symbol pairs.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-mingle-shape-window-puzzle-solutions/, https://www.gamespew.com/2026/03/the-artisan-of-glimmith-review/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: confirm how the game handles optional/extra symbol types if a puzzle has multiple symbol families.

### `gemini`

- Test idea: two adjacent regions separated by a Gemini marker with candidate shapes line triomino and L triomino; mixed-shape assignments should be rejected.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-window-3-watermill-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-precision-window-puzzle-solutions/
- Open questions: confirm whether reflections are always accepted or controlled by each puzzle's shape-equivalence setting.

### `delta`

- Test idea: two adjacent regions separated by a Delta marker where both can be the same domino shape; same-shape assignments should be rejected.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-window-3-watermill-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-precision-window-puzzle-solutions/
- Open questions: same reflection-equivalence question as Gemini.

### `polyomino`

- Test idea: a region containing an L-triomino clue should reject all straight-triomino candidates even if they have the same area.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-polyomino-window-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-forest-entrance-window-puzzle-solutions/
- Open questions: confirm whether multiple shape clues in one region are allowed and, if so, whether all must agree.

### `mingle_shape`

- Test idea: two neighboring regions can both be the same tetromino; Mingle Shape should reject that solution while allowing non-neighbor duplicates.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-mingle-shape-window-puzzle-solutions/, https://camzillasmom.com/the-artisan-of-glimmith-forest-entrance-window-puzzle-solutions/
- Open questions: confirm whether corner-only contact counts as neighboring for this rule; likely no, unless Bricky-like rules say otherwise.

### `area_number`

- Test idea: a number `4` clue in a cell should reject all candidates containing that cell with area other than 4.
- Source URLs: https://camzillasmom.com/the-artisan-of-glimmith-area-number-window-puzzle-solutions/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: confirm behavior for multiple area numbers in the same region.

### `palisade`

- Test idea: place a cross-like Palisade clue in a cell; reject any candidate partition that does not put borders on the four clue-adjacent sides required by that variant.
- Source URLs: https://www.reddit.com/r/TheArtisanOfGlimmith/comments/1s0nkfi/how_was_i_supposed_to_solve_this_puzzle/, https://steamcommunity.com/app/4160210/discussions/search/?q=Palisade, https://steamdb.info/patchnotes/22658641/
- Open questions: capture exact icon taxonomy and orientation rules from the in-game editor/tutorial before implementation.

### `match`

- Test idea: a board with three same-area regions where two can be L triominoes and one a straight triomino; Match should reject the mixed assignment.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/796716542888872782/, https://steamcommunity.com/app/4160210/?curator_clanid=7048508, https://steamcommunity.com/stats/4160210/achievements
- Open questions: confirm whether Match always applies to all regions or can apply to subsets/groups.

### `mismatch`

- Test idea: a puzzle with two separable regions that can both be the same pentomino; Mismatch should require choosing different shape classes.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/841752762653913411/, https://steamcommunity.com/app/4160210/reviews/?browsefilter=toprated, https://steamcommunity.com/stats/4160210/achievements
- Open questions: confirm whether all region sizes participate together or whether Mismatch is grouped by area.

### `range`

- Test idea: `range = 2..3` should reject monomino and tetromino candidates while preserving domino and triomino candidates.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Range
- Open questions: verify exact inclusivity and whether ranges are always global.

### `solitude`

- Test idea: with three clue cells on a small board, reject any candidate region containing zero clues or two clues if the rule is exactly-one.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Solitude, https://steamcommunity.com/app/4160210/discussions/0/796715232585227442/
- Open questions: verify exactly one vs at most one; verify whether all clue types count or only special Solitude symbols.

### `size_separation`

- Test idea: adjacent regions of areas 3 and 3 should be rejected; adjacent regions of 3 and 4 should be allowed.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Size%20Separation
- Open questions: confirm whether same-size non-adjacent regions may repeat.

### `boxy`

- Test idea: a 6-cell region can be a 2 by 3 rectangle or a bent hexomino; Boxy should keep only the rectangle.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/841752762653913411/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: verify whether a 1 by N line counts as Boxy; discussion evidence suggests it does.

### `non_boxy`

- Test idea: reject a 2 by 2 square candidate and allow an L-tetromino candidate of the same area.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://gamefaqs.gamespot.com/pc/607835-the-artisan-of-glimmith/achievements
- Open questions: confirm exact rectangle definition and whether monominoes count as boxy.

### `bricky`

- Test idea: four regions meeting around one interior vertex should be rejected, while a T-junction with three boundary lines should remain allowed unless Loopy is also active.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/796716542888934780/, https://steamcommunity.com/app/4160210?l=hungarian, https://steamdb.info/patchnotes/22541095/
- Open questions: confirm if Bricky is exactly "no degree-4 boundary vertex" or a broader no-corner-touching rule.

### `loopy`

- Test idea: a partition with a T-junction boundary vertex should be rejected; simple closed loops and degree-4 crossings need separate tests depending on Bricky interaction.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/796716542888934780/, https://steamdb.info/patchnotes/22541095/, https://steamcommunity.com/app/4160210?l=indonesian
- Open questions: confirm whether Loopy also restricts degree-1 endpoints, whether outer border edges count, and how it combines with Bricky.

### `inequality`

- Test idea: an oriented `>` clue between adjacent regions should reject assignments where the left region area is less than or equal to the right region area.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://steamcommunity.com/app/4160210/discussions/search/?q=Inequality
- Open questions: verify exact icon orientation in the editor and whether equality is ever allowed by a different symbol.

### `difference`

- Test idea: a difference `2` marker between adjacent regions should allow areas 3 and 5, reject 3 and 4, and allow either side to be larger.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/0/840628131190565348/, https://steamcommunity.com/stats/4160210/achievements
- Open questions: confirm whether the clue is always absolute difference and whether it can appear on non-edge contacts.

### `watchtower`

- Test idea: deferred until rule text is captured; likely needs a small clue-cell visibility board.
- Source URLs: https://steamcommunity.com/stats/4160210/achievements, https://www.reddit.com/r/TheArtisanOfGlimmith/comments/1sm7y2o/loved_this_puzzle_watchtower_rose_windows/
- Open questions: determine exact clue meaning, whether it counts cells/regions/symbols, and whether directions are orthogonal only.

### `compass`

- Test idea: a compass clue with `E = 2` should only accept candidates where exactly two cells in the clue's region lie in its east sector, using the in-game sector definitions.
- Source URLs: https://steamcommunity.com/app/4160210/discussions/search/?q=Compass, https://steamcommunity.com/app/4160210/discussions/0/796715232585227442/, https://steamdb.info/patchnotes/22658641/
- Open questions: verify sector boundaries, whether the clue cell itself counts, and how blank directions are represented.

## Names Not Treated As Rules Yet

| Name | Reason |
| --- | --- |
| Forest Entrance, Castle Entrance, Market, Town, Forest | Area/progression names from achievements, not rule mechanics. |
| Hedge Maze | Confirmed as a window name, but not enough evidence that it is a distinct rule apart from Compass/Palisade-style mechanics. |
| Spiral Island | Confirmed as a window/area name. No separate mechanic found in text sources. |
| Secret Garden, Secluded Garden, Restoration progress labels | Area or puzzle-location names from guides/discussions. |
