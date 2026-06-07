/**
 * Publish gate: runs the public-posting guardrail over content drafts before
 * they go out, so nothing reaches LinkedIn / owned articles / the website
 * without passing the same check the cockpit Assistant uses.
 *
 * Usage:
 *   pnpm check:publish                       # scan docs/strategy/content/*.md
 *   pnpm check:publish path/to/draft.md ...  # check specific files
 *
 * Each file declares its intent with an HTML comment on the first lines:
 *   <!-- publish-intent: external -->   must be GREEN; AMBER/RED fails the gate
 *   <!-- publish-intent: internal -->   informational only (e.g. competitor docs)
 * A file with no marker is treated as external (strict by default) and warned.
 *
 * Exit code is non-zero if any external draft is not GREEN — wire it into a
 * pre-publish step or just read the report.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { checkPublicPostingDraft, type PostingGuardrailSeverity } from "../src/lib/posting-guardrail";

const CONTENT_DIR = "docs/strategy/content";

type Intent = "external" | "internal" | "unmarked";

function resolveTargets(args: string[]): string[] {
  if (args.length > 0) return args;
  return readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md") && name !== "PUBLISH_CHECKLIST.md")
    .map((name) => join(CONTENT_DIR, name));
}

function readIntent(raw: string): Intent {
  const match = raw.match(/<!--\s*publish-intent:\s*(external|internal)\s*-->/i);
  if (!match) return "unmarked";
  return match[1].toLowerCase() as Intent;
}

/** Strip internal scaffolding so we check only the words that would be posted. */
function toPostableBody(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "") // HTML comments (incl. the intent marker)
    .split("\n")
    .filter((line) => !line.trimStart().startsWith(">")) // internal status blockquotes
    .join("\n")
    .replace(/\[link\]/gi, "") // URL placeholders
    .trim();
}

/** Split into `## ` sections (e.g. one per LinkedIn post); fall back to whole body. */
function units(body: string): { label: string; text: string }[] {
  const parts = body.split(/^##\s+(.+)$/m);
  if (parts.length <= 1) return [{ label: "(whole document)", text: body }];
  const out: { label: string; text: string }[] = [];
  // parts[0] is any preamble before the first heading; ignore if blank
  for (let i = 1; i < parts.length; i += 2) {
    out.push({ label: parts[i].trim(), text: parts[i + 1] ?? "" });
  }
  return out;
}

const SEVERITY_ICON: Record<PostingGuardrailSeverity, string> = {
  GREEN: "🟢",
  AMBER: "🟡",
  RED: "🔴"
};

function worst(a: PostingGuardrailSeverity, b: PostingGuardrailSeverity): PostingGuardrailSeverity {
  const order: PostingGuardrailSeverity[] = ["GREEN", "AMBER", "RED"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

function main() {
  const targets = resolveTargets(process.argv.slice(2));
  let gateFailures = 0;

  for (const file of targets) {
    let raw: string;
    try {
      if (!statSync(file).isFile()) continue;
      raw = readFileSync(file, "utf8");
    } catch {
      console.error(`✗ Could not read ${file}`);
      gateFailures += 1;
      continue;
    }

    const intent = readIntent(raw);
    const body = toPostableBody(raw);
    let fileSeverity: PostingGuardrailSeverity = "GREEN";

    console.log(`\n${file}  [intent: ${intent}]`);
    for (const unit of units(body)) {
      const result = checkPublicPostingDraft(unit.text);
      fileSeverity = worst(fileSeverity, result.overallSeverity);
      console.log(`  ${SEVERITY_ICON[result.overallSeverity]} ${result.overallSeverity}  ${unit.label}`);
      for (const flag of result.flags) {
        console.log(`       - [${flag.severity}/${flag.category}] "${flag.matchedText}" — ${flag.guidance}`);
      }
    }

    const mustBeGreen = intent === "external" || intent === "unmarked";
    if (intent === "unmarked") {
      console.log("  ⚠ No publish-intent marker — treating as external (strict). Add <!-- publish-intent: external|internal -->.");
    }
    if (mustBeGreen && fileSeverity !== "GREEN") {
      console.log(`  ✗ GATE FAIL: external draft is ${fileSeverity}, must be GREEN before posting.`);
      gateFailures += 1;
    } else if (intent === "internal" && fileSeverity !== "GREEN") {
      console.log(`  · Internal draft (${fileSeverity}) — review before any external reuse, not a gate failure.`);
    }
  }

  console.log(
    gateFailures === 0
      ? "\n✓ Publish gate passed: all external drafts are GREEN."
      : `\n✗ Publish gate failed: ${gateFailures} item(s) need attention.`
  );
  process.exit(gateFailures === 0 ? 0 : 1);
}

main();
