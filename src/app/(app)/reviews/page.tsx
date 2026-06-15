import { weeklyReviewAction } from "@/app/actions";
import { WeeklyReviewForm } from "@/components/forms";
import { ReviewMomentumPanel } from "@/components/review-momentum-panel";
import { getReviewData } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const { reviews, momentum } = await getReviewData();
  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Company rhythm</p>
          <h1>Review and Improvement Coach</h1>
        </div>
        <p className="muted max-w-2xl">A weekly checkpoint that turns loose company worries into approved actions.</p>
      </div>
      <ReviewMomentumPanel momentum={momentum} />
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
