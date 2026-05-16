import { activeCellIndexes, hasBit, maskFromIndexes, parseEdgeKey } from "./geometry.js";
import { generateCandidates, candidateShapeForComparison } from "./candidates.js";

export function solvePuzzle(puzzle, options = {}) {
  const limit = Math.max(1, options.limit ?? 2);
  const maxNodes = Math.max(1, options.maxNodes ?? 250000);
  const activeCells = activeCellIndexes(puzzle);
  const fullMask = maskFromIndexes(activeCells);

  if (activeCells.length === 0) {
    return {
      status: "unique_solution",
      solutions: [{ regions: [], regionByCell: {} }],
      errors: [],
      candidates: [],
      nodeCount: 0,
      truncated: false
    };
  }

  const { candidates, errors } = generateCandidates(puzzle, options);
  const candidatesByCell = Array.from({ length: puzzle.width * puzzle.height }, () => []);
  for (const candidate of candidates) {
    for (const cell of candidate.cells) candidatesByCell[cell].push(candidate);
  }

  for (const cell of activeCells) {
    if (candidatesByCell[cell].length === 0) {
      return {
        status: "no_solution",
        solutions: [],
        errors: [...errors, `No valid region candidate can cover cell ${cell}.`],
        candidates,
        nodeCount: 0,
        truncated: false
      };
    }
  }

  const invalidPairs = buildInvalidPairConstraints(puzzle, candidates);
  const solutions = [];
  let nodeCount = 0;
  let hitNodeLimit = false;
  const selected = [];

  dfs(0n);

  let status;
  if (solutions.length === 0) status = "no_solution";
  else if (hitNodeLimit) status = "search_limit";
  else if (limit === 1) status = "solution_found";
  else if (solutions.length >= limit) status = "multiple_solutions";
  else status = "unique_solution";

  return {
    status,
    solutions,
    errors,
    candidates,
    nodeCount,
    truncated: hitNodeLimit || solutions.length >= limit
  };

  function dfs(coveredMask) {
    if (solutions.length >= limit || hitNodeLimit) return;
    nodeCount += 1;
    if (nodeCount > maxNodes) {
      hitNodeLimit = true;
      return;
    }

    if (coveredMask === fullMask) {
      solutions.push(makeSolution(puzzle, selected.map((id) => candidates[id])));
      return;
    }

    const choice = chooseNextCell(coveredMask);
    if (!choice) return;

    for (const candidate of choice.options) {
      selected.push(candidate.id);
      dfs(coveredMask | candidate.mask);
      selected.pop();
      if (solutions.length >= limit || hitNodeLimit) return;
    }
  }

  function chooseNextCell(coveredMask) {
    let bestCell = -1;
    let bestOptions = null;

    for (const cell of activeCells) {
      if (hasBit(coveredMask, cell)) continue;
      const optionsForCell = [];
      for (const candidate of candidatesByCell[cell]) {
        if ((candidate.mask & coveredMask) !== 0n) continue;
        if (conflictsWithSelected(candidate.id)) continue;
        optionsForCell.push(candidate);
      }
      if (optionsForCell.length === 0) return null;
      if (bestOptions === null || optionsForCell.length < bestOptions.length) {
        bestCell = cell;
        bestOptions = optionsForCell;
        if (bestOptions.length === 1) break;
      }
    }

    return bestOptions === null ? null : { cell: bestCell, options: bestOptions };
  }

  function conflictsWithSelected(candidateId) {
    const bad = invalidPairs.get(candidateId);
    if (!bad) return false;
    for (const selectedId of selected) {
      if (bad.has(selectedId)) return true;
    }
    return false;
  }
}

function buildInvalidPairConstraints(puzzle, candidates) {
  const invalidPairs = new Map();

  for (const [key, constraint] of Object.entries(puzzle.edges ?? {})) {
    if (!constraint.relation) continue;
    const [a, b] = parseEdgeKey(key);
    const aCandidates = candidates.filter((candidate) => hasBit(candidate.mask, a) && !hasBit(candidate.mask, b));
    const bCandidates = candidates.filter((candidate) => hasBit(candidate.mask, b) && !hasBit(candidate.mask, a));

    for (const left of aCandidates) {
      for (const right of bCandidates) {
        const sameShape = candidateShapeForComparison(puzzle, left) === candidateShapeForComparison(puzzle, right);
        const valid = constraint.relation === "sameShape" ? sameShape : !sameShape;
        if (!valid) addInvalidPair(invalidPairs, left.id, right.id);
      }
    }
  }

  return invalidPairs;
}

function addInvalidPair(invalidPairs, a, b) {
  if (!invalidPairs.has(a)) invalidPairs.set(a, new Set());
  if (!invalidPairs.has(b)) invalidPairs.set(b, new Set());
  invalidPairs.get(a).add(b);
  invalidPairs.get(b).add(a);
}

function makeSolution(puzzle, candidates) {
  const regions = candidates.map((candidate, index) => ({
    id: index + 1,
    cells: [...candidate.cells],
    area: candidate.area,
    shapeKey: puzzle.rules.shapeEquivalenceAllowReflections ? candidate.shapeKeyWithReflections : candidate.shapeKey,
    source: candidate.source,
    sourceName: candidate.sourceName
  }));
  const regionByCell = {};
  for (const region of regions) {
    for (const cell of region.cells) regionByCell[cell] = region.id;
  }
  return { regions, regionByCell };
}
