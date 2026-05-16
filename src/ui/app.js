import { activeAdjacencyEdges, cellLabel, edgeKey, idx, normalizeShape, parseEdgeKey, xy } from "../core/geometry.js";
import {
  createPuzzle,
  cycleCellSymbol,
  cycleEdgeConstraint,
  normalizePuzzle,
  resizePuzzle,
  TETROMINO_PRESET,
  toggleCellActive
} from "../core/puzzle.js";
import { solvePuzzle } from "../core/solver.js";
import {
  applyLogicalStep,
  describeCandidatesForCell,
  explainAllLogicalSteps,
  findNextLogicalStep,
  formatExplanationTrace,
  isStepApplyable,
  summarizeSolution
} from "../core/explain.js";
import { validatePuzzle } from "../core/validation.js";
import { RULE_REGISTRY } from "../core/rules/registry.js";
import { RULE_GROUPS, RULE_HELP } from "./rule-ui-metadata.js";
import { applyThemePreference, loadThemePreference, saveThemePreference } from "./theme.js";
import {
  appendShapeBankEntry,
  removeShapeBankEntryAt,
  shapeBankEntryFromCells,
  shapeBankTextToEntries,
  shapePreviewViewBox
} from "./shape-bank-ui.js";
import { inspectorStateForSelection } from "./inspector-state.js";
import { hasUiCandidateSource } from "./candidate-source.js";

const CELL = 46;
const SVG_PAD = 10;
const MINI_GRID_SIZE = 5;
const DEFAULT_BANK_SHAPE = "O4: 0,0 1,0 0,1 1,1";

let puzzle = createPuzzle(6, 6);
let currentTool = "cell";
let currentSolution = null;
let lastStep = null;
let selectedCell = null;
let selectedClueId = null;
let lastCandidateSummary = null;
let explanationTrace = [];
let relationFirstCell = null;
let shapeDraftCells = new Set(["0,0", "1,0", "0,1", "1,1"]);
let polyominoDraftCells = new Set(["0,0", "1,0", "0,1"]);
let traceImage = {
  href: "",
  opacity: 0.35,
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0
};

const el = {
  boardSvg: document.getElementById("boardSvg"),
  widthInput: document.getElementById("widthInput"),
  heightInput: document.getElementById("heightInput"),
  resizeButton: document.getElementById("resizeButton"),
  rulePalette: document.getElementById("rulePalette"),
  areaInput: document.getElementById("areaInput"),
  roseInput: document.getElementById("roseInput"),
  rotationsInput: document.getElementById("rotationsInput"),
  reflectionsInput: document.getElementById("reflectionsInput"),
  shapeEquivRotationsInput: document.getElementById("shapeEquivRotationsInput"),
  shapeEquivReflectionsInput: document.getElementById("shapeEquivReflectionsInput"),
  areaClueValueInput: document.getElementById("areaClueValueInput"),
  relationRuleInput: document.getElementById("relationRuleInput"),
  differenceValueInput: document.getElementById("differenceValueInput"),
  inequalityDirectionInput: document.getElementById("inequalityDirectionInput"),
  relationPickHint: document.getElementById("relationPickHint"),
  palisadePatternInput: document.getElementById("palisadePatternInput"),
  compassNInput: document.getElementById("compassNInput"),
  compassEInput: document.getElementById("compassEInput"),
  compassSInput: document.getElementById("compassSInput"),
  compassWInput: document.getElementById("compassWInput"),
  polyominoClueGrid: document.getElementById("polyominoClueGrid"),
  polyominoRotationsInput: document.getElementById("polyominoRotationsInput"),
  polyominoReflectionsInput: document.getElementById("polyominoReflectionsInput"),
  clearPolyominoButton: document.getElementById("clearPolyominoButton"),
  shapeBankInput: document.getElementById("shapeBankInput"),
  shapeNameInput: document.getElementById("shapeNameInput"),
  shapeMiniGrid: document.getElementById("shapeMiniGrid"),
  addShapeButton: document.getElementById("addShapeButton"),
  clearShapeDraftButton: document.getElementById("clearShapeDraftButton"),
  tetrominoButton: document.getElementById("tetrominoButton"),
  screenshotInput: document.getElementById("screenshotInput"),
  screenshotOpacityInput: document.getElementById("screenshotOpacityInput"),
  screenshotXInput: document.getElementById("screenshotXInput"),
  screenshotYInput: document.getElementById("screenshotYInput"),
  screenshotScaleInput: document.getElementById("screenshotScaleInput"),
  screenshotRotationInput: document.getElementById("screenshotRotationInput"),
  clearScreenshotButton: document.getElementById("clearScreenshotButton"),
  maxNodesInput: document.getElementById("maxNodesInput"),
  solveButton: document.getElementById("solveButton"),
  nextStepButton: document.getElementById("nextStepButton"),
  explainAllButton: document.getElementById("explainAllButton"),
  applyStepButton: document.getElementById("applyStepButton"),
  showCandidatesButton: document.getElementById("showCandidatesButton"),
  exportTraceButton: document.getElementById("exportTraceButton"),
  copyTraceButton: document.getElementById("copyTraceButton"),
  clearSolutionButton: document.getElementById("clearSolutionButton"),
  exportJsonButton: document.getElementById("exportJsonButton"),
  importJsonButton: document.getElementById("importJsonButton"),
  jsonBox: document.getElementById("jsonBox"),
  validationBox: document.getElementById("validationBox"),
  statusBox: document.getElementById("statusBox"),
  solutionText: document.getElementById("solutionText"),
  themeToggle: document.getElementById("themeToggle"),
  currentToolName: document.getElementById("currentToolName"),
  currentToolDescription: document.getElementById("currentToolDescription"),
  currentToolParams: document.getElementById("currentToolParams"),
  inspectorBox: document.getElementById("inspectorBox"),
  shapeBankList: document.getElementById("shapeBankList")
};

setupTheme();
bindEvents();
syncFormFromPuzzle();
render();

