import { getCompanySetupData } from "@/lib/services";
import type { SetupItemStatus, SetupPriority } from "@/lib/company-setup-checklist";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<SetupItemStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  WAITING: "Waiting",
  DONE: "Done",
  CANCELLED: "Cancelled",
  NOT_STARTED: "Not started"
};

function statusPillClass(status: SetupItemStatus) {
  if (status === "DONE") return "status-pill status-approved";
  if (status === "BLOCKED") return "status-pill status-high";
  if (status === "IN_PROGRESS" || status === "WAITING") return "status-pill status-draft";
  return "meta-pill";
}

function priorityPillClass(priority: SetupPriority) {
  return priority === "HIGH" || priority === "CRITICAL" ? "status-pill status-high" : "meta-pill";
}

export default async function SetupPage() {
  const summary = await getCompanySetupData();

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company setup</p>
          <h1>Build-Out Checklist</h1>
        </div>
        <p className="muted max-w-2xl">
          What Dromaios Labs still needs to be legally sound, financially clean, and safely operating. Each item is a
          tracked action &mdash; update its status from the Actions page and progress here updates automatically.
        </p>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Overall progress</p>
            <h2>
              {summary.done} of {summary.total} done
            </h2>
            <p className="muted mt-1">
              {summary.inProgress} in progress &middot; {summary.notStarted} not started
            </p>
          </div>
          <span className="status-pill status-approved text-base">{summary.percentComplete}%</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${summary.percentComplete}%` }}
          />
        </div>
      </section>

      <p className="muted text-xs">
        Operational scaffolding to help you track setup &mdash; not formal legal, tax, insurance, or regulatory advice.
        Confirm specifics with your accountant, solicitor, and insurer.
      </p>

      <section className="grid gap-5 lg:grid-cols-2">
        {summary.categories.map((category) => (
          <div className="panel" key={category.category}>
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">{category.category}</p>
              <span className="meta-pill">
                {category.done}/{category.total}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${category.percentComplete}%` }}
              />
            </div>
            <div className="mt-4 space-y-3">
              {category.items.map((item) => (
                <article className="action-row" key={item.key}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-command-ink">{item.title}</p>
                    <span className={statusPillClass(item.status)}>{STATUS_LABEL[item.status]}</span>
                  </div>
                  <p className="muted mt-1">{item.description}</p>
                  <p className="mt-2 text-sm text-command-ink">
                    <span className="font-medium">Next:</span> {item.nextStep}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={priorityPillClass(item.priority)}>{item.priority}</span>
                    <span className="meta-pill">{item.companyFunction}</span>
                    {item.sensitive ? <span className="meta-pill">Sensitive</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
