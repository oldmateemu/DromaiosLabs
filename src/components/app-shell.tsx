import {
  Activity,
  Bot,
  ClipboardList,
  FileText,
  Gauge,
  LayoutGrid,
  Link as LinkIcon,
  ListChecks,
  LogOut,
  Repeat,
  ShieldAlert,
  ShieldCheck,
  Target
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { CommandPalette, type CommandItem } from "@/components/command-palette";
import { AppNavLink } from "@/components/nav-link";

const navItems = [
  { href: "/", label: "Today", icon: Gauge },
  { href: "/portfolio", label: "Portfolio", icon: LayoutGrid },
  { href: "/setup", label: "Setup", icon: ListChecks },
  { href: "/actions", label: "Actions", icon: ClipboardList },
  { href: "/pipeline", label: "Pipeline", icon: Target },
  { href: "/launchpad", label: "Launchpad", icon: LinkIcon },
  { href: "/governance", label: "Governance", icon: ShieldAlert },
  { href: "/reviews", label: "Reviews", icon: ShieldCheck },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/automations", label: "Automations", icon: Repeat },
  { href: "/docs", label: "AI Docs", icon: FileText }
];

export function AppShell({
  children,
  userName,
  commandItems
}: {
  children: React.ReactNode;
  userName: string;
  commandItems: CommandItem[];
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="border-b border-white/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Dromaios Labs</p>
          <h1 className="mt-2 text-xl font-semibold tracking-normal text-white">Company Cockpit</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Command and control for daily company running.</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <AppNavLink className="sidebar-link" href={item.href} key={item.href}>
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </AppNavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="mb-3 text-sm text-slate-300">{userName}</p>
          <form action={logoutAction}>
            <button className="sidebar-link w-full" type="submit">
              <LogOut aria-hidden="true" size={18} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="content-wrap">
        <header className="topbar">
          <div className="mx-auto max-w-[1500px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Private operations workspace</p>
                <p className="text-sm font-medium text-command-ink">Dromaios Cockpit</p>
              </div>
              <div className="flex items-center gap-3">
                <CommandPalette items={commandItems} />
                <div className="hidden items-center gap-2 md:flex">
                  <span className="meta-pill">Local/VPN first</span>
                  <span className="meta-pill">Ollama ready</span>
                </div>
              </div>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Compact navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <AppNavLink activeClassName="button-active" className="button button-secondary whitespace-nowrap" href={item.href} key={item.href}>
                    <Icon aria-hidden="true" size={16} />
                    {item.label}
                  </AppNavLink>
                );
              })}
            </nav>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
