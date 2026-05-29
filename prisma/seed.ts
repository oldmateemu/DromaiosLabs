import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

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

const launchpadLinks = [
  ["Xero", "https://www.xero.com/", "Money", "Accounting and reconciliation"],
  ["Airwallex", "https://www.airwallex.com/", "Money", "Business payments and cards"],
  ["Lawpath", "https://lawpath.com.au/", "Legal/Admin", "Legal documents and company support"],
  ["Skool", "https://www.skool.com/", "Community/Sales", "Community and course audience"],
  ["ChatGPT", "https://chatgpt.com/", "AI/Workbench", "Cloud AI drafting and strategy"],
  ["Ollama", "http://localhost:11434/", "AI/Workbench", "Local AI runtime"],
  ["GitHub", "https://github.com/", "Product", "Code repositories and issues"],
  ["Hetzner", "https://console.hetzner.cloud/", "Infrastructure", "Server hosting"]
] as const;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@dromaios.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const adminName = process.env.ADMIN_NAME ?? "Dromaios Admin";

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

  for (const [name, url, group, description] of launchpadLinks) {
    const existing = await prisma.launchpadLink.findFirst({ where: { name, group } });
    if (existing) {
      await prisma.launchpadLink.update({ where: { id: existing.id }, data: { url, description } });
    } else {
      await prisma.launchpadLink.create({ data: { name, url, group, description } });
    }
  }
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
