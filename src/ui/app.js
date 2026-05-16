import { activeAdjacencyEdges, cellLabel, edgeKey, idx, parseEdgeKey, xy } from "../core/geometry.js";
import {
  createPuzzle,
  cycleCellSymbol,
  cycleEdgeConstraint,
  normalizePuzzle,
  resizePuzzle,
  setEdgeState,
  TETROMINO_PRESET,
  toggleCellActive
} from "../core/puzzle.js";
import { solvePuzzle } from "../core/solver.js";
import { findNextLogicalStep, summarizeSolution } from "../core/explain.js";
import { validatePuzzle } from "../core/validation.js";

const CELL = 46;
const SVG_PAD = 10;

let puzzle = createPuzzle(6, 6);
let currentTool = "cell";
let currentSolution = null;
let lastStep = null;

const el = {
  boardSvg: document.getElementById("boardSvg"),
  widthInput: document.getElementById("widthInput"),
  heightInput: document.getElementById("heightInput"),
  resizeButton: document.getElementById("resizeButton"),
  areaInput: document.getElementById("areaInput"),
  roseInput: document.getElementById("roseInput"),
  rotationsInput: document.getElementById("rotationsInput"),
  reflectionsInput: document.getElementById("reflectionsInput"),
  shapeEquivReflectionsInput: document.getElementById("shapeEquivReflectionsInput"),
  shapeBankInput: document.getElementById("shapeBankInput"),
  tetrominoButton: document.getElementById("tetrominoButton"),
  maxNodesInput: document.getElementById("maxNodesInput"),
  solveButton: document.getElementById("solveButton"),
  nextStepButton: document.getElementById("nextStepButton"),
  applyStepButton: document.getElementById("applyStepButton"),
  clearSolutionButton: document.getElementById("clearSolutionButton"),
  exportJsonButton: document.getElementById("exportJsonButton"),
  importJsonButton: document.getElementById("importJsonButton"),
  jsonBox: document.getElementById("jsonBox"),
  statusBox: document.getElementById("statusBox"),
  solutionText: document.getElementById("solutionText")
};

bindEvents();
syncFormFromPuzzle();
render();

