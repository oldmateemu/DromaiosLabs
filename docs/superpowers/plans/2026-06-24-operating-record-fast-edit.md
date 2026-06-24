# Operating Record Fast Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase 1 of the operating-record upgrade: inline fast edits for setup items, launchpad systems, and actions, plus a launchpad detail page ready for future record linking.

**Architecture:** Reuse existing `Action` and `LaunchpadLink` fields. Add focused service functions and server actions for small edits, then wire compact forms into the list pages. Do not add the generic relationship table in this phase; reserve linked-record sections on detail pages using existing hardcoded relations.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, React server actions, Tailwind CSS, Vitest, Testing Library.

---

## Scope Check

The approved design includes two phases: fast editing first, generic linking second. This plan implements only phase 1. Phase 2 should get a separate plan after fast editing is verified in the app.

## File Structure

- Modify `src/lib/company-setup-checklist.ts`: extend setup action state so seeded action values overlay checklist defaults for due date, priority, next step, and description.
- Modify `src/lib/company-setup-checklist.test.ts`: prove setup overlay behavior remains deterministic.
- Modify `src/lib/services.ts`: add focused update functions for setup quick edits, action quick edits, launchpad quick edits, launchpad full edits, and launchpad detail loading.
- Modify `src/lib/services.test.ts`: add Prisma mocks and service tests for all focused update functions.
- Modify `src/app/actions.ts`: add authenticated server actions that call the focused service functions and redirect to the right cockpit page.
- Modify `src/app/actions.test.ts`: prove the new server actions require auth, call the right service function, and redirect correctly.
- Create `src/components/quick-edit-forms.tsx`: compact inline forms for setup rows, action table rows, launchpad rows, and a full launchpad edit form.
- Create `src/components/quick-edit-forms.test.tsx`: component tests for labels, default values, hidden ids, enum choices, and submit buttons.
- Modify `src/app/(app)/setup/page.tsx`: render setup quick edit form in each setup item row while keeping existing status shortcuts.
- Modify `src/app/(app)/actions/page.tsx`: render action quick edit controls in the action register table and add the review-date column.
- Modify `src/app/(app)/launchpad/page.tsx`: render launchpad quick edit controls and link each system to its detail page.
- Create `src/app/(app)/launchpad/[id]/page.tsx`: full launchpad edit surface plus existing linked actions section.
- Modify `docs/CHANGE_GUIDES.md`: document cockpit-first editing before local JSON bootstrap import.
- Modify `docs/COMPANY_SETUP_CHECKLIST.md`: document that setup due date, priority, and next step can be edited from `/setup`.

---

### Task 1: Setup Overlay Model

**Files:**
- Modify: `src/lib/company-setup-checklist.ts`
- Modify: `src/lib/company-setup-checklist.test.ts`

- [ ] **Step 1: Write the failing setup overlay test**

Add this test to the existing `describe("summariseSetupChecklist", ...)` block in `src/lib/company-setup-checklist.test.ts`:

```ts
it("overlays mutable action fields onto checklist defaults", () => {
  const summary = summariseSetupChecklist(
    [item({ key: "a", title: "Item A", priority: "HIGH", description: "default desc", nextStep: "default step" })],
    stateMap([
      [
        "Item A",
        {
          status: "IN_PROGRESS",
          dueAt: "2026-07-15",
          priority: "CRITICAL",
          description: "updated desc",
          nextStep: "updated step"
        }
      ]
    ]),
    NOW
  );

  expect(summary.categories[0].items[0]).toMatchObject({
    status: "IN_PROGRESS",
    dueAt: "2026-07-15",
    priority: "CRITICAL",
    description: "updated desc",
    nextStep: "updated step"
  });
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```powershell
pnpm test -- src/lib/company-setup-checklist.test.ts
```

Expected: FAIL because `SetupActionState` does not expose `priority`, `description`, or `nextStep`, and `summariseSetupChecklist(...)` still returns checklist defaults.

- [ ] **Step 3: Extend setup state and overlay mutable fields**

Update `src/lib/company-setup-checklist.ts` so `SetupActionState` carries optional mutable fields:

```ts
export type SetupActionState = {
  status: SetupItemStatus;
  dueAt?: Date | string | null;
  priority?: SetupPriority | null;
  description?: string | null;
  nextStep?: string | null;
};
```

Inside `summariseSetupChecklist(...)`, replace the current `view` creation with:

```ts
const view: SetupItemView = {
  ...item,
  status,
  priority: state?.priority ?? item.priority,
  description: state?.description?.trim() ? state.description : item.description,
  nextStep: state?.nextStep?.trim() ? state.nextStep : item.nextStep,
  done,
  dueAt,
  overdue,
  dueSoon
};
```

- [ ] **Step 4: Run the targeted test and verify it passes**

Run:

```powershell
pnpm test -- src/lib/company-setup-checklist.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit task 1**

Do not commit while this checkout is detached. If you are on a branch, commit:

```bash
git add src/lib/company-setup-checklist.ts src/lib/company-setup-checklist.test.ts
git commit -m "feat: overlay setup action edits"
```

---

### Task 2: Focused Service Updates

**Files:**
- Modify: `src/lib/services.ts`
- Modify: `src/lib/services.test.ts`

- [ ] **Step 1: Expand Prisma mocks for launchpad updates**

In `src/lib/services.test.ts`, change the `launchpadLink` mock from:

```ts
launchpadLink: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
```

to:

```ts
launchpadLink: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
```

Add these defaults inside `beforeEach(...)`:

```ts
prismaMock.launchpadLink.findUnique.mockResolvedValue(null);
prismaMock.launchpadLink.update.mockResolvedValue({ id: "link-1" });
```

- [ ] **Step 2: Write failing service tests for setup quick edits**

Add this block to `src/lib/services.test.ts` after `describe("updateActionStatus", ...)`:

```ts
describe("updateSetupItemFromForm", () => {
  it("updates the backing setup action with mutable operating fields", async () => {
    prismaMock.action.findFirst.mockResolvedValue({
      id: "setup-action-1",
      status: ActionStatus.OPEN,
      dueAt: null,
      completedAt: null
    });

    await services.updateSetupItemFromForm(
      "legal-asic-current",
      form({
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueAt: "2026-07-15",
        nextStep: "Call accountant"
      }),
      "user-1"
    );

    expect(prismaMock.action.update).toHaveBeenCalledWith({
      where: { id: "setup-action-1" },
      data: expect.objectContaining({
        status: ActionStatus.IN_PROGRESS,
        priority: Priority.CRITICAL,
        nextStep: "Call accountant",
        completedAt: null
      })
    });
    expect(prismaMock.action.update.mock.calls[0][0].data.dueAt.toISOString()).toBe("2026-07-15T00:00:00.000Z");
    expect(revalidatePath).toHaveBeenCalledWith("/setup");
    expect(revalidatePath).toHaveBeenCalledWith("/actions");
  });

  it("self-heals a missing setup action before applying quick edit values", async () => {
    prismaMock.action.findFirst.mockResolvedValue(null);
    prismaMock.stream.findUnique.mockResolvedValue({ id: "stream-company-core" });
    prismaMock.companyFunction.findUnique.mockResolvedValue({ id: "function-legal" });

    await services.updateSetupItemFromForm(
      "legal-asic-current",
      form({ status: "WAITING", priority: "HIGH", dueAt: "2026-08-01", nextStep: "Wait for ASIC extract" }),
      "user-1"
    );

    const data = prismaMock.action.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      title: "Confirm ASIC company details are current",
      status: ActionStatus.WAITING,
      priority: Priority.HIGH,
      nextStep: "Wait for ASIC extract",
      streamId: "stream-company-core",
      companyFunctionId: "function-legal",
      createdById: "user-1"
    });
    expect(data.dueAt.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});
```

- [ ] **Step 3: Write failing service tests for action quick edits**

Add this block after the setup quick-edit tests:

```ts
describe("updateActionQuickEditFromForm", () => {
  it("updates only status, priority, due date, and review date", async () => {
    prismaMock.action.findUnique.mockResolvedValue({ completedAt: null });

    await services.updateActionQuickEditFromForm(
      "action-1",
      form({ status: "DONE", priority: "HIGH", dueAt: "2026-07-20", reviewAt: "2026-07-25" })
    );

    const call = prismaMock.action.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "action-1" });
    expect(call.data).toMatchObject({
      status: ActionStatus.DONE,
      priority: Priority.HIGH
    });
    expect(call.data.dueAt.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(call.data.reviewAt.toISOString()).toBe("2026-07-25T00:00:00.000Z");
    expect(call.data.completedAt).toBeInstanceOf(Date);
    expect(call.data.title).toBeUndefined();
  });

  it("clears completedAt when an action is reopened from quick edit", async () => {
    prismaMock.action.findUnique.mockResolvedValue({ completedAt: new Date("2026-07-01T00:00:00.000Z") });

    await services.updateActionQuickEditFromForm("action-1", form({ status: "OPEN", priority: "MEDIUM" }));

    expect(prismaMock.action.update.mock.calls[0][0].data.completedAt).toBeNull();
  });
});
```

- [ ] **Step 4: Write failing service tests for launchpad edits**

Add this block after the action quick-edit tests:

```ts
describe("launchpad update services", () => {
  it("updates quick-edit launchpad metadata and revalidates dependent views", async () => {
    await services.updateLaunchpadQuickFieldsFromForm(
      "link-1",
      form({
        group: "Money",
        cost: "99.00",
        renewalAt: "2026-09-01",
        owner: "Callum",
        riskLevel: "HIGH"
      })
    );

    const call = prismaMock.launchpadLink.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "link-1" });
    expect(call.data).toMatchObject({
      group: "Money",
      cost: "99.00",
      owner: "Callum",
      riskLevel: RiskLevel.HIGH
    });
    expect(call.data.renewalAt.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(revalidatePath).toHaveBeenCalledWith("/launchpad");
    expect(revalidatePath).toHaveBeenCalledWith("/portfolio");
    expect(revalidatePath).toHaveBeenCalledWith("/automations");
  });

  it("updates the full launchpad detail record", async () => {
    await services.updateLaunchpadLinkFromForm(
      "link-1",
      form({
        name: "Xero",
        url: "https://xero.com",
        group: "Money",
        streamId: "stream-1",
        cost: "88.00",
        renewalAt: "2026-10-01",
        owner: "Callum",
        riskLevel: "CRITICAL",
        loginNote: "Password manager entry",
        description: "Accounting source of truth",
        sensitive: "on"
      })
    );

    expect(prismaMock.launchpadLink.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: expect.objectContaining({
        name: "Xero",
        url: "https://xero.com",
        group: "Money",
        streamId: "stream-1",
        cost: "88.00",
        owner: "Callum",
        riskLevel: RiskLevel.CRITICAL,
        loginNote: "Password manager entry",
        description: "Accounting source of truth",
        sensitive: true
      })
    });
  });

  it("loads launchpad detail with linked actions and reference data", async () => {
    prismaMock.launchpadLink.findUnique.mockResolvedValue({
      id: "link-1",
      name: "Xero",
      actions: [{ id: "action-1", title: "Review Xero renewal" }]
    });

    const detail = await services.getLaunchpadDetail("link-1");

    expect(prismaMock.launchpadLink.findUnique).toHaveBeenCalledWith({
      where: { id: "link-1" },
      include: {
        stream: true,
        actions: {
          orderBy: [{ status: "asc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
          take: 20
        }
      }
    });
    expect(detail.link?.name).toBe("Xero");
  });
});
```

- [ ] **Step 5: Run the targeted service tests and verify they fail**

Run:

```powershell
pnpm test -- src/lib/services.test.ts
```

Expected: FAIL because the new service functions do not exist and `getCompanySetupData()` still selects only status and due date.

- [ ] **Step 6: Implement shared completion timestamp helper**

In `src/lib/services.ts`, add this helper near the other form helpers:

```ts
function completedAtForStatus(status: ActionStatus, existingCompletedAt?: Date | null) {
  return status === ActionStatus.DONE ? existingCompletedAt ?? new Date() : null;
}
```

