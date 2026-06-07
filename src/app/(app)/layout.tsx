import { AppShell } from "@/components/app-shell";
import type { CommandItem } from "@/components/command-palette";
import { requireUser } from "@/lib/auth";
import { getCommandPaletteItems } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [user, palette] = await Promise.all([requireUser(), getCommandPaletteItems()]);

  const commandItems: CommandItem[] = [
    ...palette.actions.map((action) => ({
      id: `action-${action.id}`,
      label: action.title,
      hint: `Action · ${action.status}`,
      group: "Actions",
      href: "/actions"
    })),
    ...palette.links.map((link) => ({
      id: `link-${link.id}`,
      label: link.name,
      hint: link.group,
      group: "Launchpad",
      href: link.url,
      external: true
    }))
  ];

  return (
    <AppShell userName={user.name} commandItems={commandItems}>
      {children}
    </AppShell>
  );
}