function bindEvents() {
  document.querySelectorAll(".tool").forEach((button) => {
    button.addEventListener("click", () => {
      currentTool = button.dataset.tool;
      document.querySelectorAll(".tool").forEach((item) => item.classList.toggle("active", item === button));
    });
  });

  el.resizeButton.addEventListener("click", () => {
    const width = clamp(Number(el.widthInput.value) || puzzle.width, 1, 14);
    const height = clamp(Number(el.heightInput.value) || puzzle.height, 1, 14);
    puzzle = resizePuzzle(puzzle, width, height);
    clearComputed();
    syncFormFromPuzzle();
    render();
  });

  el.areaInput.addEventListener("change", updateRulesFromForm);
  el.roseInput.addEventListener("input", updateRulesFromForm);
  el.rotationsInput.addEventListener("change", updateRulesFromForm);
  el.reflectionsInput.addEventListener("change", updateRulesFromForm);
  el.shapeEquivReflectionsInput.addEventListener("change", updateRulesFromForm);
  el.shapeBankInput.addEventListener("input", updateRulesFromForm);

  el.tetrominoButton.addEventListener("click", () => {
    puzzle.rules.shapeBankText = TETROMINO_PRESET;
    clearComputed();
    syncFormFromPuzzle();
    renderStatus("Tetromino shape bank loaded. Leave Precision area at 4 or set it to 0 to allow all bank shapes.", "warn");
    render();
  });

  el.boardSvg.addEventListener("click", (event) => {
    const edge = event.target.dataset.edge;
    const cell = event.target.dataset.cell;
    if (edge && currentTool === "edge") {
      const [a, b] = parseEdgeKey(edge);
      puzzle = cycleEdgeConstraint(puzzle, a, b);
      clearComputed();
      render();
      return;
    }
    if (cell !== undefined && currentTool === "cell") {
      puzzle = toggleCellActive(puzzle, Number(cell));
      clearComputed();
      render();
      return;
    }
    if (cell !== undefined && currentTool === "symbol") {
      puzzle = cycleCellSymbol(puzzle, Number(cell));
      clearComputed();
      render();
    }
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
    el.applyStepButton.disabled = !lastStep;
    showStepResult(result);
    render();
  });

  el.applyStepButton.addEventListener("click", () => {
    if (!lastStep) return;
    const [a, b] = lastStep.edge;
    puzzle = setEdgeState(puzzle, a, b, lastStep.state);
    clearComputed();
    lastStep = null;
    el.applyStepButton.disabled = true;
    renderStatus("Applied the forced border.", "good");
    render();
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

function updateRulesFromForm(doRender = true) {
  puzzle.rules.area = Math.max(0, Number(el.areaInput.value) || 0);
  puzzle.rules.roseLabels = String(el.roseInput.value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  puzzle.rules.allowRotations = el.rotationsInput.checked;
  puzzle.rules.allowReflections = el.reflectionsInput.checked;
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
  el.reflectionsInput.checked = puzzle.rules.allowReflections === true;
  el.shapeEquivReflectionsInput.checked = puzzle.rules.shapeEquivalenceAllowReflections === true;
  el.shapeBankInput.value = puzzle.rules.shapeBankText ?? "";
}

function clearComputed() {
  currentSolution = null;
  lastStep = null;
  el.applyStepButton.disabled = true;
}

function render() {
  renderBoard();
}

function renderBoard() {
  const widthPx = puzzle.width * CELL + SVG_PAD * 2;
  const heightPx = puzzle.height * CELL + SVG_PAD * 2;
  const regionByCell = currentSolution?.regionByCell ?? {};
  const stepEdgeKey = lastStep ? edgeKey(lastStep.edge[0], lastStep.edge[1]) : null;

  let html = "";
  html += `<rect x="0" y="0" width="${widthPx}" height="${heightPx}" rx="12" fill="#fdf8ef"></rect>`;

  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      const cell = idx(x, y, puzzle.width);
      const active = puzzle.active[cell];
      const rx = SVG_PAD + x * CELL;
      const ry = SVG_PAD + y * CELL;
      const regionId = regionByCell[cell];
      const fill = active && regionId ? regionColor(regionId) : "";
      const classes = ["cell", active ? "active-cell" : "inactive-cell", regionId ? "solution-cell" : ""].join(" ");
      const label = cellLabel(cell, puzzle.width);
      html += `<rect class="${classes}" data-cell="${cell}" x="${rx}" y="${ry}" width="${CELL}" height="${CELL}" rx="4" ${fill ? `style="fill:${fill}"` : ""}><title>${label}</title></rect>`;
      if (active && puzzle.symbols[cell]) {
        html += `<text class="cell-symbol" x="${rx + CELL / 2}" y="${ry + CELL / 2}">${escapeHtml(puzzle.symbols[cell])}</text>`;
      }
      if (active && regionId) {
        html += `<text class="region-label" x="${rx + CELL - 5}" y="${ry + CELL - 5}">${regionId}</text>`;
      }
    }
  }

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
      if (isStep) {
        const text = lastStep.state === "join" ? "J" : "C";
        html += `<text class="edge-label" x="${line.mx}" y="${line.my}">${text}</text>`;
      }
    }
    html += `<line class="edge-hit" data-edge="${key}" x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}"><title>Border ${cellLabel(a, puzzle.width)}–${cellLabel(b, puzzle.width)}</title></line>`;
  }

  el.boardSvg.setAttribute("viewBox", `0 0 ${widthPx} ${heightPx}`);
  el.boardSvg.setAttribute("width", String(widthPx));
  el.boardSvg.setAttribute("height", String(heightPx));
  el.boardSvg.innerHTML = html;
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
    el.solutionText.textContent = "The highlighted border is the next forced step. Use “Apply step” to add it to the puzzle state.";
    return;
  }
  const statusClass = result.status === "no_solution" ? "bad" : "warn";
  renderStatus(result.message, statusClass);
  if (result.base?.solutions?.[0]) {
    currentSolution = result.base.solutions[0];
    el.solutionText.textContent = summarizeSolution(currentSolution, puzzle);
  }
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