Update both `updateActionStatus(...)` and `updateActionFromForm(...)` to use this helper. `updateActionStatus(...)` can pass `null` as the existing timestamp because it does not currently fetch the existing row:

```ts
completedAt: completedAtForStatus(status, null)
```

In `updateActionFromForm(...)`, replace the current completed timestamp expression with:

```ts
completedAt: completedAtForStatus(status, existing.completedAt)
```

- [ ] **Step 7: Update setup data loading**

In `getCompanySetupData()`, change the action select to:

```ts
select: { id: true, title: true, status: true, dueAt: true, priority: true, description: true, nextStep: true }
```

Change the state assignment to:

```ts
stateByTitle.set(key, {
  status: action.status as SetupActionState["status"],
  dueAt: action.dueAt,
  priority: action.priority as SetupActionState["priority"],
  description: action.description,
  nextStep: action.nextStep
});
```

- [ ] **Step 8: Implement setup quick edit service**

Add this function below `setSetupItemStatus(...)`:

```ts
export async function updateSetupItemFromForm(itemKey: string, formData: FormData, userId: string) {
  const item = COMPANY_SETUP_CHECKLIST.find((entry) => entry.key === itemKey);
  if (!item) throw new Error("Unknown setup checklist item.");

  const status = enumValue(formData, "status", ActionStatus, ActionStatus.OPEN);
  const priority = enumValue(formData, "priority", Priority, item.priority as Priority);
  const dueAt = dateValue(formData, "dueAt");
  const nextStep = optionalString(formData, "nextStep") ?? item.nextStep;

  const existing = await prisma.action.findFirst({
    where: { title: item.title },
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    await prisma.action.update({
      where: { id: existing.id },
      data: {
        status,
        priority,
        dueAt,
        nextStep,
        completedAt: completedAtForStatus(status, existing.completedAt)
      }
    });
  } else {
    const [stream, companyFunction] = await Promise.all([
      prisma.stream.findUnique({ where: { name: SETUP_CHECKLIST_STREAM } }),
      prisma.companyFunction.findUnique({ where: { name: item.companyFunction } })
    ]);
    if (!stream) throw new Error(`Missing setup stream: ${SETUP_CHECKLIST_STREAM}.`);
    if (!companyFunction) throw new Error(`Missing company function: ${item.companyFunction}.`);

    await prisma.action.create({
      data: {
        title: item.title,
        description: item.description,
        nextStep,
        sensitive: item.sensitive,
        priority,
        status,
        dueAt: dueAt ?? setupDueDate(item),
        completedAt: completedAtForStatus(status, null),
        source: ActionSource.USER,
        streamId: stream.id,
        companyFunctionId: companyFunction.id,
        createdById: userId
      }
    });
  }

  revalidatePath("/setup");
  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath("/reviews");
}
```

- [ ] **Step 9: Implement action quick edit service**

Add this function near `updateActionFromForm(...)`:

```ts
export async function updateActionQuickEditFromForm(actionId: string, formData: FormData) {
  const existing = await prisma.action.findUnique({ where: { id: actionId }, select: { completedAt: true } });
  if (!existing) throw new Error("Action not found.");

  const status = enumValue(formData, "status", ActionStatus, ActionStatus.OPEN);

  await prisma.action.update({
    where: { id: actionId },
    data: {
      status,
      priority: enumValue(formData, "priority", Priority, Priority.MEDIUM),
      dueAt: dateValue(formData, "dueAt") ?? null,
      reviewAt: dateValue(formData, "reviewAt") ?? null,
      completedAt: completedAtForStatus(status, existing.completedAt)
    }
  });

  revalidatePath("/");
  revalidatePath("/actions");
  revalidatePath(`/actions/${actionId}`);
}
```

- [ ] **Step 10: Implement launchpad quick edit, full edit, and detail services**

Add these functions near `createLaunchpadLink(...)`:

```ts
export async function updateLaunchpadQuickFieldsFromForm(linkId: string, formData: FormData) {
  await prisma.launchpadLink.update({
    where: { id: linkId },
    data: {
      group: stringValue(formData, "group") || "Ungrouped",
      cost: decimalValue(formData, "cost"),
      renewalAt: dateValue(formData, "renewalAt"),
      owner: optionalString(formData, "owner"),
      riskLevel: enumValue(formData, "riskLevel", RiskLevel, RiskLevel.LOW)
    }
  });

  revalidatePath("/launchpad");
  revalidatePath(`/launchpad/${linkId}`);
  revalidatePath("/portfolio");
  revalidatePath("/automations");
}

export async function updateLaunchpadLinkFromForm(linkId: string, formData: FormData) {
  const name = stringValue(formData, "name");
  const url = stringValue(formData, "url");
  const group = stringValue(formData, "group");
  if (!name || !url || !group) throw new Error("Name, URL, and group are required.");

  await prisma.launchpadLink.update({
    where: { id: linkId },
    data: {
      name,
      url,
      group,
      description: optionalString(formData, "description"),
      cost: decimalValue(formData, "cost"),
      renewalAt: dateValue(formData, "renewalAt"),
      loginNote: optionalString(formData, "loginNote"),
      riskLevel: enumValue(formData, "riskLevel", RiskLevel, RiskLevel.LOW),
      owner: optionalString(formData, "owner"),
      streamId: optionalString(formData, "streamId"),
      sensitive: formData.get("sensitive") === "on"
    }
  });

  revalidatePath("/launchpad");
  revalidatePath(`/launchpad/${linkId}`);
  revalidatePath("/portfolio");
  revalidatePath("/automations");
}
```

Add this read function near `getLaunchpadData()`:

```ts
export async function getLaunchpadDetail(id: string) {
  const [link, reference] = await Promise.all([
    prisma.launchpadLink.findUnique({
      where: { id },
      include: {
        stream: true,
        actions: {
          orderBy: [{ status: "asc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
          take: 20
        }
      }
    }),
    getReferenceData()
  ]);
  return { link, ...reference };
}
```

- [ ] **Step 11: Run service tests and verify they pass**

Run:

```powershell
pnpm test -- src/lib/services.test.ts src/lib/company-setup-checklist.test.ts
```

