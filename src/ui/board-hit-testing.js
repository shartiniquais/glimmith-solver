export function vertexKey(x, y) {
  return `${Number(x)},${Number(y)}`;
}

export function parseVertexKey(key) {
  const [x, y] = String(key ?? "").split(",").map(Number);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  return { x, y };
}

export function nearestVertexFromBoardPoint(point, puzzle, options = {}) {
  const cellSize = options.cellSize ?? 46;
  const pad = options.pad ?? 10;
  const threshold = options.threshold ?? 12;
  const boardX = Number(point?.x) - pad;
  const boardY = Number(point?.y) - pad;
  const x = Math.round(boardX / cellSize);
  const y = Math.round(boardY / cellSize);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > puzzle.width || y > puzzle.height) return null;
  const vx = pad + x * cellSize;
  const vy = pad + y * cellSize;
  const distance = Math.hypot(Number(point.x) - vx, Number(point.y) - vy);
  if (distance > threshold) return null;
  return { x, y, distance };
}
