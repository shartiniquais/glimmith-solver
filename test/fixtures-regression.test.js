import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { findNextLogicalStep } from "../src/core/explain.js";
import { normalizePuzzle } from "../src/core/puzzle.js";
import { RULE_REGISTRY } from "../src/core/rules/registry.js";
import { solvePuzzle } from "../src/core/solver.js";
import { validatePuzzle } from "../src/core/validation.js";

const fixtureFiles = readdirSync(new URL("./fixtures/", import.meta.url))
  .filter((file) => file.endsWith(".json"))
  .sort();

const fixtures = fixtureFiles.flatMap((file) => {
  const parsed = JSON.parse(readFileSync(new URL(`./fixtures/${file}`, import.meta.url), "utf8"));
  return parsed.fixtures.map((fixture) => ({ ...fixture, file }));
});

test("fixture metadata is complete and references registered rules", () => {
  assert.ok(fixtures.length > 0);
  for (const fixture of fixtures) {
    assert.equal(typeof fixture.name, "string", `${fixture.file} fixture name`);
    assert.ok(Array.isArray(fixture.rulesCovered), `${fixture.name} rulesCovered`);
    assert.ok(fixture.rulesCovered.length > 0, `${fixture.name} covers at least one rule`);
    assert.equal(typeof fixture.expectedStatus, "string", `${fixture.name} expectedStatus`);
    assert.ok("expectedRegionCount" in fixture, `${fixture.name} expectedRegionCount`);
    assert.ok(Array.isArray(fixture.expectedForcedSteps), `${fixture.name} expectedForcedSteps`);
    assert.equal(typeof fixture.puzzle, "object", `${fixture.name} puzzle`);
    for (const ruleId of fixture.rulesCovered) {
      assert.ok(RULE_REGISTRY[ruleId], `${fixture.name} references registered rule ${ruleId}`);
    }
  }
});

for (const fixture of fixtures) {
  test(`fixture ${fixture.name}`, () => {
    const validation = validatePuzzle(fixture.puzzle);
    const expectedValidationErrors = fixture.expectedValidationErrors ?? [];

    if (expectedValidationErrors.length > 0) {
      assert.equal(validation.ok, false, `${fixture.name} should be invalid`);
      for (const expected of expectedValidationErrors) {
        assert.match(validation.errors.join("\n"), new RegExp(escapeRegExp(expected)), `${fixture.name} validation error`);
      }
    } else {
      assert.equal(validation.ok, true, `${fixture.name} should validate: ${validation.errors.join("; ")}`);
    }

    const limit = fixture.expectedSolutionLimit ?? 2;
    const result = solvePuzzle(fixture.puzzle, { limit, maxNodes: 100000 });
    assert.equal(result.status, fixture.expectedStatus, `${fixture.name} solver status`);
    if (Number.isInteger(fixture.expectedSolutionCount)) {
      assert.equal(result.solutions.length, fixture.expectedSolutionCount, `${fixture.name} solution count`);
    }
    if (Number.isInteger(fixture.expectedRegionCount) && result.solutions[0]) {
      assert.equal(result.solutions[0].regions.length, fixture.expectedRegionCount, `${fixture.name} region count`);
    }

    if (fixture.expectedForcedSteps.length > 0) {
      const stepResult = findNextLogicalStep(fixture.puzzle, {
        maxNodes: 100000,
        ...(fixture.stepOptions ?? {})
      });
      assert.ok(stepResult.step, `${fixture.name} should have a forced step`);
      assert.ok(
        fixture.expectedForcedSteps.includes(stepResult.step.type),
        `${fixture.name} expected one of ${fixture.expectedForcedSteps.join(", ")} but got ${stepResult.step.type}`
      );
      if (fixture.expectedForcedEdge) {
        assert.deepEqual(stepResult.step.edge, fixture.expectedForcedEdge.edge, `${fixture.name} forced edge`);
        assert.equal(stepResult.step.state, fixture.expectedForcedEdge.state, `${fixture.name} forced edge state`);
      }
    }

    if (validation.ok) {
      const exported = JSON.parse(JSON.stringify(normalizePuzzle(fixture.puzzle)));
      const roundtrip = solvePuzzle(exported, { limit, maxNodes: 100000 });
      assert.equal(roundtrip.status, fixture.expectedStatus, `${fixture.name} roundtrip status`);
      assert.equal(roundtrip.solutions.length, result.solutions.length, `${fixture.name} roundtrip solution count`);
    }
  });
}

test("implemented rules have fixture coverage", () => {
  const implemented = Object.values(RULE_REGISTRY)
    .filter((rule) => rule.implemented)
    .map((rule) => rule.id)
    .sort();
  const fixtureCovered = new Set(fixtures.flatMap((fixture) => fixture.rulesCovered));
  const missing = implemented.filter((ruleId) => !fixtureCovered.has(ruleId));
  assert.deepEqual(missing, []);
});

test("implemented rules have unique, impossible, and invalid fixture coverage", () => {
  const implemented = Object.values(RULE_REGISTRY).filter((rule) => rule.implemented);
  for (const rule of implemented) {
    const covered = fixtures.filter((fixture) => fixture.rulesCovered.includes(rule.id));
    assert.ok(covered.some((fixture) => fixture.expectedStatus === "unique_solution"), `${rule.id} unique fixture`);
    assert.ok(
      covered.some((fixture) => fixture.expectedStatus === "no_solution" && !(fixture.expectedValidationErrors ?? []).length),
      `${rule.id} impossible fixture`
    );
    assert.ok(covered.some((fixture) => (fixture.expectedValidationErrors ?? []).length > 0), `${rule.id} invalid fixture`);
  }
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
