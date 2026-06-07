// Company setup checklist definition for Dromaios Labs.
//
// This is the source of truth for "what does the company still need to set up".
// Each item is seeded into the cockpit as an Action (see prisma/seed.ts) so that
// status, due dates, and notes are tracked alongside the rest of company work.
//
// IMPORTANT: This is operational scaffolding to help track setup, not formal
// legal, tax, insurance, or regulatory advice. Confirm specifics with the
// engaged accountant, solicitor, and insurer before relying on any item.

export type SetupPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SetupItemStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "WAITING"
  | "DONE"
  | "CANCELLED"
  | "NOT_STARTED";

export type SetupChecklistItem = {
  key: string;
  title: string;
  category: string;
  /** Must match a seeded CompanyFunction.name in prisma/seed.ts. */
  companyFunction: string;
  priority: SetupPriority;
  description: string;
  nextStep: string;
  sensitive: boolean;
};

// Tailored for an Australia-first healthcare company that is registered and
// early-operating (ABN/company exists; Xero, Airwallex, and Lawpath in use).
export const COMPANY_SETUP_CHECKLIST: SetupChecklistItem[] = [
  // --- Legal & structure -------------------------------------------------
  {
    key: "legal-asic-current",
    title: "Confirm ASIC company details are current",
    category: "Legal & structure",
    companyFunction: "legal",
    priority: "HIGH",
    description:
      "Verify the Pty Ltd registration, ACN, registered office, principal place of business, directors, and share structure are correct and recorded in Lawpath/ASIC.",
    nextStep: "Open the latest ASIC company statement and reconcile every field against your records.",
    sensitive: true
  },
  {
    key: "legal-director-id",
    title: "Confirm Director Identification Number (DIN) is held",
    category: "Legal & structure",
    companyFunction: "legal",
    priority: "HIGH",
    description:
      "Every Australian company director must hold a Director ID. Confirm it is issued and stored with company records.",
    nextStep: "Locate the DIN confirmation; if missing, apply via Australian Business Registry Services.",
    sensitive: true
  },
  {
    key: "legal-constitution-shareholders",
    title: "Company constitution and shareholders agreement in place",
    category: "Legal & structure",
    companyFunction: "legal",
    priority: "MEDIUM",
    description:
      "Confirm a constitution exists and, if there are or will be co-founders/investors, a shareholders agreement covering vesting, decisions, exits, and IP assignment.",
    nextStep: "Review current documents in Lawpath; flag gaps for a solicitor if equity is shared.",
    sensitive: true
  },
  {
    key: "legal-ip-assignment",
    title: "IP ownership and assignment locked for all contributors",
    category: "Legal & structure",
    companyFunction: "legal",
    priority: "HIGH",
    description:
      "Ensure every contractor, developer, and content contributor has signed IP assignment so the company owns code, course material, and brand assets.",
    nextStep: "List everyone who has contributed; confirm a signed assignment clause exists for each.",
    sensitive: true
  },
  {
    key: "legal-trademark",
    title: "Trademark Dromaios Labs and key product names",
    category: "Legal & structure",
    companyFunction: "legal",
    priority: "MEDIUM",
    description:
      "Search IP Australia and file trademarks for 'Dromaios Labs' and product names (DromaiosEd, ClinicBoss) in the relevant classes before public scale-up.",
    nextStep: "Run an IP Australia trademark search; shortlist classes for education and software.",
    sensitive: false
  },
  {
    key: "legal-contract-templates",
    title: "Core contract templates ready (services, education, NDA, contractor)",
    category: "Legal & structure",
    companyFunction: "legal",
    priority: "HIGH",
    description:
      "Have reusable, reviewed templates for client services, education delivery, mutual NDA, and contractor agreements so every deal starts from a safe baseline.",
    nextStep: "Generate/confirm each template in Lawpath and store final versions in one place.",
    sensitive: false
  },

  // --- Finance & tax -----------------------------------------------------
  {
    key: "finance-gst",
    title: "Confirm GST registration and BAS cadence",
    category: "Finance & tax",
    companyFunction: "finance",
    priority: "HIGH",
    description:
      "Decide/confirm GST registration (required at $75k turnover, optional below) and set the BAS lodgement cadence in Xero.",
    nextStep: "Check current GST status in the ATO portal and confirm BAS settings in Xero.",
    sensitive: true
  },
  {
    key: "finance-bank-feed",
    title: "Airwallex reconciled into Xero with live bank feed",
    category: "Finance & tax",
    companyFunction: "finance",
    priority: "HIGH",
    description:
      "Make sure business payments flow from Airwallex into Xero and are reconciled regularly so financial records are a single source of truth.",
    nextStep: "Confirm the bank feed is connected and reconcile any outstanding transactions.",
    sensitive: true
  },
  {
    key: "finance-accountant",
    title: "Bookkeeping and tax/BAS accountant engaged",
    category: "Finance & tax",
    companyFunction: "finance",
    priority: "HIGH",
    description:
      "Engage (or confirm) a bookkeeper/accountant responsible for BAS, company tax, and end-of-year obligations so deadlines are not missed.",
    nextStep: "Confirm who owns BAS and tax, and the next lodgement date.",
    sensitive: true
  },
  {
    key: "finance-chart-of-accounts",
    title: "Chart of accounts mapped to company streams",
    category: "Finance & tax",
    companyFunction: "finance",
    priority: "MEDIUM",
    description:
      "Structure Xero tracking categories so income and cost can be read per stream (DromaiosEd, ClinicBoss, HIL/Skool) for clear unit economics.",
    nextStep: "Set up Xero tracking categories matching the operating streams.",
    sensitive: false
  },
  {
    key: "finance-runway",
    title: "Runway and cashflow model maintained",
    category: "Finance & tax",
    companyFunction: "finance",
    priority: "HIGH",
    description:
      "Keep a simple cashflow/runway model showing months of runway, fixed costs, and break-even per stream, updated monthly.",
    nextStep: "Build or refresh a one-page runway model from current Xero balances.",
    sensitive: true
  },
  {
    key: "finance-pricing",
    title: "Pricing and packaging defined for live revenue streams",
    category: "Finance & tax",
    companyFunction: "finance",
    priority: "MEDIUM",
    description:
      "Document pricing and packaging for DromaiosEd courses and any ClinicBoss pilots so quotes are consistent and margins are understood.",
    nextStep: "Write down current prices, what is included, and the margin for each offer.",
    sensitive: false
  },

  // --- Insurance & risk --------------------------------------------------
  {
    key: "insurance-pi",
    title: "Professional indemnity insurance in force",
    category: "Insurance & risk",
    companyFunction: "risk",
    priority: "CRITICAL",
    description:
      "For healthcare education and advisory work, professional indemnity cover is essential. Confirm a policy that matches the actual services delivered.",
    nextStep: "Confirm current PI policy, sum insured, and that the activities described match what you do.",
    sensitive: true
  },
  {
    key: "insurance-public-liability",
    title: "Public liability insurance for in-person delivery",
    category: "Insurance & risk",
    companyFunction: "risk",
    priority: "HIGH",
    description:
      "If courses are delivered in person or at venues, public liability cover protects against third-party injury/damage claims.",
    nextStep: "Confirm a public liability policy covering venue-based course delivery.",
    sensitive: true
  },
  {
    key: "insurance-cyber",
    title: "Cyber insurance assessed",
    category: "Insurance & risk",
    companyFunction: "risk",
    priority: "MEDIUM",
    description:
      "As the company handles personal and potentially health-related data, assess cyber/data-breach insurance against the data you actually hold.",
    nextStep: "Get a quote and decide whether cyber cover is warranted at current data exposure.",
    sensitive: true
  },

  // --- Privacy & data protection ----------------------------------------
  {
    key: "privacy-policy-app",
    title: "Privacy policy and Australian Privacy Principles compliance",
    category: "Privacy & data protection",
    companyFunction: "compliance",
    priority: "HIGH",
    description:
      "Publish a privacy policy and confirm handling of personal/health information meets the Privacy Act 1988 and the Australian Privacy Principles, especially for any clinical or learner data.",
    nextStep: "Confirm a current privacy policy is published and reflects how data is actually collected and used.",
    sensitive: true
  },
  {
    key: "privacy-data-register",
    title: "Data handling and security register maintained",
    category: "Privacy & data protection",
    companyFunction: "compliance",
    priority: "HIGH",
    description:
      "Document where personal/health data lives, who can access it, how long it is kept, and how it is secured (no regulated data to cloud AI by default).",
    nextStep: "List every system holding personal data with access, retention, and location notes.",
    sensitive: true
  },
  {
    key: "privacy-breach-plan",
    title: "Notifiable Data Breach response plan ready",
    category: "Privacy & data protection",
    companyFunction: "compliance",
    priority: "MEDIUM",
    description:
      "Have a simple, written response plan covering containment, assessment, and notification under the Notifiable Data Breaches scheme.",
    nextStep: "Draft a one-page breach response plan with who to contact and the 30-day assessment clock.",
    sensitive: true
  },
  {
    key: "privacy-website-terms",
    title: "Website terms of use and analytics consent",
    category: "Privacy & data protection",
    companyFunction: "compliance",
    priority: "MEDIUM",
    description:
      "Publish website terms of use and ensure cookie/analytics consent is handled appropriately for any tracking used.",
    nextStep: "Confirm terms of use are published and analytics consent is configured.",
    sensitive: false
  },

  // --- Compliance & claims ----------------------------------------------
  {
    key: "compliance-claims-guardrail",
    title: "Public-claims guardrail operationalised",
    category: "Compliance & claims",
    companyFunction: "compliance",
    priority: "HIGH",
    description:
      "Make the posting guardrail a routine step so public claims about outcomes, adoption, clinical impact, or medtech readiness stay aligned with evidence.",
    nextStep: "Confirm every public post runs through the guardrail checker before publishing.",
    sensitive: false
  },
  {
    key: "compliance-tga-samd",
    title: "TGA / Software-as-a-Medical-Device line documented",
    category: "Compliance & claims",
    companyFunction: "compliance",
    priority: "HIGH",
    description:
      "Document where ClinicBoss and the medtech direction sit relative to TGA medical-device regulation so software and claims do not unintentionally cross into regulated 'medical device' territory.",
    nextStep: "Write down the current intended use and the boundary that keeps it out of SaMD scope.",
    sensitive: true
  },
  {
    key: "compliance-content-review",
    title: "Clinical accuracy review process for education content",
    category: "Compliance & claims",
    companyFunction: "compliance",
    priority: "MEDIUM",
    description:
      "Define how course and safety content is reviewed for clinical accuracy and currency before delivery.",
    nextStep: "Document who signs off clinical content and how updates are tracked.",
    sensitive: false
  },

  // --- Brand, web & marketing -------------------------------------------
  {
    key: "marketing-domain-email",
    title: "Primary domain and email hardened (SPF/DKIM/DMARC)",
    category: "Brand, web & marketing",
    companyFunction: "marketing",
    priority: "MEDIUM",
    description:
      "Confirm the company domain, professional email, and email authentication (SPF, DKIM, DMARC) are configured to protect deliverability and brand.",
    nextStep: "Check DNS records for SPF, DKIM, and DMARC and fix any gaps.",
    sensitive: false
  },
  {
    key: "marketing-website",
    title: "Public website live with approved positioning",
    category: "Brand, web & marketing",
    companyFunction: "marketing",
    priority: "MEDIUM",
    description:
      "Publish a website using the approved company statements (positioning, about, how we work) and the claims guardrail language.",
    nextStep: "Draft the site from Dromaios_Labs_company_statements.md and review against the guardrail.",
    sensitive: false
  },
  {
    key: "marketing-linkedin",
    title: "LinkedIn company page and founder profile aligned",
    category: "Brand, web & marketing",
    companyFunction: "marketing",
    priority: "LOW",
    description:
      "Ensure the LinkedIn company page and founder bio match the approved positioning and taglines.",
    nextStep: "Update the company About and founder bio from the approved statements.",
    sensitive: false
  },

  // --- Sales & partnerships ---------------------------------------------
  {
    key: "sales-pipeline",
    title: "Lead and partnership pipeline tracked",
    category: "Sales & partnerships",
    companyFunction: "sales",
    priority: "MEDIUM",
    description:
      "Keep a simple pipeline of leads, pilots, and partnership conversations with next steps and owners so nothing goes cold.",
    nextStep: "Set up a lightweight pipeline (even a board in the cockpit) and add current conversations.",
    sensitive: false
  },
  {
    key: "sales-pilot-flow",
    title: "Discovery → pilot → proposal flow documented",
    category: "Sales & partnerships",
    companyFunction: "sales",
    priority: "LOW",
    description:
      "Document the standard path from discovery call to a narrow, testable pilot to a proposal, using the pilot framing from the company statements.",
    nextStep: "Write the three-step flow and what 'better' looks like for a first pilot.",
    sensitive: false
  },

  // --- Product & delivery -----------------------------------------------
  {
    key: "product-clinicboss-roadmap",
    title: "ClinicBoss roadmap and pilot readiness defined",
    category: "Product & delivery",
    companyFunction: "product",
    priority: "MEDIUM",
    description:
      "Maintain a clear ClinicBoss roadmap, the problem it addresses, and what 'pilot-ready' means before approaching healthcare partners.",
    nextStep: "Write the current roadmap and the criteria for a first pilot.",
    sensitive: false
  },
  {
    key: "delivery-course-checklist",
    title: "DromaiosEd delivery checklist (venue, materials, feedback)",
    category: "Product & delivery",
    companyFunction: "delivery",
    priority: "MEDIUM",
    description:
      "Standardise course delivery: venue/logistics, materials, attendee comms, and a feedback loop that feeds improvements back in.",
    nextStep: "Create a repeatable delivery checklist for the next course run.",
    sensitive: false
  },
  {
    key: "product-infra-hardening",
    title: "Cockpit and infrastructure backups + hardening",
    category: "Product & delivery",
    companyFunction: "product",
    priority: "HIGH",
    description:
      "Ensure the cockpit/Hetzner deployment has backups, restore-tested data, and access controls appropriate to the data it holds.",
    nextStep: "Confirm database backups exist and have been restore-tested at least once.",
    sensitive: true
  },

  // --- Governance & founder operations ----------------------------------
  {
    key: "governance-weekly-review",
    title: "Weekly review rhythm running consistently",
    category: "Governance & founder operations",
    companyFunction: "governance",
    priority: "MEDIUM",
    description:
      "Run the weekly review across compliance, finance, sales, delivery, product, governance, and founder workload so issues surface early.",
    nextStep: "Schedule a fixed weekly review slot and complete the next one in the cockpit.",
    sensitive: false
  },
  {
    key: "governance-risk-register",
    title: "Risk register populated and reviewed",
    category: "Governance & founder operations",
    companyFunction: "risk",
    priority: "MEDIUM",
    description:
      "Capture known company risks with severity, mitigation, and review dates so nothing critical is carried silently.",
    nextStep: "Add the top 5 current risks with mitigations and next review dates.",
    sensitive: false
  },
  {
    key: "founder-operating-cadence",
    title: "Founder operating cadence and capacity guardrails",
    category: "Governance & founder operations",
    companyFunction: "founder workload",
    priority: "LOW",
    description:
      "Define a sustainable operating rhythm and capacity guardrails so founder workload stays visible and manageable.",
    nextStep: "Write down the weekly cadence and the signals that mean you are over capacity.",
    sensitive: false
  }
];

