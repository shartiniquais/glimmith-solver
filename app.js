import {
  activeCellIndexes,
  boundsOfShape,
  canonicalShapeKey,
  hasBit,
  idx,
  maskFromIndexes,
  orthogonalNeighbors,
  parseEdgeKey,
  shapeCellsFromIndexes,
  shapeTransforms
} from "./geometry.js";
import { parseShapeBank } from "./puzzle.js";

const DEFAULT_MAX_CANDIDATES = 80000;

export function generateCandidates(puzzle, options = {}) {
  const maxCandidates = options.maxCandidates ?? DEFAULT_MAX_CANDIDATES;
  const { shapes, errors } = parseShapeBank(puzzle.rules.shapeBankText);
  const raw = [];

  if (shapes.length > 0) {
    raw.push(...generateShapePlacementCandidates(puzzle, shapes, maxCandidates));
  } else if (puzzle.rules.area > 0) {
    raw.push(...generateConnectedCandidates(puzzle, puzzle.rules.area, maxCandidates));
  } else {
    errors.push("Set a Precision area or provide a shape bank before solving.");
  }

  const filtered = [];
  const seen = new Set();
  for (const candidate of raw) {
    if (seen.has(candidate.mask.toString())) continue;
    seen.add(candidate.mask.toString());
    if (!candidateSatisfiesLocalRules(puzzle, candidate)) continue;
    candidate.id = filtered.length;
    filtered.push(candidate);
  }

  filtered.sort((a, b) => a.cells[0] - b.cells[0] || a.area - b.area || a.shapeKey.localeCompare(b.shapeKey));
  for (let id = 0; id < filtered.length; id += 1) filtered[id].id = id;

  if (raw.length >= maxCandidates) {
    errors.push(`Candidate generation stopped at ${maxCandidates} regions. Add more rules or lower the board size.`);
  }

  return { candidates: filtered, errors };
}

function makeCandidate(indexes, width, height, source, sourceName = "") {
  const cells = [...indexes].sort((a, b) => a - b);
  const shapeCells = shapeCellsFromIndexes(cells, width);
  return {
    id: -1,
    cells,
    mask: maskFromIndexes(cells),
    area: cells.length,
    shapeKey: canonicalShapeKey(shapeCells, { allowRotations: true, allowReflections: false }),
    shapeKeyWithReflections: canonicalShapeKey(shapeCells, { allowRotations: true, allowReflections: true }),
    source,
    sourceName,
    width,
    height
  };
}

function generateShapePlacementCandidates(puzzle, shapes, maxCandidates) {
  const candidates = [];
  for (const shape of shapes) {
    if (puzzle.rules.area > 0 && shape.cells.length !== puzzle.rules.area) continue;
    const transforms = shapeTransforms(shape.cells, {
      allowRotations: puzzle.rules.allowRotations,
      allowReflections: puzzle.rules.allowReflections
    });
    for (const transformed of transforms) {
      const bounds = boundsOfShape(transformed);
      for (let y = 0; y <= puzzle.height - bounds.height; y += 1) {
        for (let x = 0; x <= puzzle.width - bounds.width; x += 1) {
          const indexes = [];
          let ok = true;
          for (const [dx, dy] of transformed) {
            const cell = idx(x + dx, y + dy, puzzle.width);
            if (!puzzle.active[cell]) {
              ok = false;
              break;
            }
            indexes.push(cell);
          }
          if (!ok) continue;
          candidates.push(makeCandidate(indexes, puzzle.width, puzzle.height, "shapeBank", shape.name));
          if (candidates.length >= maxCandidates) return candidates;
        }
      }
    }
  }
  return candidates;
}

function generateConnectedCandidates(puzzle, targetArea, maxCandidates) {
  const activeCells = activeCellIndexes(puzzle).sort((a, b) => a - b);
  const active = new Set(activeCells);
  const candidates = [];
  const seenMasks = new Set();

  for (const anchor of activeCells) {
    const region = new Set([anchor]);
    const frontier = new Set(
      orthogonalNeighbors(anchor, puzzle.width, puzzle.height).filter((n) => active.has(n) && n >= anchor)
    );
    explore(anchor, region, frontier);
    if (candidates.length >= maxCandidates) break;
  }

  return candidates;

  function explore(anchor, region, frontier) {
    if (candidates.length >= maxCandidates) return;
    if (region.size === targetArea) {
      const cells = [...region].sort((a, b) => a - b);
      const mask = maskFromIndexes(cells).toString();
      if (!seenMasks.has(mask)) {
        seenMasks.add(mask);
        candidates.push(makeCandidate(cells, puzzle.width, puzzle.height, "connected"));
      }
      return;
    }
    if (frontier.size === 0) return;

    const choices = [...frontier].sort((a, b) => a - b);
    for (const cell of choices) {
      if (cell < anchor) continue;
      const nextRegion = new Set(region);
      nextRegion.add(cell);

      const nextFrontier = new Set(frontier);
      nextFrontier.delete(cell);
      for (const neighbor of orthogonalNeighbors(cell, puzzle.width, puzzle.height)) {
        if (neighbor >= anchor && active.has(neighbor) && !nextRegion.has(neighbor)) {
          nextFrontier.add(neighbor);
        }
      }
      explore(anchor, nextRegion, nextFrontier);
      if (candidates.length >= maxCandidates) return;
    }
  }
}

function candidateSatisfiesLocalRules(puzzle, candidate) {
  if (puzzle.rules.area > 0 && candidate.area !== puzzle.rules.area) return false;
  if (!satisfiesRoseRule(puzzle, candidate)) return false;
  if (!satisfiesEdgeRules(puzzle, candidate)) return false;
  return true;
}

function satisfiesRoseRule(puzzle, candidate) {
  const required = [...new Set(String(puzzle.rules.roseLabels ?? "").split("").filter(Boolean))];
  if (required.length === 0) return true;

  const requiredSet = new Set(required);
  const counts = Object.fromEntries(required.map((label) => [label, 0]));

  for (const cell of candidate.cells) {
    const symbol = puzzle.symbols[cell];
    if (!symbol) continue;
    if (!requiredSet.has(symbol)) return false;
    counts[symbol] += 1;
  }

  return required.every((label) => counts[label] === 1);
}

function satisfiesEdgeRules(puzzle, candidate) {
  for (const [key, constraint] of Object.entries(puzzle.edges ?? {})) {
    const [a, b] = parseEdgeKey(key);
    const hasA = hasBit(candidate.mask, a);
    const hasB = hasBit(candidate.mask, b);
    if (constraint.state === "join" && hasA !== hasB) return false;
    if (constraint.state === "cut" && hasA && hasB) return false;
    if (constraint.relation && hasA && hasB) return false;
  }
  return true;
}

export function candidateShapeForComparison(puzzle, candidate) {
  return puzzle.rules.shapeEquivalenceAllowReflections ? candidate.shapeKeyWithReflections : candidate.shapeKey;
}
