import { ActionSource, Priority, ActionStatus, AutomationSafetyLevel } from "@prisma/client";
import Link from "next/link";

type ReferenceItem = { id: string; name: string };
type FilterValues = Record<string, string | undefined>;

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
    <form action={action} className="panel grid gap-4 md:grid-cols-2">
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
    <form className="panel grid gap-4 md:grid-cols-2 xl:grid-cols-4" method="get">
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

export function LaunchpadForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="panel grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <p className="eyebrow">Systems</p>
        <h2>Add Launchpad Link</h2>
      </div>
      <Field name="name" label="Name" required />
      <Field name="url" label="URL" required />
      <Field name="group" label="Group" required placeholder="Money, Legal/Admin, AI/Workbench..." />
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
    <form action={action} className="panel grid gap-4 md:grid-cols-2">
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
