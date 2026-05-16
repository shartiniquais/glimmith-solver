# Rule Research Notes

Research date: 2026-05-16.

This pass intentionally did not change solver code. It created a sourced inventory for later implementation and kept ambiguous mechanics out of the implementation path.

## Method

I started from the requested seed queries and checked:

- Official/public Steam surfaces: store page, achievement list, discussions, workshop/search snippets, and patch-note mirrors.
- Guide pages from Camzillasmom. A targeted `casualgameguides.com` search did not return usable rule pages in this pass.
- Review/discussion snippets where later rules were not explained by guides.
- The current repo as a cross-check for already implemented prototype rules, not as an external source.

The achievement list was useful for canonical names, but it is not enough to define mechanics. For each name, I looked for text that explained what the player actually has to satisfy.

## Strong Sources

- Steam store page: https://store.steampowered.com/app/4160210/The_Artisan_of_Glimmith/
- Steam achievement list: https://steamcommunity.com/stats/4160210/achievements
- GameFAQs achievement mirror: https://gamefaqs.gamespot.com/pc/607835-the-artisan-of-glimmith/achievements
- Precision guide: https://camzillasmom.com/the-artisan-of-glimmith-precision-window-puzzle-solutions/
- Watermill guide for Gemini/Delta: https://camzillasmom.com/the-artisan-of-glimmith-window-3-watermill-puzzle-solutions/
- Polyomino guide: https://camzillasmom.com/the-artisan-of-glimmith-polyomino-window-puzzle-solutions/
- Mingle Shape guide: https://camzillasmom.com/the-artisan-of-glimmith-mingle-shape-window-puzzle-solutions/
- Forest Entrance guide for mixed rules: https://camzillasmom.com/the-artisan-of-glimmith-forest-entrance-window-puzzle-solutions/
- Area Number guide: https://camzillasmom.com/the-artisan-of-glimmith-area-number-window-puzzle-solutions/
- Difference discussion: https://steamcommunity.com/app/4160210/discussions/0/840628131190565348/
- Match discussion: https://steamcommunity.com/app/4160210/discussions/0/796716542888872782/
- Mismatch and Boxy discussion: https://steamcommunity.com/app/4160210/discussions/0/841752762653913411/
- Loopy and Bricky discussion: https://steamcommunity.com/app/4160210/discussions/0/796716542888934780/
- Palisade discussion search: https://steamcommunity.com/app/4160210/discussions/search/?q=Palisade
- Compass discussion search: https://steamcommunity.com/app/4160210/discussions/search/?q=Compass
- Solitude discussion search: https://steamcommunity.com/app/4160210/discussions/search/?q=Solitude
- Size Separation discussion search: https://steamcommunity.com/app/4160210/discussions/search/?q=Size%20Separation
- Range discussion search: https://steamcommunity.com/app/4160210/discussions/search/?q=Range
- Inequality discussion search: https://steamcommunity.com/app/4160210/discussions/search/?q=Inequality
- Patch note mirror mentioning Palisade/Compass translation fixes: https://steamdb.info/patchnotes/22658641/
- Patch note mirror mentioning Loopy tutorial image fix and later tutorial work: https://steamdb.info/patchnotes/22541095/

## Findings

The early rules are well supported. Precision, Rose Windows, Gemini, Delta, Polyomino, Mingle Shape, and Area Number have direct guide text that matches the current solver model: generate connected candidate regions, filter candidates by local clue/rule requirements, then use exact cover and pairwise shape constraints.

Shape Bank is confirmed as a named window/rule family, and guide pages repeatedly list "Shapes allowed" entries. The one unresolved implementation detail is multiplicity. The current prototype treats the bank as an allowed-shape set; before implementing stricter bank behavior, verify whether the game ever treats bank entries as consumable.

Match and Mismatch are global shape-family rules rather than edge marker rules like Gemini/Delta. The best evidence says Match asks for multiple regions of the same shape, while Mismatch asks for distinct shapes. Dev/player discussion around Match explicitly raises isometry questions, so solver configuration should keep rotation/reflection handling explicit.

Area-number-family rules split cleanly:

- Precision and Range are global candidate filters.
- Area Number is a clue-cell candidate filter.
- Size Separation, Inequality, and Difference are pairwise area constraints.

The wall/graph family needs more careful modeling:

- Palisade clues appear to prescribe local wall patterns around clue cells.
- Bricky is probably a no-degree-4 boundary-vertex rule, also described as regions not cornering one another.
- Loopy is probably a no-degree-3 boundary-vertex rule, preventing T-junctions and making borders loop-like.

These can still fit the central candidate abstraction, but they need derived boundary-edge data for each candidate and constraints over the combined selected partition.

Compass is likely a candidate filter using relative positions around the clue cell. Steam developer snippets mention the eight sectors around a compass clue, but exact sector boundaries and blank-number behavior still need in-game confirmation.

Watchtower is the only confirmed rule/window name where I did not find enough text to define the mechanic. It should remain low confidence until someone captures the tutorial card, editor UI, or a clear screenshot/video.

## Window Names vs Rule Names

The achievement list uses "Restore the X Window" for both rule windows and progression/area windows. I treated these as non-rule names unless a mechanic was found:

- Forest Entrance
- Castle Entrance
- Market
- Town
- Forest
- Hedge Maze
- Spiral Island
- Secret Garden / Secluded Garden style location names

Hedge Maze is the most suspicious case. It may hide a rule family, but the sources found only confirm it as a window name. It should not become a solver rule without better evidence.

## Implementation Notes For Later

Rules that should be straightforward candidate filters:

- `precision`
- `shape_bank`
- `rose_window`
- `polyomino`
- `area_number`
- `range`
- `solitude`, once exact-vs-at-most is verified
- `boxy`
- `non_boxy`
- `compass`, once exact sector semantics are verified

Rules that need pairwise compatibility checks:

- `gemini`
- `delta`
- `mingle_shape`
- `size_separation`
- `inequality`
- `difference`

Rules that need global constraints:

- `match`
- `mismatch`
- possible consumable `shape_bank`, if verified

Rules that need boundary graph data:

- `palisade`
- `bricky`
- `loopy`

Do not implement `watchtower` yet. It needs primary rule text or a clear tutorial screenshot first.
