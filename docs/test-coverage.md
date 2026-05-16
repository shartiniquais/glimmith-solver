# Test Coverage

This matrix tracks researched Glimmith rules against implementation and regression coverage.

All current inventory rules are now `ready` based on user-confirmed in-game observations from 2026-05-16. `ready` means the mechanics are verified enough to implement; it does not mean solver logic already exists.

Legend:

- Yes: covered directly.
- Placeholder: visible in the UI or registry, but solving intentionally rejects the rule because it is ready-but-not-implemented.
- No: not implemented or not covered yet.

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
| match | ready | No | Registry validation only | No | Placeholder | No | Ready global all-same-shape rule; not implemented yet. |
| mismatch | ready | No | Registry validation only | No | Placeholder | No | Ready global all-distinct-shapes rule; not implemented yet. |
| range | ready | No | Registry validation only | No | Placeholder | No | Ready inclusive min/max area rule; not implemented yet. |
| size_separation | ready | No | Registry validation only | No | Placeholder | No | Ready edge-adjacent different-area rule; not implemented yet. |
| boxy | ready | No | Registry validation only | No | Placeholder | No | Ready filled-rectangle rule; not implemented yet. |
| non_boxy | ready | No | Registry validation only | No | Placeholder | No | Ready non-rectangle rule; not implemented yet. |
| inequality | ready | No | Registry validation only | No | Placeholder | No | Ready strict adjacent area inequality clue; not implemented yet. |
| solitude | ready | No | Registry validation only | No | Placeholder | No | Ready exactly-one counted cell clue/symbol rule; not implemented yet. |
| palisade | ready | No | Registry validation only | No | Placeholder | No | Ready local border-pattern cell clue; not implemented yet. |
| bricky | ready | No | Registry validation only | No | Placeholder | No | Ready boundary-vertex degree-4 prohibition; not implemented yet. |
| loopy | ready | No | Registry validation only | No | Placeholder | No | Ready boundary-vertex degree-3 prohibition; not implemented yet. |
| compass | ready | No | Registry validation only | No | Placeholder | No | Ready N/E/S/W half-plane own-region count clue; not implemented yet. |
| watchtower | ready | No | Registry validation only | No | Placeholder | No | Ready vertex/corner distinct-region count clue; not implemented yet. |

Fixture coverage lives under `test/fixtures/`. Each implemented rule has at least:

- one unique-solution fixture,
- one impossible but schema-valid fixture,
- one invalid-input fixture,
- one multi-solution fixture where the rule has a compact meaningful case.

The fixture regression runner also checks JSON roundtrip behavior for valid fixtures and confirms every implemented registry rule has fixture coverage. Ready-but-not-implemented rules are intentionally excluded from implemented-rule fixture expectations until solver logic is added.
