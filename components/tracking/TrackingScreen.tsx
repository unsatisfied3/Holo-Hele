import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { TrackingHeader } from "@/components/tracking/TrackingHeader";
import { TrackingMap } from "@/components/tracking/TrackingMap";
import { TrackingSummary } from "@/components/tracking/TrackingSummary";
import { fetchStopArrivals, fetchTracking } from "@/lib/api/transit";
import { getLocationPreference } from "@/lib/onboarding";
import type { StopLocation } from "@/types/transit";

interface TrackingScreenProps {
  stop: StopLocation;
  arrivalId: string;
}

const LIVE_REFRESH_MS = 15_000;

function TrackingLoadingState() {
  return (
    <>
      <div
        className="absolute inset-0 animate-pulse bg-canvas-soft motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-4 top-1/2 z-[1100] -translate-y-1/2 rounded-[var(--radius-xs)] border border-hairline bg-canvas px-4 py-3 text-center"
        role="status"
      >
        <p className="text-sm font-medium text-ink">Locating your bus…</p>
        <p className="mt-1 text-xs text-body">This can take a few seconds.</p>
      </div>
      <div className="tracking-summary pointer-events-none absolute inset-x-0 bottom-0 z-[1200] pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="mx-auto h-28 w-full max-w-80 animate-pulse rounded-[var(--radius-xs)] border border-hairline bg-canvas motion-reduce:animate-none" />
      </div>
    </>
  );
}

function TrackingErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 bg-canvas-soft" />
      <div className="absolute inset-x-6 top-1/2 z-[1100] -translate-y-1/2 rounded-[var(--radius-xs)] border border-hairline bg-canvas px-5 py-5 text-center">
        <h2 className="text-base font-semibold text-ink">Bus location unavailable</h2>
        <p className="mt-2 text-sm leading-relaxed text-body">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-10 rounded-[var(--radius-pill)] bg-primary px-5 py-2 text-sm font-medium text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Try again
        </button>
      </div>
    </>
  );
}

export function TrackingScreen({ stop, arrivalId }: TrackingScreenProps) {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();

  useEffect(() => {
    if (!getLocationPreference() || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      () => setUserLocation(undefined),
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const trackingQuery = useQuery({
    queryKey: ["tracking", stop.id, arrivalId],
    queryFn: () => fetchTracking(stop.id, arrivalId),
    refetchInterval: (query) =>
      query.state.data?.dataSource === "live" ? LIVE_REFRESH_MS : false,
  });
  const arrivalsQuery = useQuery({
    queryKey: ["stop-arrivals", stop.id],
    queryFn: () => fetchStopArrivals(stop.id),
    refetchInterval: LIVE_REFRESH_MS,
  });

  const data = trackingQuery.data;
  const carouselArrivals = useMemo(() => {
    if (!data) return [];

    const trackable =
      arrivalsQuery.data?.arrivals.filter(
        (arrival) =>
          arrival.estimated &&
          (arrival.vehicle != null ||
            (arrival.latitude != null && arrival.longitude != null)),
      ) ?? [];
    const deduped = new Map(
      [...trackable, data.arrival].map((arrival) => [arrival.id, arrival]),
    );
    const sorted = Array.from(deduped.values()).sort(
      (a, b) =>
        (a.minutesUntil ?? Number.MAX_SAFE_INTEGER) -
        (b.minutesUntil ?? Number.MAX_SAFE_INTEGER),
    );
    const visible = sorted.slice(0, 4);
    if (!visible.some((arrival) => arrival.id === data.arrival.id)) {
      visible[visible.length - 1] = data.arrival;
      visible.sort(
        (a, b) =>
          (a.minutesUntil ?? Number.MAX_SAFE_INTEGER) -
          (b.minutesUntil ?? Number.MAX_SAFE_INTEGER),
      );
    }
    return visible;
  }, [arrivalsQuery.data, data]);
  const error =
    data?.error ??
    (trackingQuery.error instanceof Error
      ? trackingQuery.error.message
      : trackingQuery.isError
        ? "Unable to load bus tracking. Check your connection and try again."
        : null);

  return (
    <div className="app-shell relative h-dvh overflow-hidden bg-canvas">
      <TrackingHeader stopId={stop.id} />

      {trackingQuery.isPending ? (
        <TrackingLoadingState />
      ) : error && !data ? (
        <TrackingErrorState
          message={error}
          onRetry={() => void trackingQuery.refetch()}
        />
      ) : data ? (
        <>
          <div className="tracking-map absolute inset-0">
            <TrackingMap
              stop={stop}
              arrival={data.arrival}
              vehicleLocation={data.vehicleLocation}
              routeStops={data.routeStops ?? []}
              userLocation={userLocation}
            />
          </div>

          {error ? (
            <p className="absolute inset-x-4 top-[calc(max(env(safe-area-inset-top),0.75rem)+3.75rem)] z-[1200] rounded-[var(--radius-xs)] border border-hairline bg-canvas px-3 py-2 text-xs text-body">
              Live update paused. Showing the last available location.
            </p>
          ) : !data.vehicleLocation && data.arrival.estimated ? (
            <p className="absolute inset-x-4 top-[calc(max(env(safe-area-inset-top),0.75rem)+3.75rem)] z-[1200] rounded-[var(--radius-xs)] border border-hairline bg-canvas px-3 py-2 text-xs text-body">
              Vehicle location is temporarily unavailable. The map is centered on your stop.
            </p>
          ) : null}

          <TrackingSummary
            stop={stop}
            arrivals={carouselArrivals}
            activeArrivalId={data.arrival.id}
            stopsAway={data.stopsAway}
            stopsAwaySource={data.stopsAwaySource ?? "estimated"}
            onArrivalSelect={(arrival) => {
              void navigate({
                to: "/stops/$id/track/$arrivalId",
                params: { id: stop.id, arrivalId: arrival.id },
                replace: true,
              });
            }}
          />
        </>
      ) : null}
    </div>
  );
}
