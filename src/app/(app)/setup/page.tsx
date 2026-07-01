import { CheckSquare2, Square } from "lucide-react";
import { setSetupItemStatusAction, updateSetupItemAction } from "@/app/actions";
import { SetupQuickEditForm } from "@/components/quick-edit-forms";
import { getCompanySetupData } from "@/lib/services";
import { dateKey } from "@/lib/domain";
import { buildSetupReadiness, setupItemStatusLabel, SETUP_BAND_PILL_CLASS } from "@/lib/company-setup-checklist";
import type { SetupItemStatus, SetupItemView, SetupPriority } from "@/lib/company-setup-checklist";

export const dynamic = "force-dynamic";

// Secondary one-click transitions offered for an item that is not yet done.
const SECONDARY_STATUSES: { status: SetupItemStatus; label: string }[] = [
  { status: "IN_PROGRESS", label: "Start" },
  { status: "WAITING", label: "Waiting" },
  { status: "BLOCKED", label: "Block" },
  { status: "OPEN", label: "Reset" }
];

function statusPillClass(status: SetupItemStatus) {
  if (status === "DONE") return "status-pill status-approved";
  if (status === "BLOCKED") return "status-pill status-high";
  if (status === "IN_PROGRESS" || status === "WAITING") return "status-pill status-draft";
  return "meta-pill";
}

function priorityPillClass(priority: SetupPriority) {
  return priority === "HIGH" || priority === "CRITICAL" ? "status-pill status-high" : "meta-pill";
}

function StatusForm({
  itemKey,
  status,
  className,
  children,
  label
}: {
  itemKey: string;
  status: SetupItemStatus;
  className: string;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <form action={setSetupItemStatusAction}>
      <input name="itemKey" type="hidden" value={itemKey} />
      <input name="status" type="hidden" value={status} />
      <button aria-label={label} className={className} title={label} type="submit">
        {children}
      </button>
    </form>
  );
}

function SetupItemRow({ item }: { item: SetupItemView }) {
  return (
    <article className="action-row">
      <div className="flex items-start gap-3">
        <StatusForm
          className="mt-0.5 text-command-muted transition hover:text-command-green"
          itemKey={item.key}
          label={item.done ? `Reopen ${item.title}` : `Mark ${item.title} done`}
          status={item.done ? "OPEN" : "DONE"}
        >
          {item.done ? (
            <CheckSquare2 aria-hidden="true" className="text-command-green" size={20} />
          ) : (
            <Square aria-hidden="true" size={20} />
          )}
        </StatusForm>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className={`font-semibold ${item.done ? "text-command-muted line-through" : "text-command-ink"}`}>
              {item.title}
            </p>
            <span className={statusPillClass(item.status)}>{setupItemStatusLabel(item.status)}</span>
          </div>
          <p className="muted mt-1">{item.description}</p>
          {!item.done ? (
            <p className="mt-2 text-sm text-command-ink">
              <span className="font-medium">Next:</span> {item.nextStep}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={priorityPillClass(item.priority)}>{item.priority}</span>
            <span className="meta-pill">{item.companyFunction}</span>
            {item.sensitive ? <span className="meta-pill">Sensitive</span> : null}
            {!item.done && item.overdue ? <span className="status-pill status-high">Overdue</span> : null}
            {!item.done && !item.overdue && item.dueSoon ? <span className="status-pill status-draft">Due soon</span> : null}
            {!item.done && item.dueAt ? (
              <span className="meta-pill">Due {dateKey(new Date(item.dueAt))}</span>
            ) : null}
          </div>
          {!item.done ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {SECONDARY_STATUSES.filter((option) => option.status !== item.status).map((option) => (
                <StatusForm
                  className="button button-secondary px-3 py-1 text-xs"
                  itemKey={item.key}
                  key={option.status}
                  label={`Set ${item.title} to ${setupItemStatusLabel(option.status)}`}
                  status={option.status}
                >
                  {option.label}
                </StatusForm>
              ))}
            </div>
          ) : null}
          <SetupQuickEditForm
            action={updateSetupItemAction}
            item={{
              key: item.key,
              title: item.title,
              status: item.status,
              priority: item.priority,
              dueAt: item.dueAt,
              nextStep: item.nextStep
            }}
          />
        </div>
      </div>
    </article>
  );
}

export default async function SetupPage() {
  const summary = await getCompanySetupData();
  const readiness = buildSetupReadiness(summary);

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company setup</p>
          <h1>Build-Out Checklist</h1>
        </div>
        <p className="muted max-w-2xl">
          What Dromaios Labs still needs to be legally sound, financially clean, and safely operating. Tick items off
          here &mdash; each one is a tracked action, so progress flows into the Today board and weekly review.
        </p>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Overall progress</p>
            <h2>
              {summary.done} of {summary.total} done
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="meta-pill">{summary.inProgress} in progress</span>
              <span className="meta-pill">{summary.notStarted} not started</span>
              {summary.overdue > 0 ? <span className="status-pill status-high">{summary.overdue} overdue</span> : null}
              {summary.dueSoon > 0 ? <span className="status-pill status-draft">{summary.dueSoon} due soon</span> : null}
            </div>
          </div>
          <div className="text-right">
            <span className={`${SETUP_BAND_PILL_CLASS[readiness.band]} text-base`}>{readiness.score}% ready</span>
            <p className="muted mt-1 text-xs">{readiness.band}</p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${readiness.score}%` }} />
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
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${category.percentComplete}%` }} />
            </div>
            <div className="mt-4 space-y-3">
              {category.items.map((item) => (
                <SetupItemRow item={item} key={item.key} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