function bindEvents() {
  el.themeToggle.addEventListener("change", (event) => {
    if (event.target.name !== "themePreference") return;
    const preference = saveThemePreference(event.target.value);
    applyThemePreference(preference);
  });

  document.querySelectorAll(".tool").forEach((button) => {
    button.addEventListener("click", () => setCurrentTool(button.dataset.tool));
  });

  el.resizeButton.addEventListener("click", () => {
    const width = clamp(Number(el.widthInput.value) || puzzle.width, 1, 14);
    const height = clamp(Number(el.heightInput.value) || puzzle.height, 1, 14);
    puzzle = resizePuzzle(puzzle, width, height);
    clearComputed();
    syncFormFromPuzzle();
    render();
  });

  el.rulePalette.addEventListener("change", (event) => {
    const toggle = event.target.closest("[data-rule-toggle]");
    if (toggle) {
      setRuleEnabled(toggle.dataset.ruleToggle, toggle.checked);
      return;
    }
    const mingleOption = event.target.closest("[data-mingle-option]");
    if (mingleOption) updateMingleOption(mingleOption.dataset.mingleOption, mingleOption.checked);
    const rangeOption = event.target.closest("[data-range-option]");
    if (rangeOption) updateRangeOption(rangeOption.dataset.rangeOption, rangeOption.value);
  });

  el.rulePalette.addEventListener("click", (event) => {
    const toolButton = event.target.closest("[data-select-tool]");
    if (!toolButton) return;
    if (toolButton.dataset.relationRule) el.relationRuleInput.value = toolButton.dataset.relationRule;
    setCurrentTool(toolButton.dataset.selectTool);
    renderStatus(toolButton.dataset.status ?? "Tool selected.", "");
  });

  el.areaInput.addEventListener("change", updateRulesFromForm);
  el.roseInput.addEventListener("input", updateRulesFromForm);
  el.rotationsInput.addEventListener("change", updateRulesFromForm);
  el.reflectionsInput.addEventListener("change", updateRulesFromForm);
  el.shapeEquivRotationsInput.addEventListener("change", updateRulesFromForm);
  el.shapeEquivReflectionsInput.addEventListener("change", updateRulesFromForm);
  el.shapeBankInput.addEventListener("input", updateRulesFromForm);
  el.shapeBankList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-shape-index]");
    if (!deleteButton) return;
    el.shapeBankInput.value = removeShapeBankEntryAt(el.shapeBankInput.value, Number(deleteButton.dataset.deleteShapeIndex));
    updateRulesFromForm(false);
    renderStatus("Shape removed from the Shape Bank.", "good");
    render();
  });

  el.inspectorBox.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-clue-id]");
    if (deleteButton) {
      puzzle = removeClueById(deleteButton.dataset.deleteClueId);
      selectedClueId = null;
      clearComputed();
      renderStatus("Clue removed.", "good");
      render();
    }
  });

  el.inspectorBox.addEventListener("change", (event) => {
    const target = event.target;
    const clueId = target.dataset.clueId;
    if (!clueId) return;

    if (target.dataset.areaValue !== undefined) {
      const value = Math.max(1, Number(target.value) || 1);
      puzzle = updateClueById(clueId, (clue) => ({ ...clue, value, params: { ...(clue.params ?? {}), value } }));
      clearComputed();
      render();
    }
    if (target.dataset.polyOption) {
      puzzle = updateClueById(clueId, (clue) => ({
        ...clue,
        params: { ...(clue.params ?? {}), [target.dataset.polyOption]: target.checked }
      }));
      clearComputed();
      render();
    }
    if (target.dataset.differenceValue !== undefined) {
      const value = Math.max(0, Number(target.value) || 0);
      puzzle = updateClueById(clueId, (clue) => ({ ...clue, value, params: { ...(clue.params ?? {}), difference: value } }));
      clearComputed();
      render();
    }
    if (target.dataset.inequalityDirection !== undefined) {
      const direction = target.value === "gt" ? "gt" : "lt";
      puzzle = updateClueById(clueId, (clue) => ({ ...clue, params: { ...(clue.params ?? {}), direction } }));
      clearComputed();
      render();
    }
    if (target.dataset.palisadePattern !== undefined) {
      puzzle = updateClueById(clueId, (clue) => ({ ...clue, params: { ...(clue.params ?? {}), pattern: target.value } }));
      clearComputed();
      render();
    }
    if (target.dataset.compassDirection) {
      const direction = target.dataset.compassDirection;
      const value = target.value === "" ? undefined : Math.max(0, Number(target.value) || 0);
      puzzle = updateClueById(clueId, (clue) => {
        const params = { ...(clue.params ?? {}) };
        if (value === undefined) delete params[direction];
        else params[direction] = value;
        return { ...clue, params };
      });
      clearComputed();
      render();
    }
  });

  el.relationRuleInput.addEventListener("change", () => {
    relationFirstCell = null;
    updateRelationHint();
    render();
  });

  el.polyominoClueGrid.addEventListener("click", (event) => {
    toggleDraftCell(polyominoDraftCells, event.target.dataset.miniCell);
    renderPolyominoGrid();
  });
  el.shapeMiniGrid.addEventListener("click", (event) => {
    toggleDraftCell(shapeDraftCells, event.target.dataset.miniCell);
    renderShapeMiniGrid();
  });
  el.clearPolyominoButton.addEventListener("click", () => {
    polyominoDraftCells = new Set(["0,0"]);
    renderPolyominoGrid();
  });
  el.clearShapeDraftButton.addEventListener("click", () => {
    shapeDraftCells = new Set(["0,0"]);
    renderShapeMiniGrid();
  });
  el.addShapeButton.addEventListener("click", () => {
    const entry = shapeBankEntryFromCells(el.shapeNameInput.value, shapeCellsFromDraft(shapeDraftCells));
    if (entry.cells.length === 0) {
      renderStatus("Draw at least one shape-bank cell before adding a shape.", "warn");
      return;
    }
    el.shapeBankInput.value = appendShapeBankEntry(el.shapeBankInput.value, entry);
    updateRulesFromForm(false);
    el.shapeNameInput.value = `Shape${shapeBankLineCount() + 1}`;
    renderStatus("Drawn shape added to the Shape Bank.", "good");
    render();
  });

  el.screenshotInput.addEventListener("change", () => {
    const file = el.screenshotInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      traceImage.href = String(reader.result ?? "");
      renderStatus("Screenshot loaded for manual tracing.", "good");
      render();
    });
    reader.readAsDataURL(file);
  });
  for (const input of [
    el.screenshotOpacityInput,
    el.screenshotXInput,
    el.screenshotYInput,
    el.screenshotScaleInput,
    el.screenshotRotationInput
  ]) {
    input.addEventListener("input", () => {
      updateTraceFromForm();
      render();
    });
  }
  el.clearScreenshotButton.addEventListener("click", () => {
    traceImage.href = "";
    el.screenshotInput.value = "";
    renderStatus("Screenshot cleared.", "");
    render();
  });

  el.tetrominoButton.addEventListener("click", () => {
    puzzle.rules.shapeBankText = TETROMINO_PRESET;
    clearComputed();
    syncFormFromPuzzle();
    renderStatus("Tetromino shape bank loaded. Leave Precision area at 4 or set it to 0 to allow all bank shapes.", "warn");
    render();
  });

  el.boardSvg.addEventListener("click", (event) => {
    const clueId = event.target.dataset.clueId;
    const edge = event.target.dataset.edge;
    const cell = event.target.dataset.cell;
    if (clueId && currentTool === "eraseClue") {
      puzzle = removeClueById(clueId);
      selectedClueId = null;
      clearComputed();
      renderStatus("Clue removed.", "good");
      render();
      return;
    }
    if (clueId) {
      selectedClueId = clueId;
      selectedCell = cell === undefined ? selectedCell : Number(cell);
      render();
      return;
    }
    if (edge && currentTool === "edge") {
      const [a, b] = parseEdgeKey(edge);
      puzzle = cycleEdgeConstraint(puzzle, a, b);
      clearComputed();
      render();
      return;
    }
    if (cell === undefined) return;
    handleCellClick(Number(cell));
  });

  el.solveButton.addEventListener("click", () => {
    updateRulesFromForm(false);
    const result = solvePuzzle(puzzle, { limit: 2, maxNodes: maxNodes() });
    currentSolution = result.solutions[0] ?? null;
    lastStep = null;
    el.applyStepButton.disabled = true;
    showSolveResult(result);
    render();
  });

  el.nextStepButton.addEventListener("click", () => {
    updateRulesFromForm(false);
    const result = findNextLogicalStep(puzzle, { maxNodes: maxNodes() });
    lastStep = result.step ?? null;
    el.applyStepButton.disabled = !isStepApplyable(lastStep);
    showStepResult(result);
    render();
  });

  el.explainAllButton.addEventListener("click", () => {
    updateRulesFromForm(false);
    const result = explainAllLogicalSteps(puzzle, { maxNodes: maxNodes() });
    explanationTrace = result.steps;
    puzzle = result.puzzle;
    clearComputed();
    lastStep = null;
    el.solutionText.textContent = `${result.text}\n\nTrace status: ${result.status}. ${result.message}`;
    renderStatus(`Built ${result.steps.length} explanation step${result.steps.length === 1 ? "" : "s"}.`, result.steps.length ? "good" : "warn");
    render();
  });

  el.applyStepButton.addEventListener("click", () => {
    if (!lastStep) return;
    puzzle = applyLogicalStep(puzzle, lastStep);
    explanationTrace.push(lastStep);
    clearComputed();
    lastStep = null;
    el.applyStepButton.disabled = true;
    renderStatus("Applied the logical step.", "good");
    render();
  });

  el.showCandidatesButton.addEventListener("click", () => {
    updateRulesFromForm(false);
    if (selectedCell === null) {
      renderStatus("Select a cell on the board first.", "warn");
      return;
    }
    const result = describeCandidatesForCell(puzzle, selectedCell, { maxNodes: maxNodes() });
    lastCandidateSummary = { cell: selectedCell, count: result.count };
    showCandidatesForSelectedCell(result);
    renderInspector();
  });

  el.exportTraceButton.addEventListener("click", () => {
    el.jsonBox.value = JSON.stringify(explanationTrace, null, 2);
    renderStatus("Explanation trace JSON exported into the text area.", explanationTrace.length ? "good" : "warn");
  });

  el.copyTraceButton.addEventListener("click", async () => {
    const text = formatExplanationTrace(explanationTrace, puzzle.width);
    try {
      await navigator.clipboard.writeText(text);
      renderStatus("Explanation trace copied as text.", "good");
    } catch {
      el.jsonBox.value = text;
      renderStatus("Clipboard was unavailable, so the trace text was placed in the text area.", "warn");
    }
  });

  el.clearSolutionButton.addEventListener("click", () => {
    currentSolution = null;
    lastStep = null;
    el.applyStepButton.disabled = true;
    renderStatus("Overlay cleared.", "");
    render();
  });

  el.exportJsonButton.addEventListener("click", () => {
    updateRulesFromForm(false);
    el.jsonBox.value = JSON.stringify(puzzle, null, 2);
    renderStatus("Puzzle JSON exported into the text area.", "good");
    render();
  });

  el.importJsonButton.addEventListener("click", () => {
    try {
      const rawPuzzle = JSON.parse(el.jsonBox.value);
      const validation = validatePuzzle(rawPuzzle);
      puzzle = validation.puzzle;
      clearComputed();
      syncFormFromPuzzle();
      if (validation.ok) {
        renderStatus("Puzzle JSON imported.", "good");
      } else {
        renderStatus(`Puzzle JSON imported with validation issues:\n${validation.errors.join("\n")}`, "bad");
      }
      render();
    } catch (error) {
      renderStatus(`Import failed: ${error.message}`, "bad");
    }
  });
}

