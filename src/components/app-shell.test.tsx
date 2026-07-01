import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push })
}));
vi.mock("@/app/actions", () => ({ logoutAction: vi.fn() }));

const { AppShell } = await import("./app-shell");

describe("AppShell", () => {
  it("renders the primary navigation, signed-in user, and sign-out control", () => {
    render(
      <AppShell commandItems={[]} userName="Founder">
        <p>Workspace content</p>
      </AppShell>
    );

    const sidebar = screen.getByRole("complementary");
    expect(within(sidebar).getByRole("link", { name: /Today/ })).toHaveAttribute("href", "/");
    expect(within(sidebar).getByRole("link", { name: /Automations/ })).toHaveAttribute("href", "/automations");
    expect(screen.getByText("Founder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign out/ })).toBeInTheDocument();
    expect(screen.getByText("Workspace content")).toBeInTheDocument();
  });

  it("marks the active section based on the current path", () => {
    render(<AppShell commandItems={[]} userName="Founder">x</AppShell>);

    const sidebar = screen.getByRole("complementary");
    expect(within(sidebar).getByRole("link", { name: /Today/ })).toHaveClass("sidebar-link-active");
  });
});
