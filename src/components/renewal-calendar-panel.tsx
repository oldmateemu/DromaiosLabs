import { formatRenewalCurrency, type RenewalCalendar, type RenewalItem } from "@/lib/renewal-calendar";

function RenewalRow({ item }: { item: RenewalItem }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-command-line bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-command-ink">{item.name}</p>
        <p className="muted">
          {item.renewalKey}
          {item.group ? ` · ${item.group}` : ""}
        </p>
      </div>
      <span className="meta-pill">{item.cost === null ? "No cost" : formatRenewalCurrency(item.cost)}</span>
    </div>
  );
}

export function RenewalCalendarPanel({ calendar }: { calendar: RenewalCalendar }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cash control</p>
          <h2>Renewals and spend forecast</h2>
        </div>
        <p className="muted max-w-xl">What is coming due over the next {calendar.monthsAhead} months, so no renewal or charge is a surprise.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card metric-neutral">
          <p className="eyebrow">Forecast spend</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{formatRenewalCurrency(calendar.windowTotal)}</p>
          <p className="muted mt-1">Across {calendar.windowCount} {calendar.windowCount === 1 ? "renewal" : "renewals"}.</p>
        </article>
        <article className={calendar.overdue.length > 0 ? "metric-card metric-danger" : "metric-card metric-success"}>
          <p className="eyebrow">Overdue renewals</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{calendar.overdue.length}</p>
          <p className="muted mt-1">{calendar.overdue.length > 0 ? `${formatRenewalCurrency(calendar.overdueTotal)} past due.` : "Nothing past due."}</p>
        </article>
        <article className="metric-card metric-neutral">
          <p className="eyebrow">Horizon</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{calendar.monthsAhead} mo</p>
          <p className="muted mt-1">{calendar.months.length} {calendar.months.length === 1 ? "month" : "months"} with renewals.</p>
        </article>
        <article className={calendar.untrackedCount > 0 ? "metric-card metric-warning" : "metric-card metric-neutral"}>
          <p className="eyebrow">Untracked cost</p>
          <p className="mt-1 text-2xl font-semibold text-command-ink">{calendar.untrackedCount}</p>
          <p className="muted mt-1">{calendar.untrackedCount > 0 ? "Renewals missing a cost." : "Every upcoming renewal is priced."}</p>
        </article>
      </div>

      {calendar.overdue.length > 0 ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <h3 className="text-sm font-semibold text-command-red">Overdue — act now</h3>
          <div className="mt-2 space-y-2">
            {calendar.overdue.map((item) => (
              <RenewalRow item={item} key={item.id} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {calendar.months.length === 0 ? (
          <p className="empty-state">No upcoming renewals in the horizon. Add renewal dates to launchpad systems to forecast spend.</p>
        ) : (
          calendar.months.map((month) => (
            <div className="rounded-md border border-command-line bg-command-panel p-3" key={month.key}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-command-ink">{month.label}</h3>
                <span className="meta-pill">{formatRenewalCurrency(month.total)}</span>
              </div>
              <div className="mt-2 space-y-2">
                {month.items.map((item) => (
                  <RenewalRow item={item} key={item.id} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
