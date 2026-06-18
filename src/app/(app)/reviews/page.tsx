import Link from "next/link";
import { weeklyReviewAction } from "@/app/actions";
import { WeeklyReviewForm } from "@/components/forms";
import { buildSetupReadiness, selectOutstandingSetupItems, setupItemStatusLabel } from "@/lib/company-setup-checklist";
import { getCompanySetupData, getReviewData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const [reviews, setup] = await Promise.all([getReviewData(), getCompanySetupData()]);
  const setupReadiness = buildSetupReadiness(setup);
  const outstandingSetup = selectOutstandingSetupItems(setup, 6);

  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company rhythm</p>
          <h1>Review and Improvement Coach</h1>
        </div>
        <p className="muted max-w-2xl">A weekly checkpoint that turns loose company worries into approved actions.</p>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Company setup this week</p>
            <h2>{setupReadiness.headline}</h2>
            <p className="muted mt-1">
              Carry the highest-priority outstanding setup items into this review before taking on new work.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="meta-pill">
                {setup.done}/{setup.total} done
              </span>
              {setup.overdue > 0 ? <span className="status-pill status-high">{setup.overdue} overdue</span> : null}
              {setup.dueSoon > 0 ? <span className="status-pill status-draft">{setup.dueSoon} due soon</span> : null}
              {setup.notStarted > 0 ? <span className="meta-pill">{setup.notStarted} not started</span> : null}
            </div>
          </div>
          <Link className="button button-secondary" href="/setup">
            Open setup checklist
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {outstandingSetup.map((item) => (
            <div className="action-row flex items-start justify-between gap-3" key={item.key}>
              <div>
                <p className="font-medium text-command-ink">{item.title}</p>
                <p className="muted">{item.category}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={item.priority === "HIGH" || item.priority === "CRITICAL" ? "status-pill status-high" : "meta-pill"}>
                  {item.priority}
                </span>
                <span className="meta-pill">{setupItemStatusLabel(item.status)}</span>
              </div>
            </div>
          ))}
          {outstandingSetup.length === 0 ? (
            <p className="empty-state">Company setup checklist is complete. Nothing outstanding to carry in.</p>
          ) : null}
        </div>
      </section>

      <WeeklyReviewForm action={weeklyReviewAction} />
      <section className="panel space-y-3">
        <h2>Recent reviews</h2>
        {reviews.map((review) => (
          <article className="action-row" key={review.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{review.type} review</p>
                <p className="muted whitespace-pre-line">{review.assistantSummary}</p>
              </div>
              <span className="meta-pill">{review.actions.length} actions</span>
            </div>
          </article>
        ))}
        {reviews.length === 0 ? <p className="empty-state">No reviews yet. Run the first weekly review above.</p> : null}
      </section>
    </div>
  );
}
