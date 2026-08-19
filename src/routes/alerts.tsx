import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ServiceAlertDetails } from "@/components/alerts/ServiceAlertDetails";
import { FigmaIcon } from "@/components/icons/FigmaIcon";
import { fetchServiceAlerts } from "@/lib/api/transit";
import {
  getDemoAlert,
  parseDemoAlertScenario,
  type DemoAlertScenario,
} from "@/lib/mock/service-alerts";
import {
  SERVICE_ALERT_REFRESH_MS,
  SERVICE_ALERTS_QUERY_KEY,
} from "@/lib/service-alerts";
import type { TransitAlert } from "@/types/transit";

interface AlertsSearch {
  alert?: string;
  bus?: string;
  stop?: string;
  routePage?: string;
  demo?: DemoAlertScenario;
}

export const Route = createFileRoute("/alerts")({
  validateSearch: (search: Record<string, unknown>): AlertsSearch => ({
    alert: typeof search.alert === "string" ? search.alert : undefined,
    bus: typeof search.bus === "string" ? search.bus : undefined,
    stop: typeof search.stop === "string" ? search.stop : undefined,
    routePage: typeof search.routePage === "string" ? search.routePage : undefined,
    demo: parseDemoAlertScenario(search.demo),
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
        {demoAlert ? (
          <section aria-label="Selected service alert" className="bg-canvas px-4 py-5">
            <AlertList alerts={[demoAlert]} selectedId={search.alert ?? demoAlert.id} />
          </section>
        ) : null}

        <section
          aria-labelledby="disruptions-heading"
          className={`${demoAlert ? "mt-2 " : ""}bg-canvas px-4 py-5`}
        >
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
  return <ServiceAlertDetails alert={alert} emphasized={selected} />;
}
