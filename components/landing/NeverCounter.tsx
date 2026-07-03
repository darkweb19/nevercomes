"use client";

import { useState, useEffect } from "react";

/**
 * NeverCounter — live counter for "Orders Currently Never Arriving".
 *
 * Starts at 1204, increments by 1 every 3200ms with 55% probability.
 * SSR-safe: server renders the initial value, timer starts in useEffect.
 * Uses .toLocaleString("en-US") for comma-separated formatting.
 */
export function NeverCounter() {
  const [count, setCount] = useState(1204);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.55) {
        setCount((c) => c + 1);
      }
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return <span>{count.toLocaleString("en-US")}</span>;
}
