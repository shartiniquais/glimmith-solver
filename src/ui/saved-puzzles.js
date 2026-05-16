export const SAVED_PUZZLES_KEY = "glimmith.savedPuzzles.v1";

export function listSavedPuzzles(storage, key = SAVED_PUZZLES_KEY) {
  return readCollection(storage, key).puzzles;
}

export function savePuzzle(storage, name, puzzle, key = SAVED_PUZZLES_KEY, now = new Date()) {
  const cleanName = String(name ?? "").trim();
  if (!cleanName) throw new Error("Saved puzzle name is required.");
  const collection = readCollection(storage, key);
  const id = idFromName(cleanName);
  const existing = collection.puzzles.find((item) => item.id === id);
  const entry = {
    id,
    name: cleanName,
    updatedAt: now instanceof Date ? now.toISOString() : String(now),
    puzzle: clone(puzzle)
  };
  const puzzles = existing
    ? collection.puzzles.map((item) => (item.id === id ? entry : item))
    : [...collection.puzzles, entry];
  writeCollection(storage, { version: 1, puzzles: sortPuzzles(puzzles) }, key);
  return entry;
}

export function loadSavedPuzzle(storage, id, key = SAVED_PUZZLES_KEY) {
  const entry = readCollection(storage, key).puzzles.find((item) => item.id === id);
  return entry ? clone(entry.puzzle) : null;
}

export function deleteSavedPuzzle(storage, id, key = SAVED_PUZZLES_KEY) {
  const collection = readCollection(storage, key);
  const puzzles = collection.puzzles.filter((item) => item.id !== id);
  writeCollection(storage, { version: 1, puzzles }, key);
  return puzzles;
}

export function exportSavedPuzzleCollection(storage, key = SAVED_PUZZLES_KEY) {
  return JSON.stringify(readCollection(storage, key), null, 2);
}

export function importSavedPuzzleCollection(storage, raw, key = SAVED_PUZZLES_KEY) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const incoming = normalizeCollection(parsed);
  const current = readCollection(storage, key);
  const byId = new Map(current.puzzles.map((item) => [item.id, item]));
  for (const entry of incoming.puzzles) byId.set(entry.id, entry);
  const merged = { version: 1, puzzles: sortPuzzles([...byId.values()]) };
  writeCollection(storage, merged, key);
  return merged.puzzles;
}

export function readCollection(storage, key = SAVED_PUZZLES_KEY) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return { version: 1, puzzles: [] };
    return normalizeCollection(JSON.parse(raw));
  } catch {
    return { version: 1, puzzles: [] };
  }
}

function writeCollection(storage, collection, key) {
  storage.setItem(key, JSON.stringify(normalizeCollection(collection)));
}

function normalizeCollection(value) {
  const source = Array.isArray(value) ? { version: 1, puzzles: value } : value;
  const puzzles = Array.isArray(source?.puzzles) ? source.puzzles : [];
  return {
    version: 1,
    puzzles: sortPuzzles(
      puzzles
        .filter((entry) => entry?.puzzle && entry?.name)
        .map((entry) => ({
          id: String(entry.id || idFromName(entry.name)),
          name: String(entry.name),
          updatedAt: String(entry.updatedAt ?? ""),
          puzzle: clone(entry.puzzle)
        }))
    )
  };
}

function idFromName(name) {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "saved-puzzle";
}

function sortPuzzles(puzzles) {
  return [...puzzles].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