function setupTheme() {
  const preference = loadThemePreference();
  const input = el.themeToggle.querySelector(`input[value="${preference}"]`) ?? el.themeToggle.querySelector('input[value="system"]');
  if (input) input.checked = true;
  applyThemePreference(preference);

  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener?.("change", () => {
    const checked = el.themeToggle.querySelector('input[name="themePreference"]:checked');
    if ((checked?.value ?? "system") === "system") applyThemePreference("system");
  });
}

function handleCellClick(cell) {
  selectedCell = cell;
  selectedClueId = null;
  if (!puzzle.active[cell] && currentTool !== "cell") {
    renderStatus(`Cell ${cellLabel(cell, puzzle.width)} is inactive. Activate it before placing clues.`, "warn");
    return;
  }

  if (currentTool === "cell") {
    puzzle = toggleCellActive(puzzle, cell);
    clearComputed();
    render();
    return;
  }

  if (currentTool === "symbol") {
    puzzle = cycleCellSymbol(puzzle, cell);
    clearComputed();
    render();
    return;
  }

  if (currentTool === "areaNumber") {
    const value = Math.max(1, Number(el.areaClueValueInput.value) || 1);
    puzzle = upsertCellClue("area_number", cell, { value, params: { value } });
    clearComputed();
    renderStatus(`Area Number ${value} placed on ${cellLabel(cell, puzzle.width)}.`, "good");
    render();
    return;
  }

  if (currentTool === "polyomino") {
    const shape = shapeCellsFromDraft(polyominoDraftCells);
    if (shape.length === 0) {
      renderStatus("Draw a polyomino clue shape before placing it.", "warn");
      return;
    }
    puzzle = upsertCellClue("polyomino", cell, {
      params: {
        shape,
        allowRotations: el.polyominoRotationsInput.checked,
        allowReflections: el.polyominoReflectionsInput.checked
      }
    });
    clearComputed();
    renderStatus(`Polyomino clue placed on ${cellLabel(cell, puzzle.width)}.`, "good");
    render();
    return;
  }

  if (currentTool === "palisade") {
    const pattern = el.palisadePatternInput.value;
    puzzle = upsertCellClue("palisade", cell, { params: { pattern } });
    clearComputed();
    renderStatus(`Palisade ${pattern} clue placed on ${cellLabel(cell, puzzle.width)}.`, "good");
    render();
    return;
  }

  if (currentTool === "compass") {
    const params = compassParamsFromForm();
    puzzle = upsertCellClue("compass", cell, { params });
    clearComputed();
    renderStatus(`Compass clue placed on ${cellLabel(cell, puzzle.width)}.`, "good");
    render();
    return;
  }

  if (currentTool === "relation") {
    handleRelationCellClick(cell);
    return;
  }

  if (currentTool === "eraseClue") {
    const clue = (cellCluesByCell().get(cell) ?? []).find((item) => ["area_number", "polyomino", "palisade", "compass"].includes(item.ruleId));
    if (!clue) {
      renderStatus(`No removable clue on ${cellLabel(cell, puzzle.width)}.`, "warn");
      return;
    }
    puzzle = removeClueById(clue.id);
    clearComputed();
    renderStatus("Clue removed.", "good");
    render();
  }
}

function handleRelationCellClick(cell) {
  if (relationFirstCell === null) {
    relationFirstCell = cell;
    updateRelationHint();
    render();
    return;
  }
  if (relationFirstCell === cell) {
    relationFirstCell = null;
    updateRelationHint();
    render();
    return;
  }

  const ruleId = el.relationRuleInput.value;
  if (!areCellsOrthogonallyAdjacent(relationFirstCell, cell)) {
    renderStatus(
      `${ruleLabel(ruleId)} relation clues are edge-adjacent. Click an orthogonally adjacent cell sharing an edge with ${cellLabel(relationFirstCell, puzzle.width)}.`,
      "warn"
    );
    updateRelationHint();
    render();
    return;
  }
  puzzle = upsertRelationClue(ruleId, relationFirstCell, cell);
  clearComputed();
  renderStatus(`${ruleLabel(ruleId)} relation clue placed.`, "good");
  relationFirstCell = null;
  render();
}

