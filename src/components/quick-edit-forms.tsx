import { ActionStatus, Priority, RiskLevel } from "@prisma/client";
import { humanizeEnum } from "@/lib/domain";

type FormAction = (formData: FormData) => Promise<void>;
type ReferenceItem = { id: string; name: string };
type DateInput = Date | string | null | undefined;
type MoneyInput = string | number | { toString(): string } | null | undefined;

type SetupQuickEditItem = {
  key: string;
  title: string;
  status: ActionStatus | string;
  priority: Priority | string;
  dueAt?: DateInput;
  nextStep?: string | null;
};

type ActionQuickEditItem = {
  id: string;
  status: ActionStatus | string;
  priority: Priority | string;
  dueAt?: DateInput;
  reviewAt?: DateInput;
};

type LaunchpadQuickEditLink = {
  id: string;
  group: string;
  cost?: MoneyInput;
  renewalAt?: DateInput;
  owner?: string | null;
  riskLevel: RiskLevel | string;
};

type LaunchpadEditLink = LaunchpadQuickEditLink & {
  name: string;
  url: string;
  streamId?: string | null;
  loginNote?: string | null;
  description?: string | null;
  sensitive?: boolean | null;
};

export function SetupQuickEditForm({ action, item }: { action: FormAction; item: SetupQuickEditItem }) {
  const idPrefix = `setup-${item.key}`;

  return (
    <form action={action} className="grid gap-3 md:grid-cols-4">
      <input name="itemKey" type="hidden" value={item.key} />
      <SelectField
        defaultValue={item.status}
        id={`${idPrefix}-status`}
        label="Setup status"
        name="status"
        values={Object.values(ActionStatus)}
      />
      <SelectField
        defaultValue={item.priority}
        id={`${idPrefix}-priority`}
        label="Setup priority"
        name="priority"
        values={Object.values(Priority)}
      />
      <InputField
        defaultValue={dateInputValue(item.dueAt)}
        id={`${idPrefix}-dueAt`}
        label="Setup due date"
        name="dueAt"
        type="date"
      />
      <InputField
        defaultValue={item.nextStep ?? ""}
        id={`${idPrefix}-nextStep`}
        label="Setup next step"
        name="nextStep"
      />
      <div className="flex justify-end md:col-span-4">
        <button className="button button-primary" type="submit">Save setup edits</button>
      </div>
    </form>
  );
}

export function ActionQuickEditForm({ action, item }: { action: FormAction; item: ActionQuickEditItem }) {
  const idPrefix = `action-${item.id}`;

  return (
    <form action={action} className="grid gap-3 md:grid-cols-4">
      <input name="actionId" type="hidden" value={item.id} />
      <SelectField
        defaultValue={item.status}
        id={`${idPrefix}-status`}
        label="Action status"
        name="status"
        values={Object.values(ActionStatus)}
      />
      <SelectField
        defaultValue={item.priority}
        id={`${idPrefix}-priority`}
        label="Action priority"
        name="priority"
        values={Object.values(Priority)}
      />
      <InputField
        defaultValue={dateInputValue(item.dueAt)}
        id={`${idPrefix}-dueAt`}
        label="Action due date"
        name="dueAt"
        type="date"
      />
      <InputField
        defaultValue={dateInputValue(item.reviewAt)}
        id={`${idPrefix}-reviewAt`}
        label="Action review date"
        name="reviewAt"
        type="date"
      />
      <div className="flex justify-end md:col-span-4">
        <button className="button button-primary" type="submit">Save action edits</button>
      </div>
    </form>
  );
}

