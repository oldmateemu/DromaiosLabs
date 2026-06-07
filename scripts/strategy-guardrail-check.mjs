#!/usr/bin/env node

// Guardrail linter for outward-facing acquisition copy in docs/strategy.
// Enforces Dromaios_Labs_public_posting_guardrail.md mechanically so public copy
// cannot ship with Red-list claims (clinical/outcome/TGA/overclaim) and so Amber-list
// language is surfaced for review.
//
// Scope: only files that are meant to be published or sent to prospects. Internal
// strategy/planning docs are excluded because they legitimately quote the avoid-lists.
//
// Meta/editorial passages inside scanned files (compliance notes, posting notes that
// reference the avoid-lists) can be exempted with marker comments:
//   <!-- guardrail:ignore-start --> ... <!-- guardrail:ignore-end -->   (block)
//   <anything> <!-- guardrail:allow --></anything>                       (single line)

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STRATEGY_DIR = resolve(HERE, "..", "docs", "strategy");

// Outward-facing copy only. Internal docs (the strategy itself, the operating
// cadence checklist) are intentionally not scanned: they quote the avoid-lists.
export const PUBLIC_CONTENT_FILES = [
  "lead-magnet-safety-compliance-self-assessment.md",
  "linkedin-posts-batch-1.md",
  "linkedin-posts-batch-2.md",
  "email-nurture-sequence.md",
  "article-first-30-seconds.md",
  "workshop-package-rung1.md",
  "outreach-templates-tier1.md",
  "webinar-partnership-kit.md"
];

// RED: must never appear in published copy (guardrail "Red" + "Avoid unless approved").
export const RED_RULES = [
  { id: "clinically-validated", pattern: /clinically validated/i, message: 'Clinical-validation claim ("clinically validated").' },
  { id: "compliant-by-design", pattern: /compliant by design/i, message: '"Compliant by design" — regulatory overclaim.' },
  { id: "tga-status", pattern: /\bTGA[-\s]?(ready|approved)\b/i, message: "TGA status claim (TGA-ready/approved)." },
  { id: "samd-ready", pattern: /\bSaMD[-\s]?ready\b/i, message: '"SaMD-ready" regulatory claim.' },
  { id: "clinical-decision-support", pattern: /clinical decision support/i, message: '"Clinical decision support" claim.' },
  { id: "medical-advice", pattern: /\bmedical advice\b/i, message: 'Implies the product gives "medical advice".' },
  { id: "risk-prediction", pattern: /\brisk prediction\b/i, message: '"Risk prediction" clinical claim.' },
  { id: "diagnoses", pattern: /\bdiagnos(?:e|es|is|tic)\b/i, message: "Diagnosis claim (diagnose/diagnosis/diagnostic)." },
  { id: "patient-outcomes", pattern: /\bimproves?\b[^.\n]{0,30}\boutcomes\b/i, message: "Improves-outcomes claim (unmeasured patient-outcome claim)." },
  { id: "proven-outcomes", pattern: /\bproven outcomes\b/i, message: '"Proven outcomes" claim.' },
  { id: "trusted-by-clinics", pattern: /\btrusted by clinics\b/i, message: '"Trusted by clinics" — unverified traction claim.' },
  { id: "clinicboss-platform", pattern: /\bthe ClinicBoss platform\b/i, message: 'Final-product framing ("the ClinicBoss platform"). Use "a working product stream".' },
  { id: "patented-method", pattern: /\b(our|patented)\s+patented\s+method\b|\bour patented\b/i, message: "Patent claim before the position is settled." },
  { id: "ai-transformation", pattern: /\bAI[-\s]?powered transformation\b/i, message: 'Hype phrase ("AI-powered transformation").' },
  { id: "leading-innovator", pattern: /\bleading healthcare innovator\b/i, message: 'Overclaim ("leading healthcare innovator").' },
  { id: "revolutionary", pattern: /\brevolutionary\b/i, message: 'Hype phrase ("revolutionary").' },
  { id: "savings-number", pattern: /\bsaves?\b[^.\n]{0,25}\d/i, message: "Quantified savings claim (saves <number>)." },
  { id: "reduces-by-number", pattern: /\breduces?\b[^.\n]{0,40}\bby\b[^.\n]{0,12}\d+\s*%/i, message: "Quantified reduction claim (reduces ... by <number>%)." },
  { id: "percent-reduction", pattern: /\d+\s*%\s*(reduction|fewer|less\b)/i, message: "Quantified outcome claim (<number>% reduction/fewer/less)." }
];

