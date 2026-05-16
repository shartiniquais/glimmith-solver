import { activeAdjacencyEdges, cellLabel, edgeKey } from "./geometry.js";
import { clonePuzzle, setEdgeState } from "./puzzle.js";
import { solvePuzzle } from "./solver.js";

export function findNextLogicalStep(puzzle, options = {}) {
  const base = solvePuzzle(puzzle, { limit: 2, maxNodes: options.maxNodes ?? 200000 });
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

  const edges = activeAdjacencyEdges(puzzle);
  for (const [a, b] of edges) {
    const current = puzzle.edges[edgeKey(a, b)] ?? { state: null, relation: null };
    if (current.state || current.relation) continue;

    const joinPuzzle = setEdgeState(clonePuzzle(puzzle), a, b, "join");
    const joinResult = solvePuzzle(joinPuzzle, { limit: 1, maxNodes: options.maxNodes ?? 200000 });
    if (joinResult.status === "no_solution") {
      return forcedStep(puzzle, a, b, "cut", "join");
    }

    const cutPuzzle = setEdgeState(clonePuzzle(puzzle), a, b, "cut");
    const cutResult = solvePuzzle(cutPuzzle, { limit: 1, maxNodes: options.maxNodes ?? 200000 });
    if (cutResult.status === "no_solution") {
      return forcedStep(puzzle, a, b, "join", "cut");
    }
  }

  if (base.status === "unique_solution") {
    return {
      status: "complete_or_global",
      message: "The implemented local border check found no new forced border, but the solver sees a unique full solution. Display the solution or add richer explanation techniques.",
      base
    };
  }

  return {
    status: "ambiguous",
    message: "No single unknown border is forced by the current implemented rules. The puzzle may need a higher-level deduction or may have multiple solutions.",
    base
  };
}

function forcedStep(puzzle, a, b, forcedState, impossibleState) {
  const labelA = cellLabel(a, puzzle.width);
  const labelB = cellLabel(b, puzzle.width);
  const type = forcedState === "join" ? "forced_join" : "forced_cut";
  const action = forcedState === "join" ? "Join" : "Cut";
  const impossible = impossibleState === "join" ? "joining" : "cutting";
  return {
    status: "step",
    step: {
      type,
      edge: [a, b],
      state: forcedState,
      title: `${action} ${labelA}–${labelB}`,
      reason: `Assuming the opposite, ${impossible} ${labelA}–${labelB}, leaves zero exact-cover solutions under the current rules. Therefore this border is forced.`
    }
  };
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