export function LaunchpadQuickEditForm({ action, link }: { action: FormAction; link: LaunchpadQuickEditLink }) {
  const idPrefix = `launchpad-quick-${link.id}`;

  return (
    <form action={action} className="grid gap-3 md:grid-cols-5">
      <input name="linkId" type="hidden" value={link.id} />
      <InputField defaultValue={link.group} id={`${idPrefix}-group`} label="System group" name="group" />
      <InputField defaultValue={moneyInputValue(link.cost)} id={`${idPrefix}-cost`} label="System cost" name="cost" />
      <InputField
        defaultValue={dateInputValue(link.renewalAt)}
        id={`${idPrefix}-renewalAt`}
        label="System renewal date"
        name="renewalAt"
        type="date"
      />
      <InputField defaultValue={link.owner ?? ""} id={`${idPrefix}-owner`} label="System owner" name="owner" />
      <SelectField
        defaultValue={link.riskLevel}
        id={`${idPrefix}-riskLevel`}
        label="System risk"
        name="riskLevel"
        values={Object.values(RiskLevel)}
      />
      <div className="flex justify-end md:col-span-5">
        <button className="button button-primary" type="submit">Save system edits</button>
      </div>
    </form>
  );
}

export function LaunchpadEditForm({
  action,
  streams,
  link
}: {
  action: FormAction;
  streams: ReferenceItem[];
  link: LaunchpadEditLink;
}) {
  const idPrefix = `launchpad-${link.id}`;

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input name="linkId" type="hidden" value={link.id} />
      <InputField defaultValue={link.name} id={`${idPrefix}-name`} label="Name" name="name" required />
      <InputField defaultValue={link.url} id={`${idPrefix}-url`} label="URL" name="url" required />
      <InputField defaultValue={link.group} id={`${idPrefix}-group`} label="Group" name="group" required />
      <SelectItemsField
        defaultValue={link.streamId ?? ""}
        emptyLabel="No stream (shared)"
        id={`${idPrefix}-streamId`}
        items={streams}
        label="Stream"
        name="streamId"
      />
      <InputField defaultValue={moneyInputValue(link.cost)} id={`${idPrefix}-cost`} label="Cost" name="cost" />
      <InputField
        defaultValue={dateInputValue(link.renewalAt)}
        id={`${idPrefix}-renewalAt`}
        label="Renewal date"
        name="renewalAt"
        type="date"
      />
      <InputField defaultValue={link.owner ?? ""} id={`${idPrefix}-owner`} label="Owner" name="owner" />
      <SelectField
        defaultValue={link.riskLevel}
        id={`${idPrefix}-riskLevel`}
        label="Risk level"
        name="riskLevel"
        values={Object.values(RiskLevel)}
      />
      <InputField
        defaultValue={link.loginNote ?? ""}
        id={`${idPrefix}-loginNote`}
        label="Credential/location note"
        name="loginNote"
      />
      <label className="flex items-center gap-2 text-sm text-command-muted">
        <input defaultChecked={Boolean(link.sensitive)} id={`${idPrefix}-sensitive`} name="sensitive" type="checkbox" />
        Sensitive
      </label>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          className="text-area"
          defaultValue={link.description ?? ""}
          id={`${idPrefix}-description`}
          name="description"
          rows={3}
        />
      </div>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Save launchpad record</button>
      </div>
    </form>
  );
}

function InputField({
  defaultValue,
  id,
  label,
  name,
  required = false,
  type = "text"
}: {
  defaultValue?: string;
  id: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input className="input" defaultValue={defaultValue} id={id} name={name} required={required} type={type} />
    </div>
  );
}

function SelectField({
  defaultValue,
  id,
  label,
  name,
  values
}: {
  defaultValue?: string;
  id: string;
  label: string;
  name: string;
  values: string[];
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <select className="select" defaultValue={defaultValue} id={id} name={name}>
        {values.map((value) => (
          <option key={value} value={value}>{humanizeEnum(value)}</option>
        ))}
      </select>
    </div>
  );
}

function SelectItemsField({
  defaultValue,
  emptyLabel,
  id,
  items,
  label,
  name
}: {
  defaultValue?: string;
  emptyLabel: string;
  id: string;
  items: ReferenceItem[];
  label: string;
  name: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <select className="select" defaultValue={defaultValue} id={id} name={name}>
        <option value="">{emptyLabel}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
    </div>
  );
}

function dateInputValue(value: DateInput) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function moneyInputValue(value: MoneyInput) {
  return value == null ? "" : value.toString();
}
