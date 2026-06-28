export type StrategyChecklistPhase = 0 | 1 | 2 | 3;

export type StrategyChecklistPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Human-readable label for each roadmap phase, used when seeding and in any phase UI. */
export const STRATEGY_PHASE_LABELS: Record<StrategyChecklistPhase, string> = {
  0: "Foundations",
  1: "Credible presence",
  2: "Earned authority",
  3: "Recognised company"
};

export type StrategyChecklistItem = {
  /** Phase of the authority and trust roadmap this item belongs to. */
  phase: StrategyChecklistPhase;
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
 * The authority and trust roadmap, expressed as trackable cockpit actions across all four
 * phases (0 Foundations, 1 Credible presence, 2 Earned authority, 3 Recognised company).
 *
 * Source of truth for the strategy itself is `Dromaios_Labs_authority_and_trust_strategy.md`.
 * These items are seeded as `Action` records (source USER, status OPEN) so the founder can
 * track them on the Today board and Actions register and move them through the normal
 * action lifecycle and weekly governance review.
 *
 * Constraints kept in line with the public posting guardrail and AI safety defaults:
 * none of these items carry credentials, outcome claims, or clinical/regulatory claims.
 */
export const authorityTrustChecklist: StrategyChecklistItem[] = [
  // Phase 0 - Foundations (credible from day one)
  {
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
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
    phase: 0,
    key: "evidence-ladder-tracking",
    title: "Stand up evidence and publication ladder tracking",
    description:
      "Start tracking owned articles, whitepapers, and case learning as they accumulate into a body of work. Publish one rung above where most people would dare and one rung below what the evidence can defend.",
    nextStep: "Create a simple register of publications and the current evidence rung for each, and set the monthly article cadence.",
    priority: "LOW",
    stream: "Company Core",
    companyFunction: "research"
  },

  // Phase 1 - Credible presence (recognised as serious)
  {
    phase: 1,
    key: "industry-body-membership",
    title: "Join 1-2 relevant industry bodies and participate visibly",
    description:
      "Take up membership in one or two bodies that confer credibility and introductions: the Medical Software Industry Association, AusBiotech, ANDHealth, and an aged or community-care peak body. Membership and visible participation are themselves trust signals.",
    nextStep: "Shortlist the most relevant bodies, confirm one membership, and book the first event or working-group to attend.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "marketing"
  },
  {
    phase: 1,
    key: "monthly-article-rhythm",
    title: "Establish the monthly owned-article publishing rhythm",
    description:
      "Move beyond weekly field-observation posts to one deeper owned article or whitepaper each month at the structured-insight or anonymised-case-learning rung. These accumulate into a defensible body of work over time.",
    nextStep: "Set a monthly article slot, draft a rolling topic backlog, and run each piece through the posting guardrail.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "marketing"
  },
  {
    phase: 1,
    key: "first-grant-or-accelerator",
    title: "Submit a first grant or accelerator application",
    description:
      "Apply to a credible program such as the MRFF 2026 BioMedTech Incubator stream, the broader Medical Research Commercialisation initiative, or an ANDHealth digital-health program. A competitive grant or accelerator place is third-party validation as much as funding, regardless of the outcome.",
    nextStep: "Pick the best-fit live program, confirm eligibility and timing, and prepare a first application.",
    priority: "MEDIUM",
    stream: "Medtech Direction",
    companyFunction: "research"
  },
  {
    phase: 1,
    key: "scale-dromaiosed-delivery",
    title: "Scale DromaiosEd delivery as the fastest-to-authority stream",
    description:
      "Lean into education delivery, which requires no product claims and is the quickest route to demonstrable authority in safety and workforce capability. Real delivery builds reputation and surfaces the workflow learning that feeds the other streams.",
    nextStep: "Confirm the next education offerings, delivery dates, and a feedback loop that captures workflow learning.",
    priority: "HIGH",
    stream: "DromaiosEd",
    companyFunction: "delivery"
  },
  {
    phase: 1,
    key: "first-speaking-slot",
    title: "Secure a first speaking slot or panel on safety or education",
    description:
      "Target an early speaking or panel opportunity on safety, compliance, or education topics, where the company has the most standing. Speaking is a high-credibility, guardrail-safe authority signal.",
    nextStep: "Identify suitable events or webinars, pitch a talk on a safety or education theme, and confirm one slot.",
    priority: "LOW",
    stream: "Company Core",
    companyFunction: "marketing"
  },

  // Phase 2 - Earned authority (sought out)
  {
    phase: 2,
    key: "iso-27001-certification",
    title: "Pursue ISO 27001 certification (with ISO 27701 for privacy)",
    description:
      "Begin formal ISO 27001 certification, adding ISO 27701 for privacy, once the company sells to organisations. Treat it as a sales enabler rather than a vanity badge; it is now the baseline expectation for technology vendors serving Australian healthcare.",
    nextStep: "Scope the ISMS, close the gaps from the Essential Eight baseline, and engage a certification body.",
    priority: "HIGH",
    stream: "Company Core",
    companyFunction: "compliance"
  },
  {
    phase: 2,
    key: "first-clinicboss-pilots",
    title: "Run the first ClinicBoss pilots (narrow and testable)",
    description:
      "Start one or two narrow, useful, testable pilots on real workflows. Define what better looks like up front and measure against it, keeping all public language inside the posting guardrail until results are approved.",
    nextStep: "Select one or two pilot sites and workflows, agree success measures, and set the pilot start and review dates.",
    priority: "HIGH",
    stream: "ClinicBoss",
    companyFunction: "product"
  },
  {
    phase: 2,
    key: "anonymised-case-learning",
    title: "Publish anonymised case learning from pilots",
    description:
      "Once pilots run, publish what was learned at the anonymised-case-learning rung, with outcome numbers redacted until they are measured and approved for release. This raises authority without breaching the claims guardrail.",
    nextStep: "Draft a what-we-learned piece per pilot, redact unapproved numbers, and review against the posting guardrail.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "marketing"
  },
  {
    phase: 2,
    key: "award-or-grant-win",
    title: "Pursue an award shortlist or a competitive grant win",
    description:
      "Enter awards the company can honestly win (founder, emerging company, safety or education) and push a competitive grant to a win. A shortlist or grant win is a durable authority asset and independent validation.",
    nextStep: "Identify the best-fit award categories and grant rounds, and prepare strong submissions for each.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "marketing"
  },

  // Phase 3 - Recognised company (the standing to lead the conversation)
  {
    phase: 3,
    key: "publish-measured-evidence",
    title: "Publish measured, approved evidence from pilots",
    description:
      "Move to the formal-evidence rung: publish measured pilot results that have cleared internal claims review, and where it fits the medtech path, pursue grey-literature or peer-reviewed publication. This is the evidence that lets claims finally match ambition.",
    nextStep: "Confirm which pilot results are measured and approved for release, then prepare the publications.",
    priority: "HIGH",
    stream: "ClinicBoss",
    companyFunction: "research"
  },
  {
    phase: 3,
    key: "advance-medtech-quality-path",
    title: "Advance the medtech quality and regulatory path visibly",
    description:
      "Begin building the medtech quality stack (ISO 13485 quality management, IEC 62304 software lifecycle, ISO 14971 risk management) and progress the TGA pathway for the relevant product, so the medtech direction can be discussed with the work visibly underway rather than as a claim.",
    nextStep: "Define the target quality-system scope and the TGA pathway, and schedule the first concrete steps.",
    priority: "HIGH",
    stream: "Medtech Direction",
    companyFunction: "compliance"
  },
  {
    phase: 3,
    key: "named-reference-partners",
    title: "Secure named reference customers or partners",
    description:
      "Convert successful pilots and relationships into reference customers or partners willing to be named publicly. Named references are among the strongest trust signals and unlock larger conversations.",
    nextStep: "Identify the best candidates, agree what can be said publicly, and confirm their consent to be named.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "sales"
  },
  {
    phase: 3,
    key: "recognised-thought-leadership",
    title: "Establish a recognised voice in safety and operational-care conversations",
    description:
      "Build to the point where others cite the company's framing and clinicians, operators, and peak bodies seek its view on safety, compliance, and operational care. Sustain repeat speaking and an expanded advisory presence to hold the position.",
    nextStep: "Plan a sustained programme of speaking, contributed thinking, and advisory engagement on the core themes.",
    priority: "MEDIUM",
    stream: "Company Core",
    companyFunction: "marketing"
  }
];
