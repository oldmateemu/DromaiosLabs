import { ActionSource, Priority, ActionStatus, AutomationSafetyLevel, RiskLevel } from "@prisma/client";
import Link from "next/link";

type ReferenceItem = { id: string; name: string };
type FilterValues = Record<string, string | undefined>;

export function CollapsiblePanel({
  eyebrow,
  title,
  summary,
  defaultOpen = false,
  children
}: {
  eyebrow: string;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="panel disclosure-panel" open={defaultOpen}>
      <summary className="disclosure-summary">
        <span>
          <span className="eyebrow block">{eyebrow}</span>
          <span className="block text-lg font-semibold text-command-ink">{title}</span>
          {summary ? <span className="muted mt-1 block">{summary}</span> : null}
        </span>
        <span className="button button-secondary">Open</span>
      </summary>
      <div className="mt-4 border-t border-command-line pt-4">{children}</div>
    </details>
  );
}

export function ActionSavedViews({ today, weekEnd }: { today: string; weekEnd: string }) {
  const links = [
    ["Today", `/actions?dueBefore=${today}`],
    ["This week", `/actions?dueBefore=${weekEnd}`],
    ["Waiting", "/actions?status=WAITING"],
    ["Blocked", "/actions?status=BLOCKED"],
    ["Compliance", "/actions?companyFunction=compliance"],
    ["Revenue", "/actions?companyFunction=sales"],
    ["Founder load", "/actions?companyFunction=founder+workload"]
  ] as const;

  return (
    <section className="panel compact-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">Saved views</p>
          <h2 className="text-lg font-semibold text-command-ink">Operating lenses</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map(([label, href]) => (
            <Link className="saved-view-link" href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ActionForm({
  streams,
  companyFunctions,
  action
}: {
  streams: ReferenceItem[];
  companyFunctions: ReferenceItem[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="eyebrow">Capture</p>
        <h2>New Action</h2>
      </div>
      <Field name="title" label="Title" required />
      <Select name="priority" label="Priority" values={Object.values(Priority)} />
      <Select name="status" label="Status" values={Object.values(ActionStatus)} />
      <SelectItems name="streamId" label="Stream" items={streams} />
      <SelectItems name="companyFunctionId" label="Company function" items={companyFunctions} />
      <Field name="dueAt" label="Due date" type="date" />
      <Field name="reviewAt" label="Review date" type="date" />
      <Field name="nextStep" label="Next step" />
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="description">Description</label>
        <textarea className="text-area" id="description" name="description" rows={3} />
      </div>
      <label className="flex items-center gap-2 text-sm text-command-muted">
        <input name="sensitive" type="checkbox" />
        Sensitive
      </label>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Create action</button>
      </div>
    </form>
  );
}

type EditableAction = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueAt?: Date | string | null;
  reviewAt?: Date | string | null;
  nextStep?: string | null;
  streamId?: string | null;
  companyFunctionId?: string | null;
  sensitive?: boolean | null;
};

function dateInputValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function ActionEditForm({
  action,
  streams,
  companyFunctions,
  updateAction
}: {
  action: EditableAction;
  streams: ReferenceItem[];
  companyFunctions: ReferenceItem[];
  updateAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={updateAction} className="grid gap-4 md:grid-cols-2">
      <input name="actionId" type="hidden" value={action.id} />
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="title">Title</label>
        <input className="input" defaultValue={action.title} id="title" name="title" required type="text" />
      </div>
      <Select name="priority" label="Priority" values={Object.values(Priority)} defaultValue={action.priority} />
      <Select name="status" label="Status" values={Object.values(ActionStatus)} defaultValue={action.status} />
      <SelectItems name="streamId" label="Stream" items={streams} defaultValue={action.streamId ?? ""} emptyLabel="Unassigned" />
      <SelectItems name="companyFunctionId" label="Company function" items={companyFunctions} defaultValue={action.companyFunctionId ?? ""} emptyLabel="Unassigned" />
      <Field name="dueAt" label="Due date" type="date" defaultValue={dateInputValue(action.dueAt)} />
      <Field name="reviewAt" label="Review date" type="date" defaultValue={dateInputValue(action.reviewAt)} />
      <div className="md:col-span-2">
        <Field name="nextStep" label="Next step" defaultValue={action.nextStep ?? ""} />
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="description">Description</label>
        <textarea className="text-area" defaultValue={action.description ?? ""} id="description" name="description" rows={3} />
      </div>
      <label className="flex items-center gap-2 text-sm text-command-muted">
        <input defaultChecked={Boolean(action.sensitive)} name="sensitive" type="checkbox" />
        Sensitive
      </label>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Save changes</button>
      </div>
    </form>
  );
}

export function ActionRegisterFilters({
  streams,
  companyFunctions,
  values
}: {
  streams: ReferenceItem[];
  companyFunctions: ReferenceItem[];
  values: FilterValues;
}) {
  return (
    <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" method="get">
      <div className="md:col-span-2 xl:col-span-4">
        <p className="eyebrow">Find the right work</p>
        <h2>Filters</h2>
      </div>
      <Select name="status" label="Status" values={["ALL", ...Object.values(ActionStatus)]} defaultValue={values.status ?? "ALL"} />
      <Select name="priority" label="Priority" values={["ALL", ...Object.values(Priority)]} defaultValue={values.priority ?? "ALL"} />
      <Select name="source" label="Source" values={["ALL", ...Object.values(ActionSource)]} defaultValue={values.source ?? "ALL"} />
      <SelectItems name="streamId" label="Stream" items={streams} defaultValue={values.streamId ?? ""} emptyLabel="All streams" />
      <SelectItems name="companyFunctionId" label="Function" items={companyFunctions} defaultValue={values.companyFunctionId ?? ""} emptyLabel="All functions" />
      <Field name="dueBefore" label="Due on/before" type="date" defaultValue={values.dueBefore ?? ""} />
      <Field name="reviewBefore" label="Review on/before" type="date" defaultValue={values.reviewBefore ?? ""} />
      <div className="flex items-end gap-2">
        <button className="button button-primary" type="submit">Apply filters</button>
        <Link className="button button-secondary" href="/actions">Clear</Link>
      </div>
    </form>
  );
}

export function LaunchpadForm({
  action,
  streams = []
}: {
  action: (formData: FormData) => Promise<void>;
  streams?: ReferenceItem[];
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="eyebrow">Systems</p>
        <h2>Add Launchpad Link</h2>
      </div>
      <Field name="name" label="Name" required />
      <Field name="url" label="URL" required />
      <Field name="group" label="Group" required placeholder="Money, Legal/Admin, AI/Workbench..." />
      <SelectItems name="streamId" label="Stream" items={streams} emptyLabel="No stream (shared)" />
      <Select name="riskLevel" label="Risk level" values={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} />
      <Field name="cost" label="Monthly/annual cost" />
      <Field name="renewalAt" label="Renewal date" type="date" />
      <Field name="owner" label="Owner" />
      <Field name="loginNote" label="Credential/location note" />
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="description">Description</label>
        <textarea className="text-area" id="description" name="description" rows={3} />
      </div>
      <label className="flex items-center gap-2 text-sm text-command-muted">
        <input name="sensitive" type="checkbox" />
        Sensitive
      </label>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Add link</button>
      </div>
    </form>
  );
}

export function WeeklyReviewForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const fields = [
    ["finance", "Finance and cash"],
    ["compliance", "Compliance and legal"],
    ["sales", "Sales and follow-ups"],
    ["delivery", "Delivery and operations"],
    ["product", "Product and research"],
    ["governance", "Governance and risk"],
    ["founderWorkload", "Founder workload"]
  ] as const;

  return (
    <form action={action} className="panel space-y-4">
      <div>
        <p className="eyebrow">Weekly rhythm</p>
        <h2>Company Review</h2>
        <p className="muted">Add only the checks that matter. Filled answers become proposed review actions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([name, label]) => (
          <div key={name}>
            <label className="field-label" htmlFor={name}>{label}</label>
            <textarea className="text-area" id={name} name={name} rows={3} />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button className="button button-primary" type="submit">Complete review</button>
      </div>
    </form>
  );
}

export function AutomationForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="eyebrow">Control room</p>
        <h2>Register Automation</h2>
      </div>
      <Field name="name" label="Name" required />
      <Select name="safetyLevel" label="Safety level" values={Object.values(AutomationSafetyLevel)} />
      <Field name="trigger" label="Trigger" placeholder="Manual weekly review prep" />
      <Field name="targetTool" label="Target tool" placeholder="n8n, Activepieces, webhook" />
      <div className="md:col-span-2">
        <Field name="webhookUrl" label="Webhook URL" />
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="description">Description</label>
        <textarea className="text-area" id="description" name="description" rows={3} />
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="rollbackNote">Rollback note</label>
        <textarea className="text-area" id="rollbackNote" name="rollbackNote" rows={2} />
      </div>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Register automation</button>
      </div>
    </form>
  );
}

export function RiskForm({
  streams,
  companyFunctions,
  action
}: {
  streams: ReferenceItem[];
  companyFunctions: ReferenceItem[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="eyebrow">Governance</p>
        <h2>Log Risk</h2>
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="issue">Risk</label>
        <input className="input" id="issue" name="issue" placeholder="What could go wrong, and why it matters" required type="text" />
      </div>
      <Select name="severity" label="Severity" values={Object.values(RiskLevel)} defaultValue={RiskLevel.MEDIUM} />
      <Field name="nextReviewAt" label="Next review date" type="date" />
      <SelectItems name="streamId" label="Stream" items={streams} emptyLabel="No stream" />
      <SelectItems name="companyFunctionId" label="Company function" items={companyFunctions} emptyLabel="No function" />
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="mitigation">Mitigation</label>
        <textarea className="text-area" id="mitigation" name="mitigation" rows={3} placeholder="How the risk is being reduced or contained" />
      </div>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Log risk</button>
      </div>
    </form>
  );
}

export function DecisionForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="eyebrow">Governance</p>
        <h2>Record Decision</h2>
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="decision">Decision</label>
        <input className="input" id="decision" name="decision" placeholder="The call that was made" required type="text" />
      </div>
      <Field name="affectedArea" label="Affected area" placeholder="Finance, Product, Legal..." />
      <Field name="decidedAt" label="Decided on" type="date" />
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="rationale">Rationale</label>
        <textarea className="text-area" id="rationale" name="rationale" rows={3} placeholder="Why this was the right call" />
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor="relatedDocs">Related docs</label>
        <input className="input" id="relatedDocs" name="relatedDocs" placeholder="Links or references" type="text" />
      </div>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Record decision</button>
      </div>
    </form>
  );
}

export function InlineRiskForm({ actionId, action }: { actionId: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="mt-3 space-y-2 rounded-md border border-command-line bg-command-panel p-3">
      <input name="actionId" type="hidden" value={actionId} />
      <p className="field-label">Log a risk for this action</p>
      <input className="input" name="issue" placeholder="What could go wrong" required type="text" />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-36 flex-1">
          <Select name="severity" label="Severity" values={Object.values(RiskLevel)} defaultValue={RiskLevel.MEDIUM} />
        </div>
        <button className="button button-primary" type="submit">Add risk</button>
      </div>
    </form>
  );
}

export function InlineDecisionForm({ actionId, action }: { actionId: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="mt-3 space-y-2 rounded-md border border-command-line bg-command-panel p-3">
      <input name="followUpActionId" type="hidden" value={actionId} />
      <p className="field-label">Record a decision from this action</p>
      <input className="input" name="decision" placeholder="The call that was made" required type="text" />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-36 flex-1">
          <label className="field-label" htmlFor="rationale">Rationale</label>
          <input className="input" id="rationale" name="rationale" placeholder="Why" type="text" />
        </div>
        <button className="button button-primary" type="submit">Add decision</button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  defaultValue
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>{label}</label>
      <input className="input" defaultValue={defaultValue} id={name} name={name} placeholder={placeholder} required={required} type={type} />
    </div>
  );
}

function Select({ name, label, values, defaultValue }: { name: string; label: string; values: string[]; defaultValue?: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>{label}</label>
      <select className="select" defaultValue={defaultValue} id={name} name={name}>
        {values.map((value) => (
          <option key={value} value={value}>{value === "ALL" ? "All" : value.replaceAll("_", " ")}</option>
        ))}
      </select>
    </div>
  );
}

function SelectItems({
  name,
  label,
  items,
  defaultValue,
  emptyLabel = "Unassigned"
}: {
  name: string;
  label: string;
  items: ReferenceItem[];
  defaultValue?: string;
  emptyLabel?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>{label}</label>
      <select className="select" defaultValue={defaultValue} id={name} name={name}>
        <option value="">{emptyLabel}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
    </div>
  );
}
