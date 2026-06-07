import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette, type CommandItem } from "./command-palette";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

const items: CommandItem[] = [
  { id: "action-1", label: "Renew domain registration", hint: "Action · OPEN", group: "Actions", href: "/actions" },
  { id: "link-1", label: "Xero", hint: "Money", group: "Launchpad", href: "https://xero.com", external: true }
];

describe("CommandPalette", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("opens with Cmd+K and lists built-in pages plus provided items", () => {
    render(<CommandPalette items={items} />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(screen.getByPlaceholderText(/Jump to a page/i)).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Renew domain registration")).toBeInTheDocument();
  });

  it("filters items by the query", () => {
    render(<CommandPalette items={items} />);
    fireEvent.click(screen.getByRole("button", { name: /Search the cockpit/i }));
    fireEvent.change(screen.getByPlaceholderText(/Jump to a page/i), { target: { value: "xero" } });

    expect(screen.getByText("Xero")).toBeInTheDocument();
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });

  it("navigates to an internal item on click", () => {
    render(<CommandPalette items={items} />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.click(screen.getByText("Renew domain registration"));

    expect(push).toHaveBeenCalledWith("/actions");
  });

  it("opens external items in a new tab with safety flags", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<CommandPalette items={items} />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.click(screen.getByText("Xero"));

    expect(openSpy).toHaveBeenCalledWith("https://xero.com", "_blank", "noopener,noreferrer");
    expect(push).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
