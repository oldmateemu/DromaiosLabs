const docs = [
  ["AI_CONTEXT.md", "Where future AI sessions should start."],
  ["docs/OPERATING_MODEL.md", "Streams, functions, review rhythm, and company rules."],
  ["docs/COMPANY_SETUP_CHECKLIST.md", "What the company still needs to set up; powers the /setup page."],
  ["docs/DATA_MODEL.md", "Core records and relationships."],
  ["docs/AUTOMATIONS.md", "Automation safety levels and approval rules."],
  ["docs/AI_GUIDE.md", "Model routing, privacy rules, and prompt patterns."],
  ["docs/CHANGE_GUIDES.md", "Recipes for common changes."],
  ["docs/DECISIONS.md", "Durable decision log."]
];

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI maintenance pack</p>
          <h1>Living Documentation</h1>
        </div>
        <p className="muted max-w-2xl">These files keep the cockpit easy for AI and humans to review, extend, and repair.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        {docs.map(([path, description]) => (
          <article className="panel" key={path}>
            <p className="font-semibold text-command-ink">{path}</p>
            <p className="muted mt-2">{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
