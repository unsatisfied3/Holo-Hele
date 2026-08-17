import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { FigmaIcon, RouteLineBadge } from "@/components/icons/FigmaIcon";
import { fetchDailyStopSchedule } from "@/lib/api/transit";
import { getFavoriteBusById } from "@/lib/mock/favorites";
import type { ScheduleDay } from "@/types/transit";

interface ScheduleSearch {
  stop?: string;
  route?: string;
  bus?: string;
  from?: "favorites";
  day?: ScheduleDay;
}

export const Route = createFileRoute("/schedule")({
  validateSearch: (search: Record<string, unknown>): ScheduleSearch => ({
    stop: typeof search.stop === "string" ? search.stop : undefined,
    route: typeof search.route === "string" ? search.route : undefined,
    bus: typeof search.bus === "string" ? search.bus : undefined,
    from: search.from === "favorites" ? "favorites" : undefined,
    day: search.day === "tomorrow" ? "tomorrow" : undefined,
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const search = Route.useSearch();
  const favoriteBus = search.bus ? getFavoriteBusById(search.bus) : undefined;
  const stopId = search.stop ?? favoriteBus?.stopId;
  const scheduleDay = search.day ?? "today";
  const scheduleQuery = useQuery({
    queryKey: ["daily-stop-schedule", stopId, search.route, scheduleDay],
    queryFn: () => fetchDailyStopSchedule(stopId ?? "", search.route, scheduleDay),
    enabled: Boolean(stopId),
  });
  const data = scheduleQuery.data;
  const error = scheduleQuery.error instanceof Error
    ? scheduleQuery.error.message
    : scheduleQuery.isError
      ? "Unable to load the daily schedule."
      : null;

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center border-b border-hairline px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        {favoriteBus ? (
          <ScheduleBackLink to="bus" id={favoriteBus.id} />
        ) : stopId ? (
          <ScheduleBackLink
            to="stop"
            id={stopId}
            fromFavorites={search.from === "favorites"}
          />
        ) : (
          <ScheduleBackLink to="favorites" />
        )}
        <h1 className="flex-1 text-center text-base font-semibold text-ink">
          {search.route ? "Schedule" : "Choose a Line"}
        </h1>
        <span className="h-10 w-8" aria-hidden="true" />
      </header>

      {!stopId ? (
        <ScheduleMessage title="Choose a saved stop first" body="Open a favorite stop and select Schedule." />
      ) : scheduleQuery.isPending ? (
        <ScheduleMessage title="Loading schedule…" />
      ) : error ? (
        <ScheduleMessage title="Schedule unavailable" body={error} />
      ) : !data ? null : search.route ? (
        <DailySchedule
          stopId={stopId}
          route={search.route}
          favoriteHeadsign={favoriteBus?.headsign}
          fromFavorites={search.from === "favorites"}
          scheduleDay={scheduleDay}
          data={data}
        />
      ) : (
        <LineChooser
          stopId={stopId}
          fromFavorites={search.from === "favorites"}
          scheduleDay={scheduleDay}
          data={data}
        />
      )}
    </main>
  );
}

function LineChooser({
  stopId,
  fromFavorites,
  scheduleDay,
  data,
}: {
  stopId: string;
  fromFavorites: boolean;
  scheduleDay: ScheduleDay;
  data: Awaited<ReturnType<typeof fetchDailyStopSchedule>>;
}) {
  const headsignByRoute = new Map<string, string>();
  for (const departure of data.departures) {
    if (!headsignByRoute.has(departure.route)) {
      headsignByRoute.set(departure.route, departure.headsign);
    }
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b-[6px] border-canvas-soft px-4 py-5">
        <h2 className="text-base font-semibold text-ink">{data.stop.name}</h2>
        <p className="mt-1 text-xs text-body">Stop {data.stop.id}</p>
      </div>
      {data.routes.length === 0 ? (
        <ScheduleMessage
          title={`No active lines ${scheduleDay}`}
          body={scheduleDay === "tomorrow"
            ? "Try another stop or choose a different day."
            : "Try another stop or check again tomorrow."}
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {data.routes.map((route) => (
            <li key={route}>
              <Link
                to="/schedule"
                search={{
                  stop: stopId,
                  route,
                  from: fromFavorites ? "favorites" : undefined,
                  day: scheduleDay === "tomorrow" ? "tomorrow" : undefined,
                }}
                aria-label={`Route ${route}: ${headsignByRoute.get(route) ?? `Route ${route}`}`}
                className="flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
              >
                <RouteLineBadge route={route} />
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">
                  {headsignByRoute.get(route) ?? `Route ${route}`}
                </span>
                <span aria-hidden="true" className="text-lg text-body">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DailySchedule({
  stopId,
  route,
  favoriteHeadsign,
  fromFavorites,
  scheduleDay,
  data,
}: {
  stopId: string;
  route: string;
  favoriteHeadsign?: string;
  fromFavorites: boolean;
  scheduleDay: ScheduleDay;
  data: Awaited<ReturnType<typeof fetchDailyStopSchedule>>;
}) {
  const matchingDirection = favoriteHeadsign
    ? data.departures.filter((departure) =>
        departure.headsign.toLocaleLowerCase().includes(
          favoriteHeadsign.toLocaleLowerCase().replace(/\s+/g, " "),
        ),
      )
    : [];
  const departures = matchingDirection.length > 0 ? matchingDirection : data.departures;
  const headsign = favoriteHeadsign ?? departures[0]?.headsign ?? `Route ${route}`;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b-[6px] border-canvas-soft px-4 py-5">
        <div className="flex items-start gap-3">
          <RouteLineBadge route={route} />
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-snug text-ink">{headsign}</h2>
            <p className="mt-1 text-xs text-body">{data.stop.name}</p>
          </div>
        </div>
        <div className="mt-4 flex min-h-10 items-center gap-2 rounded-[var(--radius-xs)] border border-brand-blue-border bg-brand-blue-subtle px-3 text-brand-blue">
          <FigmaIcon
            name="schedule"
            size={18}
            className="icon-brand-blue h-[18px] w-[18px]"
          />
          <span className="text-sm font-medium">
            {scheduleDay === "tomorrow" ? "Tomorrow" : "Today"}
          </span>
        </div>
      </div>

      {departures.length === 0 ? (
        <ScheduleMessage
          title={`No Route ${route} service ${scheduleDay}`}
          body={scheduleDay === "tomorrow"
            ? "Try another line or choose a different day."
            : "Try another line or check again tomorrow."}
        />
      ) : (
        <ul className="divide-y divide-hairline" aria-label={`Route ${route} scheduled departures`}>
          {departures.map((departure) => (
            <li key={departure.id} className="px-4 py-4">
              <time className="text-sm font-semibold text-ink">{departure.time}</time>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/schedule"
        search={{
          stop: stopId,
          from: fromFavorites ? "favorites" : undefined,
          day: scheduleDay === "tomorrow" ? "tomorrow" : undefined,
        }}
        className="mx-4 my-5 flex min-h-11 items-center justify-center rounded-[var(--radius-xs)] border border-brand-blue-border bg-brand-blue-subtle px-5 text-sm font-medium text-brand-blue transition-colors hover:bg-brand-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        Choose another line
      </Link>
    </section>
  );
}

function ScheduleBackLink({
  to,
  id,
  fromFavorites = false,
}: {
  to: "bus" | "stop" | "favorites";
  id?: string;
  fromFavorites?: boolean;
}) {
  const className =
    "flex h-10 w-8 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  const icon = <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />;

  if (to === "bus" && id) {
    return (
      <Link to="/buses/$busId" params={{ busId: id }} aria-label="Back to bus" className={className}>
        {icon}
      </Link>
    );
  }

  if (to === "stop" && id) {
    return (
      <Link
        to="/stops/$id"
        params={{ id }}
        search={{ from: fromFavorites ? "favorites" : undefined }}
        aria-label="Back to stop"
        className={className}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Link
      to="/favorites"
      search={{ tab: "stops" }}
      aria-label="Back to favorite stops"
      className={className}
    >
      {icon}
    </Link>
  );
}

function ScheduleMessage({ title, body }: { title: string; body?: string }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {body ? <p className="mt-2 text-sm leading-relaxed text-body">{body}</p> : null}
    </section>
  );
}
