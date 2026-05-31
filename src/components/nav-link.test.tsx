import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppNavLink, isActivePath } from "./nav-link";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn()
}));

const { usePathname } = await import("next/navigation");

describe("isActivePath", () => {
  it("matches root only at root and nested sections by prefix", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/actions", "/")).toBe(false);
    expect(isActivePath("/actions?status=OPEN", "/actions")).toBe(true);
    expect(isActivePath("/actions/detail", "/actions")).toBe(true);
  });
});

describe("AppNavLink", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/assistant");
  });

  it("applies active styling to the current section", () => {
    render(
      <AppNavLink className="sidebar-link" href="/assistant">
        Assistant
      </AppNavLink>
    );

    expect(screen.getByRole("link", { name: "Assistant" })).toHaveClass("sidebar-link-active");
  });
});
