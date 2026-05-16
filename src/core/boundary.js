import { hasBit, idx, inBounds, xy } from "./geometry.js";

export const DIRECTIONS = Object.freeze({
  N: Object.freeze({ dx: 0, dy: -1 }),
  E: Object.freeze({ dx: 1, dy: 0 }),
  S: Object.freeze({ dx: 0, dy: 1 }),
  W: Object.freeze({ dx: -1, dy: 0 })
});

const DIRECTION_ORDER = Object.freeze(["N", "E", "S", "W"]);

export function cellSideBorderState(candidateOrRegion, puzzle, cell, direction) {
  const delta = DIRECTIONS[direction];
  if (!delta) return true;
  const point = xy(cell, puzzle.width);
  const x = point.x + delta.dx;
  const y = point.y + delta.dy;
  if (!inBounds(x, y, puzzle.width, puzzle.height)) return true;
  const neighbor = idx(x, y, puzzle.width);
  if (!puzzle.active[neighbor]) return true;
  return !regionContainsCell(candidateOrRegion, neighbor);
}

export function borderSidesAroundCell(candidateOrRegion, puzzle, cell) {
  return new Set(DIRECTION_ORDER.filter((direction) => cellSideBorderState(candidateOrRegion, puzzle, cell, direction)));
}

export function palisadePatternFromSides(sides) {
  const set = sides instanceof Set ? sides : new Set(sides);
  if (set.size === 0) return "empty";
  if (set.size === 1) return "one_sided";
  if (set.size === 2) {
    if ((set.has("N") && set.has("S")) || (set.has("E") && set.has("W"))) return "opposite";
    return "corner";
  }
  if (set.size === 3) return "three_sided";
  if (set.size === 4) return "full";
  return "unknown";
}

export function cellsAroundVertex(puzzle, vertex) {
  const x = Number(vertex?.x);
  const y = Number(vertex?.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return [];
  const cells = [
    [x - 1, y - 1],
    [x, y - 1],
    [x - 1, y],
    [x, y]
  ];
  return cells
    .filter(([cx, cy]) => inBounds(cx, cy, puzzle.width, puzzle.height))
    .map(([cx, cy]) => idx(cx, cy, puzzle.width))
    .filter((cell) => puzzle.active[cell]);
}

export function distinctRegionsTouchingVertex(regionsOrCandidates, puzzle, vertex) {
  const cells = cellsAroundVertex(puzzle, vertex);
  return regionsOrCandidates.filter((region) => cells.some((cell) => regionContainsCell(region, cell))).length;
}

export function regionContainsCell(regionOrCandidate, cell) {
  if (regionOrCandidate?.mask !== undefined) return hasBit(regionOrCandidate.mask, cell);
  return (regionOrCandidate?.cells ?? []).includes(cell);
}
