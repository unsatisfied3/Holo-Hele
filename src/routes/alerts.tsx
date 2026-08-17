import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  AlertTriangleIcon,
  FigmaIcon,
  RouteLineBadge,
} from "@/components/icons/FigmaIcon";
import { fetchServiceAlerts } from "@/lib/api/transit";
import {
  getDemoAlert,
  type DemoAlertScenario,
} from "@/lib/mock/service-alerts";
import {
  SERVICE_ALERT_REFRESH_MS,
  SERVICE_ALERTS_QUERY_KEY,
} from "@/lib/service-alerts";
import { cn } from "@/lib/utils";
import type { TransitAlert } from "@/types/transit";

interface AlertsSearch {
  alert?: string;
  bus?: string;
  stop?: string;
  routePage?: string;
  demo?: DemoAlertScenario;
}

function parseDemoScenario(value: unknown): DemoAlertScenario | undefined {
  return value === "route-1l" || value === "stop-437" || value === "system-wide"
    ? value
    : undefined;
}

export const Route = createFileRoute("/alerts")({
  validateSearch: (search: Record<string, unknown>): AlertsSearch => ({
    alert: typeof search.alert === "string" ? search.alert : undefined,
    bus: typeof search.bus === "string" ? search.bus : undefined,
    stop: typeof search.stop === "string" ? search.stop : undefined,
    routePage: typeof search.routePage === "string" ? search.routePage : undefined,
    demo: parseDemoScenario(search.demo),
  }),
  component: RiderAlertsPage,
});

function RiderAlertsPage() {
  const search = Route.useSearch();
  const alertsQuery = useQuery({
    queryKey: SERVICE_ALERTS_QUERY_KEY,
    queryFn: fetchServiceAlerts,
    refetchInterval: SERVICE_ALERT_REFRESH_MS,
    staleTime: SERVICE_ALERT_REFRESH_MS,
  });
  const demoAlert = search.demo ? getDemoAlert(search.demo) : undefined;

  useEffect(() => {
    const selected = document.getElementById(search.alert ?? demoAlert?.id ?? "");
    selected?.scrollIntoView({ block: "nearest" });
  }, [demoAlert?.id, search.alert]);

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center border-b border-hairline px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <AlertsBackLink search={search} />
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
            {alertsQuery.data?.status !== "unavailable" ? (
              <span className="text-xs text-body">
                {alertsQuery.data?.alerts.length ?? 0} active
              </span>
            ) : null}
          </div>

          {alertsQuery.isPending ? (
            <AlertState>Loading current service alerts…</AlertState>
          ) : alertsQuery.isError ? (
            <AlertState>
              Service alerts are temporarily unavailable. Try again later.
            </AlertState>
          ) : (
            <>
              {alertsQuery.data?.error ? (
                <p
                  role="status"
                  className="mt-4 rounded-[var(--radius-xs)] bg-canvas-softer px-3 py-2 text-xs leading-relaxed text-body"
                >
                  {alertsQuery.data.error}
                </p>
              ) : null}

              {(alertsQuery.data?.alerts.length ?? 0) > 0 ? (
                <AlertList alerts={alertsQuery.data?.alerts ?? []} selectedId={search.alert} />
              ) : (
                <AlertState>
                  {alertsQuery.data?.status === "unavailable"
                    ? "Current service alerts could not be loaded. The rest of Holo Hele is still available."
                    : "TheBus has no current service disruptions listed."}
                </AlertState>
              )}

              <p className="mt-4 text-xs leading-relaxed text-body">
                Current notices are retrieved from{" "}
                <a
                  href={alertsQuery.data?.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-blue underline underline-offset-2"
                >
                  TheBus Service Disruption page
                </a>
                .
              </p>
            </>
          )}
        </section>

        {demoAlert ? (
          <section aria-labelledby="demo-heading" className="mt-2 bg-canvas px-4 py-5">
            <div>
              <h2 id="demo-heading" className="text-lg font-semibold text-ink">
                Demo scenario
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-body">
                Portfolio preview only — this is not a current TheBus notice.
              </p>
            </div>
            <AlertList alerts={[demoAlert]} selectedId={search.alert ?? demoAlert.id} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function AlertsBackLink({ search }: { search: AlertsSearch }) {
  const className =
    "flex h-10 w-8 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";
  const icon = <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />;

  if (search.bus) {
    return (
      <Link to="/buses/$busId" params={{ busId: search.bus }} aria-label="Back to bus" className={className}>
        {icon}
      </Link>
    );
  }
  if (search.stop) {
    return (
      <Link to="/stops/$id" params={{ id: search.stop }} aria-label="Back to stop" className={className}>
        {icon}
      </Link>
    );
  }
  if (search.routePage) {
    return (
      <Link to="/routes/$routeId" params={{ routeId: search.routePage }} aria-label="Back to route" className={className}>
        {icon}
      </Link>
    );
  }
  return (
    <Link to="/settings" aria-label="Back to settings" className={className}>
      {icon}
    </Link>
  );
}

function AlertState({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-[var(--radius-md)] border border-hairline bg-canvas px-4 py-6 text-center text-sm leading-relaxed text-body">
      {children}
    </p>
  );
}

function AlertList({
  alerts,
  selectedId,
}: {
  alerts: TransitAlert[];
  selectedId?: string;
}) {
  return (
    <ul className="mt-4 space-y-3">
      {alerts.map((alert) => (
        <li key={alert.id}>
          <AlertCard alert={alert} selected={selectedId === alert.id} />
        </li>
      ))}
    </ul>
  );
}

function AlertCard({ alert, selected }: { alert: TransitAlert; selected: boolean }) {
  return (
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
            {formatAlertStatus(alert)}
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-body">{alert.description}</p>

        {alert.systemWide ? (
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-alert">
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
            <h4 className="text-sm font-semibold text-ink">
              Affected {alert.affectedStops.length === 1 ? "stop" : "stops"}
            </h4>
            <p className="mt-1 text-sm text-body">
              {alert.affectedStops.map((stop) => `Stop ${stop}`).join(", ")}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatAlertStatus(alert: TransitAlert): string {
  if (alert.source === "holohele-demo") return "Demo scenario";
  if (!alert.startTime) return "Current TheBus notice";
  return `Posted ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(alert.startTime))}`;
}
