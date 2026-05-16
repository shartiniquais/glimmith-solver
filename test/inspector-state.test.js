import assert from "node:assert/strict";
import test from "node:test";
import { normalizePuzzle } from "../src/core/puzzle.js";
import { inspectorStateForSelection, selectedCellInspectorState } from "../src/ui/inspector-state.js";

test("selected cell inspector reports clues and candidate count", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 1,
    activeCells: [0, 1],
    rules: { area_number: {} },
    clues: [
      {
        id: "area_number:0",
        type: "cell",
        ruleId: "area_number",
        location: { type: "cell", cell: 0 },
        value: 2,
        params: { value: 2 }
      }
    ]
  });
  const state = selectedCellInspectorState(puzzle, 0, { cell: 0, count: 3 });
  assert.equal(state.label, "A1");
  assert.equal(state.active, true);
  assert.equal(state.candidateCount, 3);
  assert.equal(state.areaNumberClue.value, 2);
});

test("selected relation clue inspector reports rule type and cells", () => {
  const puzzle = normalizePuzzle({
    width: 2,
    height: 1,
    activeCells: [0, 1],
    rules: { difference: {} },
    clues: [
      {
        id: "relation:difference:0-1",
        type: "relation",
        ruleId: "difference",
        location: { type: "pair", cells: [0, 1] },
        regionRefs: [{ cell: 0 }, { cell: 1 }],
        value: 1,
        params: { difference: 1 }
      }
    ]
  });
  const state = inspectorStateForSelection(puzzle, { selectedClueId: "relation:difference:0-1" });
  assert.equal(state.type, "relation_clue");
  assert.equal(state.ruleId, "difference");
  assert.deepEqual(state.labels, ["A1", "B1"]);
  assert.equal(state.differenceValue, 1);
});
