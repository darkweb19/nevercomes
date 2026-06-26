/**
 * Tiny zero-dependency className joiner (clsx-style).
 *
 * Accepts strings, numbers, arrays, and conditional objects (`{ "klass": cond }`),
 * skips falsy values, and flattens the rest into a single space-separated string.
 *
 * Phase 1 (D1): kept dependency-free on purpose. If Tailwind class-conflict
 * resolution becomes necessary later, upgrade to `clsx` + `tailwind-merge`.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else if (typeof input === "object") {
      for (const key in input) {
        if (input[key]) out.push(key);
      }
    }
  }

  return out.join(" ");
}