Expected: PASS.

- [ ] **Step 12: Commit task 2**

Do not commit while this checkout is detached. If you are on a branch, commit:

```bash
git add src/lib/services.ts src/lib/services.test.ts src/lib/company-setup-checklist.ts src/lib/company-setup-checklist.test.ts
git commit -m "feat: add focused operating record update services"
```

---

### Task 3: Server Actions

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/app/actions.test.ts`

- [ ] **Step 1: Write failing server-action tests**

In `src/app/actions.test.ts`, add these service mocks:

```ts
updateActionQuickEditFromForm: vi.fn(),
updateLaunchpadLinkFromForm: vi.fn(),
updateLaunchpadQuickFieldsFromForm: vi.fn(),
updateSetupItemFromForm: vi.fn()
```

Add these tests inside `describe("authenticated form actions", ...)`:

```ts
it("updateSetupItemAction updates setup metadata and redirects to setup", async () => {
  await expect(actions.updateSetupItemAction(form({ itemKey: "legal-asic-current", status: "IN_PROGRESS" }))).rejects.toThrow(
    "REDIRECT:/setup"
  );

  expect(servicesMock.updateSetupItemFromForm).toHaveBeenCalledWith(
    "legal-asic-current",
    expect.any(FormData),
    "user-1"
  );
});

it("updateActionQuickEditAction updates action metadata and redirects to actions", async () => {
  await expect(actions.updateActionQuickEditAction(form({ actionId: "action-1", status: "WAITING" }))).rejects.toThrow(
    "REDIRECT:/actions"
  );

  expect(servicesMock.updateActionQuickEditFromForm).toHaveBeenCalledWith("action-1", expect.any(FormData));
});

it("updateLaunchpadQuickEditAction updates launchpad metadata and redirects to launchpad", async () => {
  await expect(actions.updateLaunchpadQuickEditAction(form({ linkId: "link-1", cost: "99.00" }))).rejects.toThrow(
    "REDIRECT:/launchpad"
  );

  expect(servicesMock.updateLaunchpadQuickFieldsFromForm).toHaveBeenCalledWith("link-1", expect.any(FormData));
});

it("updateLaunchpadLinkAction updates the full launchpad record and redirects to detail", async () => {
  await expect(actions.updateLaunchpadLinkAction(form({ linkId: "link-1", name: "Xero" }))).rejects.toThrow(
    "REDIRECT:/launchpad/link-1"
  );

  expect(servicesMock.updateLaunchpadLinkFromForm).toHaveBeenCalledWith("link-1", expect.any(FormData));
});
```

- [ ] **Step 2: Run server-action tests and verify they fail**

Run:

```powershell
pnpm test -- src/app/actions.test.ts
```

Expected: FAIL because the server actions and service imports are missing.

- [ ] **Step 3: Import focused services**

In `src/app/actions.ts`, add these imports from `@/lib/services`:

```ts
updateActionQuickEditFromForm,
updateLaunchpadLinkFromForm,
updateLaunchpadQuickFieldsFromForm,
updateSetupItemFromForm,
```

- [ ] **Step 4: Add server action functions**

Add these functions after `updateActionAction(...)` and `setSetupItemStatusAction(...)`:

```ts
export async function updateActionQuickEditAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("actionId") ?? "").trim();
  if (!actionId) throw new Error("Action id is required.");
  await updateActionQuickEditFromForm(actionId, formData);
  redirect("/actions");
}
```

Add this after `setSetupItemStatusAction(...)`:

```ts
export async function updateSetupItemAction(formData: FormData) {
  const user = await requireUser();
  const itemKey = String(formData.get("itemKey") ?? "").trim();
  if (!itemKey) throw new Error("Missing setup item key.");
  await updateSetupItemFromForm(itemKey, formData, user.id);
  redirect("/setup");
}
```

Add these after `createLaunchpadLinkAction(...)`:

```ts
export async function updateLaunchpadQuickEditAction(formData: FormData) {
  await requireUser();
  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) throw new Error("Launchpad link id is required.");
  await updateLaunchpadQuickFieldsFromForm(linkId, formData);
  redirect("/launchpad");
}

export async function updateLaunchpadLinkAction(formData: FormData) {
  await requireUser();
  const linkId = String(formData.get("linkId") ?? "").trim();
  if (!linkId) throw new Error("Launchpad link id is required.");
  await updateLaunchpadLinkFromForm(linkId, formData);
  redirect(`/launchpad/${encodeURIComponent(linkId)}`);
}
```

- [ ] **Step 5: Run server-action tests and verify they pass**

Run:

```powershell
pnpm test -- src/app/actions.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit task 3**

Do not commit while this checkout is detached. If you are on a branch, commit:

```bash
git add src/app/actions.ts src/app/actions.test.ts
git commit -m "feat: add operating record server actions"
```

---

### Task 4: Quick Edit Form Components

**Files:**
- Create: `src/components/quick-edit-forms.tsx`
- Create: `src/components/quick-edit-forms.test.tsx`

- [ ] **Step 1: Write component tests**

Create `src/components/quick-edit-forms.test.tsx` with:

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ActionQuickEditForm,
  LaunchpadEditForm,
  LaunchpadQuickEditForm,
  SetupQuickEditForm
} from "./quick-edit-forms";

const noop = async () => {};
const streams = [{ id: "stream-1", name: "DromaiosEd" }];

describe("SetupQuickEditForm", () => {
  it("renders compact mutable setup fields with the item key", () => {
    render(
      <SetupQuickEditForm
        action={noop}
        item={{
          key: "legal-asic-current",
          title: "Confirm ASIC company details are current",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueAt: "2026-07-15",
          nextStep: "Call accountant"
        }}
      />
    );

    expect(screen.getByDisplayValue("legal-asic-current")).toHaveAttribute("name", "itemKey");
    expect((screen.getByLabelText("Setup status") as HTMLSelectElement).value).toBe("IN_PROGRESS");
    expect((screen.getByLabelText("Setup priority") as HTMLSelectElement).value).toBe("HIGH");
    expect((screen.getByLabelText("Setup due date") as HTMLInputElement).value).toBe("2026-07-15");
    expect(screen.getByLabelText("Setup next step")).toHaveValue("Call accountant");
    expect(screen.getByRole("button", { name: "Save setup edits" })).toBeInTheDocument();
  });
});

