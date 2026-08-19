import { Link } from "@tanstack/react-router";

import { getAlertToneClasses } from "@/components/alerts/alertPresentation";
import { AlertTriangleIcon } from "@/components/icons/FigmaIcon";
import type { DemoAlertScenario } from "@/lib/mock/service-alerts";
import { getStopAlertLabel } from "@/lib/service-alerts";
import { cn } from "@/lib/utils";
import type { TransitAlert } from "@/types/transit";

export function ServiceAlertBanner({
  alert,
  busId,
  stopId,
  routePageId,
  demo,
}: {
  alert: TransitAlert;
  busId?: string;
  stopId?: string;
  routePageId?: string;
  demo?: DemoAlertScenario;
}) {
  const tone = getAlertToneClasses(alert);
  const label = stopId ? getStopAlertLabel(alert, stopId) : alert.title;

  return (
    <Link
      to="/alerts/$alertId"
      params={{ alertId: alert.id }}
      search={{
        bus: busId,
        stop: stopId,
        routePage: routePageId,
        demo,
      }}
      aria-label={`View service alert: ${alert.title}`}
      className={cn(
        "flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue",
        tone.surface,
        tone.hoverSurface,
      )}
    >
      <AlertTriangleIcon className={cn("h-6 w-6 shrink-0", tone.text)} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {alert.source === "thebus-live" ? (
          <span className="mt-0.5 block text-xs text-body">
            Current TheBus notice
          </span>
        ) : null}
      </span>
      <span className={cn("text-sm font-medium underline underline-offset-4", tone.text)}>
        View
      </span>
    </Link>
  );
}
