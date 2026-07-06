/**
 * /leaderboard loading state — shown by Next.js App Router while the server
 * component awaits auth + Supabase RPC.
 *
 * Pulse animation uses `motion-safe:animate-pulse` so prefers-reduced-motion
 * users see static skeleton bars.
 */
import { SiteHeader } from "@/components/catalog/SiteHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function LeaderboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[880px] px-5 pb-16 pt-14">
        <Eyebrow className="mb-5">Loading leaderboard…</Eyebrow>
        <div className="flex flex-col gap-3.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
