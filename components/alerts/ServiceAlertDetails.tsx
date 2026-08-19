import { RouteLineBadge, AlertTriangleIcon } from "@/components/icons/FigmaIcon";
import { getAlertToneClasses } from "@/components/alerts/alertPresentation";
import { getStopAlertLabel } from "@/lib/service-alerts";
import { cn } from "@/lib/utils";
import type { TransitAlert } from "@/types/transit";

export function ServiceAlertDetails({
  alert,
  emphasized = false,
  stopId,
}: {
  alert: TransitAlert;
  emphasized?: boolean;
  stopId?: string;
}) {
  const tone = getAlertToneClasses(alert);
  const stopAlertLabel = stopId ? getStopAlertLabel(alert, stopId) : undefined;

  return (
    <article
      id={alert.id}
      className={cn(
        "overflow-hidden rounded-[var(--radius-md)] border bg-canvas",
        emphasized ? tone.border : "border-hairline",
      )}
    >
      <div className={cn("flex items-start gap-3 px-4 py-4", tone.surface)}>
        <AlertTriangleIcon
          className={cn("mt-0.5 h-6 w-6 shrink-0", tone.text)}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink">{alert.title}</h2>
          {formatAlertStatus(alert) ? (
            <p className={cn("mt-1 text-xs font-medium", tone.text)}>
              {formatAlertStatus(alert)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-4">
        {stopId &&
        (alert.type === "stop-closure" || alert.type === "stop-skipped") &&
        stopAlertLabel !== alert.title ? (
          <p className={cn("mb-3 text-sm font-semibold", tone.text)}>
            {stopAlertLabel}
          </p>
        ) : null}
        <p className="text-sm leading-relaxed text-body">{alert.description}</p>

        {alert.systemWide ? (
          <p className={cn("mt-4 text-xs font-semibold uppercase tracking-wide", tone.text)}>
            System-wide notice
          </p>
        ) : alert.affectedRoutes.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-body">
              Affected lines
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {alert.affectedRoutes.map((route) => (
                <RouteLineBadge key={route} route={route} />
              ))}
            </div>
          </div>
        ) : null}

        {alert.affectedStops.length > 0 ? (
          <div className="mt-4 border-t border-hairline pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-body">
              Affected {alert.affectedStops.length === 1 ? "stop" : "stops"}
            </h3>
            <p className="mt-1 text-sm text-body">
              {alert.affectedStops.map((stop) => `Stop ${stop}`).join(", ")}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatAlertStatus(alert: TransitAlert): string | undefined {
  if (alert.source === "holohele-demo") return undefined;
  if (!alert.startTime) return "Current TheBus notice";
  return `Posted ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(alert.startTime))}`;
}
