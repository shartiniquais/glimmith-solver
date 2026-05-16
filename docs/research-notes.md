# Rule Research Notes

Updated: 2026-05-16.

This document now has two layers of evidence:

- External/public source research from the initial inventory pass.
- User-confirmed in-game observations captured in the project conversation on 2026-05-16.

For rule semantics, the user-confirmed observations are authoritative project knowledge. External source URLs remain useful provenance, but they are no longer the authority for mechanics that the user directly confirmed.

## Source Baseline

The original research pass checked:

- Official/public Steam surfaces: store page, achievement list, discussions, workshop/search snippets, and patch-note mirrors.
- Guide pages from Camzillasmom. A targeted `casualgameguides.com` search did not return usable rule pages in that pass.
- Review/discussion snippets where later rules were not explained by guides.
- The current repo as a cross-check for already implemented prototype rules, not as an external source.

Strong public-source references retained in `docs/rules-inventory.json` include Steam achievements/discussions, GameFAQs achievement mirrors, Camzillasmom guide pages, and SteamDB patch-note mirrors. These URLs should not be removed when updating mechanics.

## User-Confirmed Mechanics

The user confirmed exact mechanics for all current inventory rules. As a result, every current rule is now `ready`.

Implemented now:

- `precision`
- `shape_bank`
- `rose_window`
- `gemini`
- `delta`
- `difference`
- `area_number`
- `polyomino`
- `mingle_shape`
- `match`
- `mismatch`
- `range`
- `solitude`
- `size_separation`
- `boxy`
- `non_boxy`
- `inequality`
- `palisade`
- `compass`
- `watchtower`

Ready but not implemented:

- `bricky`
- `loopy`

There are no blocked rules left in the current inventory. Ready-but-not-implemented rules should be treated as known rules and rejected with a clear "known and ready, but not implemented" message until solver work is added.

## Confirmed Rule Families

Area rules:

- `precision`: one global exact area, distinct from Area Number clues.
- `area_number`: positive integer cell clue; multiple clues in one region must agree.
- `range`: global inclusive min/max area rule, including min-only and max-only.
- `difference`: edge relation comparing adjacent region areas by absolute difference; `0` means equal area only.
- `inequality`: strict edge relation; narrow/small side points to the smaller region.
- `size_separation`: global rule forbidding equal-area edge-adjacent regions.

Shape rules:

- `shape_bank`: global reusable allowed-shape list; shapes can be reused unlimited times and may be unused.
- `polyomino`: cell clue whose region must match the clue shape; same-shape duplicate clues can share a region, different shapes cannot.
- `gemini`: edge relation requiring same shape on opposite sides; same region on both sides is invalid.
- `delta`: kept as different-shape edge relation unless corrected later; same region on both sides is invalid.
- `mingle_shape`: global edge-adjacent regions must not share shape; corner contact does not count.
- `match`: all regions share one shape; no groups/subsets.
- `mismatch`: all regions have distinct shapes; no groups/subsets.
- `boxy`: every region is a filled rectangle; bars and single cells count.
- `non_boxy`: opposite of Boxy; rectangles, bars, and single cells are forbidden.

Symbol/clue rules:

- `rose_window`: every region has exactly one of each listed Rose symbol and no extra Rose symbols.
- `solitude`: every region has exactly one counted cell symbol/clue; global rule cards do not count.

Boundary/graph rules:

- `palisade`: cell clue specifying the count/pattern of borders around the clue cell.
- `bricky`: forbids exactly four border segments meeting at a grid vertex.
- `loopy`: forbids exactly three border segments meeting at a grid vertex; it forbids T-junctions and does not require loops.

Direction/visibility rules:

- `compass`: cell clue counting own-region cells in N/E/S/W half-planes; diagonal cells can count in two directions.
- `watchtower`: vertex/corner clue counting distinct regions touching the clue vertex, value 1 to 4.

## Implementation Notes

Implemented in the current candidate/constraint solver:

- `precision`
- `shape_bank`
- `rose_window`
- `polyomino`
- `area_number`
- `range`
- `solitude`
- `boxy`
- `non_boxy`
- `gemini`
- `delta`
- `mingle_shape`
- `size_separation`
- `inequality`
- `difference`
- `match`
- `mismatch`
- `palisade`
- `compass`
- `watchtower`

Still deferred because they need global boundary-degree geometry beyond the current batch:

- `bricky`
- `loopy`

Implementation model categories:

Straightforward candidate filters:

- `precision`
- `shape_bank`
- `rose_window`
- `polyomino`
- `area_number`
- `range`
- `solitude`
- `boxy`
- `non_boxy`
- `compass`
- `palisade`

Pairwise/global compatibility checks:

- `gemini`
- `delta`
- `mingle_shape`
- `size_separation`
- `inequality`
- `difference`
- `match`
- `mismatch`

Boundary or vertex selection constraints:

- `bricky`
- `loopy`
- `watchtower`

Watchtower is implemented as a selected-candidate validator rather than a candidate filter, because its count depends on how multiple selected regions meet at a vertex.

Do not guess solver logic beyond these confirmed mechanics. Deferred rules should first receive validation/schema/UI support, then focused solver implementations with tests that prove each rule eliminates an otherwise valid solution.
