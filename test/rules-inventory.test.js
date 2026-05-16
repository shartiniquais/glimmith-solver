import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
    ],
    experimental: [
      "match",
      "mismatch",
      "range",
      "size_separation",
      "boxy",
      "non_boxy",
      "inequality",
      "solitude",
    ],
    blocked: ["palisade", "bricky", "loopy", "compass", "watchtower"],
  };

  for (const rule of inventory.rules) {
    assert.ok(rule.implementationStatus, `${rule.id} is missing implementationStatus`);
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
});

test("ready rules expose rule-engine implementation constraints", () => {
  const shapeBank = byId.get("shape_bank");
  assert.equal(shapeBank.implementationModel.shapeUsePolicy, "reusable_allowed_shape_set");
  assert.deepEqual(shapeBank.implementationModel.optionalFutureFields, ["exactUses", "maxUses"]);
  assert.equal(shapeBank.implementationModel.enforceUseLimitsOnlyWhenSupplied, true);

  const roseWindow = byId.get("rose_window");
  assert.equal(roseWindow.implementationModel.requiredSymbolCounts, "map_symbol_id_to_required_count");
  assert.equal(roseWindow.implementationModel.notHardCodedToOneSymbolFamily, true);

  for (const id of ["shape_bank", "gemini", "delta", "polyomino", "mingle_shape"]) {
    const rule = byId.get(id);
    assert.equal(rule.shapeComparison.allowRotations, "configurable", `${id} rotations`);
    assert.equal(rule.shapeComparison.allowReflections, "configurable", `${id} reflections`);
  }

  for (const id of ["gemini", "delta", "difference"]) {
    const rule = byId.get(id);
    assert.equal(rule.relationModel.kind, "two_region_relation_clue", `${id} relation kind`);
    assert.equal(rule.relationModel.notSimpleEdgeStateOnly, true, `${id} relation scope`);
  }
});
