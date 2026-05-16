/** Geometry helpers for square-grid region puzzles. */

export function idx(x, y, width) {
  return y * width + x;
}

export function xy(index, width) {
  return { x: index % width, y: Math.floor(index / width) };
}

export function cellLabel(index, width) {
  const { x, y } = xy(index, width);
  let n = x + 1;
  let letters = "";
  while (n > 0) {
    n -= 1;
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26);
  }
  return `${letters}${y + 1}`;
}

export function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function parseEdgeKey(key) {
  const [a, b] = key.split("-").map((part) => Number(part));
  return [a, b];
}

export function inBounds(x, y, width, height) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

export function orthogonalNeighbors(index, width, height) {
  const { x, y } = xy(index, width);
  const out = [];
  if (x > 0) out.push(idx(x - 1, y, width));
  if (x + 1 < width) out.push(idx(x + 1, y, width));
  if (y > 0) out.push(idx(x, y - 1, width));
  if (y + 1 < height) out.push(idx(x, y + 1, width));
  return out;
}

export function activeCellIndexes(puzzle) {
  const cells = [];
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      const i = idx(x, y, puzzle.width);
      if (puzzle.active[i]) cells.push(i);
    }
  }
  return cells;
}

export function activeAdjacencyEdges(puzzle) {
  const edges = [];
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      const a = idx(x, y, puzzle.width);
      if (!puzzle.active[a]) continue;
      if (x + 1 < puzzle.width) {
        const b = idx(x + 1, y, puzzle.width);
        if (puzzle.active[b]) edges.push([a, b]);
      }
      if (y + 1 < puzzle.height) {
        const b = idx(x, y + 1, puzzle.width);
        if (puzzle.active[b]) edges.push([a, b]);
      }
    }
  }
  return edges;
}

export function maskFromIndexes(indexes) {
  let mask = 0n;
  for (const index of indexes) {
    mask |= 1n << BigInt(index);
  }
  return mask;
}

export function hasBit(mask, index) {
  return (mask & (1n << BigInt(index))) !== 0n;
}

export function normalizeShape(cells) {
  if (cells.length === 0) return [];
  let minX = Infinity;
  let minY = Infinity;
  for (const [x, y] of cells) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }
  return cells
    .map(([x, y]) => [x - minX, y - minY])
    .sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
}

export function shapeKey(cells) {
  return normalizeShape(cells).map(([x, y]) => `${x},${y}`).join(";");
}

function rotate90(cells) {
  return cells.map(([x, y]) => [y, -x]);
}

function reflectX(cells) {
  return cells.map(([x, y]) => [-x, y]);
}

export function shapeTransforms(cells, options = {}) {
  const allowRotations = options.allowRotations ?? true;
  const allowReflections = options.allowReflections ?? false;
  const bases = [normalizeShape(cells)];
  if (allowReflections) bases.push(normalizeShape(reflectX(cells)));

  const seen = new Set();
  const out = [];

  for (const base of bases) {
    let current = base;
    const turns = allowRotations ? 4 : 1;
    for (let turn = 0; turn < turns; turn += 1) {
      const normalized = normalizeShape(current);
      const key = shapeKey(normalized);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(normalized);
      }
      current = rotate90(current);
    }
  }
  return out;
}

export function canonicalShapeKey(cells, options = {}) {
  const transforms = shapeTransforms(cells, options);
  return transforms.map(shapeKey).sort()[0] ?? "";
}

export function boundsOfShape(cells) {
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of cells) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { width: maxX + 1, height: maxY + 1 };
}

export function cellsFromMask(mask, width, height) {
  const out = [];
  for (let i = 0; i < width * height; i += 1) {
    if (hasBit(mask, i)) out.push(i);
  }
  return out;
}

export function shapeCellsFromIndexes(indexes, width) {
  return indexes.map((index) => {
    const { x, y } = xy(index, width);
    return [x, y];
  });
}
