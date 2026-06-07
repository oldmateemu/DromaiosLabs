export type StrategyChecklistPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type StrategyChecklistItem = {
  /** Stable identifier for the checklist item. Not stored, used for tests and ordering. */
  key: string;
  title: string;
  description: string;
  nextStep: string;
  priority: StrategyChecklistPriority;
  /** Must match a seeded Stream name. */
  stream: string;
  /** Must match a seeded CompanyFunction name. */
  companyFunction: string;
};

/**
 * Phase 0 of the authority and trust strategy, expressed as trackable cockpit actions.
 *
 * Source of truth for the strategy itself is `Dromaios_Labs_authority_and_trust_strategy.md`.
 * These items are seeded as `Action` records (source USER, status OPEN) so the founder can
 * track them on the Today board and Actions register and move them through the normal
 * action lifecycle and weekly governance review.
 *
 * Constraints kept in line with the public posting guardrail and AI safety defaults:
 * none of these items carry credentials, outcome claims, or clinical/regulatory claims.
 */
export const phase0AuthorityTrustChecklist: StrategyChecklistItem[] = [
  {
    key: "essential-eight-baseline",
    title: "Document ASD Essential Eight baseline posture",
    description:
      "Capture where Dromaios Labs currently sits against the ASD Essential Eight controls and record the target maturity. This is the credible starting security posture and maps onto ISO 27001 Annex A later. Security is the highest-leverage early trust signal and gates serious buyer conversations.",
    nextStep:
      "List each Essential Eight control, note current state and a realistic target, and store the assessment as a living document.",
    priority: "HIGH",
    stream: "Company Core",
    companyFunction: "compliance"
  },
  {
    key: "information-security-policy",
    title: "Draft a written information security policy",
    description:
      "Produce a concise information security policy covering access control, device and account security, and supplier handling. This is a show-on-request artefact that wins trust cheaply before any certification spend.",
    nextStep: "Write a one to two page policy and link it from the launchpad for quick retrieval.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "legal"
  },
  {
    key: "breach-response-plan",
    title: "Draft data-handling and Notifiable Data Breaches response plan",
    description:
      "Document how company and any client data is stored, who can access it, and the step-by-step response if a breach occurs, aligned with the Notifiable Data Breaches scheme under the Privacy Act 1988. A handled incident preserves trust; a fumbled one ends it. This must exist before handling any real client or practice data.",
    nextStep: "Write the data map and breach-response runbook, including notification triggers and who is accountable.",
    priority: "HIGH",
    stream: "Company Core",
    companyFunction: "legal"
  },
  {
    key: "privacy-impact-assessment-habit",
    title: "Establish a Privacy Impact Assessment template and habit",
    description:
      "Create a lightweight Privacy Impact Assessment template and the habit of completing one whenever a stream starts handling new personal or health information. Supports Privacy Act and My Health Records Act alignment and signals responsible data practice.",
    nextStep: "Adapt a standard PIA template to Dromaios streams and record when each PIA is due.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "compliance"
  },
  {
    key: "clinical-safety-advisors",
    title: "Recruit and confirm 1-2 clinical or safety advisors",
    description:
      "Identify and confirm two or three credible advisors (clinicians, aged or community-care operators, or a quality and compliance lead). Even a small named advisory group changes how the company is read by buyers, partners, and peak bodies.",
    nextStep: "Draft a short advisor brief, shortlist candidates, and confirm the first advisor with a clear scope.",
    priority: "HIGH",
    stream: "Company Core",
    companyFunction: "governance"
  },
  {
    key: "internal-claims-policy",
    title: "Draft internal clinical safety and claims policy",
    description:
      "Write the internal twin of the public posting guardrail: a policy stating that the company sequences claims to evidence and never implies diagnosis, treatment, monitoring, prediction, or outcome improvement without the regulatory pathway and evidence to support it.",
    nextStep: "Convert the posting guardrail principles into an internal claims policy that applies across all channels, not just posts.",
    priority: "MEDIUM",
    stream: "Medtech Direction",
    companyFunction: "compliance"
  },
  {
    key: "intended-use-statements",
    title: "Write intended-use statements for each product stream",
    description:
      "Define a clear intended-use statement for DromaiosEd, ClinicBoss, and the medtech direction. Under TGA rules, public language helps define intended use, so precise statements protect both safety and regulatory standing while most competitors stay vague.",
    nextStep: "Draft one intended-use statement per stream and review each against the posting guardrail before reuse.",
    priority: "HIGH",
    stream: "Medtech Direction",
    companyFunction: "compliance"
  },
  {
    key: "samd-positioning-map",
    title: "Map ClinicBoss against the TGA Software-as-a-Medical-Device framework",
    description:
      "Determine where ClinicBoss sits in the TGA software-based medical device framework: regulated, exempt, or excluded. Factor in the clinical decision support exemptions and the TGA AI-specific guidance issued in February 2026. Knowing exactly where the product sits is both a safety control and a credibility differentiator.",
    nextStep: "Review current ClinicBoss scope against TGA software and CDSS guidance and record the provisional classification with reasoning.",
    priority: "HIGH",
    stream: "Medtech Direction",
    companyFunction: "compliance"
  },
  {
    key: "standards-alignment-targets",
    title: "Record standards alignment targets (NSQHS and Aged Care Quality Standards)",
    description:
      "Note the relevant standards to align with as work touches clinical and aged or community care: the NSQHS Standards from the Australian Commission on Safety and Quality in Health Care, and the Aged Care Quality Standards under the Aged Care Act 2024 (in effect 1 November 2025). Signpost the medtech quality stack (ISO 13485, IEC 62304, ISO 14971) as the destination without building it yet.",
    nextStep: "List the standards each stream will need to align with and the trigger that makes each one relevant.",
    priority: "MEDIUM",
    stream: "Medtech Direction",
    companyFunction: "compliance"
  },
  {
    key: "posting-cadence-loop",
    title: "Set up the weekly green-level posting cadence as a draft-then-approve loop",
    description:
      "Stand up a weekly founder or company post at field-observation or principle level, run as draft-then-approve through the cockpit and governed by the public posting guardrail. Recognition is a frequency game played at low risk; consistency matters more than brilliance.",
    nextStep: "Define the weekly cadence, the draft source, and the approval step, keeping every item inside the guardrail green zone.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "marketing"
  },
  {
    key: "evidence-ladder-tracking",
    title: "Stand up evidence and publication ladder tracking",
    description:
      "Start tracking owned articles, whitepapers, and case learning as they accumulate into a body of work. Publish one rung above where most people would dare and one rung below what the evidence can defend.",
    nextStep: "Create a simple register of publications and the current evidence rung for each, and set the monthly article cadence.",
    priority: "LOW",
    stream: "Company Core",
    companyFunction: "research"
  }
];
