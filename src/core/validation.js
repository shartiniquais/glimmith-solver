import { boundsOfShape, edgeKey, orthogonalNeighbors, parseEdgeKey, shapeTransforms } from "./geometry.js";
import { normalizePuzzle, parseShapeBank } from "./puzzle.js";
import { createRuleContext, LEGACY_RULE_KEYS, RULE_REGISTRY, validateActiveRules } from "./rules/registry.js";
import { relationReferenceCells } from "./rules/relations.js";

const EDGE_STATES = new Set(["cut", "join"]);
const EDGE_RELATIONS = new Set(["sameShape", "differentShape"]);

export function validatePuzzle(rawPuzzle = {}) {
  const puzzle = normalizePuzzle(rawPuzzle);
  const errors = [];
  const warnings = [];
  const size = puzzle.width * puzzle.height;
  const activeSet = new Set(puzzle.activeCells);

  validateBoardMask(rawPuzzle, puzzle, size, errors);
  validateSymbols(rawPuzzle, size, activeSet, errors);
  validateRawEdges(rawPuzzle, puzzle, size, activeSet, errors);
  validateRules(puzzle, errors);
  validateClues(puzzle, size, activeSet, errors);
  validateShapeBank(puzzle, errors);

  const context = createRuleContext(puzzle);
  errors.push(...validateActiveRules(context));

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    puzzle
  };
}

function validateBoardMask(rawPuzzle, puzzle, size, errors) {
  if (Array.isArray(rawPuzzle.activeCells)) {
    const seen = new Set();
    for (const value of rawPuzzle.activeCells) {
      const index = Number(value);
      if (!Number.isInteger(index) || index < 0 || index >= size) {
        errors.push(`Active cell index "${value}" is outside the ${puzzle.width} by ${puzzle.height} board.`);
        continue;
      }
      if (seen.has(index)) errors.push(`Active cell index ${index} appears more than once.`);
      seen.add(index);
    }
  }
  if (Array.isArray(rawPuzzle.active) && rawPuzzle.active.length !== size) {
    errors.push(`Legacy active mask has ${rawPuzzle.active.length} entries but board size requires ${size}.`);
  }
}

function validateSymbols(rawPuzzle, size, activeSet, errors) {
  for (const key of Object.keys(rawPuzzle.symbols ?? {})) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= size) {
      errors.push(`Symbol cell "${key}" is outside the board.`);
    } else if (!activeSet.has(index)) {
      errors.push(`Symbol cell ${index} is not active.`);
    }
  }
}

function validateRawEdges(rawPuzzle, puzzle, size, activeSet, errors) {
  const rawEdges = rawPuzzle.edgeConstraints ?? rawPuzzle.edges ?? {};
  for (const [key, value] of Object.entries(rawEdges)) {
    const [a, b] = parseEdgeKey(key);
    if (!Number.isInteger(a) || !Number.isInteger(b) || edgeKey(a, b) !== key) {
      errors.push(`Edge constraint key "${key}" is invalid; expected sorted form "a-b".`);
      continue;
    }
    if (a < 0 || b < 0 || a >= size || b >= size) {
      errors.push(`Edge constraint "${key}" references a cell outside the board.`);
      continue;
    }
    if (!activeSet.has(a) || !activeSet.has(b)) {
      errors.push(`Edge constraint "${key}" references an inactive cell.`);
    }
    if (!orthogonalNeighbors(a, puzzle.width, puzzle.height).includes(b)) {
      errors.push(`Edge constraint "${key}" must reference orthogonally adjacent cells.`);
    }
    if (value?.state != null && !EDGE_STATES.has(value.state)) {
      errors.push(`Edge constraint "${key}" has invalid state "${value.state}".`);
    }
    if (value?.relation != null && !EDGE_RELATIONS.has(value.relation)) {
      errors.push(`Edge constraint "${key}" has invalid relation "${value.relation}".`);
    }
  }
}

function validateRules(puzzle, errors) {
  for (const id of Object.keys(puzzle.rules ?? {})) {
    if (LEGACY_RULE_KEYS.has(id)) continue;
    if (!RULE_REGISTRY[id]) errors.push(`Unknown rule id "${id}".`);
  }
}

function validateClues(puzzle, size, activeSet, errors) {
  for (const clue of puzzle.clues ?? []) {
    if (clue.ruleId && !RULE_REGISTRY[clue.ruleId]) {
      errors.push(`Clue "${clue.id}" references unknown rule id "${clue.ruleId}".`);
    }
    validateLocation(clue, size, activeSet, errors);
    if (clue.type === "relation") validateRelationClue(clue, size, activeSet, errors);
  }
}

function validateLocation(clue, size, activeSet, errors) {
  const location = clue.location;
  if (!location) return;
  if (location.cell !== undefined) validateActiveCellRef(location.cell, size, activeSet, errors, `Clue "${clue.id}" location`);
  if (Array.isArray(location.cells)) {
    for (const cell of location.cells) validateActiveCellRef(cell, size, activeSet, errors, `Clue "${clue.id}" location`);
  }
  if (location.type === "vertex") {
    if (!Number.isInteger(location.x) || !Number.isInteger(location.y)) {
      errors.push(`Clue "${clue.id}" vertex location requires integer x and y.`);
    }
  }
}

function validateRelationClue(clue, size, activeSet, errors) {
  const refs = relationReferenceCells(clue);
  if (!refs || refs.length !== 2) {
    errors.push(`Relation clue "${clue.id}" must reference two region cells.`);
    return;
  }
  for (const cell of refs) validateActiveCellRef(cell, size, activeSet, errors, `Relation clue "${clue.id}"`);
}

function validateActiveCellRef(value, size, activeSet, errors, label) {
  const cell = Number(value);
  if (!Number.isInteger(cell) || cell < 0 || cell >= size) {
    errors.push(`${label} references cell "${value}" outside the board.`);
  } else if (!activeSet.has(cell)) {
    errors.push(`${label} references inactive cell ${cell}.`);
  }
}

function validateShapeBank(puzzle, errors) {
  const parsed = parseShapeBank(puzzle.shapeBank?.text ?? "");
  errors.push(...parsed.errors.map((error) => `Shape Bank: ${error}`));
  const entries = [...parsed.shapes, ...(puzzle.shapeBank?.entries ?? [])];
  for (const shape of entries) {
    if (shape.cells.length > puzzle.activeCells.length) {
      errors.push(`Shape Bank entry "${shape.name}" has more cells than the active board.`);
      continue;
    }
    const placements = shapeTransforms(shape.cells, {
      allowRotations: puzzle.shapeBank?.allowRotations !== false,
      allowReflections: puzzle.shapeBank?.allowReflections !== false
    }).some((transformed) => {
      const bounds = boundsOfShape(transformed);
      return bounds.width <= puzzle.width && bounds.height <= puzzle.height;
    });
    if (!placements) {
      errors.push(`Shape Bank entry "${shape.name}" cannot fit inside the board.`);
    }
  }
}
