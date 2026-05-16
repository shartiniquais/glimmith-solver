import { activeAdjacencyEdges, cellLabel, edgeKey, hasBit, orthogonalNeighbors } from "./geometry.js";
import { clonePuzzle, normalizePuzzle, setEdgeState } from "./puzzle.js";
import { solvePuzzle } from "./solver.js";
import { candidateShapeForComparison } from "./shape-comparison.js";
import { ruleExplanationSnippet } from "./rule-explanations.js";

const DEFAULT_MAX_NODES = 200000;
const DEFAULT_COMPLETION_LIMIT = 2;

export function findNextLogicalStep(puzzle, options = {}) {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const base = solvePuzzle(puzzle, { limit: DEFAULT_COMPLETION_LIMIT, maxNodes });
  if (base.status === "no_solution") {
    return {
      status: "no_solution",
      message: "The current puzzle has no solution under the implemented rules.",
      base
    };
  }
  if (base.status === "search_limit") {
    return {
      status: "search_limit",
      message: "The solver hit its search limit before proving a logical step. Add more givens/rules or raise the limit.",
      base
    };
  }

  const singleCandidate = findCellWithOnlyOneCandidate(puzzle, base);
  if (singleCandidate) {
    return {
      status: "step",
      step: forcedRegionStep(puzzle, singleCandidate.cell, singleCandidate.candidate, "all_completions_agree", base.candidatePlan?.ruleId),
      base
    };
  }

  const relationPair = findForcedRelationPair(puzzle, base);
  if (relationPair) {
    return { status: "step", step: relationPairStep(puzzle, relationPair), base };
  }

  if (base.status === "unique_solution") {
    const regionStep = findForcedRegionFromUniqueSolution(puzzle, base);
    if (regionStep) return { status: "step", step: regionStep, base };

    const edgeStep = findEdgeFromUniqueSolution(puzzle, base);
    if (edgeStep) return { status: "step", step: edgeStep, base };
  }

  const contradictionEdge = findContradictionEdgeStep(puzzle, maxNodes);
  if (contradictionEdge) return { status: "step", step: contradictionEdge, base };

  const eliminated = findCandidateEliminationStep(puzzle, base, maxNodes, options.maxEliminationChecks ?? 40);
  if (eliminated) return { status: "step", step: eliminated, base };

  if (base.status === "unique_solution") {
    return {
      status: "complete_or_global",
      message: "The solver sees a unique full solution, but all applyable border and region deductions have already been recorded.",
      base
    };
  }

  return {
    status: "ambiguous",
    message: "No implemented logical step is forced from the current puzzle state. The puzzle may need a higher-level deduction or may have multiple solutions.",
    base
  };
}

export function explainAllLogicalSteps(rawPuzzle, options = {}) {
  const maxSteps = options.maxSteps ?? 80;
  let puzzle = normalizePuzzle(rawPuzzle);
  const steps = [];
  let status = "complete";
  let message = "No further implemented logical steps.";

  for (let index = 0; index < maxSteps; index += 1) {
    const result = findNextLogicalStep(puzzle, options);
    if (!result.step) {
      status = result.status;
      message = result.message;
      break;
    }

    steps.push(result.step);
    if (!isStepApplyable(result.step)) {
      status = "blocked";
      message = "The next explanation is informative but cannot be applied as a puzzle state change.";
      break;
    }

    const nextPuzzle = applyLogicalStep(puzzle, result.step);
    if (JSON.stringify(nextPuzzle.edgeConstraints) === JSON.stringify(puzzle.edgeConstraints) &&
        JSON.stringify(nextPuzzle.metadata) === JSON.stringify(puzzle.metadata)) {
      status = "stalled";
      message = "The next step did not change the puzzle state.";
      break;
    }
    puzzle = nextPuzzle;
  }

  if (steps.length >= maxSteps) {
    status = "limit";
    message = `Stopped after ${maxSteps} explanation steps.`;
  }

  return {
    status,
    message,
    steps,
    puzzle,
    text: formatExplanationTrace(steps, puzzle.width)
  };
}

