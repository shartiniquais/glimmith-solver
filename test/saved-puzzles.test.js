import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteSavedPuzzle,
  exportSavedPuzzleCollection,
  importSavedPuzzleCollection,
  listSavedPuzzles,
  loadSavedPuzzle,
  savePuzzle
} from "../src/ui/saved-puzzles.js";

test("saved puzzle helpers save, load, replace, and delete entries", () => {
  const storage = memoryStorage();
  const puzzle = { width: 2, height: 2, rules: { area: 2 } };
  const entry = savePuzzle(storage, "Small test", puzzle, "test-key", new Date("2026-01-01T00:00:00Z"));

  assert.equal(entry.id, "small-test");
  assert.deepEqual(loadSavedPuzzle(storage, "small-test", "test-key"), puzzle);

  savePuzzle(storage, "Small test", { width: 3, height: 1 }, "test-key", new Date("2026-01-02T00:00:00Z"));
  assert.equal(listSavedPuzzles(storage, "test-key").length, 1);
  assert.equal(loadSavedPuzzle(storage, "small-test", "test-key").width, 3);

  deleteSavedPuzzle(storage, "small-test", "test-key");
  assert.deepEqual(listSavedPuzzles(storage, "test-key"), []);
});

test("saved puzzle collection export/import merges by id", () => {
  const source = memoryStorage();
  const target = memoryStorage();
  savePuzzle(source, "One", { width: 1, height: 1 }, "test-key", new Date("2026-01-01T00:00:00Z"));
  savePuzzle(target, "Two", { width: 2, height: 1 }, "test-key", new Date("2026-01-01T00:00:00Z"));

  const exported = exportSavedPuzzleCollection(source, "test-key");
  const merged = importSavedPuzzleCollection(target, exported, "test-key");

  assert.deepEqual(merged.map((entry) => entry.id), ["one", "two"]);
});

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
}
