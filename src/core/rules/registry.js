import { areaNumberRule } from "./area-number.js";
import { deltaRule, differenceRule, geminiRule } from "./relations.js";
import { mingleShapeRule } from "./mingle-shape.js";
import { polyominoRule } from "./polyomino.js";
import { precisionRule } from "./precision.js";
import { roseWindowRule } from "./rose-window.js";
import { shapeBankRule } from "./shape-bank.js";

export const LEGACY_RULE_KEYS = new Set([
  "area",
  "roseLabels",
  "shapeBankText",
  "allowRotations",
  "allowReflections",
  "shapeEquivalenceAllowRotations",
  "shapeEquivalenceAllowReflections"
]);

const experimentalRules = [
  ["match", "Match"],
  ["mismatch", "Mismatch"],
  ["range", "Range"],
  ["size_separation", "Size Separation"],
  ["boxy", "Boxy"],
  ["non_boxy", "Non-Boxy"],
  ["inequality", "Inequality"],
  ["solitude", "Solitude"]
];

const blockedRules = [
  ["palisade", "Palisade"],
  ["bricky", "Bricky"],
  ["loopy", "Loopy"],
  ["compass", "Compass"],
  ["watchtower", "Watchtower"]
];

export const RULE_REGISTRY = Object.freeze({
  precision: precisionRule,
  shape_bank: shapeBankRule,
  rose_window: roseWindowRule,
  gemini: geminiRule,
  delta: deltaRule,
  difference: differenceRule,
  area_number: areaNumberRule,
  polyomino: polyominoRule,
  mingle_shape: mingleShapeRule,
  ...Object.fromEntries(experimentalRules.map(([id, label]) => [id, unimplementedRule(id, label, "experimental")])),
  ...Object.fromEntries(blockedRules.map(([id, label]) => [id, unimplementedRule(id, label, "blocked")]))
});

export function createRuleContext(puzzle, options = {}) {
  const ruleConfigs = {};
  for (const id of Object.keys(RULE_REGISTRY)) {
    const config = getRuleConfig(puzzle, id);
    if (config) ruleConfigs[id] = config;
  }
  return {
    puzzle,
    options,
    ruleConfigs,
    candidates: options.candidates ?? []
  };
}

export function getRuleConfig(puzzle, id) {
  const config = puzzle.rules?.[id];
  if (config === undefined || config === null) return null;
  if (typeof config === "object" && config.enabled === false) return null;
  return config;
}

export function activeRuleEntries(context) {
  return Object.entries(context.ruleConfigs)
    .map(([id, config]) => [RULE_REGISTRY[id], config])
    .filter(([rule]) => Boolean(rule));
}

export function applyCandidateFilters(candidate, context, extraRules = []) {
  for (const rule of extraRules) {
    if (rule.candidateFilter && !rule.candidateFilter(candidate, context)) return false;
  }
  for (const [rule] of activeRuleEntries(context)) {
    if (rule.candidateFilter && !rule.candidateFilter(candidate, context)) return false;
  }
  return true;
}

export function explainCandidateRejection(candidate, context, extraRules = []) {
  const rules = [...extraRules, ...activeRuleEntries(context).map(([rule]) => rule)];
  for (const rule of rules) {
    if (!rule.candidateFilter || rule.candidateFilter(candidate, context)) continue;
    return {
      ruleId: rule.id,
      label: rule.label,
      reason:
        rule.explainElimination?.(candidate, context) ??
        `Candidate was rejected by ${rule.label ?? rule.id}.`
    };
  }
  return null;
}

export function addRuleConstraints(model, context) {
  for (const [rule] of activeRuleEntries(context)) {
    if (rule.addConstraints) rule.addConstraints(model, context);
  }
}

export function validateActiveRules(context) {
  const errors = [];
  for (const [rule] of activeRuleEntries(context)) {
    if (rule.validatePuzzle) errors.push(...rule.validatePuzzle(context));
  }
  return errors;
}

function unimplementedRule(id, label, implementationStatus) {
  return {
    id,
    label,
    implementationStatus,
    implemented: false,
    validatePuzzle(context) {
      if (!context.ruleConfigs[id]) return [];
      if (implementationStatus === "ready") {
        return [`Rule "${id}" is known and ready for implementation, but not implemented in the solver yet.`];
      }
      const reason =
        implementationStatus === "blocked"
          ? "not implemented because its semantics are unverified"
          : "registered for the rule engine but not implemented yet";
      return [`Rule "${id}" (${label}) is ${reason}.`];
    }
  };
}
