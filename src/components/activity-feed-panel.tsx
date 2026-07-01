import Link from "next/link";
import type { ActivityEvent, ActivityTone } from "@/lib/activity-feed";

const TONE_DOT: Record<ActivityTone, string> = {
  neutral: "bg-command-muted",
  positive: "bg-command-green",
  warning: "bg-command-amber",
  danger: "bg-command-red"
};

function dayKey(date: Date) {
  return `${date.toISOString().slice(0, 10)} UTC`;
}

function timeLabel(date: Date) {
  return `${date.toISOString().slice(11, 16)} UTC`;
}

export function ActivityFeedPanel({ events, title = "Recent activity" }: { events: ActivityEvent[]; title?: string }) {
  const groups = events.reduce<Record<string, ActivityEvent[]>>((acc, event) => {
    (acc[dayKey(event.at)] ??= []).push(event);
    return acc;
  }, {});

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company timeline</p>
          <h2>{title}</h2>
        </div>
        <p className="muted max-w-xl">Everything that moved across actions, governance, automations, drafts, and reviews — newest first.</p>
      </div>

      {events.length === 0 ? (
        <p className="empty-state">No activity recorded yet. As work moves, it will appear here as a single company timeline.</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([day, dayEvents]) => (
            <div key={day}>
              <p className="eyebrow mb-2">{day}</p>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <Link className="action-row block transition hover:border-command-navy" href={event.href} key={event.id}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[event.tone]}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate font-medium text-command-ink">{event.title}</p>
                          <span className="shrink-0 text-xs text-command-muted">{timeLabel(event.at)}</span>
                        </div>
                        <p className="muted">{event.label} · {event.detail}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
