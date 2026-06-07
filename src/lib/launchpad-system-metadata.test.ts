import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RiskLevel } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CORE_LAUNCHPAD_SYSTEMS,
  DEFAULT_LAUNCHPAD_METADATA_PATH,
  launchpadSystemKey,
  loadLaunchpadSystemMetadata,
  mergeLaunchpadSystemMetadata,
  parseLaunchpadSystemMetadataImport
} from "./launchpad-system-metadata";

describe("CORE_LAUNCHPAD_SYSTEMS", () => {
  it("captures operational metadata for every core launchpad system", () => {
    expect(CORE_LAUNCHPAD_SYSTEMS.map((system) => system.name)).toEqual([
      "Xero",
      "Airwallex",
      "Lawpath",
      "Skool",
      "ChatGPT",
      "Ollama",
      "GitHub",
      "Hetzner"
    ]);

    for (const system of CORE_LAUNCHPAD_SYSTEMS) {
      expect(system.owner).toBe("Callum");
      expect(system).toHaveProperty("cost");
      expect(system).toHaveProperty("renewalAt");
      expect(system.loginNote.trim().length).toBeGreaterThan(12);
      expect(Object.values(RiskLevel)).toContain(system.riskLevel);
    }

    expect(CORE_LAUNCHPAD_SYSTEMS.find((system) => system.name === "GitHub")).toMatchObject({
      riskLevel: RiskLevel.HIGH,
      sensitive: true
    });
  });

  it("lets a private import fill exact cost, renewal, risk, and credential details", () => {
    const overrides = parseLaunchpadSystemMetadataImport({
      systems: [
        {
          name: "Xero",
          group: "Money",
          cost: "99.00",
          renewalAt: "2026-07-01",
          owner: "Finance owner",
          riskLevel: "CRITICAL",
          loginNote: "Password manager: Dromaios / Xero admin",
          sensitive: true
        }
      ]
    });

    const merged = mergeLaunchpadSystemMetadata(overrides);
    const xero = merged.find((system) => system.name === "Xero");
    const lawpath = merged.find((system) => system.name === "Lawpath");

    expect(xero).toMatchObject({
      cost: "99.00",
      renewalAt: "2026-07-01",
      owner: "Finance owner",
      riskLevel: RiskLevel.CRITICAL,
      loginNote: "Password manager: Dromaios / Xero admin",
      sensitive: true
    });
    expect(lawpath?.description).toContain("Legal");
  });
});

describe("launchpadSystemKey", () => {
  it("normalises name and group into a stable case-insensitive key", () => {
    expect(launchpadSystemKey({ name: "  Xero ", group: "Money" })).toBe("xero::money");
    expect(launchpadSystemKey({ name: "XERO", group: "MONEY" })).toBe(launchpadSystemKey({ name: "xero", group: "money" }));
  });
});

describe("parseLaunchpadSystemMetadataImport validation", () => {
  it("accepts a bare array of systems and explicit null cost/renewal", () => {
    const overrides = parseLaunchpadSystemMetadataImport([
      { name: "Xero", group: "Money", cost: null, renewalAt: null, riskLevel: "LOW", sensitive: false }
    ]);
    expect(overrides[0]).toMatchObject({ cost: null, renewalAt: null, riskLevel: "LOW", sensitive: false });
  });

  it("coerces numeric cost to a trimmed string", () => {
    const [override] = parseLaunchpadSystemMetadataImport([{ name: "Xero", group: "Money", cost: 99 }]);
    expect(override.cost).toBe("99");
  });

  it("rejects a non-array, non-object payload", () => {
    expect(() => parseLaunchpadSystemMetadataImport("nope")).toThrow(
      "Launchpad metadata import must be an array or an object with a systems array."
    );
  });

  it("rejects a non-object system entry", () => {
    expect(() => parseLaunchpadSystemMetadataImport([42])).toThrow(
      "Launchpad metadata import system at index 0 must be an object."
    );
  });

  it("rejects a missing required name", () => {
    expect(() => parseLaunchpadSystemMetadataImport([{ group: "Money" }])).toThrow(
      "systems[0].name must be a non-empty string."
    );
  });

  it("rejects an invalid cost type", () => {
    expect(() => parseLaunchpadSystemMetadataImport([{ name: "Xero", group: "Money", cost: true }])).toThrow(
      "systems[0].cost must be a decimal string, number, or null."
    );
  });

  it("rejects a malformed renewal date", () => {
    expect(() => parseLaunchpadSystemMetadataImport([{ name: "Xero", group: "Money", renewalAt: "2026/07/01" }])).toThrow(
      "systems[0].renewalAt must use YYYY-MM-DD format."
    );
  });

  it("rejects an unknown risk level", () => {
    expect(() => parseLaunchpadSystemMetadataImport([{ name: "Xero", group: "Money", riskLevel: "EXTREME" }])).toThrow(
      "systems[0].riskLevel must be LOW, MEDIUM, HIGH, or CRITICAL."
    );
  });

  it("rejects a non-boolean sensitive flag", () => {
    expect(() => parseLaunchpadSystemMetadataImport([{ name: "Xero", group: "Money", sensitive: "yes" }])).toThrow(
      "systems[0].sensitive must be true or false."
    );
  });
});

describe("mergeLaunchpadSystemMetadata", () => {
  it("rejects overrides that reference an unseeded system", () => {
    expect(() => mergeLaunchpadSystemMetadata([{ name: "Notion", group: "Workbench" }])).toThrow(
      "Launchpad metadata import contains an unknown seeded system: Notion (Workbench)."
    );
  });
});

describe("loadLaunchpadSystemMetadata", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "launchpad-meta-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("falls back to core systems when the default import file is absent", () => {
    const loaded = loadLaunchpadSystemMetadata({ cwd: dir, metadataFilePath: undefined });
    expect(loaded.systems).toBe(CORE_LAUNCHPAD_SYSTEMS);
    expect(loaded.importedKeys.size).toBe(0);
    expect(loaded.importPath).toBeUndefined();
  });

  it("throws when an explicitly configured import file is missing", () => {
    expect(() => loadLaunchpadSystemMetadata({ cwd: dir, metadataFilePath: "missing.json" })).toThrow(
      /Launchpad metadata import file was not found/
    );
  });

  it("merges overrides from a present import file and records imported keys", () => {
    writeFileSync(
      join(dir, DEFAULT_LAUNCHPAD_METADATA_PATH.replace(/^.*\//, "")),
      JSON.stringify({ systems: [{ name: "Xero", group: "Money", cost: "120.00" }] })
    );

    const loaded = loadLaunchpadSystemMetadata({ cwd: dir, metadataFilePath: "launchpad-system-metadata.local.json" });
    expect(loaded.importPath).toContain("launchpad-system-metadata.local.json");
    expect(loaded.importedKeys.has(launchpadSystemKey({ name: "Xero", group: "Money" }))).toBe(true);
    expect(loaded.systems.find((system) => system.name === "Xero")?.cost).toBe("120.00");
  });
});
