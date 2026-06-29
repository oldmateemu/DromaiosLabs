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

  it("lets the daily inbox triage automation generate a local draft", () => {
    render(
      <AutomationRegistry
        automations={[
          {
            id: "auto-5",
            name: "Daily inbox triage",
            description: "Drafts the weekday inbox digest.",
            safetyLevel: "DRAFT_ONLY",
            status: "ACTIVE",
            trigger: "Weekday inbox digest",
            targetTool: "local cockpit",
            webhookUrl: null,
            rollbackNote: "Discard the digest.",
            runs: [
              {
                id: "run-1",
                status: "SUCCESS",
                requestSummary: "Local draft prep for Daily inbox triage",
                responseSummary: "Daily inbox triage - draft only\n\nAction needed\n- Reply to priority item\n\nEmail work prepared for review",
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
    expect(screen.getByText(/Daily inbox triage - draft only/)).toBeInTheDocument();
    expect(screen.getByText(/Email work prepared for review/)).toBeInTheDocument();
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
                responseSummary: "Renewal reminder - approved local run\n\nReminder actions prepared: 4\n\nRun result\n- Reminder actions created this run: 4",
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
    expect(screen.getByText(/Reminder actions prepared: 4/)).toBeInTheDocument();
    expect(screen.getByText(/Reminder actions created this run: 4/)).toBeInTheDocument();
  });

  it("lets the company mailroom filing runner stay approval-gated without a webhook", () => {
    render(
      <AutomationRegistry
        automations={[
          {
            id: "auto-4",
            name: "Company mailroom filing",
            description: "Files labelled Gmail attachments into Drive and Sheets review logs.",
            safetyLevel: "APPROVAL_REQUIRED",
            status: "ACTIVE",
            trigger: "Manual Gmail/Drive/Sheets filing review",
            targetTool: "Gmail Processor / Apps Script",
            webhookUrl: null,
            rollbackNote: "Disable Gmail labels or Apps Script trigger; originals remain in Gmail.",
            runs: [
              {
                id: "run-1",
                status: "SUCCESS",
                requestSummary: "Approved local company mailroom filing run",
                responseSummary: "Company mailroom filing - approved setup run\n\nReceipt and invoice support\n- receipt\n- invoice",
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
    expect(screen.getByText("Approval records the mailroom filing control summary; Gmail, Drive, Sheets, OCR, payments, and Xero stay outside Cockpit.")).toBeInTheDocument();
    expect(screen.queryByText("Add a webhook URL before this can run.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run with approval" })).toBeInTheDocument();
    expect(screen.getByText(/Company mailroom filing - approved setup run/)).toBeInTheDocument();
  });
});