export function applyLogicalStep(rawPuzzle, step) {
  let puzzle = normalizePuzzle(rawPuzzle);
  if (!step) return puzzle;

  if ((step.type === "forced_join" || step.type === "forced_cut") && step.edge) {
    return setEdgeState(puzzle, step.edge[0], step.edge[1], step.state ?? (step.type === "forced_join" ? "join" : "cut"));
  }

  if (step.type === "forced_region" && step.region?.cells) {
    return applyRegionEdges(puzzle, step.region.cells);
  }

  if (step.type === "rule_application" && Array.isArray(step.regions)) {
    for (const region of step.regions) puzzle = applyRegionEdges(puzzle, region.cells);
    return puzzle;
  }

  if (step.type === "candidate_eliminated" && step.region?.mask) {
    const metadata = { ...(puzzle.metadata ?? {}) };
    const excluded = new Set(metadata.excludedCandidateMasks ?? []);
    excluded.add(String(step.region.mask));
    metadata.excludedCandidateMasks = [...excluded].sort();
    return normalizePuzzle({ ...puzzle, metadata });
  }

  return puzzle;
}

export function isStepApplyable(step) {
  return Boolean(
    step?.edge ||
    step?.type === "forced_region" ||
    step?.type === "rule_application" ||
    step?.type === "candidate_eliminated"
  );
}

export function describeCandidatesForCell(rawPuzzle, cell, options = {}) {
  const puzzle = normalizePuzzle(rawPuzzle);
  const result = solvePuzzle(puzzle, { limit: 1, maxNodes: options.maxNodes ?? DEFAULT_MAX_NODES });
  const candidates = (result.candidates ?? [])
    .filter((candidate) => hasBit(candidate.mask, cell))
    .map((candidate) => summarizeCandidate(candidate, puzzle, result.candidatePlan?.ruleId));

  return {
    cell,
    label: cellLabel(cell, puzzle.width),
    status: result.status,
    count: candidates.length,
    candidates,
    errors: result.errors ?? []
  };
}

export function formatExplanationTrace(steps, width) {
  if (!steps.length) return "No explanation steps.";
  return steps
    .map((step, index) => {
      const label = step.edge
        ? `${cellLabel(step.edge[0], width)}-${cellLabel(step.edge[1], width)}`
        : step.cells?.map((cell) => cellLabel(cell, width)).join(", ") ?? "";
      return `${index + 1}. ${step.title ?? step.type}${label ? ` (${label})` : ""}\n${step.reason}`;
    })
    .join("\n\n");
}

export function summarizeSolution(solution, puzzle) {
  if (!solution) return "No solution.";
  return solution.regions
    .map((region) => {
      const labels = region.cells.map((cell) => cellLabel(cell, puzzle.width)).join(", ");
      const source = region.sourceName ? ` (${region.sourceName})` : "";
      return `Region ${region.id}${source}: ${labels}`;
    })
    .join("\n");
}

function findCellWithOnlyOneCandidate(puzzle, base) {
  for (const cell of puzzle.activeCells) {
    const covering = base.candidates.filter((candidate) => hasBit(candidate.mask, cell));
    if (covering.length === 1 && !regionAlreadyForced(puzzle, covering[0].cells)) {
      return { cell, candidate: covering[0] };
    }
  }
  return null;
}

function findForcedRelationPair(puzzle, base) {
  for (const clue of puzzle.clues ?? []) {
    if (clue.type !== "relation") continue;
    const refs = relationCellsFromClue(clue);
    if (!refs) continue;
    const pairs = compatibleRelationPairs(puzzle, base.candidates, clue, refs);
    if (pairs.length === 1) {
      return { clue, refs, left: pairs[0][0], right: pairs[0][1] };
    }
  }
  return null;
}

