import { RiskLevel } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  CORE_LAUNCHPAD_SYSTEMS,
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
      "HubSpot",
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
