import assert from "node:assert/strict";
import test from "node:test";
import { canRedo, canUndo, createHistory, recordHistory, redoHistory, undoHistory } from "../src/ui/history.js";

test("history records bounded puzzle states and supports undo/redo", () => {
  let history = createHistory({ value: 0 }, { limit: 2 });
  history = recordHistory(history, { value: 1 }, "one");
  history = recordHistory(history, { value: 2 }, "two");
  history = recordHistory(history, { value: 3 }, "three");

  assert.equal(history.past.length, 2);
  assert.equal(history.present.value, 3);
  assert.equal(canUndo(history), true);
  assert.equal(canRedo(history), false);

  history = undoHistory(history);
  assert.equal(history.present.value, 2);
  assert.equal(canRedo(history), true);

  history = undoHistory(history);
  assert.equal(history.present.value, 1);
  assert.equal(canUndo(history), false);

  history = redoHistory(history);
  assert.equal(history.present.value, 2);
});

test("recording an equivalent state does not grow history", () => {
  let history = createHistory({ value: 1 });
  history = recordHistory(history, { value: 1 }, "same");
  assert.equal(history.past.length, 0);
  assert.equal(history.present.value, 1);
});
