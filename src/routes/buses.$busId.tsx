import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  AlertTriangleIcon,
  FigmaIcon,
  RouteLineBadge,
} from "@/components/icons/FigmaIcon";
import { StopArrivalItem } from "@/components/stops/StopArrivalItem";
import {
  toggleFavoriteBus,
  useFavoriteBusIds,
} from "@/lib/favorites";
import { fetchStopArrivals } from "@/lib/api/transit";
import { getFavoriteBusById } from "@/lib/mock/favorites";
import { getServiceAlertForBus } from "@/lib/mock/service-alerts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buses/$busId")({
  component: FavoriteBusPage,
});

const actionButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-[var(--radius-xs)] border border-brand-blue-border bg-brand-blue-subtle p-2 text-brand-blue transition-colors hover:bg-brand-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";

function FavoriteBusPage() {
  const { busId } = Route.useParams();
  const bus = getFavoriteBusById(busId);
  const favoriteBusIds = useFavoriteBusIds();
  const arrivalsQuery = useQuery({
    queryKey: ["favorite-bus-arrivals", bus?.stopId],
    queryFn: () => fetchStopArrivals(bus?.stopId ?? ""),
    enabled: Boolean(bus),
  });

  if (!bus) {
    return (
      <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold text-ink">Bus favorite unavailable</h1>
        <p className="text-sm text-body">This saved bus is no longer in the preview list.</p>
        <Link to="/favorites" className="rounded-[var(--radius-pill)] bg-primary px-5 py-3 text-sm font-medium text-on-primary">
          Back to favorites
        </Link>
      </main>
    );
  }

  const data = arrivalsQuery.data;
  const arrivals = (data?.arrivals ?? []).filter(
    (arrival) => arrival.route.toLocaleUpperCase() === bus.route.toLocaleUpperCase(),
  );
  const error =
    data?.error ??
    (arrivalsQuery.error instanceof Error ? arrivalsQuery.error.message : null);
  const isFavorite = favoriteBusIds.includes(bus.id);
  const serviceAlert = getServiceAlertForBus(bus.id);

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas-soft">
      <header className="flex items-center border-b border-hairline bg-canvas px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <Link
          to="/favorites"
          aria-label="Back to favorites"
          className="flex h-10 w-8 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-ink">Bus</h1>
        <span className="h-10 w-8" aria-hidden="true" />
      </header>

      {serviceAlert ? (
        <Link
          to="/alerts"
          search={{ alert: serviceAlert.id, bus: bus.id }}
          aria-label={`View service alert: ${serviceAlert.title}`}
          className="flex min-h-[72px] items-center gap-3 bg-brand-blue-subtle px-4 py-3 transition-colors hover:bg-brand-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue"
        >
          <AlertTriangleIcon className="h-7 w-7 shrink-0 text-brand-blue" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">
              {serviceAlert.title}
            </span>
            <span className="mt-0.5 block text-xs text-body">
              {serviceAlert.statusLabel}
            </span>
          </span>
          <span className="text-sm font-medium text-brand-blue underline underline-offset-4">
            View
          </span>
        </Link>
      ) : null}

      <section className="border-b border-charcoal-500 bg-canvas px-4 pb-4 pt-6">
        <div className="flex items-start gap-3">
          <RouteLineBadge route={bus.route} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium leading-snug text-ink">
              {bus.route} - {bus.headsign}
            </h2>
            <p className="mt-2 text-xs text-body">{bus.stopName}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-1.5">
          <Link
            to="/schedule"
            search={{ stop: bus.stopId, route: bus.route, bus: bus.id }}
            className={`${actionButtonClass} gap-1 px-2`}
          >
            <FigmaIcon
              name="schedule"
              size={20}
              className="icon-brand-blue h-5 w-5"
            />
            <span className="text-sm font-medium">Schedule</span>
          </Link>
          <Link to="/home" aria-label="Show stop on map" className={actionButtonClass}>
            <FigmaIcon
              name="place"
              size={20}
              className="icon-brand-blue h-5 w-5"
            />
          </Link>
          <button
            type="button"
            aria-label={isFavorite ? "Remove bus from favorites" : "Save bus to favorites"}
            aria-pressed={isFavorite}
            onClick={() => toggleFavoriteBus(bus.id)}
            className={cn(
              actionButtonClass,
              isFavorite && "bg-brand-blue-subtle text-brand-blue",
            )}
          >
            <FigmaIcon
              name={isFavorite ? "favorites" : "favorite"}
              size={20}
              className="icon-brand-blue h-5 w-5"
            />
          </button>
        </div>
      </section>

      <section aria-label={`Route ${bus.route} arrivals`} className="min-h-0 flex-1 overflow-y-auto bg-canvas">
        {arrivalsQuery.isPending ? (
          <p className="px-4 py-8 text-center text-sm text-body">Loading arrivals…</p>
        ) : error ? (
          <p className="px-4 py-8 text-center text-sm text-body">{error}</p>
        ) : arrivals.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <h2 className="text-base font-semibold text-ink">No upcoming Route {bus.route} arrivals</h2>
            <p className="mt-2 text-sm text-body">
              Service has ended for today. Check tomorrow&apos;s schedule for the next departures.
            </p>
            <Link
              to="/schedule"
              search={{
                stop: bus.stopId,
                route: bus.route,
                bus: bus.id,
                day: "tomorrow",
              }}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-xs)] border border-brand-blue-border bg-brand-blue-subtle px-5 text-sm font-medium text-brand-blue transition-colors hover:bg-brand-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              View schedule
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {arrivals.map((arrival) => (
              <li key={arrival.id}>
                <StopArrivalItem
                  stopId={bus.stopId}
                  arrival={arrival}
                  trackingAvailable={data?.dataSource !== "scheduled"}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
