import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  launchpadSystemKey,
  loadLaunchpadSystemMetadata,
  type LaunchpadSystemMetadata
} from "../src/lib/launchpad-system-metadata";

const prisma = new PrismaClient();

const streams = [
  ["DromaiosEd", "Course operations, delivery, venues, learners, and education products."],
  ["ClinicBoss", "Product work, pilots, risks, roadmap, and operational software."],
  ["HIL/Skool", "Healthcare Innovation Labs tools, community, content, and experiments."],
  ["Medtech Direction", "Evidence, IP, regulatory guardrails, and long-term medtech work."],
  ["Company Core", "Finance, legal, admin, governance, risk, infrastructure, and founder workload."]
] as const;

const functions = [
  ["finance", "Cash, invoices, tax, subscriptions, runway, and reporting."],
  ["legal", "Contracts, IP, privacy, insurance, and company records."],
  ["compliance", "Regulatory checks, public-claim guardrails, and due obligations."],
  ["admin", "Company maintenance, tooling, accounts, domains, and housekeeping."],
  ["sales", "Leads, proposals, follow-ups, partnerships, and waitlists."],
  ["marketing", "LinkedIn, owned articles, campaigns, and public positioning."],
  ["delivery", "Course delivery, materials, comms, venues, and feedback loops."],
  ["product", "Product roadmap, technical work, feedback, and release readiness."],
  ["research", "Evidence, source library, learning, experiments, and technical discovery."],
  ["governance", "Weekly review, decision log, risk register, and priority resets."],
  ["risk", "Known risks, mitigations, and review dates."],
  ["founder workload", "Energy, capacity, focus, and founder operating rhythm."]
] as const;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@dromaios.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const adminName = process.env.ADMIN_NAME ?? "Dromaios Admin";
  const launchpadMetadata = loadLaunchpadSystemMetadata();

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash, role: UserRole.ADMIN },
    create: { email: adminEmail, name: adminName, passwordHash, role: UserRole.ADMIN }
  });

  for (const [index, [name, description]] of streams.entries()) {
    await prisma.stream.upsert({
      where: { name },
      update: { description, sortOrder: index + 1 },
      create: { name, description, sortOrder: index + 1 }
    });
  }

  for (const [index, [name, description]] of functions.entries()) {
    await prisma.companyFunction.upsert({
      where: { name },
      update: { description, sortOrder: index + 1 },
      create: { name, description, sortOrder: index + 1 }
    });
  }

  for (const system of launchpadMetadata.systems) {
    const existing = await prisma.launchpadLink.findFirst({ where: { name: system.name, group: system.group } });
    const imported = launchpadMetadata.importedKeys.has(launchpadSystemKey(system));
    if (existing) {
      await prisma.launchpadLink.update({
        where: { id: existing.id },
        data: {
          url: system.url,
          description: system.description,
          ...metadataUpdateForExisting(existing, system, imported)
        }
      });
    } else {
      await prisma.launchpadLink.create({ data: metadataForCreate(system) });
    }
  }

  await seedGovernance();
}

async function seedGovernance() {
  const [riskCount, decisionCount] = await Promise.all([prisma.risk.count(), prisma.decision.count()]);

  if (riskCount === 0) {
    const riskFunction = await prisma.companyFunction.findUnique({ where: { name: "risk" } });
    await prisma.risk.createMany({
      data: [
        {
          issue: "Key supplier or platform renewal lapses without notice",
          severity: "HIGH",
          status: "OPEN",
          mitigation: "Track renewals in Launchpad and run the renewal reminder automation weekly.",
          companyFunctionId: riskFunction?.id ?? null
        },
        {
          issue: "Founder workload concentration creates single point of failure",
          severity: "MEDIUM",
          status: "OPEN",
          mitigation: "Capture recurring tasks as automations and document operating procedures.",
          companyFunctionId: riskFunction?.id ?? null
        }
      ]
    });
  }

  if (decisionCount === 0) {
    await prisma.decision.createMany({
      data: [
        {
          decision: "Run Dromaios Cockpit local/VPN-first before any public hardening",
          rationale: "Keeps sensitive company data off public infrastructure while the operating model stabilises.",
          affectedArea: "admin"
        },
        {
          decision: "Default the assistant to Ollama for private company-memory work",
          rationale: "Avoids sending sensitive context to cloud AI unless privacy rules explicitly allow it.",
          affectedArea: "product"
        }
      ]
    });
  }
}

function metadataForCreate(system: LaunchpadSystemMetadata) {
  return {
    name: system.name,
    url: system.url,
    group: system.group,
    description: system.description,
    owner: system.owner,
    cost: system.cost,
    renewalAt: dateOrNull(system.renewalAt),
    loginNote: system.loginNote,
    riskLevel: system.riskLevel,
    sensitive: system.sensitive
  };
}

function metadataUpdateForExisting(
  existing: {
    cost: unknown;
    renewalAt: Date | null;
    loginNote: string | null;
    riskLevel: string;
    owner: string | null;
    sensitive: boolean;
  },
  system: LaunchpadSystemMetadata,
  imported: boolean
) {
  const update: Partial<ReturnType<typeof metadataForCreate>> = {};

  if (imported || !existing.owner?.trim()) update.owner = system.owner;
  if (imported || existing.cost === null || existing.cost === undefined) update.cost = system.cost;
  if (imported || !existing.renewalAt) update.renewalAt = dateOrNull(system.renewalAt);
  if (imported || !existing.loginNote?.trim()) update.loginNote = system.loginNote;
  if (imported || existing.riskLevel === "LOW") update.riskLevel = system.riskLevel;
  if (imported || (!existing.sensitive && system.sensitive)) update.sensitive = system.sensitive;

  return update;
}

function dateOrNull(date: string | null) {
  return date ? new Date(`${date}T00:00:00.000Z`) : null;
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
