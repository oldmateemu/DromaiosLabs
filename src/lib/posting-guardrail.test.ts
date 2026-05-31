import { describe, expect, it } from "vitest";
import { checkPublicPostingDraft } from "./posting-guardrail";

describe("checkPublicPostingDraft", () => {
  it("blocks red regulatory and clinical outcome claims in a draft-only workflow", () => {
    const result = checkPublicPostingDraft(
      "ClinicBoss is TGA-ready, clinically validated, and reduces no-shows by 30% while recommending treatment plans."
    );

    expect(result.safetyLevel).toBe("DRAFT_ONLY");
    expect(result.publishAllowed).toBe(false);
    expect(result.overallSeverity).toBe("RED");
    expect(result.flags.map((flag) => flag.category)).toContain("TGA/SaMD language");
    expect(result.flags.map((flag) => flag.category)).toContain("ClinicBoss");
    expect(result.suggestedRewrite).toContain("working product stream");
    expect(result.suggestedRewrite).toContain("without replacing professional judgement");
    expect(result.suggestedRewrite).not.toMatch(/TGA-ready|clinically validated|reduces no-shows|recommending treatment/i);
  });

  it("flags amber ClinicBoss trademark and patent-disclosure detail without allowing publication", () => {
    const result = checkPublicPostingDraft(
      "The ClinicBoss platform launches in August with pricing for clinics and details on the intake module workflow."
    );

    expect(result.safetyLevel).toBe("DRAFT_ONLY");
    expect(result.publishAllowed).toBe(false);
    expect(result.overallSeverity).toBe("AMBER");
    expect(result.flags.map((flag) => flag.category)).toEqual(
      expect.arrayContaining(["ClinicBoss", "trademark clearance", "patent disclosure"])
    );
    expect(result.suggestedRewrite).toContain("currently referred to as ClinicBoss");
    expect(result.suggestedRewrite).not.toMatch(/platform|launches in August|pricing|intake module workflow/i);
  });

  it("keeps safe umbrella language green while still staying draft-only", () => {
    const result = checkPublicPostingDraft(
      "Dromaios Labs is building practical healthcare infrastructure across education, tools, operational software, and responsible medtech, with claims kept close to real evidence."
    );

    expect(result.safetyLevel).toBe("DRAFT_ONLY");
    expect(result.publishAllowed).toBe(false);
    expect(result.overallSeverity).toBe("GREEN");
    expect(result.flags).toEqual([]);
    expect(result.suggestedRewrite).toContain("claims kept close to real evidence");
  });
});
