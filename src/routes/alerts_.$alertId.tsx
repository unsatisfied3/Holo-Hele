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

interface AlertDetailsSearch {
  bus?: string;
  stop?: string;
  routePage?: string;
  demo?: DemoAlertScenario;
}

export const Route = createFileRoute("/alerts_/$alertId")({
  validateSearch: (search: Record<string, unknown>): AlertDetailsSearch => ({
    bus: typeof search.bus === "string" ? search.bus : undefined,
    stop: typeof search.stop === "string" ? search.stop : undefined,
    routePage: typeof search.routePage === "string" ? search.routePage : undefined,
    demo: parseDemoAlertScenario(search.demo),
  }),
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const { alertId } = Route.useParams();
  const search = Route.useSearch();
  const alertsQuery = useQuery({
    queryKey: SERVICE_ALERTS_QUERY_KEY,
    queryFn: fetchServiceAlerts,
    refetchInterval: SERVICE_ALERT_REFRESH_MS,
    staleTime: SERVICE_ALERT_REFRESH_MS,
    enabled: !search.demo,
  });
  const demoAlert = search.demo ? getDemoAlert(search.demo) : undefined;
  const alert =
    demoAlert?.id === alertId
      ? demoAlert
      : alertsQuery.data?.alerts.find((candidate) => candidate.id === alertId);

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center border-b border-hairline bg-canvas px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <AlertDetailBackLink search={search} />
        <h1 className="flex-1 text-center text-base font-semibold text-ink">
          Alert details
        </h1>
        <span className="h-10 w-8" aria-hidden="true" />
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {!search.demo && alertsQuery.isPending ? (
          <AlertDetailState>Loading alert details…</AlertDetailState>
        ) : !search.demo && alertsQuery.isError ? (
          <AlertDetailState>
            This service alert could not be loaded. Check your connection and try again.
          </AlertDetailState>
        ) : alert ? (
          <>
            <ServiceAlertDetails alert={alert} emphasized stopId={search.stop} />
            {alert.source === "thebus-live" && alert.sourceUrl ? (
              <p className="mt-4 text-xs leading-relaxed text-body">
                Current notice from{" "}
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-brand-blue underline underline-offset-2"
                >
                  TheBus Service Disruption page
                </a>
                .
              </p>
            ) : null}
          </>
        ) : (
          <AlertDetailState>
            This alert is no longer listed. It may have ended since you last viewed it.
          </AlertDetailState>
        )}
      </section>
    </main>
  );
}

function AlertDetailBackLink({ search }: { search: AlertDetailsSearch }) {
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
    <Link to="/alerts" aria-label="Back to rider alerts" className={className}>
      {icon}
    </Link>
  );
}

function AlertDetailState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-md)] border border-hairline bg-canvas px-4 py-8 text-center text-sm leading-relaxed text-body">
      {children}
    </p>
  );
}