// AMBER: allowed but flagged for review (guardrail "Amber"). Not a build failure.
export const AMBER_RULES = [
  { id: "clinicboss-mention", pattern: /\bClinicBoss\b/, message: 'ClinicBoss mentioned — confirm it reads as "a working product stream", no feature detail.' },
  { id: "ai", pattern: /\bAI\b/, message: '"AI" used — confirm no clinical/AI-decision implication.' },
  { id: "decision-support", pattern: /\bdecision support\b/i, message: '"Decision support" language — review against TGA framing.' },
  { id: "triage", pattern: /\btriage\b/i, message: '"Triage" — clinical-function language, review.' },
  { id: "monitoring", pattern: /\bmonitor(?:s|ing)?\b/i, message: '"Monitor/monitoring" — can imply a clinical function, review.' },
  { id: "predicts", pattern: /\bpredict(?:s|ion|ive)?\b/i, message: '"Predict/prediction" — review against clinical-claim risk.' },
  { id: "recommendation", pattern: /\brecommend(?:s|ation|ations)?\b/i, message: '"Recommend(ation)" — review against decision-support framing.' },
  { id: "price-number", pattern: /\$\s?\d/, message: "Explicit price — keep pricing in proposals, not public copy." }
];

const IGNORE_START = /<!--\s*guardrail:ignore-start\s*-->/i;
const IGNORE_END = /<!--\s*guardrail:ignore-end\s*-->/i;
const ALLOW_LINE = /<!--\s*guardrail:allow\s*-->/i;

/**
 * Scan a single document's text.
 * @returns {{red: Finding[], amber: Finding[]}}
 */
export function checkContent(text, { fileName = "(string)" } = {}) {
  const red = [];
  const amber = [];
  let ignoring = false;

  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (IGNORE_START.test(line)) {
      ignoring = true;
      return;
    }
    if (IGNORE_END.test(line)) {
      ignoring = false;
      return;
    }
    if (ignoring || ALLOW_LINE.test(line)) return;

    for (const rule of RED_RULES) {
      const m = line.match(rule.pattern);
      if (m) red.push(makeFinding(fileName, index + 1, rule, m[0], line));
    }
    for (const rule of AMBER_RULES) {
      const m = line.match(rule.pattern);
      if (m) amber.push(makeFinding(fileName, index + 1, rule, m[0], line));
    }
  });

  return { red, amber };
}

function makeFinding(fileName, lineNumber, rule, matchText, line) {
  return {
    file: fileName,
    line: lineNumber,
    ruleId: rule.id,
    message: rule.message,
    match: matchText,
    excerpt: line.trim().slice(0, 120)
  };
}

/**
 * Scan the configured public-content files (or an explicit list).
 * @returns {{ok: boolean, red: Finding[], amber: Finding[], scanned: string[]}}
 */
export function checkFiles(files = PUBLIC_CONTENT_FILES, baseDir = STRATEGY_DIR) {
  const red = [];
  const amber = [];
  const scanned = [];

  for (const file of files) {
    const fullPath = join(baseDir, file);
    const text = readFileSync(fullPath, "utf8");
    scanned.push(file);
    const result = checkContent(text, { fileName: file });
    red.push(...result.red);
    amber.push(...result.amber);
  }

  return { ok: red.length === 0, red, amber, scanned };
}

function format(findings) {
  return findings
    .map((f) => `  ${f.file}:${f.line}  [${f.ruleId}] ${f.message}\n      matched: "${f.match}"  ·  ${f.excerpt}`)
    .join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ok, red, amber, scanned } = checkFiles();

  console.log(`Guardrail check — scanned ${scanned.length} public-content file(s).`);

  if (amber.length > 0) {
    console.log(`\nAMBER (review before publishing) — ${amber.length} item(s):`);
    console.log(format(amber));
  }

  if (!ok) {
    console.error(`\nRED (must fix before publishing) — ${red.length} item(s):`);
    console.error(format(red));
    console.error("\nGuardrail check FAILED.");
    process.exit(1);
  }

  console.log("\nNo RED-list violations. Guardrail check passed.");
}