function findForcedRegionFromUniqueSolution(puzzle, base) {
  const solution = base.solutions[0];
  if (!solution) return null;
  for (const region of solution.regions) {
    if (!regionAlreadyForced(puzzle, region.cells)) {
      return forcedRegionStep(puzzle, region.cells[0], {
        id: region.id,
        cells: region.cells,
        area: region.area,
        mask: region.cells.reduce((mask, cell) => mask | (1n << BigInt(cell)), 0n),
        source: region.source,
        sourceName: region.sourceName
      }, "all_completions_agree");
    }
  }
  return null;
}

function findEdgeFromUniqueSolution(puzzle, base) {
  const solution = base.solutions[0];
  if (!solution) return null;
  for (const [a, b] of activeAdjacencyEdges(puzzle)) {
    const current = puzzle.edges[edgeKey(a, b)] ?? { state: null, relation: null };
    if (current.state || current.relation) continue;
    const sameRegion = solution.regionByCell[a] === solution.regionByCell[b];
    return forcedEdgeStep(puzzle, a, b, sameRegion ? "join" : "cut", {
      result: "all_completions_agree",
      reason: "The unique completion fixes this border state."
    });
  }
  return null;
}

function findContradictionEdgeStep(puzzle, maxNodes) {
  for (const [a, b] of activeAdjacencyEdges(puzzle)) {
    const current = puzzle.edges[edgeKey(a, b)] ?? { state: null, relation: null };
    if (current.state || current.relation) continue;

    const joinPuzzle = setEdgeState(clonePuzzle(puzzle), a, b, "join");
    const joinResult = solvePuzzle(joinPuzzle, { limit: 1, maxNodes });
    if (joinResult.status === "no_solution") {
      return forcedEdgeStep(puzzle, a, b, "cut", {
        assumptionState: "join",
        result: "no_solution",
        reason: "joining this border leaves zero exact-cover solutions"
      });
    }

    const cutPuzzle = setEdgeState(clonePuzzle(puzzle), a, b, "cut");
    const cutResult = solvePuzzle(cutPuzzle, { limit: 1, maxNodes });
    if (cutResult.status === "no_solution") {
      return forcedEdgeStep(puzzle, a, b, "join", {
        assumptionState: "cut",
        result: "no_solution",
        reason: "cutting this border leaves zero exact-cover solutions"
      });
    }
  }
  return null;
}

function findCandidateEliminationStep(puzzle, base, maxNodes, maxChecks) {
  let checks = 0;
  for (const candidate of base.candidates) {
    if (checks >= maxChecks) return null;
    if (candidateAppearsInKnownSolution(candidate, base.solutions)) continue;
    checks += 1;
    const forced = applyRegionEdges(puzzle, candidate.cells);
    const result = solvePuzzle(forced, { limit: 1, maxNodes });
    if (result.status === "no_solution") {
      return candidateEliminatedStep(puzzle, candidate, base.candidatePlan?.ruleId);
    }
  }
  return null;
}

function forcedRegionStep(puzzle, cell, candidate, proofResult = "all_completions_agree", fallbackRuleId = null) {
  const labels = candidate.cells.map((item) => cellLabel(item, puzzle.width));
  const ruleId = candidateSourceRuleId(candidate) ?? fallbackRuleId;
  const ruleReason = ruleExplanationSnippet(ruleId, "clueSatisfied");
  return structuredStep({
    type: "forced_region",
    cells: candidate.cells,
    region: summarizeCandidate(candidate, puzzle, ruleId),
    ruleId,
    title: `Force region containing ${cellLabel(cell, puzzle.width)}`,
    reason: `Cell ${cellLabel(cell, puzzle.width)} can only be covered by the region ${labels.join(", ")} under the current candidate rules.${ruleReason ? ` ${ruleReason}` : ""}`,
    proof: {
      assumption: { cell, candidateId: candidate.id },
      result: proofResult
    }
  });
}