function updateRulesFromForm(doRender = true) {
  puzzle.rules.area = Math.max(0, Number(el.areaInput.value) || 0);
  puzzle.rules.roseLabels = String(el.roseInput.value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  puzzle.rules.allowRotations = el.rotationsInput.checked;
  puzzle.rules.allowReflections = el.reflectionsInput.checked;
  puzzle.rules.shapeEquivalenceAllowRotations = el.shapeEquivRotationsInput.checked;
  puzzle.rules.shapeEquivalenceAllowReflections = el.shapeEquivReflectionsInput.checked;
  puzzle.rules.shapeBankText = el.shapeBankInput.value;
  puzzle = normalizePuzzle(puzzle);
  clearComputed();
  if (doRender) render();
}

function syncFormFromPuzzle() {
  el.widthInput.value = String(puzzle.width);
  el.heightInput.value = String(puzzle.height);
  el.areaInput.value = String(puzzle.rules.area ?? 0);
  el.roseInput.value = puzzle.rules.roseLabels ?? "";
  el.rotationsInput.checked = puzzle.rules.allowRotations !== false;
  el.reflectionsInput.checked = puzzle.rules.allowReflections !== false;
  el.shapeEquivRotationsInput.checked = puzzle.rules.shapeEquivalenceAllowRotations !== false;
  el.shapeEquivReflectionsInput.checked = puzzle.rules.shapeEquivalenceAllowReflections !== false;
  el.shapeBankInput.value = puzzle.rules.shapeBankText ?? "";
  updateTraceControls();
  updateRelationHint();
}

function setCurrentTool(tool) {
  currentTool = tool;
  if (tool !== "relation") relationFirstCell = null;
  document.querySelectorAll(".tool").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  updateRelationHint();
  render();
}

function setRuleEnabled(id, enabled) {
  const rule = RULE_REGISTRY[id];
  if (!rule?.implemented) return;

  if (enabled) {
    enableRule(id);
  } else {
    disableRule(id);
  }

  puzzle = normalizePuzzle(puzzle);
  clearComputed();
  syncFormFromPuzzle();
  render();
}

function enableRule(id) {
  if (id === "precision") {
    puzzle.rules.area = Math.max(1, Number(el.areaInput.value) || Number(puzzle.rules.area) || 4);
    return;
  }
  if (id === "rose_window") {
    puzzle.rules.roseLabels = puzzle.rules.roseLabels || el.roseInput.value || "A";
    return;
  }
  if (id === "shape_bank") {
    puzzle.rules.shapeBankText = puzzle.rules.shapeBankText || el.shapeBankInput.value || DEFAULT_BANK_SHAPE;
    return;
  }
  if (id === "mingle_shape") {
    puzzle.rules.mingle_shape = puzzle.rules.mingle_shape ?? {
      allowRotations: puzzle.rules.shapeEquivalenceAllowRotations !== false,
      allowReflections: puzzle.rules.shapeEquivalenceAllowReflections !== false
    };
    return;
  }
  if (id === "area_number") {
    puzzle.rules.area_number = puzzle.rules.area_number ?? {};
    setCurrentTool("areaNumber");
    return;
  }
  if (id === "polyomino") {
    puzzle.rules.polyomino = puzzle.rules.polyomino ?? {};
    setCurrentTool("polyomino");
    return;
  }
  if (id === "palisade") {
    puzzle.rules.palisade = puzzle.rules.palisade ?? {};
    setCurrentTool("palisade");
    return;
  }
  if (id === "compass") {
    puzzle.rules.compass = puzzle.rules.compass ?? {};
    setCurrentTool("compass");
    return;
  }
  if (id === "watchtower") {
    puzzle.rules.watchtower = puzzle.rules.watchtower ?? {};
    return;
  }
  if (id === "gemini" || id === "delta" || id === "difference") {
    puzzle.rules[id] = puzzle.rules[id] ?? {};
    el.relationRuleInput.value = id;
    setCurrentTool("relation");
    return;
  }
  if (id === "inequality") {
    puzzle.rules.inequality = puzzle.rules.inequality ?? {};
    el.relationRuleInput.value = "inequality";
    setCurrentTool("relation");
    return;
  }
  if (id === "range") {
    puzzle.rules.range = puzzle.rules.range ?? { min: 1, max: Math.max(1, Number(puzzle.rules.area) || 4) };
    return;
  }
  if (["match", "mismatch", "solitude", "size_separation", "boxy", "non_boxy", "bricky", "loopy"].includes(id)) {
    puzzle.rules[id] = puzzle.rules[id] ?? {};
  }
}

function disableRule(id) {
  if (id === "precision") {
    puzzle.rules.area = 0;
    return;
  }
  if (id === "rose_window") {
    puzzle.rules.roseLabels = "";
    return;
  }
  if (id === "shape_bank") {
    puzzle.rules.shapeBankText = "";
    return;
  }

  const rules = { ...puzzle.rules };
  delete rules[id];
  const clues = (puzzle.clues ?? []).filter((clue) => clue.ruleId !== id);
  const edgeConstraints = clearEdgeRelationsForRule(id, puzzle.edgeConstraints ?? puzzle.edges ?? {});
  puzzle = normalizePuzzle({ ...puzzle, rules, clues, edgeConstraints, edges: edgeConstraints });
}

function updateMingleOption(option, checked) {
  const config = { ...(puzzle.rules.mingle_shape ?? {}) };
  config[option] = checked;
  puzzle.rules.mingle_shape = config;
  puzzle = normalizePuzzle(puzzle);
  clearComputed();
  render();
}

function updateRangeOption(option, value) {
  const config = { ...(puzzle.rules.range ?? {}) };
  const number = Number(value);
  if (value === "") delete config[option];
  else config[option] = Number.isInteger(number) ? number : value;
  puzzle.rules.range = config;
  puzzle = normalizePuzzle(puzzle);
  clearComputed();
  render();
}

function clearComputed() {
  currentSolution = null;
  lastStep = null;
  lastCandidateSummary = null;
  el.applyStepButton.disabled = true;
}

function render() {
  renderBoard();
  renderToolBanner();
  renderRulePalette();
  renderShapeBankList();
  renderShapeMiniGrid();
  renderPolyominoGrid();
  renderValidation();
  renderInspector();
  updateRelationHint();
}

function renderToolBanner() {
  const info = toolInfo(currentTool);
  el.currentToolName.textContent = info.name;
  el.currentToolDescription.textContent = info.description;
  el.currentToolParams.textContent = info.params;
}

function toolInfo(tool) {
  const common = {
    cell: {
      name: "Active / hole cells",
      description: "Click a cell to toggle whether it belongs to the puzzle mask.",
      params: "Click the same cell again to undo the toggle."
    },
    symbol: {
      name: "Cycle symbols",
      description: "Click an active cell to cycle symbols used by Rose Windows.",
      params: `Current cycle is blank, A, B, C, D. Click until the symbol is removed.`
    },
    edge: {
      name: "Cycle borders",
      description: "Click a border between active cells to cycle cut, join, Gemini, and Delta edge marks.",
      params: "Edge marks are removed by cycling back to unknown."
    },
    relation: {
      name: "Relation pair clue",
      description: "Click two edge-adjacent active cells to add a relation clue between their eventual regions.",
      params: `${ruleLabel(el.relationRuleInput.value)}${relationToolParameterText()}. Delete relation clues with Erase clue or the inspector.`
    },
    areaNumber: {
      name: "Area number clue",
      description: "Click an active cell to place or replace its Area Number clue.",
      params: `Value ${Math.max(1, Number(el.areaClueValueInput.value) || 1)}. Edit or remove selected clues in the inspector.`
    },
    polyomino: {
      name: "Polyomino clue",
      description: "Click an active cell to place the drawn polyomino clue.",
      params: `${polyominoDraftCells.size} drawn cells, rotations ${el.polyominoRotationsInput.checked ? "on" : "off"}, reflections ${el.polyominoReflectionsInput.checked ? "on" : "off"}.`
    },
    palisade: {
      name: "Palisade clue",
      description: "Click an active cell to place a side-border pattern clue.",
      params: `Pattern ${el.palisadePatternInput.value}. Click again with another pattern to replace it.`
    },
    compass: {
      name: "Compass clue",
      description: "Click an active cell to place directional own-region count restrictions.",
      params: compassToolParameterText()
    },
    eraseClue: {
      name: "Erase clue",
      description: "Click an Area Number, Polyomino, or relation clue to remove it.",
      params: "Cut and join edge constraints stay controlled by the Cycle borders tool."
    }
  };
  return common[tool] ?? common.cell;
}

function relationToolParameterText() {
  if (el.relationRuleInput.value === "difference") return `, value ${Number(el.differenceValueInput.value) || 0}`;
  if (el.relationRuleInput.value === "inequality") {
    return el.inequalityDirectionInput.value === "gt" ? ", first region > second region" : ", first region < second region";
  }
  return "";
}

function renderRulePalette() {
  const seen = new Set();
  const groups = RULE_GROUPS.map((group) => {
    const cards = group.ids
      .filter((id) => RULE_REGISTRY[id])
      .map((id) => {
        seen.add(id);
        return ruleCardHtml(RULE_REGISTRY[id]);
      })
      .join("");
    return `<section class="rule-group">
      <h3>${escapeHtml(group.title)}</h3>
      <div class="rule-group-grid">${cards}</div>
    </section>`;
  });
  const ungrouped = Object.values(RULE_REGISTRY)
    .filter((rule) => !seen.has(rule.id))
    .map(ruleCardHtml)
    .join("");
  el.rulePalette.innerHTML = `${groups.join("")}${ungrouped ? `<section class="rule-group"><h3>Other</h3><div class="rule-group-grid">${ungrouped}</div></section>` : ""}`;
}

function ruleCardHtml(rule) {
  const active = isRuleActive(rule.id);
  const disabled = !rule.implemented;
  const badge = disabled ? rule.implementationStatus : active ? "active" : "available";
  const checkbox = `<input type="checkbox" data-rule-toggle="${rule.id}" ${checkedAttr(active)} ${disabledAttr(disabled)} />`;
  return `<section class="rule-card ${disabled ? "disabled" : ""}" data-rule-card="${escapeHtml(rule.id)}" aria-disabled="${disabled}" title="${escapeHtml(ruleHelp(rule.id))}">
    <div class="rule-card-head">
      <label>${checkbox}<span>${escapeHtml(rule.label)}</span></label>
      <span class="rule-badge">${escapeHtml(badge)}</span>
    </div>
    <p>${escapeHtml(ruleHelp(rule.id))}</p>
    ${ruleControlsHtml(rule.id, active, disabled)}
  </section>`;
}

function ruleControlsHtml(id, active, disabled) {
  if (disabled) {
    const reason =
      RULE_REGISTRY[id].implementationStatus === "blocked"
        ? "Placeholder only. Solver rejects this rule because semantics are unverified."
        : "Known and ready, but not implemented in the solver yet.";
    return `<div class="rule-controls"><p>${escapeHtml(reason)}</p></div>`;
  }
  if (id === "precision") return `<div class="rule-controls"><p>Edit with the Precision area field.</p></div>`;
  if (id === "rose_window") return `<div class="rule-controls"><p>Edit required symbols with the Rose labels field.</p></div>`;
  if (id === "shape_bank") return `<div class="rule-controls"><p>Use the mini-grid or raw Shape Bank text.</p></div>`;
  if (id === "range" && active) {
    const config = puzzle.rules.range ?? {};
    return `<div class="rule-controls">
      <label>Min area <input type="number" min="1" max="99" value="${escapeHtml(config.min ?? "")}" data-range-option="min" /></label>
      <label>Max area <input type="number" min="1" max="99" value="${escapeHtml(config.max ?? "")}" data-range-option="max" /></label>
    </div>`;
  }
  if (id === "area_number") {
    return `<div class="rule-controls"><button type="button" data-select-tool="areaNumber" data-status="Area Number placement tool selected.">Place area clues</button></div>`;
  }
  if (id === "polyomino") {
    return `<div class="rule-controls"><button type="button" data-select-tool="polyomino" data-status="Polyomino placement tool selected.">Place polyomino clues</button></div>`;
  }
  if (id === "palisade") {
    return `<div class="rule-controls"><button type="button" data-select-tool="palisade" data-status="Palisade placement tool selected.">Place Palisade clues</button></div>`;
  }
  if (id === "compass") {
    return `<div class="rule-controls"><button type="button" data-select-tool="compass" data-status="Compass placement tool selected.">Place Compass clues</button></div>`;
  }
  if (id === "watchtower" && active) {
    return `<div class="rule-controls"><p>Watchtower vertex clues are supported through JSON import/export.</p></div>`;
  }
  if ((id === "bricky" || id === "loopy") && active) {
    return `<div class="rule-controls"><p>Global boundary-vertex rule. No placement tool needed.</p></div>`;
  }
  if (id === "gemini" || id === "delta" || id === "difference" || id === "inequality") {
    return `<div class="rule-controls"><button type="button" data-select-tool="relation" data-relation-rule="${id}" data-status="${escapeHtml(ruleLabel(id))} relation tool selected.">Place relation clue</button></div>`;
  }
  if (id === "mingle_shape" && active) {
    const config = puzzle.rules.mingle_shape ?? {};
    const rotations = config.allowRotations ?? puzzle.rules.shapeEquivalenceAllowRotations ?? true;
    const reflections = config.allowReflections ?? puzzle.rules.shapeEquivalenceAllowReflections ?? true;
    return `<div class="rule-controls">
      <label><input type="checkbox" data-mingle-option="allowRotations" ${checkedAttr(rotations !== false)} /> Rotation equivalence</label>
      <label><input type="checkbox" data-mingle-option="allowReflections" ${checkedAttr(reflections !== false)} /> Reflection equivalence</label>
    </div>`;
  }
  if (["match", "mismatch", "solitude", "size_separation", "boxy", "non_boxy"].includes(id) && active) {
    return `<div class="rule-controls"><p>This global rule is active. Use JSON export/import for advanced parameters.</p></div>`;
  }
  return "";
}

function renderShapeBankList() {
  const { entries, errors } = shapeBankTextToEntries(el.shapeBankInput.value);
  if (entries.length === 0) {
    const errorText = errors.length ? `<p class="shape-errors">${errors.map(escapeHtml).join("<br />")}</p>` : "";
    el.shapeBankList.innerHTML = `<div class="empty-state">No shapes in the bank yet. Draw one below or paste raw text.</div>${errorText}`;
    return;
  }
  const cards = entries
    .map(
      (entry, index) => `<article class="shape-card">
        <div class="shape-card-preview">${shapePreviewSvg(entry.cells)}</div>
        <div class="shape-card-body">
          <strong>${escapeHtml(entry.name || `Shape${index + 1}`)}</strong>
          <span>${entry.cells.length} cell${entry.cells.length === 1 ? "" : "s"}</span>
        </div>
        <button type="button" class="icon-button" data-delete-shape-index="${index}" aria-label="Delete ${escapeHtml(entry.name)}">Delete</button>
      </article>`
    )
    .join("");
  const errorText = errors.length ? `<p class="shape-errors">${errors.map(escapeHtml).join("<br />")}</p>` : "";
  el.shapeBankList.innerHTML = `${cards}${errorText}`;
}

function shapePreviewSvg(cells) {
  const preview = shapePreviewViewBox(cells);
  const size = 18;
  const width = preview.width * size;
  const height = preview.height * size;
  const rects = preview.cells
    .map(([x, y]) => `<rect x="${x * size + 1}" y="${y * size + 1}" width="${size - 2}" height="${size - 2}" rx="3"></rect>`)
    .join("");
  return `<svg class="shape-preview" viewBox="0 0 ${width} ${height}" aria-hidden="true">${rects}</svg>`;
}

function renderShapeMiniGrid() {
  renderMiniGrid(el.shapeMiniGrid, shapeDraftCells);
}

function renderPolyominoGrid() {
  renderMiniGrid(el.polyominoClueGrid, polyominoDraftCells);
}

function renderMiniGrid(container, selectedCells) {
  let html = "";
  for (let y = 0; y < MINI_GRID_SIZE; y += 1) {
    for (let x = 0; x < MINI_GRID_SIZE; x += 1) {
      const key = `${x},${y}`;
      const classes = ["mini-cell", selectedCells.has(key) ? "active" : "", key === "0,0" ? "origin" : ""].join(" ");
      html += `<button type="button" class="${classes}" data-mini-cell="${key}" title="${key}"></button>`;
    }
  }
  container.innerHTML = html;
}

function renderValidation() {
  const validation = validatePuzzle(puzzle);
  const groups = {
    "Board issues": [],
    "Rule issues": [],
    "Clue issues": [],
    "Shape-bank issues": [],
    "Solver / candidate-source issues": []
  };
  const validationErrors = validation.errors.filter((error) => {
    return (
      error !== 'Rule "area_number" requires at least one area number clue.' &&
      error !== 'Rule "polyomino" requires at least one polyomino clue.'
    );
  });
  if (puzzle.activeCells.length === 0) groups["Board issues"].push("Add at least one active cell before solving.");
  if (Number(puzzle.rules.area) <= 0 && !hasCandidateSource()) {
    groups["Rule issues"].push("Precision needs a positive area.");
  } else if (!hasCandidateSource()) {
    groups["Solver / candidate-source issues"].push(
      "Add Precision area, Shape Bank shapes, Area Number clues, Polyomino clues, or Range bounds so the solver can generate candidates."
    );
  }
  if (puzzle.rules.shape_bank && !puzzle.shapeBank?.text?.trim() && (puzzle.shapeBank?.entries ?? []).length === 0) {
    groups["Shape-bank issues"].push("Draw or paste at least one shape.");
  }
  if (puzzle.rules.area_number && !hasRuleClue("area_number")) {
    groups["Clue issues"].push("Place at least one Area Number clue.");
  }
  if (puzzle.rules.polyomino && !hasRuleClue("polyomino")) {
    groups["Clue issues"].push("Place at least one Polyomino clue.");
  }
  for (const error of validationErrors) {
    groups[categorizeValidationMessage(error)].push(actionableValidationMessage(error));
  }

  const messages = Object.entries(groups).filter(([, items]) => items.length > 0);
  if (messages.length === 0) {
    el.validationBox.textContent = "No validation issues.";
    el.validationBox.className = "validation-box good";
    return;
  }

  el.validationBox.innerHTML = messages
    .map(([title, items]) => `<section class="validation-group"><h3>${escapeHtml(title)}</h3><ul>${items.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul></section>`)
    .join("");
  el.validationBox.className = `validation-box ${validationErrors.length ? "bad" : "warn"}`;
}

function categorizeValidationMessage(message) {
  if (/shape bank|shape-bank|shape_bank|shape/i.test(message)) return "Shape-bank issues";
  if (/clue|relation|cell clue|polyomino|area number/i.test(message)) return "Clue issues";
  if (/candidate|source|solver/i.test(message)) return "Solver / candidate-source issues";
  if (/active|cell|width|height|board/i.test(message)) return "Board issues";
  return "Rule issues";
}

function actionableValidationMessage(message) {
  if (/Unknown rule id/i.test(message)) return `${message} Remove it from JSON or add a supported registry entry.`;
  if (/not implemented/i.test(message)) return `${message} Disable this rule before solving.`;
  return message;
}

function renderInspector() {
  const state = inspectorStateForSelection(puzzle, {
    selectedClueId,
    selectedCell,
    candidateSummary: lastCandidateSummary
  });

  if (!state) {
    const info = toolInfo(currentTool);
    el.inspectorBox.innerHTML = `<div class="empty-state">
      <strong>${escapeHtml(info.name)}</strong>
      <p>${escapeHtml(info.description)}</p>
      <p>${escapeHtml(info.params)}</p>
    </div>`;
    return;
  }

  if (state.type === "cell") {
    el.inspectorBox.innerHTML = cellInspectorHtml(state);
    return;
  }
  if (state.type === "relation_clue") {
    el.inspectorBox.innerHTML = relationInspectorHtml(state);
    return;
  }
  if (state.type === "cell_clue") {
    el.inspectorBox.innerHTML = cellClueInspectorHtml(state.clue, state.label);
  }
}

function cellInspectorHtml(state) {
  const candidateText =
    state.candidateCount === null ? "Use Show candidates for selected cell to calculate this." : `${state.candidateCount} candidate${state.candidateCount === 1 ? "" : "s"}`;
  const area = state.areaNumberClue ? cellClueInspectorHtml(state.areaNumberClue, state.label) : `<p class="muted">No Area Number clue on this cell.</p>`;
  const poly = state.polyominoClue ? cellClueInspectorHtml(state.polyominoClue, state.label) : `<p class="muted">No Polyomino clue on this cell.</p>`;
  return `<div class="inspector-stack">
    <section class="inspector-card">
      <h3>${escapeHtml(state.label)}</h3>
      <dl class="compact-list">
        <dt>Cell state</dt><dd>${state.active ? "Active" : "Hole"}</dd>
        <dt>Candidate count</dt><dd>${escapeHtml(candidateText)}</dd>
      </dl>
    </section>
    <section class="inspector-card">
      <h3>Area Number</h3>
      ${area}
    </section>
    <section class="inspector-card">
      <h3>Polyomino</h3>
      ${poly}
    </section>
    <section class="inspector-card">
      <h3>Other cell clues</h3>
      ${state.otherCellClues.length ? state.otherCellClues.map((clue) => cellClueInspectorHtml(clue, state.label)).join("") : `<p class="muted">No Palisade or Compass clue on this cell.</p>`}
    </section>
  </div>`;
}

function cellClueInspectorHtml(clue, label) {
  if (clue.ruleId === "area_number") {
    const value = Number(clue.value ?? clue.params?.value ?? clue.params?.area ?? 1);
    return `<div class="inspector-stack">
      <label class="stacked">Value
        <input type="number" min="1" max="20" value="${value}" data-clue-id="${escapeHtml(clue.id)}" data-area-value />
      </label>
      <button type="button" data-delete-clue-id="${escapeHtml(clue.id)}">Remove clue</button>
    </div>`;
  }
  if (clue.ruleId === "polyomino") {
    const cells = clue.params?.shape ?? [];
    const rotations = clue.params?.allowRotations !== false;
    const reflections = clue.params?.allowReflections !== false;
    return `<div class="inspector-stack">
      <p>${escapeHtml(label)} polyomino clue, ${cells.length} cell${cells.length === 1 ? "" : "s"}.</p>
      <label class="checkbox-row single"><input type="checkbox" ${checkedAttr(rotations)} data-clue-id="${escapeHtml(clue.id)}" data-poly-option="allowRotations" /> Allow rotations</label>
      <label class="checkbox-row single"><input type="checkbox" ${checkedAttr(reflections)} data-clue-id="${escapeHtml(clue.id)}" data-poly-option="allowReflections" /> Allow reflections</label>
      <button type="button" data-delete-clue-id="${escapeHtml(clue.id)}">Remove clue</button>
    </div>`;
  }
  if (clue.ruleId === "palisade") {
    const pattern = clue.params?.pattern ?? "empty";
    const options = ["empty", "one_sided", "corner", "opposite", "three_sided", "full"]
      .map((value) => `<option value="${value}" ${value === pattern ? "selected" : ""}>${value}</option>`)
      .join("");
    return `<div class="inspector-stack">
      <label class="stacked">Pattern
        <select data-clue-id="${escapeHtml(clue.id)}" data-palisade-pattern>${options}</select>
      </label>
      <button type="button" data-delete-clue-id="${escapeHtml(clue.id)}">Remove clue</button>
    </div>`;
  }
  if (clue.ruleId === "compass") {
    const params = clue.params ?? {};
    return `<div class="inspector-stack">
      ${["N", "E", "S", "W"].map((direction) => `<label class="stacked">${direction}
        <input type="number" min="0" max="20" value="${escapeHtml(params[direction] ?? "")}" data-clue-id="${escapeHtml(clue.id)}" data-compass-direction="${direction}" />
      </label>`).join("")}
      <button type="button" data-delete-clue-id="${escapeHtml(clue.id)}">Remove clue</button>
    </div>`;
  }
  return `<p>${escapeHtml(ruleLabel(clue.ruleId))} clue.</p>
    <button type="button" data-delete-clue-id="${escapeHtml(clue.id)}">Remove clue</button>`;
}

function relationInspectorHtml(state) {
  const differenceInput =
    state.ruleId === "difference"
      ? `<label class="stacked">Difference value
          <input type="number" min="0" max="20" value="${state.differenceValue ?? 0}" data-clue-id="${escapeHtml(state.clue.id)}" data-difference-value />
        </label>`
      : "";
  const inequalityInput =
    state.ruleId === "inequality"
      ? `<label class="stacked">Direction
          <select data-clue-id="${escapeHtml(state.clue.id)}" data-inequality-direction>
            <option value="lt" ${state.clue.params?.direction === "gt" ? "" : "selected"}>First region &lt; second region</option>
            <option value="gt" ${state.clue.params?.direction === "gt" ? "selected" : ""}>First region &gt; second region</option>
          </select>
        </label>`
      : "";
  return `<div class="inspector-stack">
    <section class="inspector-card">
      <h3>${escapeHtml(ruleLabel(state.ruleId))}</h3>
      <dl class="compact-list">
        <dt>Referenced cells</dt><dd>${escapeHtml(state.labels.join(" and ") || "Unknown")}</dd>
        <dt>Rule type</dt><dd>${escapeHtml(state.ruleId)}</dd>
      </dl>
      ${differenceInput}
      ${inequalityInput}
      <button type="button" data-delete-clue-id="${escapeHtml(state.clue.id)}">Delete relation clue</button>
    </section>
  </div>`;
}

function renderBoard() {
  const widthPx = puzzle.width * CELL + SVG_PAD * 2;
  const heightPx = puzzle.height * CELL + SVG_PAD * 2;
  const regionByCell = currentSolution?.regionByCell ?? {};
  const stepEdgeKey = lastStep?.edge ? edgeKey(lastStep.edge[0], lastStep.edge[1]) : null;
  const cellClues = cellCluesByCell();

  let html = "";
  html += `<rect x="0" y="0" width="${widthPx}" height="${heightPx}" rx="12" fill="var(--board-bg)"></rect>`;
  html += traceImageSvg(widthPx, heightPx);

  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      const cell = idx(x, y, puzzle.width);
      const active = puzzle.active[cell];
      const rx = SVG_PAD + x * CELL;
      const ry = SVG_PAD + y * CELL;
      const regionId = regionByCell[cell];
      const fill = active && regionId ? regionColor(regionId) : "";
      const classes = [
        "cell",
        traceImage.href ? "trace-cell" : "",
        active ? "active-cell" : "inactive-cell",
        selectedCell === cell ? "selected-cell" : "",
        relationFirstCell === cell ? "relation-pick-cell" : "",
        regionId ? "solution-cell" : ""
      ].join(" ");
      const label = cellLabel(cell, puzzle.width);
      html += `<rect class="${classes}" data-cell="${cell}" x="${rx}" y="${ry}" width="${CELL}" height="${CELL}" rx="4" ${fill ? `style="fill:${fill}"` : ""}><title>${label}</title></rect>`;
      if (active && puzzle.symbols[cell]) {
        html += `<text class="cell-symbol" x="${rx + CELL / 2}" y="${ry + CELL / 2}">${escapeHtml(puzzle.symbols[cell])}</text>`;
      }
      html += cellClueSvg(cellClues.get(cell) ?? [], rx, ry);
      if (active && regionId) {
        html += `<text class="region-label" x="${rx + CELL - 5}" y="${ry + CELL - 5}">${regionId}</text>`;
      }
    }
  }

  html += relationCluesSvg();

  for (const [a, b] of activeAdjacencyEdges(puzzle)) {
    const key = edgeKey(a, b);
    const constraint = puzzle.edges[key] ?? { state: null, relation: null };
    const isStep = key === stepEdgeKey;
    const line = edgeLine(a, b);
    const visualType = constraint.relation ?? constraint.state;
    if (visualType || isStep) {
      const cssType = isStep && lastStep ? lastStep.state : visualType;
      html += `<line class="edge-visible edge-${cssType}" x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}"></line>`;
      if (constraint.relation) {
        const text = constraint.relation === "sameShape" ? "G" : "D";
        html += `<text class="edge-label" x="${line.mx}" y="${line.my}">${text}</text>`;
      }
      if (isStep && lastStep?.state) {
        const text = lastStep.state === "join" ? "J" : "C";
        html += `<text class="edge-label" x="${line.mx}" y="${line.my}">${text}</text>`;
      }
    }
    html += `<line class="edge-hit" data-edge="${key}" x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}"><title>Border ${cellLabel(a, puzzle.width)}-${cellLabel(b, puzzle.width)}</title></line>`;
  }

  el.boardSvg.setAttribute("viewBox", `0 0 ${widthPx} ${heightPx}`);
  el.boardSvg.setAttribute("width", String(widthPx));
  el.boardSvg.setAttribute("height", String(heightPx));
  el.boardSvg.innerHTML = html;
}

