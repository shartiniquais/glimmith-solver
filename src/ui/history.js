const DEFAULT_LIMIT = 100;

export function createHistory(initialState, options = {}) {
  return {
    past: [],
    present: cloneState(initialState),
    future: [],
    limit: Math.max(1, Number(options.limit) || DEFAULT_LIMIT),
    lastLabel: options.label ?? "Initial state"
  };
}

export function recordHistory(history, nextState, label = "Edit") {
  const next = cloneState(nextState);
  if (statesEqual(history.present, next)) return { ...history, present: next, lastLabel: label };
  const past = [...history.past, { state: cloneState(history.present), label: history.lastLabel }].slice(-history.limit);
  return {
    ...history,
    past,
    present: next,
    future: [],
    lastLabel: label
  };
}

export function undoHistory(history) {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    ...history,
    past: history.past.slice(0, -1),
    present: cloneState(previous.state),
    future: [{ state: cloneState(history.present), label: history.lastLabel }, ...history.future].slice(0, history.limit),
    lastLabel: previous.label ?? "Undo"
  };
}

export function redoHistory(history) {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return {
    ...history,
    past: [...history.past, { state: cloneState(history.present), label: history.lastLabel }].slice(-history.limit),
    present: cloneState(next.state),
    future: history.future.slice(1),
    lastLabel: next.label ?? "Redo"
  };
}

export function canUndo(history) {
  return history.past.length > 0;
}

export function canRedo(history) {
  return history.future.length > 0;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function statesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
