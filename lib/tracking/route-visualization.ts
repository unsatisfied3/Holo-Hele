import type { StopLocation, TheBusArrival, VehicleLocation } from "@/types/transit";

export type RouteStopMarker = {
  lat: number;
  lng: number;
  kind: "intermediate" | "destination";
};

/** Rough stops-until-arrival for mock/live tracking when GTFS stop sequence is unavailable. */
export function estimateStopsAway(arrival: TheBusArrival): number | null {
  if (!arrival.estimated || arrival.minutesUntil == null) return null;
  if (arrival.minutesUntil === 0) return 0;
  return Math.max(1, Math.round(arrival.minutesUntil / 2.5));
}

export function buildRouteStopMarkers(
  vehicle: VehicleLocation,
  stop: StopLocation,
  stopsAway: number,
): RouteStopMarker[] {
  if (stopsAway <= 0) {
    return [{ lat: stop.lat, lng: stop.lng, kind: "destination" }];
  }

  const markers: RouteStopMarker[] = [];

  for (let i = 1; i <= stopsAway; i++) {
    const t = i / stopsAway;
    markers.push({
      lat: vehicle.lat + (stop.lat - vehicle.lat) * t,
      lng: vehicle.lng + (stop.lng - vehicle.lng) * t,
      kind: i === stopsAway ? "destination" : "intermediate",
    });
  }

  return markers;
}

export function buildRoutePolyline(
  vehicle: VehicleLocation,
  stop: StopLocation,
  stopsAway: number,
): [number, number][] {
  return [
    [vehicle.lat, vehicle.lng],
    ...buildRouteStopMarkers(vehicle, stop, stopsAway).map(
      (marker) => [marker.lat, marker.lng] as [number, number],
    ),
  ];
}
