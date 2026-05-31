export type PostingGuardrailSeverity = "GREEN" | "AMBER" | "RED";
export type PostingGuardrailRiskCategory =
  | "ClinicBoss"
  | "patent disclosure"
  | "trademark clearance"
  | "TGA/SaMD language";

export type PostingGuardrailFlag = {
  id: string;
  severity: Exclude<PostingGuardrailSeverity, "GREEN">;
  category: PostingGuardrailRiskCategory;
  matchedText: string;
  guidance: string;
};

export type PostingGuardrailResult = {
  safetyLevel: "DRAFT_ONLY";
  publishAllowed: false;
  overallSeverity: PostingGuardrailSeverity;
  flags: PostingGuardrailFlag[];
  suggestedRewrite: string;
};

type PostingGuardrailRule = Omit<PostingGuardrailFlag, "matchedText"> & {
  pattern: RegExp;
};

const POSTING_GUARDRAIL_RULES: PostingGuardrailRule[] = [
  {
    id: "clinicboss-outcome-claims",
    severity: "RED",
    category: "ClinicBoss",
    pattern:
      /\bClinicBoss\b[^.!?\n]*(?:reduces?|saves?|improves?|clinically validated|proven outcomes?|trusted by|no-shows?|patient outcomes?|recommend(?:s|ing)?\s+treatment)[^.!?\n]*/i,
    guidance: "Do not publish ClinicBoss outcome, validation, treatment, savings, or adoption claims unless measured and approved for release."
  },
  {
    id: "tga-samd-status-claims",
    severity: "RED",
    category: "TGA/SaMD language",
    pattern: /\b(?:TGA[-\s]?(?:ready|approved)|SaMD[-\s]?ready|not a medical device|compliant by design)\b/i,
    guidance: "Avoid regulatory-status language until the TGA/SaMD assessment is documented."
  },
  {
    id: "clinical-intended-use-claims",
    severity: "RED",
    category: "TGA/SaMD language",
    pattern:
      /\b(?:diagnos(?:e|es|ing)|treat(?:s|ing)?|predict(?:s|ing)?|monitor(?:s|ing)?|recommend(?:s|ing)?\s+treatment(?:\s+plans?)?|clinical decision support|medical advice)\b/i,
    guidance: "Avoid language that implies diagnosis, treatment, monitoring, prediction, clinical decision support, or medical advice."
  },
  {
    id: "patent-disclosure-red-detail",
    severity: "RED",
    category: "patent disclosure",
    pattern:
      /\b(?:feature-level|architecture diagrams?|workflow diagrams?|product screenshots?|demo videos?|algorithmic explanations?|unique workflows?|data models?|implementation methods?|patented method)\b/i,
    guidance: "Keep feature-level mechanics, diagrams, screenshots, demo videos, algorithms, and implementation details private until the patent position is settled."
  },
  {
    id: "clinicboss-final-brand-language",
    severity: "AMBER",
    category: "ClinicBoss",
    pattern:
      /\b(?:the\s+)?ClinicBoss\s+(?:platform|product|brand|launch|campaign|domain|logo|site|website)\b|\bClinicBoss\b[^.!?\n]*(?:launch(?:es|ing)?|available|pricing|customers?|pilots?)[^.!?\n]*/i,
    guidance: "Keep ClinicBoss visible but careful: a working product stream, not a final cleared brand or public launch promise."
  },
  {
    id: "trademark-clearance-language",
    severity: "AMBER",
    category: "trademark clearance",
    pattern:
      /\b(?:the\s+)?ClinicBoss\s+(?:platform|brand|logo|domain|campaign|site|website)\b|\bClinicBoss\b[^.!?\n]*(?:launch(?:es|ing)?|domain|logo|campaign)[^.!?\n]*/i,
    guidance: "Treat ClinicBoss as a working name until formal trademark clearance is complete."
  },
  {
    id: "patent-disclosure-amber-detail",
    severity: "AMBER",
    category: "patent disclosure",
    pattern: /\b(?:specific\s+ClinicBoss|modules?|workflows?|how it works|intake module|demo)\b/i,
    guidance: "Review any module, workflow, demo, or how-it-works detail before posting."
  },
  {
    id: "tga-samd-amber-language",
    severity: "AMBER",
    category: "TGA/SaMD language",
    pattern: /\b(?:clinical|AI|decision support|risk prediction|triage|monitoring|recommendation)\b/i,
    guidance: "Review clinical, AI, decision-support, prediction, triage, monitoring, or recommendation language before posting."
  },
  {
    id: "clinicboss-market-specifics",
    severity: "AMBER",
    category: "ClinicBoss",
    pattern: /\b(?:pricing|launch(?:es|ing)?|launch timing|pilot(?:s|ing)?|customer names?|traction|savings?|outcome numbers?)\b/i,
    guidance: "Keep pricing, launch timing, pilots, customer names, traction, savings, and outcome numbers out of public copy unless approved."
  }
];