function traceImageSvg(widthPx, heightPx) {
  if (!traceImage.href) return "";
  const boardWidth = puzzle.width * CELL;
  const boardHeight = puzzle.height * CELL;
  const cx = SVG_PAD + boardWidth / 2;
  const cy = SVG_PAD + boardHeight / 2;
  const transform = `translate(${traceImage.x} ${traceImage.y}) translate(${cx} ${cy}) rotate(${traceImage.rotation}) scale(${traceImage.scale}) translate(${-cx} ${-cy})`;
  return `<g class="trace-image" opacity="${traceImage.opacity}" transform="${transform}">
    <image href="${escapeHtml(traceImage.href)}" x="${SVG_PAD}" y="${SVG_PAD}" width="${boardWidth}" height="${boardHeight}" preserveAspectRatio="none"></image>
  </g>`;
}

function cellClueSvg(clues, rx, ry) {
  let html = "";
  const areaClue = clues.find((clue) => clue.ruleId === "area_number");
  if (areaClue) {
    const value = areaClue.value ?? areaClue.params?.value ?? areaClue.params?.area;
    html += `<circle class="cell-clue-bg" data-clue-id="${escapeHtml(areaClue.id)}" data-cell="${areaClue.location.cell}" cx="${rx + 12}" cy="${ry + 12}" r="10"><title>Area Number clue ${escapeHtml(value)}</title></circle>`;
    html += `<text class="cell-clue" data-clue-id="${escapeHtml(areaClue.id)}" data-cell="${areaClue.location.cell}" x="${rx + 12}" y="${ry + 12}">${escapeHtml(value)}</text>`;
  }
  const polyClue = clues.find((clue) => clue.ruleId === "polyomino");
  if (polyClue) {
    html += `<circle class="cell-clue-bg poly-clue-bg" data-clue-id="${escapeHtml(polyClue.id)}" data-cell="${polyClue.location.cell}" cx="${rx + CELL - 12}" cy="${ry + 12}" r="10"><title>Polyomino clue</title></circle>`;
    html += `<text class="cell-clue" data-clue-id="${escapeHtml(polyClue.id)}" data-cell="${polyClue.location.cell}" x="${rx + CELL - 12}" y="${ry + 12}">P</text>`;
  }
  const palisadeClue = clues.find((clue) => clue.ruleId === "palisade");
  if (palisadeClue) {
    html += `<circle class="cell-clue-bg" data-clue-id="${escapeHtml(palisadeClue.id)}" data-cell="${palisadeClue.location.cell}" cx="${rx + 12}" cy="${ry + CELL - 12}" r="10"><title>Palisade clue</title></circle>`;
    html += `<text class="cell-clue" data-clue-id="${escapeHtml(palisadeClue.id)}" data-cell="${palisadeClue.location.cell}" x="${rx + 12}" y="${ry + CELL - 12}">S</text>`;
  }
  const compassClue = clues.find((clue) => clue.ruleId === "compass");
  if (compassClue) {
    html += `<circle class="cell-clue-bg" data-clue-id="${escapeHtml(compassClue.id)}" data-cell="${compassClue.location.cell}" cx="${rx + CELL - 12}" cy="${ry + CELL - 12}" r="10"><title>Compass clue</title></circle>`;
    html += `<text class="cell-clue" data-clue-id="${escapeHtml(compassClue.id)}" data-cell="${compassClue.location.cell}" x="${rx + CELL - 12}" y="${ry + CELL - 12}">C</text>`;
  }
  return html;
}