function relationPairStep(puzzle, pair) {
  const { clue, refs, left, right } = pair;
  const label = ruleLabel(clue.ruleId);
  const reason = relationPairReason(puzzle, clue, left, right);
  return structuredStep({
    type: "rule_application",
    cells: [...new Set([...left.cells, ...right.cells])].sort((a, b) => a - b),
    ruleId: clue.ruleId,
    regions: [summarizeCandidate(left, puzzle, candidateSourceRuleId(left)), summarizeCandidate(right, puzzle, candidateSourceRuleId(right))],
    title: `${label} clue has one compatible pair`,
    reason,
    proof: {
      assumption: { clueId: clue.id, refs },
      result: "unique_completion"
    }
  });
}

function forcedEdgeStep(puzzle, a, b, state, proofInput) {
  const labelA = cellLabel(a, puzzle.width);
  const labelB = cellLabel(b, puzzle.width);
  const action = state === "join" ? "Join" : "Cut";
  const opposite = state === "join" ? "cut" : "join";
  const reason =
    proofInput.result === "no_solution"
      ? `Assuming the opposite, ${proofInput.reason}. Therefore this border is forced.`
      : `${proofInput.reason} Therefore this border is forced.`;
  return structuredStep({
    type: state === "join" ? "forced_join" : "forced_cut",
    cells: [a, b],
    edge: [a, b],
    state,
    ruleId: proofInput.result === "no_solution" ? "contradiction" : null,
    title: `${action} ${labelA}-${labelB}`,
    beforeState: { edge: { [edgeKey(a, b)]: puzzle.edges[edgeKey(a, b)] ?? { state: null, relation: null } } },
    afterState: { edge: { [edgeKey(a, b)]: { state, relation: null } } },
    reason,
    proof: {
      assumption: { edge: [a, b], state: proofInput.assumptionState ?? opposite },
      result: proofInput.result
    }
  });
}

function candidateEliminatedStep(puzzle, candidate, fallbackRuleId) {
  const region = summarizeCandidate(candidate, puzzle, fallbackRuleId);
  return structuredStep({
    type: "candidate_eliminated",
    cells: candidate.cells,
    region,
    ruleId: fallbackRuleId ?? candidateSourceRuleId(candidate),
    title: `Eliminate candidate ${region.labels.join(", ")}`,
    reason: `If ${region.labels.join(", ")} is selected as a region, the remaining puzzle has zero exact-cover completions. This candidate can be removed.`,
    proof: {
      assumption: { region: candidate.cells },
      result: "no_solution"
    },
    afterState: {
      metadata: { excludedCandidateMasks: [region.mask] }
    }
  });
}

function structuredStep(partial) {
  return {
    type: partial.type,
    cells: partial.cells ?? [],
    edge: partial.edge ?? null,
    region: partial.region ?? null,
    ruleId: partial.ruleId ?? null,
    beforeState: partial.beforeState ?? {},
    afterState: partial.afterState ?? {},
    reason: partial.reason,
    proof: partial.proof ?? { assumption: {}, result: "all_completions_agree" },
    ...partial
  };
}

function applyRegionEdges(rawPuzzle, cells) {
  let puzzle = normalizePuzzle(rawPuzzle);
  const set = new Set(cells);
  for (const cell of cells) {
    for (const neighbor of orthogonalNeighbors(cell, puzzle.width, puzzle.height)) {
      if (!puzzle.active[neighbor]) continue;
      const state = set.has(neighbor) ? "join" : "cut";
      puzzle = setEdgeState(puzzle, cell, neighbor, state);
    }
  }
  return puzzle;
}

function regionAlreadyForced(puzzle, cells) {
  const set = new Set(cells);
  for (const cell of cells) {
    for (const neighbor of orthogonalNeighbors(cell, puzzle.width, puzzle.height)) {
      if (!puzzle.active[neighbor]) continue;
      const state = puzzle.edges[edgeKey(cell, neighbor)]?.state;
      if (set.has(neighbor) && state !== "join") return false;
      if (!set.has(neighbor) && state !== "cut") return false;
    }
  }
  return true;
}

