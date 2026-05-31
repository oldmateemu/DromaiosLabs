import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RiskLevel } from "@prisma/client";

export type LaunchpadSystemMetadata = {
  name: string;
  url: string;
  group: string;
  description: string;
  owner: string;
  cost: string | null;
  renewalAt: string | null;
  riskLevel: RiskLevel;
  loginNote: string;
  sensitive: boolean;
};

export type LaunchpadSystemMetadataOverride = Pick<LaunchpadSystemMetadata, "name" | "group"> &
  Partial<Omit<LaunchpadSystemMetadata, "name" | "group">>;

export type LoadedLaunchpadSystemMetadata = {
  systems: LaunchpadSystemMetadata[];
  importedKeys: Set<string>;
  importPath?: string;
};

export const DEFAULT_LAUNCHPAD_METADATA_PATH = "prisma/launchpad-system-metadata.local.json";

export const CORE_LAUNCHPAD_SYSTEMS: LaunchpadSystemMetadata[] = [
  {
    name: "Xero",
    url: "https://www.xero.com/",
    group: "Money",
    description: "Accounting, reconciliation, BAS/GST source of truth, and business financial records.",
    owner: "Callum",
    cost: null,
    renewalAt: null,
    riskLevel: RiskLevel.HIGH,
    loginNote: "Credential location: password manager entry for Xero admin; keep MFA and recovery details there.",
    sensitive: true
  },
  {
    name: "Airwallex",
    url: "https://www.airwallex.com/",
    group: "Money",
    description: "Business payments, cards, FX, and account access.",
    owner: "Callum",
    cost: "0.00",
    renewalAt: null,
    riskLevel: RiskLevel.HIGH,
    loginNote: "Credential location: password manager entry for Airwallex admin; card and banking changes stay manual.",
    sensitive: true
  },
  {
    name: "Lawpath",
    url: "https://lawpath.com.au/",
    group: "Legal/Admin",
    description: "Legal documents, company support, contracts, and compliance-adjacent admin.",
    owner: "Callum",
    cost: null,
    renewalAt: null,
    riskLevel: RiskLevel.HIGH,
    loginNote: "Credential location: password manager entry for Lawpath admin; store legal records outside the cockpit.",
    sensitive: true
  },
  {
    name: "Skool",
    url: "https://www.skool.com/",
    group: "Community/Sales",
    description: "Healthcare Innovation Labs community, course audience, member comms, and public proof layer.",
    owner: "Callum",
    cost: null,
    renewalAt: null,
    riskLevel: RiskLevel.MEDIUM,
    loginNote: "Credential location: password manager entry for Skool owner/admin account; keep member exports controlled.",
    sensitive: true
  },
  {
    name: "ChatGPT",
    url: "https://chatgpt.com/",
    group: "AI/Workbench",
    description: "Cloud AI drafting, strategy, research assistance, and review support.",
    owner: "Callum",
    cost: null,
    renewalAt: null,
    riskLevel: RiskLevel.MEDIUM,
    loginNote: "Credential location: password manager entry for ChatGPT/OpenAI; do not paste secrets or regulated data.",
    sensitive: true
  },
  {
    name: "Ollama",
    url: "http://localhost:11434/",
    group: "AI/Workbench",
    description: "Local AI runtime for private drafting and offline experiments.",
    owner: "Callum",
    cost: "0.00",
    renewalAt: null,
    riskLevel: RiskLevel.LOW,
    loginNote: "Local service only; no cloud login. Track model downloads and workstation access separately.",
    sensitive: false
  },
  {
    name: "GitHub",
    url: "https://github.com/",
    group: "Product",
    description: "Code repositories, issues, pull requests, automation secrets, and product evidence trails.",
    owner: "Callum",
    cost: "0.00",
    renewalAt: null,
    riskLevel: RiskLevel.HIGH,
    loginNote: "Credential location: password manager entry for GitHub; protect MFA, recovery codes, and repo secrets.",
    sensitive: true
  },
  {
    name: "Hetzner",
    url: "https://console.hetzner.cloud/",
    group: "Infrastructure",
    description: "Server hosting, infrastructure billing, network controls, and deployment targets.",
    owner: "Callum",
    cost: null,
    renewalAt: null,
    riskLevel: RiskLevel.CRITICAL,
    loginNote: "Credential location: password manager entry for Hetzner Cloud; infrastructure changes require deliberate review.",
    sensitive: true
  }
];

export function launchpadSystemKey(system: Pick<LaunchpadSystemMetadata, "name" | "group">) {
  return `${system.name.trim().toLowerCase()}::${system.group.trim().toLowerCase()}`;
}

