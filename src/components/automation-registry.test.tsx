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
            name: "Lead follow-up draft",
            description: "Drafts follow-up copy.",
            safetyLevel: "DRAFT_ONLY",
            status: "ACTIVE",
            trigger: "Manual",
            targetTool: "local cockpit",
            webhookUrl: null,
            rollbackNote: "Delete drafted tasks.",
            runs: []
          }
        ]}
        prepareDraftAction={async () => {}}
        runAction={async () => {}}
      />
    );

    expect(screen.getByRole("heading", { name: "Registered Loops" })).toBeInTheDocument();
    expect(screen.getByText("Draft-only automations cannot execute.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not runnable" })).toBeDisabled();
  });

  it("lets the weekly review prep automation generate a local draft", () => {
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
            targetTool: "local cockpit",
            webhookUrl: null,
            rollbackNote: "Delete drafted tasks.",
            runs: [
              {
                id: "run-1",
                status: "SUCCESS",
                requestSummary: "Local draft prep for Weekly review prep",
                responseSummary: "Weekly review prep - draft only\n\nDraft actions to consider\n- Review overdue work",
                error: null
              }
            ]
          }
        ]}
        prepareDraftAction={async () => {}}
        runAction={async () => {}}
      />
    );

    expect(screen.getByText("External execution stays blocked; this only writes a local draft run log.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prepare draft locally" })).toBeInTheDocument();
    expect(screen.getByText(/Draft actions to consider/)).toBeInTheDocument();
  });

  it("lets the stale task summary automation generate a local draft", () => {
    render(
      <AutomationRegistry
        automations={[
          {
            id: "auto-1",
            name: "Stale task summary",
            description: "Drafts the stale work digest.",
            safetyLevel: "DRAFT_ONLY",
            status: "ACTIVE",
            trigger: "Manual stale action scan",
            targetTool: "local cockpit",
            webhookUrl: null,
            rollbackNote: "Delete drafted output.",
            runs: [
              {
                id: "run-1",
                status: "SUCCESS",
                requestSummary: "Local draft prep for Stale task summary",
                responseSummary: "Stale task summary - draft only\n\nDraft follow-ups to consider\n- Review stale work",
                error: null
              }
            ]
          }
        ]}
        prepareDraftAction={async () => {}}
        runAction={async () => {}}
      />
    );

    expect(screen.getByText("External execution stays blocked; this only writes a local draft run log.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prepare draft locally" })).toBeInTheDocument();
    expect(screen.getByText(/Stale task summary - draft only/)).toBeInTheDocument();
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
        prepareDraftAction={async () => {}}
        runAction={async () => {}}
      />
    );

    expect(screen.getByLabelText("I approve this manual run")).toBeRequired();
    expect(screen.getByRole("button", { name: "Run with approval" })).toBeInTheDocument();
  });

  it("lets the renewal reminder run locally after explicit approval", () => {
    render(
      <AutomationRegistry
        automations={[
          {
            id: "auto-3",
            name: "Renewal reminder",
            description: "Checks launchpad renewal dates.",
            safetyLevel: "APPROVAL_REQUIRED",
            status: "ACTIVE",
            trigger: "Manual launchpad renewal check",
            targetTool: "local cockpit",
            webhookUrl: null,
            rollbackNote: "Cancel generated reminders if not useful.",
            runs: [
              {
                id: "run-1",
                status: "SUCCESS",
                requestSummary: "Approved local renewal reminder run",
                responseSummary: "Renewal reminder - approved local run\n\nReminder actions created: 4",
                error: null
              }
            ]
          }
        ]}
        prepareDraftAction={async () => {}}
        runAction={async () => {}}
      />
    );

    expect(screen.getByLabelText("I approve this manual run")).toBeRequired();
    expect(screen.getByText("Approval creates local renewal reminders; no webhook is called.")).toBeInTheDocument();
    expect(screen.queryByText("Add a webhook URL before this can run.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run with approval" })).toBeInTheDocument();
    expect(screen.getByText(/Reminder actions created: 4/)).toBeInTheDocument();
  });
});
