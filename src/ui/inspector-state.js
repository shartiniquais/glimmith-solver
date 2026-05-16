import { cellLabel } from "../core/geometry.js";

export function selectedCellInspectorState(puzzle, selectedCell, candidateSummary = null) {
  if (!Number.isInteger(selectedCell)) return null;
  const cellClues = (puzzle.clues ?? []).filter((clue) => clue.type === "cell" && Number(clue.location?.cell) === selectedCell);
  return {
    type: "cell",
    cell: selectedCell,
    label: cellLabel(selectedCell, puzzle.width),
    active: Boolean(puzzle.active?.[selectedCell]),
    areaNumberClue: cellClues.find((clue) => clue.ruleId === "area_number") ?? null,
    polyominoClue: cellClues.find((clue) => clue.ruleId === "polyomino") ?? null,
    candidateCount:
      candidateSummary && Number(candidateSummary.cell) === selectedCell && Number.isFinite(candidateSummary.count)
        ? candidateSummary.count
        : null
  };
}

export function selectedClueInspectorState(puzzle, selectedClueId) {
  if (!selectedClueId) return null;
  const clue = (puzzle.clues ?? []).find((item) => item.id === selectedClueId);
  if (!clue) return null;
  if (clue.type === "relation") {
    const cells = relationCellsFromClue(clue);
    return {
      type: "relation_clue",
      clue,
      ruleId: clue.ruleId,
      cells,
      labels: cells.map((cell) => cellLabel(cell, puzzle.width)),
      differenceValue: clue.ruleId === "difference" ? Number(clue.value ?? clue.params?.difference ?? 0) : null
    };
  }
  return {
    type: "cell_clue",
    clue,
    cell: Number(clue.location?.cell),
    label: cellLabel(Number(clue.location?.cell), puzzle.width)
  };
}

export function inspectorStateForSelection(puzzle, selection = {}) {
  const clueState = selectedClueInspectorState(puzzle, selection.selectedClueId);
  if (clueState) return clueState;
  const candidateSummary = selection.candidateSummary ?? null;
  return selectedCellInspectorState(puzzle, selection.selectedCell, candidateSummary);
}

export function relationCellsFromClue(clue) {
  const refs = clue.regionRefs ?? clue.regions;
  if (Array.isArray(refs) && refs.length === 2) {
    return refs.map((ref) => Number(typeof ref === "object" ? ref.cell : ref)).filter(Number.isInteger);
  }
  if (Array.isArray(clue.location?.cells) && clue.location.cells.length === 2) {
    return clue.location.cells.map(Number).filter(Number.isInteger);
  }
  if (Array.isArray(clue.cells) && clue.cells.length === 2) {
    return clue.cells.map(Number).filter(Number.isInteger);
  }
  return [];
}
