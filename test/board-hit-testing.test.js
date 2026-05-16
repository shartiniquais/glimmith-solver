import assert from "node:assert/strict";
import test from "node:test";
import { nearestVertexFromBoardPoint, parseVertexKey, vertexKey } from "../src/ui/board-hit-testing.js";

test("vertexKey round-trips grid coordinates", () => {
  assert.equal(vertexKey(2, 3), "2,3");
  assert.deepEqual(parseVertexKey("2,3"), { x: 2, y: 3 });
  assert.equal(parseVertexKey("bad"), null);
});

test("nearestVertexFromBoardPoint detects a nearby board vertex", () => {
  const puzzle = { width: 4, height: 3 };
  const vertex = nearestVertexFromBoardPoint({ x: 56, y: 102 }, puzzle, { cellSize: 46, pad: 10, threshold: 8 });
  assert.deepEqual({ x: vertex.x, y: vertex.y }, { x: 1, y: 2 });
});

test("nearestVertexFromBoardPoint ignores distant or out-of-board points", () => {
  const puzzle = { width: 4, height: 3 };
  assert.equal(nearestVertexFromBoardPoint({ x: 70, y: 102 }, puzzle, { cellSize: 46, pad: 10, threshold: 8 }), null);
  assert.equal(nearestVertexFromBoardPoint({ x: -2, y: 10 }, puzzle, { cellSize: 46, pad: 10, threshold: 8 }), null);
});
