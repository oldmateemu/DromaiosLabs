import bcrypt from "bcryptjs";
import { ActionSource, ActionStatus, PrismaClient, Priority, UserRole } from "@prisma/client";
import {
  launchpadSystemKey,
  loadLaunchpadSystemMetadata,
  type LaunchpadSystemMetadata
} from "../src/lib/launchpad-system-metadata";
import { authorityTrustChecklist, STRATEGY_PHASE_LABELS } from "../src/lib/strategy-checklist";

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

  const adminUser = await prisma.user.upsert({
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

  await seedStrategyChecklist(adminUser.id);
}

async function seedStrategyChecklist(adminUserId: string) {
  const [streamRecords, functionRecords] = await Promise.all([
    prisma.stream.findMany(),
    prisma.companyFunction.findMany()
  ]);
  const streamByName = new Map(streamRecords.map((stream) => [stream.name, stream.id]));
  const functionByName = new Map(functionRecords.map((fn) => [fn.name, fn.id]));

  for (const item of authorityTrustChecklist) {
    const existing = await prisma.action.findFirst({
      where: { title: item.title, source: ActionSource.USER }
    });
    if (existing) continue;

    // Phase 0 is live work (OPEN). Later phases are seeded as WAITING so they sit in the
    // backlog, out of the active Today focus, until their phase is activated by moving the
    // item to OPEN.
    const status = item.phase === 0 ? ActionStatus.OPEN : ActionStatus.WAITING;
    const description = `Phase ${item.phase} - ${STRATEGY_PHASE_LABELS[item.phase]}.\n\n${item.description}`;

    await prisma.action.create({
      data: {
        title: item.title,
        description,
        nextStep: item.nextStep,
        priority: item.priority as Priority,
        status,
        source: ActionSource.USER,
        streamId: streamByName.get(item.stream) ?? null,
        companyFunctionId: functionByName.get(item.companyFunction) ?? null,
        createdById: adminUserId
      }
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
