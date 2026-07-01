"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
  external?: boolean;
};

const NAV_ITEMS: CommandItem[] = [
  { id: "nav-today", label: "Today", hint: "Command brief and focus", group: "Pages", href: "/" },
  { id: "nav-portfolio", label: "Portfolio", hint: "Stream command view", group: "Pages", href: "/portfolio" },
  { id: "nav-actions", label: "Actions", hint: "Action register", group: "Pages", href: "/actions" },
  { id: "nav-launchpad", label: "Launchpad", hint: "Systems and links", group: "Pages", href: "/launchpad" },
  { id: "nav-intake", label: "Intake", hint: "Document scan, triage, and review queue", group: "Pages", href: "/intake" },
  { id: "nav-personal", label: "Personal", hint: "Personal-domain documents and actions", group: "Pages", href: "/personal" },
  { id: "nav-governance", label: "Governance", hint: "Risks and decisions", group: "Pages", href: "/governance" },
  { id: "nav-reviews", label: "Reviews", hint: "Weekly company review", group: "Pages", href: "/reviews" },
  { id: "nav-activity", label: "Activity", hint: "Company timeline and throughput", group: "Pages", href: "/activity" },
  { id: "nav-assistant", label: "Assistant", hint: "Draft review", group: "Pages", href: "/assistant" },
  { id: "nav-automations", label: "Automations", hint: "Control room", group: "Pages", href: "/automations" },
  { id: "nav-docs", label: "AI Docs", hint: "Maintenance guides", group: "Pages", href: "/docs" }
];

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo(() => [...NAV_ITEMS, ...items], [items]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allItems;
    return allItems.filter((item) =>
      `${item.label} ${item.hint ?? ""} ${item.group}`.toLowerCase().includes(term)
    );
  }, [allItems, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function activate(item: CommandItem | undefined) {
    if (!item) return;
    setOpen(false);
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.href);
    }
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    if (filtered.length === 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") event.preventDefault();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate(filtered[activeIndex]);
    }
  }

  let runningIndex = -1;
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <button className="cmdk-trigger" onClick={() => setOpen(true)} type="button">
        <span>Search the cockpit…</span>
        <kbd className="cmdk-kbd">⌘K</kbd>
      </button>

      {open ? (
        <div className="cmdk-overlay" onClick={() => setOpen(false)} role="presentation">
          <div className="cmdk-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command palette">
            <input
              className="cmdk-input"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onListKeyDown}
              placeholder="Jump to a page, action, or system…"
              ref={inputRef}
              value={query}
            />
            <div className="cmdk-list">
              {filtered.length === 0 ? (
                <p className="cmdk-empty">No matches.</p>
              ) : (
                Object.entries(groups).map(([group, groupItems]) => (
                  <div key={group}>
                    <p className="cmdk-group-label">{group}</p>
                    {groupItems.map((item) => {
                      runningIndex += 1;
                      const index = runningIndex;
                      return (
                        <button
                          className={`cmdk-item${index === activeIndex ? " cmdk-item-active" : ""}`}
                          key={item.id}
                          onClick={() => activate(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          type="button"
                        >
                          <span className="cmdk-item-label">{item.label}</span>
                          {item.hint ? <span className="cmdk-item-hint">{item.hint}</span> : null}
                          {item.external ? <span className="cmdk-item-tag">open ↗</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