describe("ActionQuickEditForm", () => {
  it("renders action quick edit fields", () => {
    render(
      <ActionQuickEditForm
        action={noop}
        item={{
          id: "action-1",
          status: "OPEN",
          priority: "MEDIUM",
          dueAt: "2026-08-01",
          reviewAt: "2026-08-03"
        }}
      />
    );

    expect(screen.getByDisplayValue("action-1")).toHaveAttribute("name", "actionId");
    expect((screen.getByLabelText("Action status") as HTMLSelectElement).value).toBe("OPEN");
    expect((screen.getByLabelText("Action priority") as HTMLSelectElement).value).toBe("MEDIUM");
    expect((screen.getByLabelText("Action due date") as HTMLInputElement).value).toBe("2026-08-01");
    expect((screen.getByLabelText("Action review date") as HTMLInputElement).value).toBe("2026-08-03");
  });
});

describe("LaunchpadQuickEditForm", () => {
  it("renders launchpad quick metadata controls", () => {
    render(
      <LaunchpadQuickEditForm
        action={noop}
        link={{
          id: "link-1",
          group: "Money",
          cost: "99.00",
          renewalAt: "2026-09-01",
          owner: "Callum",
          riskLevel: "HIGH"
        }}
      />
    );

    expect(screen.getByDisplayValue("link-1")).toHaveAttribute("name", "linkId");
    expect(screen.getByLabelText("System group")).toHaveValue("Money");
    expect(screen.getByLabelText("System cost")).toHaveValue("99.00");
    expect((screen.getByLabelText("System renewal date") as HTMLInputElement).value).toBe("2026-09-01");
    expect(screen.getByLabelText("System owner")).toHaveValue("Callum");
    expect((screen.getByLabelText("System risk") as HTMLSelectElement).value).toBe("HIGH");
  });
});

