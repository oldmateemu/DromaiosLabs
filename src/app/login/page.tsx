import { loginAction } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-command-ink px-4">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 shadow-2xl">
        <p className="eyebrow">Dromaios Labs</p>
        <h1 className="text-2xl font-semibold text-command-ink">Company Cockpit</h1>
        <p className="mt-2 text-sm leading-6 text-command-muted">
          Private command-and-control workspace for daily company running.
        </p>
        {params?.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-command-red">
            Invalid email or password.
          </p>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <div>
            <label className="field-label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required />
          </div>
          <button className="button button-primary w-full" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}
