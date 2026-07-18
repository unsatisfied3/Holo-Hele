import type { StopLocation, TheBusArrival, VehicleLocation } from "@/types/transit";

/** Default tracking fields for mock arrivals. */
export const MOCK_TRACKING_DEFAULTS = {
  vehicle: null,
  trip: null,
  latitude: null,
  longitude: null,
  shape: null,
} as const satisfies Pick<
  TheBusArrival,
  "vehicle" | "trip" | "latitude" | "longitude" | "shape"
>;

export function withMockTracking(
  arrival: Omit<TheBusArrival, "vehicle" | "trip" | "latitude" | "longitude" | "shape"> &
    Partial<Pick<TheBusArrival, "vehicle" | "trip" | "latitude" | "longitude" | "shape">>,
): TheBusArrival {
  return {
    ...MOCK_TRACKING_DEFAULTS,
    ...arrival,
  };
}

/** Deterministic mock vehicle position — offset from the stop toward the bus. */
export function getMockVehicleLocation(
  stop: StopLocation,
  arrival: TheBusArrival,
): VehicleLocation | null {
  if (!arrival.estimated) return null;

  const seed = arrival.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const angle = ((seed % 360) * Math.PI) / 180;
  const minutes = arrival.minutesUntil ?? 12;
  const distance = Math.max(0.001, minutes * 0.00012);

  return {
    lat: stop.lat + Math.cos(angle) * distance,
    lng: stop.lng + Math.sin(angle) * distance,
  };
}

export function findMockArrival(
  stopId: string,
  arrivalId: string,
  arrivals: Record<string, TheBusArrival[]>,
): TheBusArrival | null {
  return (arrivals[stopId] ?? []).find((arrival) => arrival.id === arrivalId) ?? null;
}
