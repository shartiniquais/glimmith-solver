import { parseShapeBank } from "../core/puzzle.js";
import { normalizeShape } from "../core/geometry.js";

export function shapeBankTextToEntries(text) {
  const parsed = parseShapeBank(text);
  return {
    entries: parsed.shapes.map((shape, index) => ({
      id: `${shape.name}:${index}`,
      name: shape.name,
      cells: normalizeShape(shape.cells)
    })),
    errors: parsed.errors
  };
}

export function shapeBankEntriesToText(entries) {
  return entries
    .map((entry, index) => {
      const name = sanitizeShapeBankName(entry.name) || `Shape${index + 1}`;
      const cells = normalizeShape(entry.cells ?? []);
      return `${name}: ${cells.map(([x, y]) => `${x},${y}`).join(" ")}`;
    })
    .join("\n");
}

export function appendShapeBankEntry(text, entry) {
  const line = shapeBankEntriesToText([entry]);
  const current = String(text ?? "").trimEnd();
  return current ? `${current}\n${line}` : line;
}

export function removeShapeBankEntryAt(text, index) {
  const { entries } = shapeBankTextToEntries(text);
  if (index < 0 || index >= entries.length) return String(text ?? "");
  entries.splice(index, 1);
  return shapeBankEntriesToText(entries);
}

export function shapeBankEntryFromCells(name, cells) {
  return {
    name: sanitizeShapeBankName(name),
    cells: normalizeShape(cells)
  };
}

export function shapePreviewViewBox(cells) {
  const normalized = normalizeShape(cells ?? []);
  let width = 1;
  let height = 1;
  for (const [x, y] of normalized) {
    width = Math.max(width, x + 1);
    height = Math.max(height, y + 1);
  }
  return { cells: normalized, width, height };
}

export function sanitizeShapeBankName(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "");
}