describe("LaunchpadEditForm", () => {
  it("renders full launchpad editing with streams and sensitive flag", () => {
    render(
      <LaunchpadEditForm
        action={noop}
        streams={streams}
        link={{
          id: "link-1",
          name: "Xero",
          url: "https://xero.com",
          group: "Money",
          streamId: "stream-1",
          cost: "99.00",
          renewalAt: "2026-09-01",
          owner: "Callum",
          riskLevel: "HIGH",
          loginNote: "Password manager entry",
          description: "Accounting source of truth",
          sensitive: true
        }}
      />
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Xero");
    expect(screen.getByLabelText("URL")).toHaveValue("https://xero.com");
    expect(within(screen.getByLabelText("Stream")).getByRole("option", { name: "DromaiosEd" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sensitive")).toBeChecked();
    expect(screen.getByRole("button", { name: "Save launchpad record" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component tests and verify they fail**

Run:

```powershell
pnpm test -- src/components/quick-edit-forms.test.tsx
```

Expected: FAIL because `src/components/quick-edit-forms.tsx` does not exist.

- [ ] **Step 3: Create quick edit form components**

Create `src/components/quick-edit-forms.tsx` with:

```tsx
import { ActionStatus, Priority, RiskLevel } from "@prisma/client";

type ServerAction = (formData: FormData) => Promise<void>;
type ReferenceItem = { id: string; name: string };

type SetupQuickEditItem = {
  key: string;
  title: string;
  status: string;
  priority: string;
  dueAt?: Date | string | null;
  nextStep?: string | null;
};

type ActionQuickEditItem = {
  id: string;
  status: string;
  priority: string;
  dueAt?: Date | string | null;
  reviewAt?: Date | string | null;
};

type LaunchpadQuickEditItem = {
  id: string;
  group: string;
  cost?: unknown;
  renewalAt?: Date | string | null;
  owner?: string | null;
  riskLevel: string;
};

type LaunchpadEditable = LaunchpadQuickEditItem & {
  name: string;
  url: string;
  streamId?: string | null;
  loginNote?: string | null;
  description?: string | null;
  sensitive?: boolean | null;
};

export function SetupQuickEditForm({ item, action }: { item: SetupQuickEditItem; action: ServerAction }) {
  const prefix = `setup-${item.key}`;
  return (
    <form action={action} className="mt-3 grid gap-2 rounded-md border border-command-line bg-command-panel p-3 sm:grid-cols-2 xl:grid-cols-4">
      <input name="itemKey" type="hidden" value={item.key} />
      <Select id={`${prefix}-status`} label="Setup status" name="status" values={Object.values(ActionStatus)} defaultValue={item.status} />
      <Select id={`${prefix}-priority`} label="Setup priority" name="priority" values={Object.values(Priority)} defaultValue={item.priority} />
      <Field id={`${prefix}-dueAt`} label="Setup due date" name="dueAt" type="date" defaultValue={dateInputValue(item.dueAt)} />
      <div className="sm:col-span-2 xl:col-span-4">
        <Field id={`${prefix}-nextStep`} label="Setup next step" name="nextStep" defaultValue={item.nextStep ?? ""} />
      </div>
      <div className="sm:col-span-2 xl:col-span-4">
        <button className="button button-secondary w-full sm:w-auto" type="submit">Save setup edits</button>
      </div>
    </form>
  );
}

export function ActionQuickEditForm({ item, action }: { item: ActionQuickEditItem; action: ServerAction }) {
  const prefix = `action-${item.id}`;
  return (
    <form action={action} className="grid min-w-72 gap-2 sm:grid-cols-2">
      <input name="actionId" type="hidden" value={item.id} />
      <Select id={`${prefix}-status`} label="Action status" name="status" values={Object.values(ActionStatus)} defaultValue={item.status} />
      <Select id={`${prefix}-priority`} label="Action priority" name="priority" values={Object.values(Priority)} defaultValue={item.priority} />
      <Field id={`${prefix}-dueAt`} label="Action due date" name="dueAt" type="date" defaultValue={dateInputValue(item.dueAt)} />
      <Field id={`${prefix}-reviewAt`} label="Action review date" name="reviewAt" type="date" defaultValue={dateInputValue(item.reviewAt)} />
      <div className="sm:col-span-2">
        <button className="button button-secondary w-full" type="submit">Save action edits</button>
      </div>
    </form>
  );
}

export function LaunchpadQuickEditForm({ link, action }: { link: LaunchpadQuickEditItem; action: ServerAction }) {
  const prefix = `launchpad-${link.id}`;
  return (
    <form action={action} className="mt-3 grid gap-2 rounded-md border border-command-line bg-command-panel p-3 sm:grid-cols-2 xl:grid-cols-5">
      <input name="linkId" type="hidden" value={link.id} />
      <Field id={`${prefix}-group`} label="System group" name="group" defaultValue={link.group} />
      <Field id={`${prefix}-cost`} label="System cost" name="cost" defaultValue={stringValue(link.cost)} />
      <Field id={`${prefix}-renewalAt`} label="System renewal date" name="renewalAt" type="date" defaultValue={dateInputValue(link.renewalAt)} />
      <Field id={`${prefix}-owner`} label="System owner" name="owner" defaultValue={link.owner ?? ""} />
      <Select id={`${prefix}-riskLevel`} label="System risk" name="riskLevel" values={Object.values(RiskLevel)} defaultValue={link.riskLevel} />
      <div className="sm:col-span-2 xl:col-span-5">
        <button className="button button-secondary w-full sm:w-auto" type="submit">Save system edits</button>
      </div>
    </form>
  );
}

export function LaunchpadEditForm({
  link,
  streams,
  action
}: {
  link: LaunchpadEditable;
  streams: ReferenceItem[];
  action: ServerAction;
}) {
  const prefix = `launchpad-detail-${link.id}`;
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input name="linkId" type="hidden" value={link.id} />
      <Field id={`${prefix}-name`} label="Name" name="name" required defaultValue={link.name} />
      <Field id={`${prefix}-url`} label="URL" name="url" required defaultValue={link.url} />
      <Field id={`${prefix}-group`} label="Group" name="group" required defaultValue={link.group} />
      <SelectItems id={`${prefix}-streamId`} label="Stream" name="streamId" items={streams} defaultValue={link.streamId ?? ""} emptyLabel="No stream (shared)" />
      <Field id={`${prefix}-cost`} label="Cost" name="cost" defaultValue={stringValue(link.cost)} />
      <Field id={`${prefix}-renewalAt`} label="Renewal date" name="renewalAt" type="date" defaultValue={dateInputValue(link.renewalAt)} />
      <Field id={`${prefix}-owner`} label="Owner" name="owner" defaultValue={link.owner ?? ""} />
      <Select id={`${prefix}-riskLevel`} label="Risk level" name="riskLevel" values={Object.values(RiskLevel)} defaultValue={link.riskLevel} />
      <div className="md:col-span-2">
        <Field id={`${prefix}-loginNote`} label="Credential/location note" name="loginNote" defaultValue={link.loginNote ?? ""} />
      </div>
      <div className="md:col-span-2">
        <label className="field-label" htmlFor={`${prefix}-description`}>Description</label>
        <textarea className="text-area" defaultValue={link.description ?? ""} id={`${prefix}-description`} name="description" rows={3} />
      </div>
      <label className="flex items-center gap-2 text-sm text-command-muted">
        <input defaultChecked={Boolean(link.sensitive)} name="sensitive" type="checkbox" />
        Sensitive
      </label>
      <div className="flex justify-end md:col-span-2">
        <button className="button button-primary" type="submit">Save launchpad record</button>
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required = false,
  defaultValue
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input className="input" defaultValue={defaultValue} id={id} name={name} required={required} type={type} />
    </div>
  );
}

function Select({ id, name, label, values, defaultValue }: { id: string; name: string; label: string; values: string[]; defaultValue?: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <select className="select" defaultValue={defaultValue} id={id} name={name}>
        {values.map((value) => (
          <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
        ))}
      </select>
    </div>
  );
}

function SelectItems({
  id,
  name,
  label,
  items,
  defaultValue,
  emptyLabel
}: {
  id: string;
  name: string;
  label: string;
  items: ReferenceItem[];
  defaultValue: string;
  emptyLabel: string;
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

function dateInputValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function stringValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return typeof value === "object" && "toString" in value ? value.toString() : String(value);
}
```

- [ ] **Step 4: Run component tests and verify they pass**

Run:

```powershell
pnpm test -- src/components/quick-edit-forms.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit task 4**

Do not commit while this checkout is detached. If you are on a branch, commit:

```bash
git add src/components/quick-edit-forms.tsx src/components/quick-edit-forms.test.tsx
git commit -m "feat: add compact operating record edit forms"
```

---

### Task 5: Page Wiring

**Files:**
- Modify: `src/app/(app)/setup/page.tsx`
- Modify: `src/app/(app)/actions/page.tsx`
- Modify: `src/app/(app)/launchpad/page.tsx`
- Create: `src/app/(app)/launchpad/[id]/page.tsx`

- [ ] **Step 1: Wire setup quick edits**

In `src/app/(app)/setup/page.tsx`, update imports:

```ts
import { setSetupItemStatusAction, updateSetupItemAction } from "@/app/actions";
import { SetupQuickEditForm } from "@/components/quick-edit-forms";
```

Inside `SetupItemRow`, after the secondary status buttons, render:

```tsx
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
```

Run:

```powershell
pnpm test -- src/lib/company-setup-checklist.test.ts src/components/quick-edit-forms.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Wire action quick edits**

In `src/app/(app)/actions/page.tsx`, update imports:

```ts
import { createActionAction, completeActionAction, updateActionQuickEditAction } from "@/app/actions";
import { ActionQuickEditForm } from "@/components/quick-edit-forms";
```

Add a table header after `Due`:

```tsx
<th>Review</th>
```

Add this cell after the due cell:

```tsx
<td>{action.reviewAt ? action.reviewAt.toISOString().slice(0, 10) : "No date"}</td>
```

Replace the current control cell contents with:

```tsx
<div className="space-y-2">
  {action.status !== "DONE" ? (
    <form action={completeActionAction}>
      <input name="actionId" type="hidden" value={action.id} />
      <button className="button button-secondary w-full" type="submit">Done</button>
    </form>
  ) : (
    <span className="status-pill status-approved">Done</span>
  )}
  <ActionQuickEditForm
    action={updateActionQuickEditAction}
    item={{
      id: action.id,
      status: action.status,
      priority: action.priority,
      dueAt: action.dueAt,
      reviewAt: action.reviewAt
    }}
  />
</div>
```

Run:

```powershell
pnpm test -- src/app/actions.test.ts src/components/quick-edit-forms.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Wire launchpad quick edits**

In `src/app/(app)/launchpad/page.tsx`, update imports:

```ts
import Link from "next/link";
import { createLaunchpadLinkAction, updateLaunchpadQuickEditAction } from "@/app/actions";
import { LaunchpadQuickEditForm } from "@/components/quick-edit-forms";
```

Inside the `groupLinks.map(...)`, replace the single anchor wrapper with an article so the row can contain a form:

```tsx
<article className="action-row" key={link.id}>
  <div className="flex items-start justify-between gap-4">
    <div>
      <Link className="font-semibold text-command-ink hover:text-command-navy hover:underline" href={`/launchpad/${link.id}`}>
        {link.name}
      </Link>
      <p className="muted">{link.description ?? link.url}</p>
    </div>
    <span className="meta-pill">{link.riskLevel}</span>
  </div>
  <div className="mt-3 flex flex-wrap gap-2">
    {link.streamId && streamNames.has(link.streamId) ? <span className="meta-pill">{streamNames.get(link.streamId)}</span> : null}
    {link.renewalAt ? <span className="meta-pill">Renews {link.renewalAt.toISOString().slice(0, 10)}</span> : null}
    {link.cost ? <span className="meta-pill">${link.cost.toString()}</span> : null}
    {link.loginNote ? <span className="meta-pill">Login note saved</span> : null}
    <a className="button button-secondary px-3 py-1 text-xs" href={link.url} rel="noreferrer" target="_blank">Open</a>
  </div>
  <LaunchpadQuickEditForm
    action={updateLaunchpadQuickEditAction}
    link={{
      id: link.id,
      group: link.group,
      cost: link.cost,
      renewalAt: link.renewalAt,
      owner: link.owner,
      riskLevel: link.riskLevel
    }}
  />
</article>
```

Run:

```powershell
pnpm test -- src/components/quick-edit-forms.test.tsx src/components/launchpad-health.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Add launchpad detail page**

Create `src/app/(app)/launchpad/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateLaunchpadLinkAction } from "@/app/actions";
import { LaunchpadEditForm } from "@/components/quick-edit-forms";
import { priorityLabel, statusLabel } from "@/lib/domain";
import { getLaunchpadDetail } from "@/lib/services";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function LaunchpadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const data = await getLaunchpadDetail(id);
  if (!data.link) notFound();
  const link = data.link;

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Launchpad system</p>
          <h1>{link.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="button button-secondary" href={link.url} rel="noreferrer" target="_blank">Open system</a>
          <Link className="button button-secondary" href="/launchpad">Back to launchpad</Link>
        </div>
      </div>

      <section className="panel">
        <div className="flex flex-wrap gap-2">
          <span className="meta-pill">Group: {link.group}</span>
          <span className="meta-pill">Risk: {link.riskLevel}</span>
          <span className="meta-pill">Owner: {link.owner ?? "Unassigned"}</span>
          <span className="meta-pill">Stream: {link.stream?.name ?? "Shared"}</span>
          <span className="meta-pill">Renewal: {link.renewalAt ? link.renewalAt.toISOString().slice(0, 10) : "No date"}</span>
          <span className="meta-pill">Cost: {link.cost ? link.cost.toString() : "No cost"}</span>
          {link.sensitive ? <span className="status-pill status-draft">Sensitive</span> : null}
        </div>
        {link.description ? <p className="mt-3 whitespace-pre-line text-sm text-command-ink">{link.description}</p> : null}
        {link.loginNote ? <p className="muted mt-3">Credential note: {link.loginNote}</p> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Edit</p>
            <h2>Update system</h2>
          </div>
          <p className="muted">Store credential locations only. Keep passwords, tokens, and recovery codes in the password manager.</p>
        </div>
        <LaunchpadEditForm action={updateLaunchpadLinkAction} link={link} streams={data.streams} />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Linked records</p>
            <h2>Existing linked actions</h2>
          </div>
          <p className="muted">This phase shows existing hard links. Generic record linking belongs to the next implementation phase.</p>
        </div>
        {link.actions.length === 0 ? (
          <p className="empty-state">No actions are linked to this system yet.</p>
        ) : (
          <div className="space-y-2">
            {link.actions.map((action) => (
              <Link className="action-row block" href={`/actions/${action.id}`} key={action.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-command-ink">{action.title}</p>
                    {action.nextStep ? <p className="muted">{action.nextStep}</p> : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="meta-pill">{statusLabel(action.status)}</span>
                    <span className="meta-pill">{priorityLabel(action.priority)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

Run:

```powershell
pnpm typecheck
```

Expected: PASS. If typecheck reports that the linked action shape is too broad for `statusLabel(...)`, tighten the `getLaunchpadDetail(...)` relation selection to this exact shape:

```ts
actions: {
  orderBy: [{ status: "asc" }, { priority: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  take: 20,
  select: {
    id: true,
    title: true,
    status: true,
    priority: true,
    dueAt: true,
    nextStep: true
  }
}
```

- [ ] **Step 5: Run focused page-adjacent tests**

Run:

```powershell
pnpm test -- src/app/actions.test.ts src/lib/services.test.ts src/components/quick-edit-forms.test.tsx src/components/launchpad-health.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit task 5**

Do not commit while this checkout is detached. If you are on a branch, commit:

Use PowerShell and quote the app-router paths:

```powershell
git add 'src/app/(app)/setup/page.tsx' 'src/app/(app)/actions/page.tsx' 'src/app/(app)/launchpad/page.tsx' 'src/app/(app)/launchpad/[id]/page.tsx'
git commit -m "feat: wire operating record quick edits"
```

---

### Task 6: Documentation Updates

**Files:**
- Modify: `docs/CHANGE_GUIDES.md`
- Modify: `docs/COMPANY_SETUP_CHECKLIST.md`

- [ ] **Step 1: Update change guide copy**

In `docs/CHANGE_GUIDES.md`, replace `## Import Launchpad System Metadata` with:

```md
## Edit Launchpad System Metadata

1. For normal day-to-day changes, edit cost, renewal date, owner, group, and risk directly on `/launchpad`.
2. For full record edits, open the system detail page from `/launchpad` and update name, URL, stream, credential-location note, description, or sensitivity.
3. Keep real credential values out of Cockpit; store only where the credential lives.
4. Use `prisma/launchpad-system-metadata.local.json` only for bootstrap or bulk local reseed values.
5. After changing renewal metadata, run the Renewal reminder automation if you need open reminder actions refreshed immediately.
```

Add this section after `## Add A Stream`:

```md
## Edit A Setup Item

1. Open `/setup`.
2. Use the row quick-edit controls to change status, due date, priority, or next step.
3. The checklist definition still controls item identity, category, and default wording.
4. The backing Action row controls mutable operating state, so edits flow into Today, Actions, and weekly review surfaces.
```

- [ ] **Step 2: Update setup checklist cockpit note**

In `docs/COMPANY_SETUP_CHECKLIST.md`, replace the paragraph that currently says setup status is one-click only with:

```md
The cockpit version is seeded from `src/lib/company-setup-checklist.ts` and tracked as Actions. Update status, due date, priority, and next step directly on `/setup`; those mutable fields live on the backing Action row so progress flows into Today, Actions, and the weekly review.
```

Keep the legal/tax/insurance disclaimer unchanged.

- [ ] **Step 3: Run documentation sanity checks**

Run:

```powershell
rg -n "seed-file-only|local import as authoritative|Tick items off directly|one-click Done" docs/CHANGE_GUIDES.md docs/COMPANY_SETUP_CHECKLIST.md
```

Expected: no stale wording that says setup or launchpad metadata can only be changed through seed/import paths.

- [ ] **Step 4: Commit task 6**

Do not commit while this checkout is detached. If you are on a branch, commit:

```bash
git add docs/CHANGE_GUIDES.md docs/COMPANY_SETUP_CHECKLIST.md
git commit -m "docs: document cockpit metadata editing"
```

---

### Task 7: Verification

**Files:**
- No source edits unless verification exposes a defect.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
pnpm test -- src/lib/company-setup-checklist.test.ts src/lib/services.test.ts src/app/actions.test.ts src/components/quick-edit-forms.test.tsx src/components/launchpad-health.test.tsx src/lib/renewal-reminders.test.ts
```

Expected: PASS. Renewal reminder tests prove launchpad metadata remains compatible with the existing refresh-in-place behavior.

- [ ] **Step 2: Run full unit suite**

Run:

```powershell
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```powershell
pnpm lint
```

Expected: PASS with `--max-warnings=0`.

- [ ] **Step 4: Generate Prisma client**

Run:

```powershell
pnpm db:generate
```

Expected: Prisma Client generation succeeds. If Windows reports a locked Prisma DLL, stop running Next/dev Node processes and retry once.

- [ ] **Step 5: Run typecheck**

Run:

```powershell
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Run production build**

Run:

```powershell
pnpm build
```

Expected: PASS. If `pnpm build` fails with a Windows `.next` readlink or Prisma DLL lock, stop the dev server, remove only the generated `.next` directory, then run:

```powershell
pnpm exec next build
```

Expected fallback: PASS.

- [ ] **Step 7: Run browser proof**

Start the app on a free port:

```powershell
pnpm codex:run
```

If port `3003` is occupied, use:

```powershell
node scripts/start-next-dev.mjs --hostname 127.0.0.1 --port 3014
```

Use Playwright with Microsoft Edge on this host:

```powershell
pnpm dlx playwright open --browser=msedge http://127.0.0.1:3003/setup
```

Manual proof checklist:

- `/setup`: change one setup due date or priority, save, and confirm the row shows the edited value.
- `/actions`: change one action due date or review date, save, and confirm the table shows the edited value.
- `/launchpad`: change one system renewal date, cost, owner, or risk, save, and confirm system health/renewal panels reflect it after reload.
- `/launchpad/[id]`: open the detail page, edit credential-location note or description, save, and confirm the page shows the edited value.
- `/actions/[id]`: confirm the existing full action edit page still loads and existing linked governance sections still render.

- [ ] **Step 8: Stop dev server and remove browser artifacts**

Stop the dev server with `Ctrl+C`. If the process ignores it, identify and stop the listening PID:

```powershell
netstat -ano | findstr :3003
$pidToStop = Read-Host "PID listening on 3003"
Stop-Process -Id ([int]$pidToStop)
```

Remove Playwright CLI artifacts if created:

```powershell
if (Test-Path .playwright-cli) { Remove-Item -Recurse -Force .playwright-cli }
```

- [ ] **Step 9: Final diff checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors. Status should show only files from this plan.

- [ ] **Step 10: Final commit**

Do not commit while this checkout is detached. If you are on a branch and all verification passed, use PowerShell and quote the app-router paths:

```powershell
git add src/lib/company-setup-checklist.ts src/lib/company-setup-checklist.test.ts src/lib/services.ts src/lib/services.test.ts src/app/actions.ts src/app/actions.test.ts src/components/quick-edit-forms.tsx src/components/quick-edit-forms.test.tsx 'src/app/(app)/setup/page.tsx' 'src/app/(app)/actions/page.tsx' 'src/app/(app)/launchpad/page.tsx' 'src/app/(app)/launchpad/[id]/page.tsx' docs/CHANGE_GUIDES.md docs/COMPANY_SETUP_CHECKLIST.md docs/superpowers/specs/2026-06-24-operating-record-fast-edit-design.md docs/superpowers/plans/2026-06-24-operating-record-fast-edit.md
git commit -m "feat: add operating record fast edits"
```

Expected: commit succeeds on a named branch.
