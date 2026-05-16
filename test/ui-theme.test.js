import assert from "node:assert/strict";
import test from "node:test";
import {
  THEME_STORAGE_KEY,
  applyThemePreference,
  loadThemePreference,
  resolveThemePreference,
  saveThemePreference
} from "../src/ui/theme.js";

test("theme preference resolves light, dark, and system", () => {
  assert.equal(resolveThemePreference("light", true), "light");
  assert.equal(resolveThemePreference("dark", false), "dark");
  assert.equal(resolveThemePreference("system", true), "dark");
  assert.equal(resolveThemePreference("system", false), "light");
  assert.equal(resolveThemePreference("invalid", true), "dark");
});

test("theme preference persists to storage", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  assert.equal(saveThemePreference("dark", storage), "dark");
  assert.equal(values.get(THEME_STORAGE_KEY), "dark");
  assert.equal(loadThemePreference(storage), "dark");
});

test("applyThemePreference writes root data attributes", () => {
  const root = { dataset: {} };
  const matchMedia = () => ({ matches: true });
  const result = applyThemePreference("system", { root, matchMedia });
  assert.deepEqual(result, { preference: "system", resolved: "dark" });
  assert.equal(root.dataset.themePreference, "system");
  assert.equal(root.dataset.theme, "dark");
});
