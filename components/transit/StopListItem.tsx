import { Link } from "@tanstack/react-router";
import { BusStopSignIcon } from "@/components/icons/FigmaIcon";
import type { NearbyStopResult } from "@/types/transit";
import { useI18n } from "@/lib/i18n";

interface StopListItemProps {
  stopResult: NearbyStopResult;
}

function formatLines(lines: string[], loadingLabel: string): string {
  if (lines.length === 0) return loadingLabel;
  const visible = lines.slice(0, 11).join(", ");
  return lines.length > 11 ? `${visible}…` : visible;
}

export function StopListItem({ stopResult }: StopListItemProps) {
  const { t } = useI18n();
  const { stop, walkMinutes, lines } = stopResult;

  return (
    <Link
      to="/stops/$id"
      params={{ id: stop.id }}
      aria-label={t("View stop {name}", { name: stop.name })}
      className="group flex h-[94px] items-center gap-3 bg-canvas px-4 py-2.5 transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-transit-blue"
    >
      <div className="w-11 shrink-0 pl-1">
        <BusStopSignIcon />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug text-ink">{stop.name}</h3>
        <p className="mt-1 text-xs leading-normal text-body">
          {t("ID {id} • {minutes} min walk", { id: stop.id, minutes: walkMinutes })}
        </p>
        <p className="text-xs leading-normal text-body">
          {t("Lines: {lines}", { lines: formatLines(lines, t("Loading routes…")) })}
        </p>

        {stopResult.error ? (
          <p className="mt-1 text-xs text-body">{stopResult.error}</p>
        ) : null}
      </div>

      <span
        aria-hidden="true"
        className="shrink-0 rounded-[var(--radius-xs)] border border-hairline bg-canvas-softer px-2 py-2 text-xs font-medium text-ink transition-colors group-hover:bg-canvas"
      >
        {t("View")}
      </span>
    </Link>
  );
}