export function mergeLaunchpadSystemMetadata(
  overrides: LaunchpadSystemMetadataOverride[] = [],
  baseSystems: LaunchpadSystemMetadata[] = CORE_LAUNCHPAD_SYSTEMS
) {
  const systemsByKey = new Map(baseSystems.map((system) => [launchpadSystemKey(system), system]));

  for (const override of overrides) {
    const key = launchpadSystemKey(override);
    const current = systemsByKey.get(key);
    if (!current) {
      throw new Error(`Launchpad metadata import contains an unknown seeded system: ${override.name} (${override.group}).`);
    }
    systemsByKey.set(key, { ...current, ...override });
  }

  return Array.from(systemsByKey.values());
}

export function parseLaunchpadSystemMetadataImport(input: unknown): LaunchpadSystemMetadataOverride[] {
  const systems = Array.isArray(input) ? input : readSystemsArray(input);

  return systems.map((raw, index) => {
    if (!isRecord(raw)) {
      throw new Error(`Launchpad metadata import system at index ${index} must be an object.`);
    }

    const override: LaunchpadSystemMetadataOverride = {
      name: requiredString(raw.name, `systems[${index}].name`),
      group: requiredString(raw.group, `systems[${index}].group`)
    };

    assignOptionalString(raw, override, "url", index);
    assignOptionalString(raw, override, "description", index);
    assignOptionalString(raw, override, "owner", index);
    assignOptionalString(raw, override, "loginNote", index);
    assignOptionalCost(raw, override, index);
    assignOptionalRenewal(raw, override, index);
    assignOptionalRisk(raw, override, index);
    assignOptionalBoolean(raw, override, "sensitive", index);

    return override;
  });
}

export function loadLaunchpadSystemMetadata({
  cwd = process.cwd(),
  metadataFilePath = process.env.LAUNCHPAD_SYSTEM_METADATA_FILE
}: {
  cwd?: string;
  metadataFilePath?: string;
} = {}): LoadedLaunchpadSystemMetadata {
  const explicitPath = metadataFilePath?.trim();
  const importPath = explicitPath ? resolve(cwd, explicitPath) : resolve(cwd, DEFAULT_LAUNCHPAD_METADATA_PATH);

  if (!existsSync(importPath)) {
    if (explicitPath) {
      throw new Error(`Launchpad metadata import file was not found: ${importPath}`);
    }
    return { systems: CORE_LAUNCHPAD_SYSTEMS, importedKeys: new Set() };
  }

  const imported = parseLaunchpadSystemMetadataImport(JSON.parse(readFileSync(importPath, "utf8")));
  return {
    systems: mergeLaunchpadSystemMetadata(imported),
    importedKeys: new Set(imported.map(launchpadSystemKey)),
    importPath
  };
}

function readSystemsArray(input: unknown) {
  if (!isRecord(input) || !Array.isArray(input.systems)) {
    throw new Error("Launchpad metadata import must be an array or an object with a systems array.");
  }
  return input.systems;
}

function assignOptionalString(
  source: Record<string, unknown>,
  target: LaunchpadSystemMetadataOverride,
  key: "url" | "description" | "owner" | "loginNote",
  index: number
) {
  if (!hasOwn(source, key)) return;
  target[key] = requiredString(source[key], `systems[${index}].${key}`);
}

function assignOptionalCost(source: Record<string, unknown>, target: LaunchpadSystemMetadataOverride, index: number) {
  if (!hasOwn(source, "cost")) return;
  const value = source.cost;
  if (value === null) {
    target.cost = null;
    return;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`systems[${index}].cost must be a decimal string, number, or null.`);
  }
  target.cost = String(value).trim();
}

function assignOptionalRenewal(source: Record<string, unknown>, target: LaunchpadSystemMetadataOverride, index: number) {
  if (!hasOwn(source, "renewalAt")) return;
  const value = source.renewalAt;
  if (value === null) {
    target.renewalAt = null;
    return;
  }
  const date = requiredString(value, `systems[${index}].renewalAt`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`systems[${index}].renewalAt must use YYYY-MM-DD format.`);
  }
  target.renewalAt = date;
}

function assignOptionalRisk(source: Record<string, unknown>, target: LaunchpadSystemMetadataOverride, index: number) {
  if (!hasOwn(source, "riskLevel")) return;
  const value = requiredString(source.riskLevel, `systems[${index}].riskLevel`);
  if (!Object.values(RiskLevel).includes(value as RiskLevel)) {
    throw new Error(`systems[${index}].riskLevel must be LOW, MEDIUM, HIGH, or CRITICAL.`);
  }
  target.riskLevel = value as RiskLevel;
}

function assignOptionalBoolean(
  source: Record<string, unknown>,
  target: LaunchpadSystemMetadataOverride,
  key: "sensitive",
  index: number
) {
  if (!hasOwn(source, key)) return;
  if (typeof source[key] !== "boolean") {
    throw new Error(`systems[${index}].${key} must be true or false.`);
  }
  target[key] = source[key];
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(source: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(source, key);
}
