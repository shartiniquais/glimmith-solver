import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { RULE_REGISTRY } from "../src/core/rules/registry.js";
import { IMPLEMENTED_RULE_VISUALS, RULE_GROUPS, RULE_HELP } from "../src/ui/rule-ui-metadata.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/ui/app.js", import.meta.url), "utf8");

test("index.html exposes rule palette and validation UI anchors", () => {
  assert.match(indexHtml, /id="rulePalette"/);
  assert.match(indexHtml, /id="validationBox"/);
  assert.match(indexHtml, /id="explainAllButton"/);
  assert.match(indexHtml, /id="showCandidatesButton"/);
  assert.match(indexHtml, /id="currentToolBanner"/);
  assert.match(indexHtml, /id="inspectorBox"/);
  assert.match(indexHtml, /id="shapeBankList"/);
});

test("index.html exposes theme toggle controls", () => {
  assert.match(indexHtml, /id="themeToggle"/);
  assert.match(indexHtml, /value="light"/);
  assert.match(indexHtml, /value="dark"/);
  assert.match(indexHtml, /value="system"/);
});

test("app imports RULE_REGISTRY for registry-driven UI", () => {
  assert.match(appSource, /import \{ RULE_REGISTRY \}/);
});

test("app persists theme preferences through the theme module", () => {
  assert.match(appSource, /loadThemePreference/);
  assert.match(appSource, /saveThemePreference/);
  assert.match(appSource, /applyThemePreference/);
});

test("every implemented rule has a visual control or placement tool", () => {
  const implementedIds = Object.values(RULE_REGISTRY)
    .filter((rule) => rule.implemented)
    .map((rule) => rule.id)
    .sort();

  assert.deepEqual(Object.keys(IMPLEMENTED_RULE_VISUALS).sort(), implementedIds);

  for (const [id, visual] of Object.entries(IMPLEMENTED_RULE_VISUALS)) {
    assert.ok(["field", "editor", "placementTool", "paletteToggle"].includes(visual.type), `${id} visual type`);
    assert.equal(typeof visual.target, "string", `${id} visual target`);
    assert.notEqual(visual.target.length, 0, `${id} visual target`);
  }
});

test("every registry rule is present in a visible rule group", () => {
  const groupedIds = new Set(RULE_GROUPS.flatMap((group) => group.ids));
  for (const rule of Object.values(RULE_REGISTRY)) {
    assert.ok(groupedIds.has(rule.id), `${rule.id} is grouped in rule palette`);
  }
});

test("disabled rules have placeholder/help text", () => {
  for (const rule of Object.values(RULE_REGISTRY).filter((item) => !item.implemented)) {
    assert.equal(typeof RULE_HELP[rule.id], "string", `${rule.id} help text`);
    assert.notEqual(RULE_HELP[rule.id].length, 0, `${rule.id} non-empty help`);
  }
  assert.match(appSource, /Placeholder only/);
});

test("shape-bank editor has list and preview support", () => {
  assert.match(indexHtml, /id="shapeBankList"/);
  assert.match(appSource, /renderShapeBankList/);
  assert.match(appSource, /shapePreviewSvg/);
});
