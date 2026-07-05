import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Perforation } from "@/components/ui/Perforation";
import { formatCents } from "@/lib/utils/money";
import type { MeStats } from "@/lib/me/stats";

interface StatsCardProps {
  stats: MeStats;
}

/**
 * /me stats card — responsive layout.
 *
 * Desktop (lg+): 4-cell horizontal grid. Money saved is wider (1.3fr).
 * Vertical dividers are dashed border-l (Perforation is horizontal-only).
 *
 * Tablet (md–lg): Money block on top → horizontal Perforation → 3-col grid
 * (Orders placed, Delivered, Streak).
 *
 * Mobile (<md): fully stacked rows separated by horizontal Perforation.
 */
export function StatsCard({ stats }: StatsCardProps) {
  return (
    <Card raised padded={false} className="p-6 md:p-8">
      {/* ── Desktop lg+: 4-cell horizontal grid ──────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:items-start lg:gap-8">
        {/* Money saved */}
        <div>
          <Eyebrow>Money saved</Eyebrow>
          <div className="mt-2 font-mono text-4xl font-bold tabular-nums text-fg-strong">
            {formatCents(stats.moneySavedCents)}
          </div>
          <div className="mt-1.5 font-mono text-xs text-fg-faint">
            <span className="line-through">
              {formatCents(stats.moneySavedCents)} charged
            </span>{" "}
            → $0.00 CAD
          </div>
        </div>

        {/* Orders placed */}
        <div className="border-l border-dashed border-hairline pl-8">
          <Eyebrow>Orders placed</Eyebrow>
          <div className="mt-2 font-mono text-4xl font-bold tabular-nums text-fg-strong">
            {stats.ordersPlaced}
          </div>
        </div>

        {/* Orders delivered */}
        <div className="border-l border-dashed border-hairline pl-8">
          <Eyebrow>Orders delivered</Eyebrow>
          <div className="mt-2 font-mono text-4xl font-bold tabular-nums text-fg-strong">
            {stats.ordersDelivered}
          </div>
        </div>

        {/* Streak */}
        <div className="border-l border-dashed border-hairline pl-8">
          <Eyebrow>Streak</Eyebrow>
          <div className="mt-2 font-mono text-4xl font-bold tabular-nums text-fg-strong">
            {stats.streakDays}
          </div>
          <div className="mt-1.5 font-mono text-xs text-fg-muted">
            days in a row of buying nothing
          </div>
        </div>
      </div>

      {/* ── Tablet md–lg: money block + Perforation + 3-col grid ─────────── */}
      <div className="hidden md:flex lg:hidden flex-col gap-[18px]">
        {/* Money saved */}
        <div>
          <Eyebrow>Money saved</Eyebrow>
          <div className="mt-1.5 font-mono text-3xl font-bold tabular-nums text-fg-strong">
            {formatCents(stats.moneySavedCents)}
          </div>
          <div className="mt-1.5 font-mono text-xs text-fg-faint">
            <span className="line-through">
              {formatCents(stats.moneySavedCents)} charged
            </span>{" "}
            → $0.00 CAD
          </div>
        </div>

        <Perforation />

        {/* 3-col: orders placed / delivered / streak */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Eyebrow>Orders placed</Eyebrow>
            <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-fg-strong">
              {stats.ordersPlaced}
            </div>
          </div>
          <div>
            <Eyebrow>Delivered</Eyebrow>
            <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-fg-strong">
              {stats.ordersDelivered}
            </div>
          </div>
          <div>
            <Eyebrow>Streak</Eyebrow>
            <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-fg-strong">
              {stats.streakDays}{" "}
              <span className="text-xs text-fg-muted">days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile <md: fully stacked rows ──────────────────────────────── */}
      <div className="flex flex-col md:hidden">
        {/* Money saved */}
        <div className="pb-4">
          <Eyebrow>Money saved</Eyebrow>
          <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-fg-strong">
            {formatCents(stats.moneySavedCents)}
          </div>
          <div className="mt-1.5 font-mono text-[11px] text-fg-faint">
            <span className="line-through">{formatCents(stats.moneySavedCents)}</span>{" "}
            → $0.00 CAD
          </div>
        </div>

        <Perforation />

        <div className="flex items-center justify-between py-3">
          <Eyebrow>Orders placed</Eyebrow>
          <span className="font-mono text-base font-bold text-fg-strong">
            {stats.ordersPlaced}
          </span>
        </div>

        <Perforation />

        <div className="flex items-center justify-between py-3">
          <Eyebrow>Orders delivered</Eyebrow>
          <span className="font-mono text-base font-bold text-fg-strong">
            {stats.ordersDelivered}
          </span>
        </div>

        <Perforation />

        <div className="flex items-center justify-between pt-3">
          <Eyebrow>Streak</Eyebrow>
          <span className="font-mono text-base font-bold text-fg-strong">
            {stats.streakDays} days
          </span>
        </div>
      </div>
    </Card>
  );
}
