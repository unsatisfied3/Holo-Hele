import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { FigmaIcon, RouteLineBadge } from "@/components/icons/FigmaIcon";
import { RouteOverviewMap } from "@/components/routes/RouteOverviewMap";
import { fetchRouteSchedule } from "@/lib/api/transit";

export const Route = createFileRoute("/routes/$routeId")({
  component: RouteOverviewPage,
});

function RouteOverviewPage() {
  const { routeId } = Route.useParams();
  const isHawaiiKaiRoute =
    routeId === "1l-hawaii-kai" || routeId === "8-hawaii-kai";
  const routeQuery = useQuery({
    queryKey: ["route-schedule", "1L", "HAWAII KAI"],
    queryFn: () => fetchRouteSchedule("1L", "HAWAII KAI"),
    enabled: isHawaiiKaiRoute,
    retry: 1,
  });

  if (!isHawaiiKaiRoute) return <RoutePreviewNotFound />;

  return (
    <main className="app-page-enter app-shell min-h-dvh bg-canvas">
      <header className="flex shrink-0 items-center border-b border-hairline bg-canvas px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <Link
          to="/search"
          aria-label="Back to search"
          className="flex h-10 w-6 shrink-0 items-center justify-start rounded-[var(--radius-xs)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-ink">Route</h1>
        <span className="h-10 w-6 shrink-0" aria-hidden="true" />
      </header>

      {routeQuery.isPending ? (
        <RouteScheduleState
          title="Loading official route…"
          detail="Fetching the current GTFS stop sequence and schedule."
        />
      ) : routeQuery.isError || !routeQuery.data ? (
        <RouteScheduleState
          title="Route schedule unavailable"
          detail={
            routeQuery.error instanceof Error
              ? routeQuery.error.message
              : "The official route schedule could not be loaded."
          }
          action={
            <button
              type="button"
              onClick={() => void routeQuery.refetch()}
              className="rounded-[var(--radius-pill)] bg-primary px-5 py-3 text-sm font-medium text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Try again
            </button>
          }
        />
      ) : (
        <>
          <section className="h-[38dvh] min-h-60 max-h-80 shrink-0 border-b border-hairline" aria-label="Route map">
            <RouteOverviewMap route={routeQuery.data} />
          </section>

          <section className="flex items-start gap-4 border-b border-hairline bg-canvas px-4 py-4">
            <RouteLineBadge route={routeQuery.data.route} />
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-snug text-ink">
                {routeQuery.data.name}
              </h2>
              <p className="mt-1 text-sm leading-snug text-mute">
                {routeQuery.data.origin} → {routeQuery.data.destination}
              </p>
            </div>
          </section>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <ol className="relative bg-canvas" aria-label="Route stops">
              {routeQuery.data.stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === routeQuery.data.stops.length - 1;

            return (
              <li
                key={stop.id}
                className="relative grid min-h-16 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 px-4"
              >
                {index < routeQuery.data.stops.length - 1 ? (
                  <span
                    className="absolute bottom-0 left-[31px] top-1/2 w-0.5 bg-transit-blue"
                    aria-hidden="true"
                  />
                ) : null}
                {index > 0 ? (
                  <span
                    className="absolute bottom-1/2 left-[31px] top-0 w-0.5 bg-transit-blue"
                    aria-hidden="true"
                  />
                ) : null}

                <span
                  className={
                    isFirst || isLast
                      ? "relative z-10 flex h-6 w-6 justify-self-center items-center justify-center rounded-full border-2 border-transit-blue bg-canvas text-xs font-bold text-transit-blue"
                      : "relative z-10 h-3 w-3 justify-self-center rounded-full border-2 border-transit-blue bg-canvas"
                  }
                  aria-hidden="true"
                >
                  {isFirst ? "A" : isLast ? "B" : null}
                </span>

                <span className="min-w-0 border-b border-hairline py-5 text-sm font-medium leading-snug text-ink">
                  {stop.name}
                </span>
                <time className="border-b border-hairline py-5 text-sm text-body">
                  {stop.scheduledTime}
                </time>
              </li>
            );
              })}
            </ol>
          </div>
        </>
      )}
    </main>
  );
}

function RouteScheduleState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="max-w-xs text-sm leading-relaxed text-body">{detail}</p>
      {action}
    </section>
  );
}

function RoutePreviewNotFound() {
  return (
    <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-ink">Route preview unavailable</h1>
      <p className="text-sm text-body">
        That route is not in the Holo Hele preview yet.
      </p>
      <Link
        to="/search"
        className="rounded-[var(--radius-pill)] bg-primary px-5 py-3 text-sm font-medium text-on-primary"
      >
        Back to search
      </Link>
    </main>
  );
}
