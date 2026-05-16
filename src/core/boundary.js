import { hasBit, idx, inBounds, xy } from "./geometry.js";

export const DIRECTIONS = Object.freeze({
  N: Object.freeze({ dx: 0, dy: -1 }),
  E: Object.freeze({ dx: 1, dy: 0 }),
  S: Object.freeze({ dx: 0, dy: 1 }),
  W: Object.freeze({ dx: -1, dy: 0 })
});

const DIRECTION_ORDER = Object.freeze(["N", "E", "S", "W"]);

const SEGMENT_SORT_ORDER = Object.freeze({ h: 0, v: 1 });

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

export function selectedRegionByCell(selectedCandidates, puzzle) {
  const regions = Array.from({ length: puzzle.width * puzzle.height }, () => null);
  for (let regionIndex = 0; regionIndex < selectedCandidates.length; regionIndex += 1) {
    for (const cell of selectedCandidates[regionIndex]?.cells ?? []) {
      regions[cell] = regionIndex;
    }
  }
  return regions;
}

export function selectedBorderSegments(selectedCandidates, puzzle) {
  const regionByCell = selectedRegionByCell(selectedCandidates, puzzle);
  const segments = new Map();

  for (const cell of puzzle.activeCells ?? []) {
    const region = regionByCell[cell];
    if (region === null) continue;
    const point = xy(cell, puzzle.width);
    maybeAddSideSegment(segments, puzzle, regionByCell, region, point.x, point.y, "N");
    maybeAddSideSegment(segments, puzzle, regionByCell, region, point.x, point.y, "S");
    maybeAddSideSegment(segments, puzzle, regionByCell, region, point.x, point.y, "W");
    maybeAddSideSegment(segments, puzzle, regionByCell, region, point.x, point.y, "E");
  }

  return [...segments.values()].sort(compareSegments);
}

export function vertexBorderDegree(selectedCandidates, puzzle, vertex) {
  const x = Number(vertex?.x);
  const y = Number(vertex?.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 0;
  return selectedBorderSegments(selectedCandidates, puzzle).filter((segment) => segmentTouchesVertex(segment, x, y)).length;
}

export function allVertexBorderDegrees(selectedCandidates, puzzle) {
  const segments = selectedBorderSegments(selectedCandidates, puzzle);
  const degrees = [];
  for (let y = 0; y <= puzzle.height; y += 1) {
    for (let x = 0; x <= puzzle.width; x += 1) {
      degrees.push({
        x,
        y,
        degree: segments.filter((segment) => segmentTouchesVertex(segment, x, y)).length
      });
    }
  }
  return degrees;
}

export function regionContainsCell(regionOrCandidate, cell) {
  if (regionOrCandidate?.mask !== undefined) return hasBit(regionOrCandidate.mask, cell);
  return (regionOrCandidate?.cells ?? []).includes(cell);
}

function maybeAddSideSegment(segments, puzzle, regionByCell, region, x, y, direction) {
  const delta = DIRECTIONS[direction];
  const neighborX = x + delta.dx;
  const neighborY = y + delta.dy;
  let isBorder = false;

  if (!inBounds(neighborX, neighborY, puzzle.width, puzzle.height)) {
    isBorder = true;
  } else {
    const neighbor = idx(neighborX, neighborY, puzzle.width);
    if (!puzzle.active[neighbor]) {
      isBorder = true;
    } else {
      const neighborRegion = regionByCell[neighbor];
      isBorder = neighborRegion !== null && neighborRegion !== region;
    }
  }

  if (!isBorder) return;
  const segment = sideSegment(x, y, direction);
  segments.set(segmentKey(segment), segment);
}

function sideSegment(x, y, direction) {
  if (direction === "N") return { orientation: "h", x, y };
  if (direction === "S") return { orientation: "h", x, y: y + 1 };
  if (direction === "W") return { orientation: "v", x, y };
  return { orientation: "v", x: x + 1, y };
}

function segmentKey(segment) {
  return `${segment.orientation}:${segment.x}:${segment.y}`;
}

function segmentTouchesVertex(segment, x, y) {
  if (segment.orientation === "h") {
    return segment.y === y && (segment.x === x || segment.x + 1 === x);
  }
  return segment.x === x && (segment.y === y || segment.y + 1 === y);
}

function compareSegments(a, b) {
  return SEGMENT_SORT_ORDER[a.orientation] - SEGMENT_SORT_ORDER[b.orientation] || a.y - b.y || a.x - b.x;
}
