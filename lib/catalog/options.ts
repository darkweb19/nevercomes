// Product options live in a jsonb column (typed as Json), so parse defensively
// into a known shape before the UI touches them. Pure — unit-tested.

export interface OptionChoice {
  label: string;
  note?: string;
}

export interface OptionGroup {
  name: string;
  kind: "single" | "multi";
  choices: OptionChoice[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Coerce arbitrary jsonb into a clean `OptionGroup[]`. Anything malformed is
 * dropped (groups with no valid choices are omitted), so the product page can
 * render the result without further guarding.
 */
export function parseOptions(raw: unknown): OptionGroup[] {
  if (!Array.isArray(raw)) return [];

  const groups: OptionGroup[] = [];
  for (const g of raw) {
    if (!isRecord(g)) continue;
    const { name, kind, choices } = g;
    if (typeof name !== "string") continue;
    if (kind !== "single" && kind !== "multi") continue;
    if (!Array.isArray(choices)) continue;

    const parsed: OptionChoice[] = [];
    for (const c of choices) {
      if (!isRecord(c)) continue;
      if (typeof c.label !== "string") continue;
      parsed.push({
        label: c.label,
        note: typeof c.note === "string" ? c.note : undefined,
      });
    }
    if (parsed.length) groups.push({ name, kind, choices: parsed });
  }
  return groups;
}
