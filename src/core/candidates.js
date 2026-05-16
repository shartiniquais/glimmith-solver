import {
  activeCellIndexes,
  boundsOfShape,
  canonicalShapeKey,
  idx,
  maskFromIndexes,
  orthogonalNeighbors,
  shapeCellsFromIndexes,
  shapeTransforms
} from "./geometry.js";
import { parseShapeBank } from "./puzzle.js";
import { candidateShapeForComparison } from "./shape-comparison.js";
import { edgeConstraintsRule } from "./rules/edge-constraints.js";
import { applyCandidateFilters, createRuleContext } from "./rules/registry.js";

const DEFAULT_MAX_CANDIDATES = 80000;

export function generateCandidates(puzzle, options = {}) {
  const maxCandidates = options.maxCandidates ?? DEFAULT_MAX_CANDIDATES;
  const context = options.context ?? createRuleContext(puzzle, options);
  const plan = buildCandidateGenerationPlan(puzzle, context);
  const errors = [...plan.errors];
  const raw = [];

  if (plan.kind === "shape_bank") {
    raw.push(...generateShapePlacementCandidates(puzzle, plan.shapes, maxCandidates));
  } else if (plan.kind === "fixed_area") {
    raw.push(...generateConnectedCandidates(puzzle, plan.area, maxCandidates));
  } else {
    errors.push("Set a Precision area or provide a shape bank before solving.");
  }

  const filtered = [];
  const seen = new Set();
  for (const candidate of raw) {
    if (seen.has(candidate.mask.toString())) continue;
    seen.add(candidate.mask.toString());
    if (!applyCandidateFilters(candidate, context, [edgeConstraintsRule])) continue;
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

export function buildCandidateGenerationPlan(puzzle, context = createRuleContext(puzzle)) {
  const { shapes, errors } = shapeBankEntriesForGeneration(puzzle);
  if (shapes.length > 0) {
    return {
      kind: "shape_bank",
      ruleId: "shape_bank",
      shapes,
      errors
    };
  }

  const precisionArea = context.ruleConfigs.precision?.area ?? 0;
  if (precisionArea > 0) {
    return {
      kind: "fixed_area",
      ruleId: "precision",
      area: precisionArea,
      errors
    };
  }

  // Extension point for Step 02:
  // area_number and polyomino can provide bounded candidate sources here once
  // their solver modules are implemented. Keep this as a source plan instead
  // of hardcoding those clue mechanics inside the exact-cover search.
  return {
    kind: "missing_source",
    ruleId: null,
    errors
  };
}

function makeCandidate(indexes, width, height, source, sourceName = "") {
  const cells = [...indexes].sort((a, b) => a - b);
  const shapeCells = shapeCellsFromIndexes(cells, width);
  return {
    id: -1,
    cells,
    mask: maskFromIndexes(cells),
    area: cells.length,
    shapeCells,
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
    if (puzzle.rules.precision?.area > 0 && shape.cells.length !== puzzle.rules.precision.area) continue;
    const transforms = shapeTransforms(shape.cells, {
      allowRotations: puzzle.shapeBank?.allowRotations !== false,
      allowReflections: puzzle.shapeBank?.allowReflections === true
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

function shapeBankEntriesForGeneration(puzzle) {
  const parsed = parseShapeBank(puzzle.shapeBank?.text ?? puzzle.rules.shapeBankText);
  return {
    shapes: [...parsed.shapes, ...(puzzle.shapeBank?.entries ?? [])],
    errors: parsed.errors
  };
}

export { candidateShapeForComparison };
