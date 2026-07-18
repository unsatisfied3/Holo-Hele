import Link from "next/link";
import { BusStopSignIcon } from "@/components/icons/FigmaIcon";
import type { NearbyStopResult } from "@/types/transit";

interface StopListItemProps {
  stopResult: NearbyStopResult;
}

function formatLines(lines: string[]): string {
  if (lines.length === 0) return "Loading routes…";
  const visible = lines.slice(0, 11).join(", ");
  return lines.length > 11 ? `${visible}…` : visible;
}

export function StopListItem({ stopResult }: StopListItemProps) {
  const { stop, walkMinutes, lines } = stopResult;

  return (
    <article className="flex h-[94px] items-center gap-3 bg-canvas px-4 py-2.5">
      <div className="w-11 shrink-0 pl-1">
        <BusStopSignIcon />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug text-ink">{stop.name}</h3>
        <p className="mt-1 text-xs leading-normal text-body">
          ID {stop.id} • {walkMinutes} min walk
        </p>
        <p className="text-xs leading-normal text-body">
          Lines: {formatLines(lines)}
        </p>

        {stopResult.error ? (
          <p className="mt-1 text-xs text-body">{stopResult.error}</p>
        ) : null}
      </div>

      <Link
        href={`/stops/${stop.id}`}
        className="shrink-0 rounded-[var(--radius-xs)] border border-hairline bg-canvas-softer px-2 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        View
      </Link>
    </article>
  );
}
