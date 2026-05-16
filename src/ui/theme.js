export const THEME_STORAGE_KEY = "glimmith.theme";
export const THEME_OPTIONS = Object.freeze(["light", "dark", "system"]);

export function normalizeThemePreference(value) {
  return THEME_OPTIONS.includes(value) ? value : "system";
}

export function resolveThemePreference(preference, systemPrefersDark = false) {
  const normalized = normalizeThemePreference(preference);
  if (normalized === "system") return systemPrefersDark ? "dark" : "light";
  return normalized;
}

export function loadThemePreference(storage = globalThis.localStorage) {
  try {
    return normalizeThemePreference(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function saveThemePreference(preference, storage = globalThis.localStorage) {
  const normalized = normalizeThemePreference(preference);
  try {
    storage?.setItem(THEME_STORAGE_KEY, normalized);
  } catch {
    // Storage may be unavailable in private contexts. The in-memory UI state still works.
  }
  return normalized;
}

export function applyThemePreference(preference, options = {}) {
  const root = options.root ?? globalThis.document?.documentElement;
  const matchMedia = options.matchMedia ?? globalThis.matchMedia;
  const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
  const normalized = normalizeThemePreference(preference);
  const resolved = resolveThemePreference(normalized, Boolean(media?.matches));

  if (root?.dataset) {
    root.dataset.themePreference = normalized;
    root.dataset.theme = resolved;
  }

  return { preference: normalized, resolved };
}