export function checkPublicPostingDraft(draft: string): PostingGuardrailResult {
  const normalizedDraft = normalizeDraft(draft);
  const flags = POSTING_GUARDRAIL_RULES.flatMap((rule) => {
    const match = normalizedDraft.match(rule.pattern);
    if (!match) return [];
    return [{ ...rule, matchedText: cleanMatchedText(match[0]) }];
  });

  return {
    safetyLevel: "DRAFT_ONLY",
    publishAllowed: false,
    overallSeverity: getOverallSeverity(flags),
    flags,
    suggestedRewrite: buildSuggestedRewrite(normalizedDraft, flags)
  };
}

function getOverallSeverity(flags: PostingGuardrailFlag[]): PostingGuardrailSeverity {
  if (flags.some((flag) => flag.severity === "RED")) return "RED";
  if (flags.some((flag) => flag.severity === "AMBER")) return "AMBER";
  return "GREEN";
}

function buildSuggestedRewrite(draft: string, flags: PostingGuardrailFlag[]) {
  if (flags.length === 0) {
    return draft || safeUmbrellaFrame();
  }

  const categories = new Set(flags.map((flag) => flag.category));
  const hasClinicBoss = categories.has("ClinicBoss") || /\bClinicBoss\b/i.test(draft);
  const hasRegulatoryRisk = categories.has("TGA/SaMD language");
  const hasIpOrBrandRisk = categories.has("patent disclosure") || categories.has("trademark clearance");

  const paragraphs = hasClinicBoss
    ? [
        "One Dromaios Labs working product stream, currently referred to as ClinicBoss, is focused on healthcare compliance and operational workflows.",
        "The important public story right now is the operational problem underneath it, not product mechanics, launch specifics, commercial specifics, or final-brand certainty."
      ]
    : [safeUmbrellaFrame()];

  if (hasIpOrBrandRisk) {
    paragraphs.push(
      "Detailed product workflows, implementation choices, screenshots, demos, and brand-heavy language are being kept internal while the patent and trademark position is settled."
    );
  }

  if (hasRegulatoryRisk) {
    paragraphs.push(
      "Any medtech language is being kept deliberately narrow until the evidence and regulatory pathway support more specific claims. The work is designed to support teams without replacing professional judgement."
    );
  }

  if (!hasRegulatoryRisk && !hasIpOrBrandRisk) {
    paragraphs.push("Claims stay close to real evidence and avoid implying adoption, validation, savings, or patient-outcome improvement.");
  }

  return paragraphs.join("\n\n");
}

function safeUmbrellaFrame() {
  return "Dromaios Labs is building practical healthcare infrastructure across education, tools, operational software, and responsible medtech, with claims kept close to real evidence.";
}

function normalizeDraft(draft: string) {
  return draft.trim().replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ");
}

function cleanMatchedText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
