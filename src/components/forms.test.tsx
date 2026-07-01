import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ActionForm,
  ActionRegisterFilters,
  ActionSavedViews,
  AutomationForm,
  CollapsiblePanel,
  LaunchpadForm,
  WeeklyReviewForm
} from "./forms";

const noop = async () => {};
const streams = [{ id: "s1", name: "ClinicBoss" }];
const companyFunctions = [{ id: "f1", name: "Finance" }];

describe("ActionSavedViews", () => {
  it("renders common operating lenses as direct action register links", () => {
    render(<ActionSavedViews today="2026-05-30" weekEnd="2026-06-06" />);

    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/actions?dueBefore=2026-05-30");
    expect(screen.getByRole("link", { name: "This week" })).toHaveAttribute("href", "/actions?dueBefore=2026-06-06");
    expect(screen.getByRole("link", { name: "Compliance" })).toHaveAttribute("href", "/actions?companyFunction=compliance");
    expect(screen.getByRole("link", { name: "Founder load" })).toHaveAttribute("href", "/actions?companyFunction=founder+workload");
  });
});

describe("CollapsiblePanel", () => {
  it("keeps secondary controls available without opening them by default", () => {
    render(
      <CollapsiblePanel eyebrow="Capture" title="New Action">
        <button type="button">Create action</button>
      </CollapsiblePanel>
    );

    const details = screen.getByText("New Action").closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Create action" })).toBeInTheDocument();
  });
});

describe("ActionForm", () => {
  it("renders a required title, reference selects, and the captured stream options", () => {
    render(<ActionForm streams={streams} companyFunctions={companyFunctions} action={noop} />);

    expect(screen.getByRole("heading", { name: "New Action" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    const streamSelect = screen.getByLabelText("Stream");
    expect(within(streamSelect).getByRole("option", { name: "ClinicBoss" })).toBeInTheDocument();
    expect(within(streamSelect).getByRole("option", { name: "Unassigned" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sensitive")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Create action" })).toBeInTheDocument();
  });
});

describe("ActionRegisterFilters", () => {
  it("reflects current filter values and offers a clear link", () => {
    render(
      <ActionRegisterFilters
        streams={streams}
        companyFunctions={companyFunctions}
        values={{ status: "WAITING", dueBefore: "2026-06-30" }}
      />
    );

    expect((screen.getByLabelText("Status") as HTMLSelectElement).value).toBe("WAITING");
    expect((screen.getByLabelText("Due on/before") as HTMLInputElement).value).toBe("2026-06-30");
    expect(within(screen.getByLabelText("Stream")).getByRole("option", { name: "All streams" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear" })).toHaveAttribute("href", "/actions");
  });
});

describe("LaunchpadForm", () => {
  it("requires the identifying fields and renders the risk select", () => {
    render(<LaunchpadForm action={noop} />);

    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("URL")).toBeRequired();
    expect(screen.getByLabelText("Group")).toBeRequired();
    expect(screen.getByLabelText("Risk level")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add link" })).toBeInTheDocument();
  });
});

describe("WeeklyReviewForm", () => {
  it("renders one prompt per company function lane", () => {
    render(<WeeklyReviewForm action={noop} />);

    expect(screen.getByLabelText("Finance and cash")).toBeInTheDocument();
    expect(screen.getByLabelText("Founder workload")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(7);
    expect(screen.getByRole("button", { name: "Complete review" })).toBeInTheDocument();
  });
});

describe("AutomationForm", () => {
  it("requires a name and exposes the safety level select", () => {
    render(<AutomationForm action={noop} />);

    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(within(screen.getByLabelText("Safety level")).getByRole("option", { name: "Draft Only" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register automation" })).toBeInTheDocument();
  });
});
