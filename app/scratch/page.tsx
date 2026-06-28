"use client";

import { useState } from "react";
import { Badge, Button, Card, Input, Sheet, Stamp } from "@/components/ui";

// Phase 1 visual-review surface (D3: /scratch, since Next treats /_scratch as private).
// Not a product screen — exists only to eyeball tokens + primitives. Safe to delete later.

const typeScale = [
  { name: "h1 / 56", className: "text-h1" },
  { name: "h2 / 40", className: "text-h2" },
  { name: "h3 / 28", className: "text-h3" },
  { name: "lg / 20", className: "text-lg" },
  { name: "body / 16", className: "text-body" },
  { name: "label / 14", className: "text-label" },
  { name: "micro / 12", className: "text-micro" },
];

const swatches = [
  { name: "paper", className: "bg-paper" },
  { name: "paper-2", className: "bg-paper-2" },
  { name: "ink", className: "bg-ink" },
  { name: "ink-faded", className: "bg-ink-faded" },
  { name: "stamp", className: "bg-stamp" },
  { name: "ok", className: "bg-ok" },
  { name: "warn", className: "bg-warn" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-label uppercase tracking-widest text-ink-faded">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ScratchPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="mx-auto max-w-4xl space-y-12 p-8">
      <header className="space-y-2">
        <Stamp />
        <h1 className="text-h2 font-display">Design system scratch</h1>
        <p className="font-mono text-label text-ink-faded">
          Phase 1 — tokens &amp; primitives. Eyeball only.
        </p>
      </header>

      <Section title="Type scale">
        <div className="space-y-2">
          {typeScale.map((t) => (
            <div key={t.name} className="flex items-baseline gap-4">
              <span className="w-24 shrink-0 font-mono text-micro text-ink-faded">
                {t.name}
              </span>
              <span className={`font-display ${t.className}`}>
                The order never comes.
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Color">
        <div className="flex flex-wrap gap-3">
          {swatches.map((s) => (
            <div key={s.name} className="space-y-1">
              <div
                className={`h-16 w-24 rounded-md border border-rule ${s.className}`}
              />
              <span className="font-mono text-micro text-ink-faded">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Add to cart</Button>
          <Button variant="primary" size="sm">
            Buy now
          </Button>
          <Button variant="ghost">Keep browsing</Button>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Input">
        <div className="max-w-sm space-y-3">
          <Input placeholder="Delivery address" />
          <Input placeholder="Promo code" defaultValue="NEVER100" />
          <Input placeholder="Disabled" disabled />
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm space-y-2">
          <h3 className="font-display text-lg">Order #NC-000000</h3>
          <p className="font-mono text-label text-ink-faded">
            Status: in transit · ETA: —
          </p>
        </Card>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge>default</Badge>
          <Badge variant="ok">delivered?</Badge>
          <Badge variant="warn">delayed</Badge>
          <Badge variant="stamp">in transit</Badge>
        </div>
      </Section>

      <Section title="Sheet">
        <Button variant="ghost" onClick={() => setSheetOpen(true)}>
          Open cart drawer
        </Button>
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          aria-label="Example cart drawer"
        >
          <div className="space-y-4">
            <h3 className="font-display text-h3">Your cart</h3>
            <p className="font-mono text-label text-ink-faded">
              Nothing ships from here. Press Esc to close.
            </p>
            <Button onClick={() => setSheetOpen(false)}>Close</Button>
          </div>
        </Sheet>
      </Section>
    </main>
  );
}
