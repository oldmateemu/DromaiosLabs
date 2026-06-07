import assert from "node:assert/strict";
import test from "node:test";
import {
  checkContent,
  checkFiles,
  PUBLIC_CONTENT_FILES,
  RED_RULES,
  AMBER_RULES
} from "./strategy-guardrail-check.mjs";

test("flags Red-list clinical and outcome claims", () => {
  const text = [
    "ClinicBoss is clinically validated and compliant by design.",
    "It diagnoses risk and improves patient outcomes.",
    "Our platform is TGA-ready and trusted by clinics."
  ].join("\n");

  const { red } = checkContent(text);
  const ids = red.map((f) => f.ruleId);

  assert.ok(ids.includes("clinically-validated"));
  assert.ok(ids.includes("compliant-by-design"));
  assert.ok(ids.includes("diagnoses"));
  assert.ok(ids.includes("patient-outcomes"));
  assert.ok(ids.includes("tga-status"));
  assert.ok(ids.includes("trusted-by-clinics"));
});

test("flags quantified savings and reduction claims", () => {
  const text = [
    "It saves 12 hours a week.",
    "ClinicBoss reduces no-shows by 30%.",
    "We delivered a 40% reduction in incidents."
  ].join("\n");

  const ids = checkContent(text).red.map((f) => f.ruleId);
  assert.ok(ids.includes("savings-number"));
  assert.ok(ids.includes("reduces-by-number"));
  assert.ok(ids.includes("percent-reduction"));
});

test("does not flag non-quantified, careful phrasing", () => {
  const text = [
    "A good pilot should be narrow, useful, and testable.",
    "This costs less than the cost of a single serious incident's aftermath.",
    'Do not promise "reduces incidents by X."',
    "We avoid unmeasured savings and outcome claims."
  ].join("\n");

  const { red } = checkContent(text);
  assert.deepEqual(red, [], `unexpected red findings: ${JSON.stringify(red)}`);
});

test("surfaces Amber language without failing", () => {
  const text = "One product stream, ClinicBoss, focuses on workflows.";
  const { red, amber } = checkContent(text);
  assert.equal(red.length, 0);
  assert.ok(amber.some((f) => f.ruleId === "clinicboss-mention"));
});

test("ignore-block markers exempt meta passages", () => {
  const text = [
    "<!-- guardrail:ignore-start -->",
    'Avoid phrases like "trusted by clinics" and "clinically validated".',
    "<!-- guardrail:ignore-end -->",
    "This line is clean.",
    'A real claim: clinically validated. <!-- guardrail:allow -->'
  ].join("\n");

  const { red } = checkContent(text);
  assert.deepEqual(red, [], `ignore markers should suppress findings: ${JSON.stringify(red)}`);
});

test("ignore block re-enables checking after it closes", () => {
  const text = [
    "<!-- guardrail:ignore-start -->",
    "trusted by clinics",
    "<!-- guardrail:ignore-end -->",
    "trusted by clinics"
  ].join("\n");

  const { red } = checkContent(text);
  assert.equal(red.length, 1);
  assert.equal(red[0].line, 4);
});

test("reports accurate file and line numbers", () => {
  const text = ["clean line", "clean line", "revolutionary new tool"].join("\n");
  const { red } = checkContent(text, { fileName: "sample.md" });
  assert.equal(red.length, 1);
  assert.equal(red[0].file, "sample.md");
  assert.equal(red[0].line, 3);
  assert.equal(red[0].ruleId, "revolutionary");
});

test("rule tables are well-formed (unique ids, real regexes)", () => {
  const all = [...RED_RULES, ...AMBER_RULES];
  const ids = all.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "rule ids must be unique");
  for (const rule of all) {
    assert.ok(rule.pattern instanceof RegExp, `${rule.id} must have a RegExp pattern`);
    assert.equal(typeof rule.message, "string");
    assert.ok(rule.message.length > 0);
  }
});

test("all shipped public-content files pass the Red-list check", () => {
  const { ok, red, scanned } = checkFiles();
  assert.equal(scanned.length, PUBLIC_CONTENT_FILES.length);
  assert.equal(ok, true, `Red-list violations found:\n${JSON.stringify(red, null, 2)}`);
});