export function normaliseSetupTitle(title: string) {
  return title.trim().toLowerCase();
}

export type SetupItemView = SetupChecklistItem & {
  status: SetupItemStatus;
  done: boolean;
};

export type SetupCategoryView = {
  category: string;
  items: SetupItemView[];
  total: number;
  done: number;
  inProgress: number;
  notStarted: number;
  percentComplete: number;
};

export type SetupChecklistSummary = {
  categories: SetupCategoryView[];
  total: number;
  done: number;
  inProgress: number;
  notStarted: number;
  percentComplete: number;
};

const IN_PROGRESS_STATUSES: ReadonlySet<SetupItemStatus> = new Set([
  "IN_PROGRESS",
  "BLOCKED",
  "WAITING"
]);

/**
 * Builds a grouped progress view of the setup checklist. `statusByTitle` maps a
 * normalised action title to its current status; titles with no matching action
 * are treated as NOT_STARTED.
 */
export function summariseSetupChecklist(
  items: SetupChecklistItem[],
  statusByTitle: Map<string, SetupItemStatus>
): SetupChecklistSummary {
  const categories: SetupCategoryView[] = [];
  const categoryIndex = new Map<string, SetupCategoryView>();

  for (const item of items) {
    const status = statusByTitle.get(normaliseSetupTitle(item.title)) ?? "NOT_STARTED";
    const done = status === "DONE";
    const view: SetupItemView = { ...item, status, done };

    let category = categoryIndex.get(item.category);
    if (!category) {
      category = {
        category: item.category,
        items: [],
        total: 0,
        done: 0,
        inProgress: 0,
        notStarted: 0,
        percentComplete: 0
      };
      categoryIndex.set(item.category, category);
      categories.push(category);
    }

    category.items.push(view);
    category.total += 1;
    if (done) category.done += 1;
    else if (IN_PROGRESS_STATUSES.has(status)) category.inProgress += 1;
    else category.notStarted += 1;
  }

  let total = 0;
  let done = 0;
  let inProgress = 0;
  let notStarted = 0;

  for (const category of categories) {
    category.percentComplete = category.total === 0 ? 0 : Math.round((category.done / category.total) * 100);
    total += category.total;
    done += category.done;
    inProgress += category.inProgress;
    notStarted += category.notStarted;
  }

  return {
    categories,
    total,
    done,
    inProgress,
    notStarted,
    percentComplete: total === 0 ? 0 : Math.round((done / total) * 100)
  };
}