function relationCluesSvg() {
  let html = "";
  for (const clue of puzzle.clues ?? []) {
    if (clue.type !== "relation" || clue.source === "edgeConstraints") continue;
    const cells = relationCellsFromClue(clue);
    if (!cells) continue;
    const left = cellCenter(cells[0]);
    const right = cellCenter(cells[1]);
    const mx = (left.x + right.x) / 2;
    const my = (left.y + right.y) / 2;
    html += `<line class="relation-clue-line" data-clue-id="${escapeHtml(clue.id)}" x1="${left.x}" y1="${left.y}" x2="${right.x}" y2="${right.y}"><title>${escapeHtml(ruleLabel(clue.ruleId))} relation clue</title></line>`;
    html += `<text class="relation-clue-label" data-clue-id="${escapeHtml(clue.id)}" x="${mx}" y="${my}">${escapeHtml(relationClueLabel(clue))}</text>`;
  }
  return html;
}

function edgeLine(a, b) {
  const ca = xy(a, puzzle.width);
  const cb = xy(b, puzzle.width);
  if (ca.y === cb.y) {
    const x = SVG_PAD + Math.max(ca.x, cb.x) * CELL;
    const y = SVG_PAD + ca.y * CELL;
    return { x1: x, y1: y + 5, x2: x, y2: y + CELL - 5, mx: x, my: y + CELL / 2 };
  }
  const x = SVG_PAD + ca.x * CELL;
  const y = SVG_PAD + Math.max(ca.y, cb.y) * CELL;
  return { x1: x + 5, y1: y, x2: x + CELL - 5, y2: y, mx: x + CELL / 2, my: y };
}

