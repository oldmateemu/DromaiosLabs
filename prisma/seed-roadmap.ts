/**
 * Roadmap seed: loads the Path-to-#1 roadmap milestones into the cockpit as
 * Action records, tagged to their Stream and CompanyFunction.
 *
 * Source of truth: docs/strategy/2026-06-07-path-to-no1-roadmap.md
 *
 * Idempotent: actions are matched by (title, streamId). Re-running updates the
 * existing action (priority, function, owner/measure, phase) rather than
 * creating duplicates. All actions are created as source=USER and status=OPEN;
 * none are sensitive and none trigger automation — this only proposes planning
 * work, consistent with the cockpit safety defaults.
 */
import { PrismaClient, Priority, ActionSource, ActionStatus } from "@prisma/client";

const prisma = new PrismaClient();

type Milestone = {
  ref: string;
  phase: string;
  title: string;
  stream: string;
  func: string;
  owner: string;
  priority: Priority;
  measure: string;
};

const roadmap: Milestone[] = [
  // Phase 0 — Foundations
  {
    ref: "0.1",
    phase: "Phase 0 — Foundations",
    title: "Run public-posting guardrail pass on flagship article + comparison page",
    stream: "Company Core",
    func: "compliance",
    owner: "Founder",
    priority: Priority.HIGH,
    measure: "Both drafts pass the Quick Pre-Post Check in the guardrail doc before anything goes outward."
  },
  {
    ref: "0.2",
    phase: "Phase 0 — Foundations",
    title: "Define de-escalation outcome metrics to measure and publish",
    stream: "DromaiosEd",
    func: "research",
    owner: "Founder",
    priority: Priority.HIGH,
    measure: "Written measurement protocol agreed (incident rate, restraint/Code-Black frequency, staff confidence pre/post)."
  },
  {
    ref: "0.3",
    phase: "Phase 0 — Foundations",
    title: "Stand up evidence/source library for every public claim",
    stream: "Medtech Direction",
    func: "research",
    owner: "Founder",
    priority: Priority.MEDIUM,
    measure: "Source register exists and is linked from public drafts."
  },

  // Phase 1 — Quick wins
  {
    ref: "1.1",
    phase: "Phase 1 — Quick wins",
    title: 'Publish flagship article: "What the evidence actually says about de-escalation training"',
    stream: "DromaiosEd",
    func: "marketing",
    owner: "Founder",
    priority: Priority.CRITICAL,
    measure: 'Article live; ranks for "de-escalation training evidence Australia"; used in 1+ sales conversation.'
  },
  {
    ref: "1.2",
    phase: "Phase 1 — Quick wins",
    title: "Build NDIS + Strengthened-Standards content cluster",
    stream: "DromaiosEd",
    func: "marketing",
    owner: "Founder+Contractor",
    priority: Priority.HIGH,
    measure: "5+ cornerstone pages live (mandatory training, SIRS 24-hr, Action 2.9.6, NDIS Practice Standards, RACGP 6th-ed); organic impressions trending up."
  },
  {
    ref: "1.3",
    phase: "Phase 1 — Quick wins",
    title: "Launch free provider-owner community (HIL/Skool)",
    stream: "HIL/Skool",
    func: "marketing",
    owner: "Founder",
    priority: Priority.HIGH,
    measure: "Community open; 50+ members; 3+ design-partner leads."
  },
  {
    ref: "1.4",
    phase: "Phase 1 — Quick wins",
    title: "Publish neutral competitor-comparison hub",
    stream: "ClinicBoss",
    func: "marketing",
    owner: "Founder+Contractor",
    priority: Priority.MEDIUM,
    measure: 'Comparison page live; ranks for "[competitor] alternative" terms. Keep factual and current.'
  },
  {
    ref: "1.5",
    phase: "Phase 1 — Quick wins",
    title: "Adopt transparent flat-pricing public stance",
    stream: "ClinicBoss",
    func: "marketing",
    owner: "Founder",
    priority: Priority.MEDIUM,
    measure: "Pricing principle published (softened per guardrails) contrasting credit/per-seat models."
  },
  {
    ref: "1.6",
    phase: "Phase 1 — Quick wins",
    title: "Start disciplined review-generation habit from every pilot/interaction",
    stream: "DromaiosEd",
    func: "delivery",
    owner: "Founder",
    priority: Priority.MEDIUM,
    measure: "10+ verified reviews across aggregators within 6 months."
  },
  {
    ref: "1.7",
    phase: "Phase 1 — Quick wins",
    title: 'Target "Power Diary / Zanda alternative" SEO vacuum',
    stream: "ClinicBoss",
    func: "marketing",
    owner: "Founder+Contractor",
    priority: Priority.LOW,
    measure: "Page live and indexed."
  },

  // Phase 2 — Moats
  {
    ref: "2.1",
    phase: "Phase 2 — Moats",
    title: "Build ClinicBoss as compliance-native PMS (audit-readiness in daily workflow)",
    stream: "ClinicBoss",
    func: "product",
    owner: "Founder+Contractor",
    priority: Priority.CRITICAL,
    measure: "Pilot clinic prepares for/passes an audit using the one-click evidence map (training, incidents, policies linked to Standard outcomes)."
  },
  {
    ref: "2.2",
    phase: "Phase 2 — Moats",
    title: 'Ship guaranteed one-click data export ("you own your data")',
    stream: "ClinicBoss",
    func: "product",
    owner: "Founder+Contractor",
    priority: Priority.HIGH,
    measure: "Export feature shipped and demonstrated in pilot; weaponises Helix/MediRecords export-failure complaints."
  },
  {
    ref: "2.3",
    phase: "Phase 2 — Moats",
    title: "Guarantee Australian data residency + human AU-timezone support",
    stream: "ClinicBoss",
    func: "product",
    owner: "Founder+Contractor",
    priority: Priority.HIGH,
    measure: "AU hosting documented; support SLA defined (addresses the #1 market complaint)."
  },
  {
    ref: "2.4",
    phase: "Phase 2 — Moats",
    title: "Run measured de-escalation outcome study with university / ISCRR-type partner",
    stream: "DromaiosEd",
    func: "research",
    owner: "Partner",
    priority: Priority.CRITICAL,
    measure: "Study underway; pre/post data being collected against the agreed protocol."
  },
  {
    ref: "2.5",
    phase: "Phase 2 — Moats",
    title: "Build dual-sector audit-ready compliance mapping (Aged Care + NDIS)",
    stream: "ClinicBoss",
    func: "product",
    owner: "Founder+Contractor",
    priority: Priority.HIGH,
    measure: "Dual mapping shipped; validated against both Aged Care Quality Standards and NDIS Practice Standards."
  },
  {
    ref: "2.6",
    phase: "Phase 2 — Moats",
    title: "Prototype compliance-grade AI documentation tool (note + funding justification)",
    stream: "HIL/Skool",
    func: "product",
    owner: "Founder+Contractor",
    priority: Priority.MEDIUM,
    measure: "Working prototype; intended-purpose statement reviewed against TGA Excluded/Exempt rules."
  },
  {
    ref: "2.7",
    phase: "Phase 2 — Moats",
    title: "Lock medtech regulatory guardrails (intended-purpose, human-in-loop, consent, AHPRA)",
    stream: "Medtech Direction",
    func: "compliance",
    owner: "Founder",
    priority: Priority.HIGH,
    measure: "Documented intended-purpose + governance statement for each tool."
  },

  // Phase 3 — Durable #1
  {
    ref: "3.1",
    phase: "Phase 3 — Durable #1",
    title: "Fuse training + compliance + operations into one evidence-linked source of truth",
    stream: "ClinicBoss",
    func: "product",
    owner: "Founder+Contractor",
    priority: Priority.CRITICAL,
    measure: "1+ reference customer running training, compliance and operations through Dromaios."
  },
  {
    ref: "3.2",
    phase: "Phase 3 — Durable #1",
    title: "Build proprietary Australian benchmark dataset into a recurring data-report asset",
    stream: "HIL/Skool",
    func: "research",
    owner: "Founder+Contractor",
    priority: Priority.HIGH,
    measure: "First published benchmark report (utilisation, incidents, claim turnaround, de-escalation outcomes); inbound links/citations."
  },
  {
    ref: "3.3",
    phase: "Phase 3 — Durable #1",
    title: "Convert de-escalation outcome study into published proof + reference case",
    stream: "DromaiosEd",
    func: "research",
    owner: "Partner",
    priority: Priority.HIGH,
    measure: "Results published; cited in sales."
  },
  {
    ref: "3.4",
    phase: "Phase 3 — Durable #1",
    title: "Establish responsible-medtech credibility narrative as the brand moat",
    stream: "Medtech Direction",
    func: "marketing",
    owner: "Founder",
    priority: Priority.MEDIUM,
    measure: "Evidence-first positioning consistently reflected across public channels."
  }
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const m of roadmap) {
    const stream = await prisma.stream.findUnique({ where: { name: m.stream } });
    if (!stream) {
      console.warn(`Skipping ${m.ref}: stream "${m.stream}" not found. Run the base seed first (pnpm db:seed).`);
      continue;
    }
    const companyFunction = await prisma.companyFunction.findUnique({ where: { name: m.func } });

    const description = `[Roadmap ${m.ref} · ${m.phase}] See docs/strategy/2026-06-07-path-to-no1-roadmap.md.`;
    const nextStep = `Owner: ${m.owner}. Success: ${m.measure}`;

    const existing = await prisma.action.findFirst({
      where: { title: m.title, streamId: stream.id }
    });

    if (existing) {
      await prisma.action.update({
        where: { id: existing.id },
        data: {
          description,
          nextStep,
          priority: m.priority,
          companyFunctionId: companyFunction?.id ?? existing.companyFunctionId
        }
      });
      updated += 1;
    } else {
      await prisma.action.create({
        data: {
          title: m.title,
          description,
          nextStep,
          priority: m.priority,
          status: ActionStatus.OPEN,
          source: ActionSource.USER,
          sensitive: false,
          streamId: stream.id,
          companyFunctionId: companyFunction?.id ?? null
        }
      });
      created += 1;
    }
  }

  console.log(`Roadmap seed complete: ${created} actions created, ${updated} updated.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
