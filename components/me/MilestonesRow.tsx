import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";

interface MilestonesRowProps {
  milestones: string[];
}

/**
 * Quiet milestones — server-safe, no "use client".
 * Renders nothing when the list is empty (no orders, no thresholds met).
 */
export function MilestonesRow({ milestones }: MilestonesRowProps) {
  if (milestones.length === 0) return null;

  return (
    <div>
      <Eyebrow className="mb-3">Quiet milestones</Eyebrow>
      <div className="flex flex-wrap gap-2">
        {milestones.map((m) => (
          <Badge key={m}>{m}</Badge>
        ))}
      </div>
    </div>
  );
}
