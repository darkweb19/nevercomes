"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * /me error boundary — shown when the server component throws (e.g. network
 * failure fetching orders). "Try again" calls Next's built-in reset to
 * re-render the page segment.
 */
export default function MeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="font-display text-lg font-bold text-fg-strong">
            Couldn&rsquo;t load your order history.
          </p>
          <p className="max-w-[40ch] text-sm text-fg-muted">
            Also unclear if that tracks.
          </p>
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}
