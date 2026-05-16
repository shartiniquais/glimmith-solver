import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { RULE_REGISTRY } from "../src/core/rules/registry.js";

const inventory = JSON.parse(
  readFileSync(new URL("../docs/rules-inventory.json", import.meta.url), "utf8"),
);

const byId = new Map(inventory.rules.map((rule) => [rule.id, rule]));

test("rule inventory records implementation status for every rule", () => {
  const expected = {
    ready: [
      "precision",
      "shape_bank",
      "rose_window",
      "gemini",
      "delta",
      "polyomino",
      "mingle_shape",
      "area_number",
      "difference",
      "match",
      "mismatch",
      "range",
      "size_separation",
      "boxy",
      "non_boxy",
      "inequality",
      "solitude",
      "palisade",
      "bricky",
      "loopy",
      "compass",
      "watchtower",
    ],
    experimental: [],
    blocked: [],
  };

  for (const rule of inventory.rules) {
    assert.ok(rule.implementationStatus, `${rule.id} is missing implementationStatus`);
    assert.equal(rule.implementationStatus, "ready", `${rule.id} should be ready after user confirmation`);
    assert.equal(rule.confirmation?.basis, "user_confirmed_in_game_observation", `${rule.id} confirmation basis`);
    assert.ok(rule.sourceUrls?.length > 0, `${rule.id} is missing source URLs`);
    assert.ok(Array.isArray(rule.openQuestions), `${rule.id} is missing openQuestions`);
  }

  for (const [status, ids] of Object.entries(expected)) {
    const actual = inventory.rules
      .filter((rule) => rule.implementationStatus === status)
      .map((rule) => rule.id)
      .sort();
    assert.deepEqual(actual, [...ids].sort(), `${status} rule set changed`);
  }
});

test("rule inventory records top-level implementation policy", () => {
  assert.equal(
    inventory.implementationPolicy.blockedRuleSolverBehavior,
    "reject_not_implemented_semantics_unverified",
  );
  assert.equal(inventory.implementationPolicy.blockedRuleUiPolicy, "placeholder_only_if_useful");
  assert.match(inventory.implementationPolicy.shapeComparison, /configurable/i);
  assert.match(inventory.implementationPolicy.shapeComparison, /rotation/i);
  assert.match(inventory.implementationPolicy.shapeComparison, /reflection/i);
  assert.match(inventory.implementationPolicy.relationClues, /constraints between two regions/i);
  assert.match(inventory.implementationPolicy.relationClues, /not as simple edge states only/i);
  assert.equal(inventory.implementationPolicy.readyUnimplementedRuleSolverBehavior, "reject_known_ready_not_implemented");
});

test("every inventory rule id is represented in RULE_REGISTRY", () => {
  const missing = inventory.rules
    .map((rule) => rule.id)
    .filter((id) => !RULE_REGISTRY[id]);

  assert.deepEqual(missing, []);
});

test("ready rules expose rule-engine implementation constraints", () => {
  const shapeBank = byId.get("shape_bank");
  assert.equal(shapeBank.implementationModel.shapeUsePolicy, "reusable_allowed_shape_set");
  assert.equal(shapeBank.implementationModel.unlimitedReuse, true);
  assert.equal(shapeBank.implementationModel.listedShapeMayBeUnused, true);
  assert.deepEqual(shapeBank.implementationModel.optionalFutureFields, ["exactUses", "maxUses"]);
  assert.equal(shapeBank.implementationModel.enforceUseLimitsOnlyWhenSupplied, true);

  const roseWindow = byId.get("rose_window");
  assert.equal(roseWindow.implementationModel.requiredSymbolCounts, "map_symbol_id_to_required_count");
  assert.equal(roseWindow.implementationModel.notHardCodedToOneSymbolFamily, true);

  for (const id of ["shape_bank", "gemini", "delta", "polyomino", "mingle_shape", "match", "mismatch"]) {
    const rule = byId.get(id);
    assert.equal(rule.shapeComparison.allowRotations, true, `${id} rotations`);
    assert.equal(rule.shapeComparison.allowReflections, true, `${id} reflections`);
  }

  for (const id of ["gemini", "delta", "difference", "inequality"]) {
    const rule = byId.get(id);
    assert.match(rule.relationModel.kind, /two_region_relation_clue/, `${id} relation kind`);
    assert.equal(rule.relationModel.notSimpleEdgeStateOnly, true, `${id} relation scope`);
  }
});

test("implemented flags separate solver support from ready mechanics", () => {
  const implemented = inventory.rules.filter((rule) => rule.implemented).map((rule) => rule.id).sort();
  assert.deepEqual(implemented, [
    "area_number",
    "boxy",
    "bricky",
    "compass",
    "delta",
    "difference",
    "gemini",
    "inequality",
    "loopy",
    "match",
    "mingle_shape",
    "mismatch",
    "non_boxy",
    "palisade",
    "polyomino",
    "precision",
    "range",
    "rose_window",
    "shape_bank",
    "size_separation",
    "solitude",
    "watchtower",
  ]);

  const readyNotImplemented = inventory.rules
    .filter((rule) => rule.implementationStatus === "ready" && !rule.implemented)
    .map((rule) => rule.id)
    .sort();
  assert.deepEqual(readyNotImplemented, []);
});