export type OutstandingSetupItem = {
  key: string;
  title: string;
  category: string;
  companyFunction: string;
  priority: SetupPriority;
  status: SetupItemStatus;
};

const PRIORITY_WEIGHT: Record<SetupPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

// Untouched items surface before ones already in flight at the same priority,
// because a not-started high-priority obligation is the bigger gap in a review.
const STATUS_WEIGHT: Record<SetupItemStatus, number> = {
  NOT_STARTED: 0,
  BLOCKED: 1,
  OPEN: 2,
  WAITING: 3,
  IN_PROGRESS: 4,
  DONE: 5,
  CANCELLED: 6
};

/**
 * Highest-priority items that are not yet done, ordered for review attention.
 * Cancelled items are excluded; they were a deliberate decision, not a gap.
 */
export function selectOutstandingSetupItems(
  summary: SetupChecklistSummary,
  limit = 6
): OutstandingSetupItem[] {
  return summary.categories
    .flatMap((category) => category.items)
    .filter((item) => !item.done && item.status !== "CANCELLED")
    .map((item) => ({
      key: item.key,
      title: item.title,
      category: item.category,
      companyFunction: item.companyFunction,
      priority: item.priority,
      status: item.status
    }))
    .sort(
      (a, b) =>
        PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] ||
        STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status] ||
        a.title.localeCompare(b.title)
    )
    .slice(0, limit);
}

export type SetupDraftContext = {
  percentComplete: number;
  done: number;
  total: number;
  inProgress: number;
  notStarted: number;
  criticalOutstanding: number;
  outstanding: OutstandingSetupItem[];
};

/** Condensed setup snapshot for embedding in the weekly review prep draft. */
export function buildSetupDraftContext(summary: SetupChecklistSummary, limit = 6): SetupDraftContext {
  const allOutstanding = selectOutstandingSetupItems(summary, Number.MAX_SAFE_INTEGER);
  return {
    percentComplete: summary.percentComplete,
    done: summary.done,
    total: summary.total,
    inProgress: summary.inProgress,
    notStarted: summary.notStarted,
    criticalOutstanding: allOutstanding.filter(
      (item) => item.priority === "CRITICAL" || item.priority === "HIGH"
    ).length,
    outstanding: allOutstanding.slice(0, limit)
  };
}

export function setupItemStatusLabel(status: SetupItemStatus) {
  const text = status.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
