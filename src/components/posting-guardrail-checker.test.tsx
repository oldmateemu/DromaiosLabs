import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PostingGuardrailChecker } from "./posting-guardrail-checker";

describe("PostingGuardrailChecker", () => {
  // Always restore globals so a stubbed navigator can't leak into later tests
  // if an assertion throws mid-test.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("checks pasted public copy without exposing a publish action", () => {
    render(<PostingGuardrailChecker />);

    expect(screen.getByRole("heading", { name: "Draft Posting Checker" })).toBeInTheDocument();
    expect(screen.getByText("DRAFT ONLY")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No publish action" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Draft post or website snippet"), {
      target: {
        value: "ClinicBoss is TGA-ready and clinically validated. It recommends treatment plans for clinics."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check draft" }));

    expect(screen.getAllByText("RED").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TGA/SaMD language").length).toBeGreaterThan(0);
    expect(screen.getByText("Suggested softened rewrite")).toBeInTheDocument();
    expect(screen.getByText(/without replacing professional judgement/i)).toBeInTheDocument();
    expect(within(screen.getByTestId("softened-rewrite")).queryByText(/TGA-ready/i)).not.toBeInTheDocument();
  });

  it("reports a clean result and keeps the check disabled until copy is entered", () => {
    render(<PostingGuardrailChecker />);

    expect(screen.getByRole("button", { name: "Check draft" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Draft post or website snippet"), {
      target: { value: "We share weekly notes about running a small company and the lessons we learn." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check draft" }));

    expect(screen.getByText("No red or amber claims were detected.")).toBeInTheDocument();
    expect(screen.getByText(/This checker is a draft aid/i)).toBeInTheDocument();
  });

  it("copies the suggested rewrite to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<PostingGuardrailChecker />);
    fireEvent.change(screen.getByLabelText("Draft post or website snippet"), {
      target: { value: "ClinicBoss is TGA-ready and clinically validated." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Check draft" }));

    const rewrite = screen.getByTestId("softened-rewrite").textContent;
    const copyButton = screen.getByRole("button", { name: "Copy rewrite" });
    fireEvent.click(copyButton);
    await screen.findByRole("button", { name: "Rewrite copied" });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(rewrite);
  });
});
