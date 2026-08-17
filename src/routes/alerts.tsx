import { createFileRoute, Link } from "@tanstack/react-router";

import {
  AlertTriangleIcon,
  FigmaIcon,
  RouteLineBadge,
} from "@/components/icons/FigmaIcon";
import { SERVICE_ALERT_PREVIEWS } from "@/lib/mock/service-alerts";
import { cn } from "@/lib/utils";

interface AlertsSearch {
  alert?: string;
  bus?: string;
}

export const Route = createFileRoute("/alerts")({
  validateSearch: (search: Record<string, unknown>): AlertsSearch => ({
    alert: typeof search.alert === "string" ? search.alert : undefined,
    bus: typeof search.bus === "string" ? search.bus : undefined,
  }),
  component: RiderAlertsPage,
});

function RiderAlertsPage() {
  const search = Route.useSearch();

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center border-b border-hairline px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        {search.bus ? (
          <Link
            to="/buses/$busId"
            params={{ busId: search.bus }}
            aria-label="Back to bus"
            className="flex h-10 w-8 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
          </Link>
        ) : (
          <Link
            to="/settings"
            aria-label="Back to settings"
            className="flex h-10 w-8 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
          </Link>
        )}
        <h1 className="flex-1 text-center text-base font-semibold text-ink">
          Rider Alerts
        </h1>
        <span className="h-10 w-8" aria-hidden="true" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-canvas-soft">
        <section aria-labelledby="disruptions-heading" className="bg-canvas px-4 py-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="disruptions-heading" className="text-lg font-semibold text-ink">
              Service disruptions
            </h2>
            <span className="text-xs text-body">
              {SERVICE_ALERT_PREVIEWS.length} active
            </span>
          </div>

          <ul className="mt-4 space-y-3">
            {SERVICE_ALERT_PREVIEWS.map((alert) => {
              const selected = search.alert === alert.id;

              return (
                <li key={alert.id}>
                  <article
                    id={alert.id}
                    className={cn(
                      "overflow-hidden rounded-[var(--radius-md)] border bg-canvas",
                      selected ? "border-brand-blue-border" : "border-hairline",
                    )}
                  >
                    <div className="flex items-start gap-3 bg-brand-blue-subtle px-4 py-4">
                      <AlertTriangleIcon className="mt-0.5 h-6 w-6 shrink-0 text-brand-blue" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-ink">{alert.title}</h3>
                        <p className="mt-1 text-xs font-medium text-brand-blue">
                          {alert.statusLabel}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-4">
                      <p className="text-sm leading-relaxed text-body">{alert.summary}</p>

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

                      <div className="mt-4 border-t border-hairline pt-4">
                        <h4 className="text-sm font-semibold text-ink">What to expect</h4>
                        <p className="mt-1 text-sm leading-relaxed text-body">
                          {alert.details}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-hairline pt-4">
                        <h4 className="text-sm font-semibold text-ink">Affected stop</h4>
                        <p className="mt-1 text-sm text-body">
                          {alert.affectedStops.join(", ")}
                        </p>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
