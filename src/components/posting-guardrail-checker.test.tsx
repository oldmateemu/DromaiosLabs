import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostingGuardrailChecker } from "./posting-guardrail-checker";

describe("PostingGuardrailChecker", () => {
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
});
