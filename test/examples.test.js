import assert from "node:assert/strict";
import test from "node:test";
import { RULE_REGISTRY } from "../src/core/rules/registry.js";
import { EXAMPLES, exampleById } from "../src/ui/examples.js";

test("example loader exposes at least one puzzle for every implemented rule", () => {
  const covered = new Set(EXAMPLES.flatMap((example) => example.ruleIds));
  const implemented = Object.values(RULE_REGISTRY).filter((rule) => rule.implemented);
  for (const rule of implemented) {
    assert.ok(covered.has(rule.id), `${rule.id} has a UI example`);
  }
});

test("exampleById returns a defensive copy of the example and puzzle", () => {
  const first = exampleById("watchtower");
  const second = exampleById("watchtower");
  assert.equal(first.id, "watchtower");
  assert.equal(first.puzzle.clues[0].ruleId, "watchtower");
  first.puzzle.clues[0].value = 4;
  assert.equal(second.puzzle.clues[0].value, 1);
});