function upsertCellClue(ruleId, cell, data) {
  const rules = { ...puzzle.rules, [ruleId]: puzzle.rules[ruleId] ?? {} };
  const clues = (puzzle.clues ?? []).filter((clue) => !(clue.ruleId === ruleId && clue.location?.cell === cell));
  clues.push({
    id: `${ruleId}:${cell}`,
    type: "cell",
    ruleId,
    location: { type: "cell", cell },
    ...data
  });
  return normalizePuzzle({ ...puzzle, rules, clues });
}

function upsertRelationClue(ruleId, firstCell, secondCell) {
  const key = edgeKey(firstCell, secondCell);
  const clue = {
    id: `relation:${ruleId}:${key}`,
    type: "relation",
    ruleId,
    location: { type: "edge", cells: [firstCell, secondCell] },
    regionRefs: [{ cell: firstCell }, { cell: secondCell }]
  };
  if (ruleId === "difference") {
    const value = Math.max(0, Number(el.differenceValueInput.value) || 0);
    clue.value = value;
    clue.params = { difference: value };
  }
  if (ruleId === "inequality") {
    clue.params = { direction: el.inequalityDirectionInput.value === "gt" ? "gt" : "lt" };
  }
  const rules = { ...puzzle.rules, [ruleId]: puzzle.rules[ruleId] ?? {} };
  const clues = (puzzle.clues ?? []).filter((existing) => existing.id !== clue.id);
  clues.push(clue);
  return normalizePuzzle({ ...puzzle, rules, clues });
}

function removeClueById(clueId) {
  const clues = (puzzle.clues ?? []).filter((clue) => clue.id !== clueId);
  return normalizePuzzle({ ...puzzle, clues });
}

function updateClueById(clueId, updater) {
  const clues = (puzzle.clues ?? []).map((clue) => (clue.id === clueId ? updater(clue) : clue));
  return normalizePuzzle({ ...puzzle, clues });
}

function cellCluesByCell() {
  const byCell = new Map();
  for (const clue of puzzle.clues ?? []) {
    if (clue.type !== "cell" || clue.location?.cell === undefined) continue;
    const cell = Number(clue.location.cell);
    const list = byCell.get(cell) ?? [];
    list.push(clue);
    byCell.set(cell, list);
  }
  return byCell;
}

