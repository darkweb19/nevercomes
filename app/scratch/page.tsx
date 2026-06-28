"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Eyebrow,
  Input,
  Sheet,
  Stamp,
  Stepper,
  ThemeToggle,
} from "@/components/ui";

// Visual-review surface (D3: /scratch, since Next treats /_scratch as private).
// Not a product screen — exists only to eyeball tokens + primitives in both
// themes. Safe to delete later.

const typeScale = [
  { name: "5xl / 62", className: "text-5xl" },
  { name: "4xl / 48", className: "text-4xl" },
  { name: "3xl / 38", className: "text-3xl" },
  { name: "2xl / 30", className: "text-2xl" },
  { name: "xl / 24", className: "text-xl" },
  { name: "lg / 20", className: "text-lg" },
  { name: "base / 15", className: "text-base" },
  { name: "sm / 13", className: "text-sm" },
  { name: "xs / 12", className: "text-xs" },
];

const swatches = [
  { name: "page", className: "bg-page" },
  { name: "card", className: "bg-card" },
  { name: "sunken", className: "bg-sunken" },
  { name: "raised", className: "bg-raised" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-wash", className: "bg-accent-wash" },
  { name: "status-transit", className: "bg-status-transit" },
  { name: "carbon-700", className: "bg-carbon-700" },
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
      <h2 className="font-mono text-sm uppercase tracking-label text-fg-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ScratchPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [qty, setQty] = useState(1);

  return (
    <main className="mx-auto max-w-4xl space-y-12 p-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Stamp />
          <h1 className="text-4xl font-display">Design system scratch</h1>
          <p className="font-mono text-sm text-fg-faint">
            Phase 3 — adopted design-system tokens. Toggle the theme to eyeball
            both.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Type scale">
        <div className="space-y-2">
          {typeScale.map((t) => (
            <div key={t.name} className="flex items-baseline gap-4">
              <span className="w-24 shrink-0 font-mono text-xs text-fg-faint">
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
                className={`h-16 w-24 rounded-md border border-hairline ${s.className}`}
              />
              <span className="font-mono text-xs text-fg-faint">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg">
            Add to cart · $0.00
          </Button>
          <Button variant="primary">Add to cart</Button>
          <Button variant="secondary" size="sm">
            Filters · 0
          </Button>
          <Button variant="ghost">Keep browsing</Button>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <Button variant="primary" block>
          Block button
        </Button>
      </Section>

      <Section title="Eyebrow">
        <Eyebrow>Open 24/7 · Nothing in stock</Eyebrow>
        <Eyebrow rule>Delivering to</Eyebrow>
      </Section>

      <Section title="Stepper">
        <Stepper value={qty} onChange={setQty} aria-label="Quantity" />
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
          <h3 className="font-display text-lg text-fg-strong">
            Order #NC-000000
          </h3>
          <p className="font-mono text-sm text-fg-faint">
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
            <h3 className="font-display text-2xl text-fg-strong">Your cart</h3>
            <p className="font-mono text-sm text-fg-faint">
              Nothing ships from here. Press Esc to close.
            </p>
            <Button onClick={() => setSheetOpen(false)}>Close</Button>
          </div>
        </Sheet>
      </Section>
    </main>
  );
}
