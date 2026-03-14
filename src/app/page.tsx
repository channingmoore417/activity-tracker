import { CalendarDays, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

const setupItems = [
  {
    title: "Supabase",
    description: "Auth, storage, and database clients live under src/lib/supabase.",
    icon: ShieldCheck,
  },
  {
    title: "Resend",
    description: "Transactional email templates and senders live under src/emails.",
    icon: Mail,
  },
  {
    title: "Utilities",
    description: "Shared helpers and validation logic live under src/lib and src/types.",
    icon: CheckCircle2,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_transparent_40%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10">
          <div className="mb-6 flex items-center gap-3 text-sm font-medium text-slate-500">
            <CalendarDays className="h-4 w-4" />
            <span>{format(new Date(), "EEEE, MMMM d")}</span>
          </div>
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Activity Tracker Starter
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Your Next.js app is configured with the core libraries for building.
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              The project now uses a `src`-based structure with room for Supabase
              clients, email templates, shared utilities, and app-specific types.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {setupItems.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <Icon className="mb-4 h-5 w-5 text-sky-700" />
              <h2 className="mb-2 text-lg font-semibold text-slate-950">{title}</h2>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
