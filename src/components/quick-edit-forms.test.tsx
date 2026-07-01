import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ActionQuickEditForm,
  LaunchpadEditForm,
  LaunchpadQuickEditForm,
  SetupQuickEditForm
} from "./quick-edit-forms";

const noop = async () => {};
const streams = [{ id: "stream-1", name: "DromaiosEd" }];

describe("SetupQuickEditForm", () => {
  it("renders compact mutable setup fields with the item key", () => {
    render(
      <SetupQuickEditForm
        action={noop}
        item={{
          key: "legal-asic-current",
          title: "Confirm ASIC company details are current",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueAt: "2026-07-15",
          nextStep: "Call accountant"
        }}
      />
    );

    expect(screen.getByDisplayValue("legal-asic-current")).toHaveAttribute("name", "itemKey");
    expect((screen.getByLabelText("Setup status") as HTMLSelectElement).value).toBe("IN_PROGRESS");
    expect((screen.getByLabelText("Setup priority") as HTMLSelectElement).value).toBe("HIGH");
    expect((screen.getByLabelText("Setup due date") as HTMLInputElement).value).toBe("2026-07-15");
    expect(screen.getByLabelText("Setup next step")).toHaveValue("Call accountant");
    expect(screen.getByRole("button", { name: "Save setup edits" })).toBeInTheDocument();
  });
});

describe("ActionQuickEditForm", () => {
  it("renders action quick edit fields", () => {
    render(
      <ActionQuickEditForm
        action={noop}
        item={{
          id: "action-1",
          status: "OPEN",
          priority: "MEDIUM",
          dueAt: "2026-08-01",
          reviewAt: "2026-08-03"
        }}
      />
    );

    expect(screen.getByDisplayValue("action-1")).toHaveAttribute("name", "actionId");
    expect((screen.getByLabelText("Action status") as HTMLSelectElement).value).toBe("OPEN");
    expect((screen.getByLabelText("Action priority") as HTMLSelectElement).value).toBe("MEDIUM");
    expect((screen.getByLabelText("Action due date") as HTMLInputElement).value).toBe("2026-08-01");
    expect((screen.getByLabelText("Action review date") as HTMLInputElement).value).toBe("2026-08-03");
    expect(screen.getByRole("button", { name: "Save action edits" })).toBeInTheDocument();
  });
});

describe("LaunchpadQuickEditForm", () => {
  it("renders launchpad quick metadata controls", () => {
    render(
      <LaunchpadQuickEditForm
        action={noop}
        link={{
          id: "link-1",
          group: "Money",
          cost: "99.00",
          renewalAt: "2026-09-01",
          owner: "Callum",
          riskLevel: "HIGH"
        }}
      />
    );

    expect(screen.getByDisplayValue("link-1")).toHaveAttribute("name", "linkId");
    expect(screen.getByLabelText("System group")).toHaveValue("Money");
    expect(screen.getByLabelText("System cost")).toHaveValue("99.00");
    expect((screen.getByLabelText("System renewal date") as HTMLInputElement).value).toBe("2026-09-01");
    expect(screen.getByLabelText("System owner")).toHaveValue("Callum");
    expect((screen.getByLabelText("System risk") as HTMLSelectElement).value).toBe("HIGH");
    expect(screen.getByRole("button", { name: "Save system edits" })).toBeInTheDocument();
  });
});

describe("LaunchpadEditForm", () => {
  it("renders full launchpad editing with streams and sensitive flag", () => {
    render(
      <LaunchpadEditForm
        action={noop}
        streams={streams}
        link={{
          id: "link-1",
          name: "Xero",
          url: "https://xero.com",
          group: "Money",
          streamId: "stream-1",
          cost: "99.00",
          renewalAt: "2026-09-01",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "Password manager entry",
          description: "Accounting source of truth",
          sensitive: true
        }}
      />
    );

    expect(screen.getByDisplayValue("link-1")).toHaveAttribute("name", "linkId");
    expect(screen.getByLabelText("Name")).toHaveValue("Xero");
    expect(screen.getByLabelText("URL")).toHaveValue("https://xero.com");
    expect(within(screen.getByLabelText("Stream")).getByRole("option", { name: "DromaiosEd" })).toBeInTheDocument();
    expect(screen.getByLabelText("Credential/location note")).toHaveValue("Password manager entry");
    expect(screen.getByLabelText("Description")).toHaveValue("Accounting source of truth");
    expect(screen.getByLabelText("Sensitive")).toBeChecked();
    expect(screen.getByRole("button", { name: "Save launchpad record" })).toBeInTheDocument();
  });
});