function compatibleRelationPairs(puzzle, candidates, clue, refs) {
  const [a, b] = refs;
  const leftOptions = candidates.filter((candidate) => hasBit(candidate.mask, a) && !hasBit(candidate.mask, b));
  const rightOptions = candidates.filter((candidate) => hasBit(candidate.mask, b) && !hasBit(candidate.mask, a));
  const pairs = [];
  for (const left of leftOptions) {
    for (const right of rightOptions) {
      if ((left.mask & right.mask) !== 0n) continue;
      if (relationSatisfied(puzzle, clue, left, right)) pairs.push([left, right]);
    }
  }
  return pairs;
}

function relationSatisfied(puzzle, clue, left, right) {
  if (clue.ruleId === "gemini") {
    return candidateShapeForComparison(puzzle, left) === candidateShapeForComparison(puzzle, right);
  }
  if (clue.ruleId === "delta") {
    return candidateShapeForComparison(puzzle, left) !== candidateShapeForComparison(puzzle, right);
  }
  if (clue.ruleId === "difference") {
    const value = Number(clue.value ?? clue.params?.difference);
    return Number.isInteger(value) && Math.abs(left.area - right.area) === value;
  }
  return false;
}

function relationPairReason(puzzle, clue, left, right) {
  const leftLabels = left.cells.map((cell) => cellLabel(cell, puzzle.width)).join(", ");
  const rightLabels = right.cells.map((cell) => cellLabel(cell, puzzle.width)).join(", ");
  if (clue.ruleId === "gemini") {
    return `Gemini clue "${clue.id}" requires the referenced regions to have the same shape. Only ${leftLabels} and ${rightLabels} match.`;
  }
  if (clue.ruleId === "delta") {
    return `Delta clue "${clue.id}" requires the referenced regions to have different shapes. Only ${leftLabels} and ${rightLabels} satisfy it.`;
  }
  if (clue.ruleId === "difference") {
    const value = Number(clue.value ?? clue.params?.difference);
    return `Difference clue "${clue.id}" requires an area gap of ${value}. Only ${leftLabels} and ${rightLabels} satisfy it.`;
  }
  return `Clue "${clue.id}" has one compatible region pair: ${leftLabels} and ${rightLabels}.`;
}

function relationCellsFromClue(clue) {
  const refs = clue.regionRefs ?? clue.regions;
  if (Array.isArray(refs) && refs.length === 2) {
    const cells = refs.map((ref) => Number(typeof ref === "object" ? ref.cell : ref));
    return cells.every(Number.isInteger) ? cells : null;
  }
  if (Array.isArray(clue.cells) && clue.cells.length === 2) {
    const cells = clue.cells.map(Number);
    return cells.every(Number.isInteger) ? cells : null;
  }
  if (Array.isArray(clue.location?.cells) && clue.location.cells.length === 2) {
    const cells = clue.location.cells.map(Number);
    return cells.every(Number.isInteger) ? cells : null;
  }
  return null;
}

function candidateAppearsInKnownSolution(candidate, solutions) {
  return (solutions ?? []).some((solution) =>
    solution.regions.some((region) => sameCells(region.cells, candidate.cells))
  );
}

function summarizeCandidate(candidate, puzzle, fallbackRuleId = null) {
  return {
    id: candidate.id,
    cells: [...candidate.cells],
    labels: candidate.cells.map((cell) => cellLabel(cell, puzzle.width)),
    area: candidate.area,
    shapeKey: candidateShapeForComparison(puzzle, candidate),
    source: candidate.source,
    sourceName: candidate.sourceName,
    ruleId: candidateSourceRuleId(candidate) ?? fallbackRuleId,
    mask: candidate.mask?.toString()
  };
}

function candidateSourceRuleId(candidate) {
  if (candidate.source === "shapeBank") return "shape_bank";
  if (candidate.source === "polyomino") return "polyomino";
  return null;
}

function ruleLabel(ruleId) {
  return {
    gemini: "Gemini",
    delta: "Delta",
    difference: "Difference"
  }[ruleId] ?? ruleId;
}

function sameCells(left, right) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((cell, index) => cell === sortedRight[index]);
}