function relationCellsFromClue(clue) {
  const refs = clue.regionRefs ?? clue.regions;
  if (Array.isArray(refs) && refs.length === 2) {
    const cells = refs.map((ref) => Number(typeof ref === "object" ? ref.cell : ref));
    return cells.every(Number.isInteger) ? cells : null;
  }
  if (Array.isArray(clue.location?.cells) && clue.location.cells.length === 2) {
    const cells = clue.location.cells.map(Number);
    return cells.every(Number.isInteger) ? cells : null;
  }
  if (Array.isArray(clue.cells) && clue.cells.length === 2) {
    const cells = clue.cells.map(Number);
    return cells.every(Number.isInteger) ? cells : null;
  }
  return null;
}

function relationClueLabel(clue) {
  if (clue.ruleId === "gemini") return "G";
  if (clue.ruleId === "delta") return "D";
  if (clue.ruleId === "difference") return `Diff ${clue.value ?? clue.params?.difference ?? 0}`;
  if (clue.ruleId === "inequality") return clue.params?.direction === "gt" ? ">" : "<";
  return ruleLabel(clue.ruleId);
}

function cellCenter(cell) {
  const point = xy(cell, puzzle.width);
  return {
    x: SVG_PAD + point.x * CELL + CELL / 2,
    y: SVG_PAD + point.y * CELL + CELL / 2
  };
}

function clearEdgeRelationsForRule(ruleId, edgeConstraints) {
  const relation = ruleId === "gemini" ? "sameShape" : ruleId === "delta" ? "differentShape" : null;
  if (!relation) return edgeConstraints;
  const next = {};
  for (const [key, value] of Object.entries(edgeConstraints)) {
    const constraint = { ...value };
    if (constraint.relation === relation) constraint.relation = null;
    if (constraint.state || constraint.relation) next[key] = constraint;
  }
  return next;
}

function toggleDraftCell(targetSet, key) {
  if (!key) return;
  if (targetSet.has(key)) targetSet.delete(key);
  else targetSet.add(key);
}

function shapeCellsFromDraft(targetSet) {
  const cells = [...targetSet].map((key) => key.split(",").map(Number));
  return cells.length ? normalizeShape(cells) : [];
}

function compassParamsFromForm() {
  const params = {};
  for (const [direction, input] of [
    ["N", el.compassNInput],
    ["E", el.compassEInput],
    ["S", el.compassSInput],
    ["W", el.compassWInput]
  ]) {
    if (input.value === "") continue;
    params[direction] = Math.max(0, Number(input.value) || 0);
  }
  return params;
}

function compassToolParameterText() {
  const params = compassParamsFromForm();
  const labels = Object.entries(params).map(([direction, value]) => `${direction} ${value}`);
  return labels.length ? labels.join(", ") : "No directional restrictions; still counts as a cell clue.";
}

function shapeBankLineCount() {
  return String(el.shapeBankInput.value ?? "")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#")).length;
}

function updateTraceFromForm() {
  traceImage.opacity = clamp(Number(el.screenshotOpacityInput.value), 0, 1);
  traceImage.x = Number(el.screenshotXInput.value) || 0;
  traceImage.y = Number(el.screenshotYInput.value) || 0;
  traceImage.scale = clamp(Number(el.screenshotScaleInput.value) || 1, 0.1, 5);
  traceImage.rotation = Number(el.screenshotRotationInput.value) || 0;
}

function updateTraceControls() {
  el.screenshotOpacityInput.value = String(traceImage.opacity);
  el.screenshotXInput.value = String(traceImage.x);
  el.screenshotYInput.value = String(traceImage.y);
  el.screenshotScaleInput.value = String(traceImage.scale);
  el.screenshotRotationInput.value = String(traceImage.rotation);
}

function updateRelationHint() {
  if (currentTool !== "relation") {
    el.relationPickHint.textContent = "Choose Relation pair clue, then click two edge-adjacent active cells.";
    return;
  }
  if (relationFirstCell === null) {
    el.relationPickHint.textContent = `Click the first cell for an edge-adjacent ${ruleLabel(el.relationRuleInput.value)} relation clue.`;
    return;
  }
  el.relationPickHint.textContent = `First cell: ${cellLabel(relationFirstCell, puzzle.width)}. Click an edge-adjacent second cell.`;
}

function hasCandidateSource() {
  return hasUiCandidateSource(puzzle);
}

function areCellsOrthogonallyAdjacent(a, b) {
  const left = xy(a, puzzle.width);
  const right = xy(b, puzzle.width);
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) === 1;
}

function hasRuleClue(ruleId) {
  return (puzzle.clues ?? []).some((clue) => clue.ruleId === ruleId);
}

function isRuleActive(id) {
  if (id === "precision") return Number(puzzle.rules.precision?.area ?? puzzle.rules.area) > 0;
  if (id === "rose_window") return Boolean(puzzle.rules.rose_window);
  if (id === "shape_bank") return Boolean(puzzle.rules.shape_bank);
  return puzzle.rules[id] !== undefined;
}

function ruleHelp(id) {
  return RULE_HELP[id] ?? "Registered rule.";
}

function ruleLabel(id) {
  return RULE_REGISTRY[id]?.label ?? id;
}

function showSolveResult(result) {
  const errors = result.errors.length ? `\n\nWarnings/errors:\n${result.errors.join("\n")}` : "";
  const base = `Status: ${humanStatus(result.status)}\nCandidates: ${result.candidates.length}\nSearch nodes: ${result.nodeCount}${result.truncated ? "\nSearch stopped at a limit or after enough solutions." : ""}`;

  if (!currentSolution) {
    renderStatus(base + errors, result.status === "no_solution" ? "bad" : "warn");
    el.solutionText.textContent = "";
    return;
  }

  const summary = summarizeSolution(currentSolution, puzzle);
  const statusClass = result.status === "unique_solution" ? "good" : "warn";
  renderStatus(base + errors, statusClass);
  el.solutionText.textContent = `${summary}\n\n${result.status === "multiple_solutions" ? "At least two solutions exist. The overlay shows the first one found." : "Overlay shows the solution found."}`;
}

function showStepResult(result) {
  if (result.step) {
    renderStatus(`${result.step.title}\n\n${result.step.reason}`, "good");
    el.solutionText.textContent = formatStepDetails(result.step);
    return;
  }
  const statusClass = result.status === "no_solution" ? "bad" : "warn";
  renderStatus(result.message, statusClass);
  if (result.base?.solutions?.[0]) {
    currentSolution = result.base.solutions[0];
    el.solutionText.textContent = summarizeSolution(currentSolution, puzzle);
  }
}

function showCandidatesForSelectedCell(result) {
  const lines = [
    `Selected cell: ${result.label}`,
    `Candidate count: ${result.count}`,
    result.errors.length ? `Solver warnings/errors: ${result.errors.join("; ")}` : ""
  ].filter(Boolean);

  for (const candidate of result.candidates) {
    const source = candidate.ruleId ? ` via ${ruleLabel(candidate.ruleId)}` : "";
    const name = candidate.sourceName ? ` (${candidate.sourceName})` : "";
    lines.push(`- #${candidate.id}: ${candidate.labels.join(", ")}; area ${candidate.area}; shape ${candidate.shapeKey}${source}${name}`);
  }

  el.solutionText.textContent = lines.join("\n");
  renderStatus(`Showing ${result.count} candidate${result.count === 1 ? "" : "s"} for ${result.label}.`, result.count ? "good" : "warn");
}

function formatStepDetails(step) {
  const proof = step.proof ? `Proof: ${step.proof.result} under ${JSON.stringify(step.proof.assumption)}.` : "";
  const rule = step.ruleId ? `Rule: ${ruleLabel(step.ruleId)}.` : "Rule: exact-cover consistency.";
  const apply = isStepApplyable(step) ? "Use Apply step to add this deduction to the puzzle state." : "This explanation is informative and has no direct state change.";
  return `${step.reason}\n\n${rule}\n${proof}\n${apply}`;
}

function renderStatus(text, kind) {
  el.statusBox.textContent = text;
  el.statusBox.className = `status ${kind ?? ""}`;
}

function humanStatus(status) {
  return {
    unique_solution: "unique solution",
    multiple_solutions: "multiple solutions",
    no_solution: "no solution",
    search_limit: "search limit reached",
    solution_found: "solution found"
  }[status] ?? status;
}

function regionColor(regionId) {
  const hue = (regionId * 47) % 360;
  return `hsl(${hue}, 78%, 82%)`;
}

function maxNodes() {
  return Math.max(1000, Number(el.maxNodesInput.value) || 250000);
}

function checkedAttr(value) {
  return value ? "checked" : "";
}

function disabledAttr(value) {
  return value ? "disabled" : "";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
