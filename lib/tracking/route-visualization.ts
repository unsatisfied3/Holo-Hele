import type {
  StopLocation,
  TheBusArrival,
  TrackingRouteStop,
  VehicleLocation,
} from "@/types/transit";

/** Rough stops-until-arrival for mock/live tracking when GTFS stop sequence is unavailable. */
export function estimateStopsAway(arrival: TheBusArrival): number | null {
  if (!arrival.estimated || arrival.minutesUntil == null) return null;
  if (arrival.minutesUntil === 0) return 0;
  return Math.max(1, Math.round(arrival.minutesUntil / 2.5));
}

export function buildRoutePolyline(
  vehicle: VehicleLocation,
  stop: StopLocation,
  routeStops: TrackingRouteStop[],
): [number, number][] {
  return [
    [vehicle.lat, vehicle.lng],
    ...(routeStops.length > 0
      ? routeStops.map(
          (routeStop) => [routeStop.lat, routeStop.lng] as [number, number],
        )
      : ([[stop.lat, stop.lng]] as [number, number][])),
  ];
}

export function buildApproachPolyline(
  vehicle: VehicleLocation,
  stop: StopLocation,
  routeStops: TrackingRouteStop[],
): [number, number][] {
  const destinationIndex = routeStops.findIndex(
    (routeStop) => routeStop.markerKind === "destination",
  );
  const stopsBeforeBoarding =
    destinationIndex >= 0
      ? routeStops.slice(0, destinationIndex + 1)
      : routeStops;

  return buildRoutePolyline(vehicle, stop, stopsBeforeBoarding);
}

export interface RouteDirectionIndicator {
  position: [number, number];
  rotationDegrees: number;
}

export function buildRouteDirectionIndicator(
  vehicle: VehicleLocation,
  stop: StopLocation,
  routeStops: TrackingRouteStop[],
): RouteDirectionIndicator | null {
  const destinationIndex = routeStops.findIndex(
    (routeStop) => routeStop.markerKind === "destination",
  );
  let start: [number, number];
  let end: [number, number];

  if (destinationIndex >= 0 && destinationIndex + 1 < routeStops.length) {
    const destination = routeStops[destinationIndex];
    const nextStop = routeStops[destinationIndex + 1];
    start = [destination.lat, destination.lng];
    end = [nextStop.lat, nextStop.lng];
  } else {
    const approach = buildApproachPolyline(vehicle, stop, routeStops);
    if (approach.length < 2) return null;
    start = approach[approach.length - 2];
    end = approach[approach.length - 1];
  }

  const latitudeScale = Math.cos((((start[0] + end[0]) / 2) * Math.PI) / 180);
  const deltaX = (end[1] - start[1]) * latitudeScale;
  const deltaY = -(end[0] - start[0]);
  if (Math.abs(deltaX) + Math.abs(deltaY) < Number.EPSILON) return null;

  return {
    position: [
      start[0] + (end[0] - start[0]) * 0.35,
      start[1] + (end[1] - start[1]) * 0.35,
    ],
    rotationDegrees: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
  };
}
