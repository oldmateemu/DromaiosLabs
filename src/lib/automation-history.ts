export type AutomationRunSummaryInput = {
  status: string;
};

export type AutomationRunSummary = {
  total: number;
  success: number;
  failed: number;
  blocked: number;
  successRate: number | null;
};

/**
 * Reduce a set of automation run records into headline counts and a success
 * rate. Pure so it can be reused by the run-history view and the company pulse.
 */
export function summariseAutomationRuns(runs: AutomationRunSummaryInput[]): AutomationRunSummary {
  const total = runs.length;
  const success = runs.filter((run) => run.status === "SUCCESS").length;
  const failed = runs.filter((run) => run.status === "FAILED").length;
  const blocked = runs.filter((run) => run.status === "BLOCKED").length;

  return {
    total,
    success,
    failed,
    blocked,
    successRate: total === 0 ? null : Math.round((success / total) * 100)
  };
}
