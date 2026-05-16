import assert from "node:assert/strict";
import test from "node:test";
import {
  appendShapeBankEntry,
  removeShapeBankEntryAt,
  shapeBankEntriesToText,
  shapeBankEntryFromCells,
  shapeBankTextToEntries,
  shapePreviewViewBox
} from "../src/ui/shape-bank-ui.js";

test("shape-bank text converts to list entries and back", () => {
  const parsed = shapeBankTextToEntries("Box: 0,0 1,0 0,1 1,1");
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].name, "Box");
  assert.equal(shapeBankEntriesToText(parsed.entries), "Box: 0,0 1,0 0,1 1,1");
});

test("shape-bank append and delete preserve JSON-compatible text format", () => {
  const entry = shapeBankEntryFromCells("L shape", [
    [0, 0],
    [0, 1],
    [1, 1]
  ]);
  const next = appendShapeBankEntry("Box: 0,0 1,0 0,1 1,1", entry);
  assert.match(next, /L_shape: 0,0 0,1 1,1/);
  assert.equal(removeShapeBankEntryAt(next, 0), "L_shape: 0,0 0,1 1,1");
});

test("shape preview returns normalized bounds", () => {
  const preview = shapePreviewViewBox([
    [2, 2],
    [3, 2],
    [2, 3]
  ]);
  assert.deepEqual(preview, {
    cells: [
      [0, 0],
      [1, 0],
      [0, 1]
    ],
    width: 2,
    height: 2
  });
});
