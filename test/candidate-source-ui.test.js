import assert from "node:assert/strict";
import test from "node:test";
import { hasUiCandidateSource } from "../src/ui/candidate-source.js";

test("UI candidate-source detection counts valid Range bounds", () => {
  assert.equal(hasUiCandidateSource({ rules: { area: 0, range: { min: 2 } }, shapeBank: {}, clues: [] }), true);
  assert.equal(hasUiCandidateSource({ rules: { area: 0, range: { max: 4 } }, shapeBank: {}, clues: [] }), true);
  assert.equal(hasUiCandidateSource({ rules: { area: 0, range: { min: 2, max: 4 } }, shapeBank: {}, clues: [] }), true);
});

test("UI candidate-source detection rejects invalid Range bounds", () => {
  assert.equal(hasUiCandidateSource({ rules: { area: 0, range: {} }, shapeBank: {}, clues: [] }), false);
  assert.equal(hasUiCandidateSource({ rules: { area: 0, range: { min: 4, max: 2 } }, shapeBank: {}, clues: [] }), false);
  assert.equal(hasUiCandidateSource({ rules: { area: 0, range: { min: 0 } }, shapeBank: {}, clues: [] }), false);
});
