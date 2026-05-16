# Test Coverage

This matrix tracks researched Glimmith rules against implementation and regression coverage.

All current inventory rules are now `ready` based on user-confirmed in-game observations from 2026-05-16. `ready` means the mechanics are verified enough to implement; it does not mean solver logic already exists.

Legend:

- Yes: covered directly.
- Placeholder: visible in the UI or registry, but solving intentionally rejects the rule because it is ready-but-not-implemented. No current inventory rule is in this state.
- No: not implemented or not covered yet. No current inventory rule is in this state.

| Rule | Status | Implementation | Unit Tests | Fixture Tests | UI Support | Explanation Support | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| precision | ready | Yes | Yes | Yes | Yes | Yes | Global exact-area candidate source and filter. |
| shape_bank | ready | Yes | Yes | Yes | Yes | Yes | Reusable allowed-shape set; shapes may be reused unlimited times and may be unused. |
| rose_window | ready | Yes | Yes | Yes | Yes | Yes | Exactly one of each listed Rose symbol and no extras. |
| gemini | ready | Yes | Yes | Yes | Yes | Yes | Edge relation comparing opposite-side regions for same shape. |
| delta | ready | Yes | Yes | Yes | Yes | Yes | Edge relation comparing opposite-side regions for different shape. |
| polyomino | ready | Yes | Yes | Yes | Yes | Yes | Cell-local shape clue with rotations/reflections allowed. |
| mingle_shape | ready | Yes | Yes | Yes | Yes | Yes | Pairwise adjacent same-shape rejection; corner contact is not counted. |
| area_number | ready | Yes | Yes | Yes | Yes | Yes | Cell-local positive integer area clue. |
| difference | ready | Yes | Yes | Yes | Yes | Yes | Edge relation clue for absolute area difference; zero means equal area. |
| match | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Global all-same-shape pairwise constraint. |
| mismatch | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Global all-distinct-shapes pairwise constraint. |
| range | ready | Yes | Yes | Yes | Minimal min/max fields | Yes | Inclusive min/max area filter and candidate source. |
| size_separation | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Edge-adjacent regions must have different areas. |
| boxy | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Candidate filter for filled rectangles, bars, and single cells. |
| non_boxy | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Candidate filter forbidding filled rectangles, bars, and single cells. |
| inequality | ready | Yes | Yes | Yes | Relation placement with direction selector | Yes | Strict two-region area inequality relation clue. |
| solitude | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Candidate filter requiring exactly one counted cell clue or eligible Rose symbol per region. |
| palisade | ready | Yes | Yes | Yes | Minimal placement tool | Yes | Local border-pattern cell clue; full means four border sides around the clue cell. |
| bricky | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Boundary-vertex rule forbidding exactly degree-4 border vertices. Degree 3 is allowed unless Loopy is active. |
| loopy | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Boundary-vertex rule forbidding exactly degree-3 border vertices. Degree 4 is allowed unless Bricky is active. |
| compass | ready | Yes | Yes | Yes | Minimal placement tool | Yes | N/E/S/W half-plane own-region count clue; blank Compass clues still count for Solitude. |
| watchtower | ready | Yes | Yes | Yes | JSON-compatible toggle | Yes | Vertex/corner distinct-region count clue implemented through selection validation. |

Fixture coverage lives under `test/fixtures/`. Each implemented rule has at least:

- one unique-solution fixture,
- one impossible but schema-valid fixture,
- one invalid-input fixture,
- one multi-solution fixture where the rule has a compact meaningful case.

The fixture regression runner also checks JSON roundtrip behavior for valid fixtures and confirms every implemented registry rule has fixture coverage. All known inventory rules are implemented.
