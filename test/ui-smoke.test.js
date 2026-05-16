import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { RULE_REGISTRY } from "../src/core/rules/registry.js";
import { IMPLEMENTED_RULE_VISUALS } from "../src/ui/rule-ui-metadata.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/ui/app.js", import.meta.url), "utf8");

test("index.html exposes rule palette and validation UI anchors", () => {
  assert.match(indexHtml, /id="rulePalette"/);
  assert.match(indexHtml, /id="validationBox"/);
});

test("app imports RULE_REGISTRY for registry-driven UI", () => {
  assert.match(appSource, /import \{ RULE_REGISTRY \}/);
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
