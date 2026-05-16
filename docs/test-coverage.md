# Test Coverage

This matrix tracks researched Glimmith rules against implementation and regression coverage.

Legend:

- Yes: covered directly.
- Placeholder: visible in the UI or registry, but solving intentionally rejects or does not implement the rule.
- No: not implemented or not covered yet.

| Rule | Status | Implementation | Unit Tests | Fixture Tests | UI Support | Explanation Support | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| precision | ready | Yes | Yes | Yes | Yes | Yes | Global exact-area candidate source and filter. |
| shape_bank | ready | Yes | Yes | Yes | Yes | Yes | Reusable allowed-shape set; optional use limits are schema-only for now. |
| rose_window | ready | Yes | Yes | Yes | Yes | Yes | Required symbol counts, not hard-coded to one symbol family. |
| gemini | ready | Yes | Yes | Yes | Yes | Yes | Two-region same-shape relation clue. |
| delta | ready | Yes | Yes | Yes | Yes | Yes | Two-region different-shape relation clue. |
| polyomino | ready | Yes | Yes | Yes | Yes | Yes | Cell-local shape clue with configurable rotations/reflections. |
| mingle_shape | ready | Yes | Yes | Yes | Yes | Yes | Pairwise adjacent same-shape rejection; corner contact is not counted. |
| area_number | ready | Yes | Yes | Yes | Yes | Yes | Cell-local numeric area clue. |
| difference | ready | Yes | Yes | Yes | Yes | Yes | Two-region absolute area-difference relation clue. |
| match | experimental | No | Registry validation only | No | Placeholder | No | Needs verified group/global semantics before solving. |
| mismatch | experimental | No | Registry validation only | No | Placeholder | No | Needs verified shape-distinctness scope before solving. |
| range | experimental | No | Registry validation only | No | Placeholder | No | Needs verified range semantics before solving. |
| size_separation | experimental | No | Registry validation only | No | Placeholder | No | Needs verified adjacency and equal-size semantics. |
| boxy | experimental | No | Registry validation only | No | Placeholder | No | Needs verified rectangle definition. |
| non_boxy | experimental | No | Registry validation only | No | Placeholder | No | Needs verified non-rectangle definition. |
| inequality | experimental | No | Registry validation only | No | Placeholder | No | Needs verified orientation and relation semantics. |
| solitude | experimental | No | Registry validation only | No | Placeholder | No | Needs verified counted clue/symbol semantics. |
| palisade | blocked | No | Registry rejection only | No | Disabled placeholder | No | Solver must reject until wall-pattern semantics are verified. |
| bricky | blocked | No | Registry rejection only | No | Disabled placeholder | No | Solver must reject until vertex/boundary semantics are verified. |
| loopy | blocked | No | Registry rejection only | No | Disabled placeholder | No | Solver must reject until loop/junction semantics are verified. |
| compass | blocked | No | Registry rejection only | No | Disabled placeholder | No | Solver must reject until directional count semantics are verified. |
| watchtower | blocked | No | Registry rejection only | No | Disabled placeholder | No | Solver must reject until exact mechanics are verified. |

Fixture coverage lives under `test/fixtures/`. Each implemented rule has at least:

- one unique-solution fixture,
- one impossible but schema-valid fixture,
- one invalid-input fixture,
- one multi-solution fixture where the rule has a compact meaningful case.

The fixture regression runner also checks JSON roundtrip behavior for valid fixtures and confirms every implemented registry rule has fixture coverage.
