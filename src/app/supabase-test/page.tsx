import { createClient } from "@/lib/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Supabase Test
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Current Session
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            This page uses the existing Supabase server client to read the current
            auth session.
          </p>
        </div>

        {session ? (
          <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-6 text-sm leading-6 text-slate-100">
            {JSON.stringify(session, null, 2)}
          </pre>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            No active session
          </div>
        )}
      </div>
    </main>
  );
}
