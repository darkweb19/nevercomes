"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

// Read the live `.theme-dark` class on <html> as external state — no setState in
// an effect, and no hydration mismatch (server snapshot matches the shipped
// default). The no-flash script in app/layout.tsx applies any stored preference
// before paint; this control just reflects + flips it.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
const getSnapshot = () =>
  document.documentElement.classList.contains("theme-dark");
const getServerSnapshot = () => true; // dark is the shipped default

/**
 * Light/dark theme toggle. Static (no animation to degrade for reduced-motion);
 * keyboard-operable with aria-pressed reflecting the current mode.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("theme-dark", next);
    try {
      localStorage.setItem("nc-theme", next ? "dark" : "light");
    } catch {
      // ignore (private mode / storage disabled)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline",
        "text-fg-strong transition-colors hover:bg-sunken",
        className,
      )}
    >
      {dark ? (
        // sun
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // moon
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
