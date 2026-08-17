import { Link } from "@tanstack/react-router";

import { AlertTriangleIcon } from "@/components/icons/FigmaIcon";
import type { DemoAlertScenario } from "@/lib/mock/service-alerts";
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
  return (
    <Link
      to="/alerts"
      search={{
        alert: alert.id,
        bus: busId,
        stop: stopId,
        routePage: routePageId,
        demo,
      }}
      aria-label={`View service alert: ${alert.title}`}
      className="flex min-h-[64px] items-center gap-3 bg-brand-blue-subtle px-4 py-3 transition-colors hover:bg-brand-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue"
    >
      <AlertTriangleIcon className="h-6 w-6 shrink-0 text-brand-blue" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{alert.title}</span>
        <span className="mt-0.5 block text-xs text-body">
          {alert.source === "thebus-live" ? "Current TheBus notice" : "Demo scenario"}
        </span>
      </span>
      <span className="text-sm font-medium text-brand-blue underline underline-offset-4">
        View
      </span>
    </Link>
  );
}
