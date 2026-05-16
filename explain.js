import { edgeKey, idx, normalizeShape, parseEdgeKey } from "./geometry.js";

export const EDGE_STATES = [null, "cut", "join"];
export const EDGE_RELATIONS = [null, "sameShape", "differentShape"];

export function createPuzzle(width = 6, height = 6) {
  const active = Array.from({ length: width * height }, () => true);
  return {
    width,
    height,
    active,
    symbols: {},
    edges: {},
    rules: {
      area: 4,
      roseLabels: "",
      shapeBankText: "",
      allowRotations: true,
      allowReflections: false,
      shapeEquivalenceAllowReflections: false
    }
  };
}

export function clonePuzzle(puzzle) {
  return JSON.parse(JSON.stringify(puzzle));
}

export function normalizePuzzle(raw) {
  const width = Math.max(1, Number(raw.width) || 1);
  const height = Math.max(1, Number(raw.height) || 1);
  const size = width * height;
  const active = Array.from({ length: size }, (_, index) => raw.active?.[index] !== false);

  const puzzle = {
    width,
    height,
    active,
    symbols: {},
    edges: {},
    rules: {
      area: Math.max(0, Number(raw.rules?.area) || 0),
      roseLabels: String(raw.rules?.roseLabels ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
      shapeBankText: String(raw.rules?.shapeBankText ?? ""),
      allowRotations: raw.rules?.allowRotations !== false,
      allowReflections: raw.rules?.allowReflections === true,
      shapeEquivalenceAllowReflections: raw.rules?.shapeEquivalenceAllowReflections === true
    }
  };

  for (const [key, value] of Object.entries(raw.symbols ?? {})) {
    const index = Number(key);
    const symbol = String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (Number.isInteger(index) && index >= 0 && index < size && active[index] && symbol) {
      puzzle.symbols[index] = symbol.slice(0, 3);
    }
  }

  for (const [key, value] of Object.entries(raw.edges ?? {})) {
    const [a, b] = parseEdgeKey(key);
    if (!Number.isInteger(a) || !Number.isInteger(b)) continue;
    if (a < 0 || b < 0 || a >= size || b >= size) continue;
    if (!active[a] || !active[b]) continue;
    const state = value?.state === "join" || value?.state === "cut" ? value.state : null;
    const relation = value?.relation === "sameShape" || value?.relation === "differentShape" ? value.relation : null;
    if (state || relation) puzzle.edges[edgeKey(a, b)] = { state, relation };
  }

  return puzzle;
}

export function resizePuzzle(puzzle, width, height) {
  const next = createPuzzle(width, height);
  next.rules = { ...puzzle.rules };

  const minW = Math.min(puzzle.width, width);
  const minH = Math.min(puzzle.height, height);
  for (let y = 0; y < minH; y += 1) {
    for (let x = 0; x < minW; x += 1) {
      const oldIndex = idx(x, y, puzzle.width);
      const newIndex = idx(x, y, width);
      next.active[newIndex] = puzzle.active[oldIndex];
      if (puzzle.symbols[oldIndex]) next.symbols[newIndex] = puzzle.symbols[oldIndex];
    }
  }
  return normalizePuzzle(next);
}

export function toggleCellActive(puzzle, index) {
  const next = clonePuzzle(puzzle);
  next.active[index] = !next.active[index];
  if (!next.active[index]) delete next.symbols[index];
  return normalizePuzzle(next);
}

export function cycleCellSymbol(puzzle, index, symbols = ["", "A", "B", "C", "D"]) {
  if (!puzzle.active[index]) return puzzle;
  const next = clonePuzzle(puzzle);
  const current = next.symbols[index] ?? "";
  const pos = symbols.indexOf(current);
  const value = symbols[(pos + 1 + symbols.length) % symbols.length];
  if (value) next.symbols[index] = value;
  else delete next.symbols[index];
  return normalizePuzzle(next);
}

export function setEdgeState(puzzle, a, b, state) {
  const next = clonePuzzle(puzzle);
  const key = edgeKey(a, b);
  const current = next.edges[key] ?? { state: null, relation: null };
  current.state = state;
  if (!current.state && !current.relation) delete next.edges[key];
  else next.edges[key] = current;
  return normalizePuzzle(next);
}

export function setEdgeRelation(puzzle, a, b, relation) {
  const next = clonePuzzle(puzzle);
  const key = edgeKey(a, b);
  const current = next.edges[key] ?? { state: null, relation: null };
  current.relation = relation;
  if (!current.state && !current.relation) delete next.edges[key];
  else next.edges[key] = current;
  return normalizePuzzle(next);
}

export function cycleEdgeConstraint(puzzle, a, b) {
  const key = edgeKey(a, b);
  const current = puzzle.edges[key] ?? { state: null, relation: null };
  const order = [
    { state: null, relation: null },
    { state: "cut", relation: null },
    { state: "join", relation: null },
    { state: null, relation: "sameShape" },
    { state: null, relation: "differentShape" }
  ];
  const index = order.findIndex((item) => item.state === current.state && item.relation === current.relation);
  const nextConstraint = order[(index + 1) % order.length];
  let next = setEdgeState(puzzle, a, b, nextConstraint.state);
  next = setEdgeRelation(next, a, b, nextConstraint.relation);
  return next;
}

export function parseShapeBank(text) {
  const shapes = [];
  const errors = [];
  const lines = String(text ?? "").split(/\r?\n/);
  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    let line = lines[lineNo].trim();
    if (!line || line.startsWith("#")) continue;
    line = line.replace(/;/g, " ");
    let name = `shape_${shapes.length + 1}`;
    let body = line;
    if (line.includes(":")) {
      const parts = line.split(":");
      name = parts.shift().trim() || name;
      body = parts.join(":").trim();
    }
    const coords = body.split(/\s+/).filter(Boolean);
    const cells = [];
    let valid = true;
    for (const coord of coords) {
      const match = coord.match(/^(-?\d+),(-?\d+)$/);
      if (!match) {
        errors.push(`Line ${lineNo + 1}: invalid coordinate "${coord}". Use x,y such as 0,0.`);
        valid = false;
        break;
      }
      cells.push([Number(match[1]), Number(match[2])]);
    }
    if (!valid) continue;
    if (cells.length === 0) {
      errors.push(`Line ${lineNo + 1}: shape has no cells.`);
      continue;
    }
    const normalized = normalizeShape(cells);
    shapes.push({ name, cells: normalized });
  }
  return { shapes, errors };
}

export const TETROMINO_PRESET = `# Tetromino shape bank. Rotations are controlled by the checkbox.
I4: 0,0 1,0 2,0 3,0
O4: 0,0 1,0 0,1 1,1
L4: 0,0 0,1 0,2 1,2
T4: 0,0 1,0 2,0 1,1
S4: 1,0 2,0 0,1 1,1`;
