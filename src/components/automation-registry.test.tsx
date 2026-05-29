import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutomationRegistry } from "./automation-registry";

describe("AutomationRegistry", () => {
  it("makes unsafe automations visibly non-runnable", () => {
    render(
      <AutomationRegistry
        automations={[
          {
            id: "auto-1",
            name: "Weekly review prep",
            description: "Drafts the review checklist.",
            safetyLevel: "DRAFT_ONLY",
            status: "ACTIVE",
            trigger: "Manual",
            targetTool: "n8n",
            webhookUrl: "https://example.com/hook",
            rollbackNote: "Delete drafted tasks.",
            runs: []
          }
        ]}
        runAction={async () => {}}
      />
    );

    expect(screen.getByRole("heading", { name: "Registered Loops" })).toBeInTheDocument();
    expect(screen.getByText("Draft-only automations cannot execute.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not runnable" })).toBeDisabled();
  });

  it("requires an explicit checkbox before a manual approval run", () => {
    render(
      <AutomationRegistry
        automations={[
          {
            id: "auto-2",
            name: "Renewal reminder",
            description: "Checks launchpad renewal dates.",
            safetyLevel: "APPROVAL_REQUIRED",
            status: "ACTIVE",
            trigger: "Manual",
            targetTool: "Activepieces",
            webhookUrl: "https://example.com/hook",
            rollbackNote: "Stop the flow.",
            runs: []
          }
        ]}
        runAction={async () => {}}
      />
    );

    expect(screen.getByLabelText("I approve this manual run")).toBeRequired();
    expect(screen.getByRole("button", { name: "Run with approval" })).toBeInTheDocument();
  });
});
