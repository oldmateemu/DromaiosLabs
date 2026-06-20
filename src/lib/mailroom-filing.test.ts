import { describe, expect, it } from "vitest";
import { buildCompanyMailroomFilingRun } from "./mailroom-filing";

describe("buildCompanyMailroomFilingRun", () => {
  it("builds an approval-gated mailroom filing control run with receipt and invoice support", () => {
    const run = buildCompanyMailroomFilingRun({
      now: new Date("2026-06-05T09:00:00+08:00")
    });

    expect(run.actionsToCreate).toHaveLength(1);
    expect(run.actionsToCreate[0]).toMatchObject({
      title: "Review Company mailroom filing setup and exceptions",
      dueAt: "2026-06-05",
      reviewAt: "2026-06-05",
      priority: "HIGH",
      sensitive: true
    });
    expect(run.actionsToCreate[0].description).toContain("Gmail labels: contract, receipt, invoice, certificate, insurance, venue, course, software");
    expect(run.actionsToCreate[0].description).toContain("Finance Receipt Log");
    expect(run.actionsToCreate[0].description).toContain("Supplier Invoice Review");

    expect(run.responseSummary).toContain("Company mailroom filing - approved setup run");
    expect(run.responseSummary).toContain("Safety: APPROVAL_REQUIRED");
    expect(run.responseSummary).toContain("Explicit approval captured");
    expect(run.responseSummary).toContain("Receipt and invoice support");
    expect(run.responseSummary).toContain("Company Core/Finance/Receipts/Inbox");
    expect(run.responseSummary).toContain("Company Core/Finance/Invoices/Inbox");
    expect(run.responseSummary).toContain("Company Core/Admin/Renewals");
    expect(run.actionsToCreate[0].description).toContain("Company Core/Admin/Renewals");
    expect(run.responseSummary).toContain("Finance Receipt Log");
    expect(run.responseSummary).toContain("Supplier Invoice Review");
    expect(run.responseSummary).toContain("OCR foundation");
    expect(run.responseSummary).toContain("OCR is disabled in v1");
    expect(run.responseSummary).toContain("No payment execution");
    expect(run.responseSummary).toContain("No Xero writes");
  });
});
