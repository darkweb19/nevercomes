/**
 * /me loading state — shown by Next.js App Router while the server component
 * awaits auth + Supabase queries.
 *
 * Pulse animation uses `motion-safe:animate-pulse` so prefers-reduced-motion
 * users see static skeleton bars.
 */
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function MeLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] px-5 pb-16 pt-14 md:px-12">
        <Eyebrow className="mb-5">Loading order history…</Eyebrow>
        <div className="flex flex-col gap-3.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[60px] rounded-md bg-sunken motion-safe:animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
