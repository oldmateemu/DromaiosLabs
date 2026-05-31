import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LaunchpadHealthPanel } from "./launchpad-health";

describe("LaunchpadHealthPanel", () => {
  it("surfaces system health without turning the launchpad into analytics noise", () => {
    render(
      <LaunchpadHealthPanel
        health={{
          total: 3,
          renewalsDue: [{ id: "xero", name: "Xero", href: "/launchpad" }],
          renewalsSoon: [{ id: "lawpath", name: "Lawpath", href: "/launchpad" }],
          missingOwners: 1,
          missingCosts: 2,
          missingRenewals: 1,
          missingCredentialNotes: 1,
          highRisk: [{ id: "github", name: "GitHub", href: "/launchpad" }],
          credentialNotes: 2,
          metadataGaps: [
            { id: "xero", name: "Xero", href: "/launchpad", detail: "owner, cost" },
            { id: "github", name: "GitHub", href: "/launchpad", detail: "renewal date, credential note" }
          ]
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "System health" })).toBeInTheDocument();
    expect(screen.getByText("1 due / 1 soon")).toBeInTheDocument();
    expect(screen.getByText("2 metadata gaps")).toBeInTheDocument();
    expect(screen.getByText("1 high risk")).toBeInTheDocument();
    expect(screen.getAllByText("Xero")).toHaveLength(2);
    expect(screen.getByText("owner, cost")).toBeInTheDocument();
    expect(screen.getAllByText("GitHub")).toHaveLength(2);
  });
});
