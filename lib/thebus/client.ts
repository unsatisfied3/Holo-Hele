import type { TheBusArrival } from "@/types/transit";

const ARRIVALS_URL = "http://api.thebus.org/arrivalsJSON/";
const VEHICLE_URL = "http://api.thebus.org/vehicleJSON/";

export interface RawTheBusArrival {
  id: string;
  trip: string;
  route: string;
  headsign: string;
  direction: string;
  vehicle: string;
  estimated: string;
  stopTime: string;
  date: string;
  longitude: string;
  latitude: string;
  shape: string;
  canceled: string;
}

export interface RawTheBusArrivalsResponse {
  stop?: string;
  timestamp?: string;
  errorMessage?: string;
  arrivals?: RawTheBusArrival[];
}

export interface RawTheBusVehicle {
  number: string;
  latitude: string;
  longitude: string;
  route_short_name?: string;
  headsign?: string;
  trip?: string;
}

export interface RawTheBusVehicleResponse {
  timestamp?: string;
  errorMessage?: string;
  vehicle?: RawTheBusVehicle;
}

function parseCoord(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  return parsed;
}

export function parseStopTimeMinutes(stopTime: string, date: string): number | null {
  const parsed = new Date(`${date} ${stopTime}`);
  if (Number.isNaN(parsed.getTime())) return null;

  const diffMs = parsed.getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / 60000));
}

export function normalizeArrival(raw: RawTheBusArrival): TheBusArrival {
  const estimated = raw.estimated === "1";
  const canceled = raw.canceled === "1";
  const vehicle = raw.vehicle?.trim() || null;

  return {
    id: raw.id,
    route: raw.route,
    headsign: raw.headsign,
    direction: raw.direction,
    stopTime: raw.stopTime,
    estimated,
    canceled,
    minutesUntil: parseStopTimeMinutes(raw.stopTime, raw.date),
    vehicle,
    trip: raw.trip?.trim() || null,
    latitude: parseCoord(raw.latitude),
    longitude: parseCoord(raw.longitude),
    shape: raw.shape?.trim() || null,
  };
}

export function vehicleLocationFromArrival(
  arrival: TheBusArrival,
): { lat: number; lng: number } | null {
  if (arrival.latitude == null || arrival.longitude == null) return null;
  return { lat: arrival.latitude, lng: arrival.longitude };
}

export async function fetchVehicleLocation(
  vehicleNumber: string,
  apiKey: string,
): Promise<{ location: { lat: number; lng: number } | null; error?: string }> {
  const url = new URL(VEHICLE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("num", vehicleNumber);

  let response: Response;

  try {
    response = await fetch(url.toString(), { cache: "no-store" });
  } catch {
    return {
      location: null,
      error: "Unable to reach TheBus API. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    return {
      location: null,
      error: `TheBus API returned ${response.status}.`,
    };
  }

  let data: RawTheBusVehicleResponse;

  try {
    data = (await response.json()) as RawTheBusVehicleResponse;
  } catch {
    return {
      location: null,
      error: "Received an invalid response from TheBus API.",
    };
  }

  if (data.errorMessage) {
    return { location: null, error: data.errorMessage };
  }

  const vehicle = data.vehicle;
  if (!vehicle) {
    return { location: null, error: "Vehicle not found." };
  }

  const lat = parseCoord(vehicle.latitude);
  const lng = parseCoord(vehicle.longitude);

  if (lat == null || lng == null) {
    return { location: null, error: "Vehicle location is unavailable." };
  }

  return { location: { lat, lng } };
}

export async function fetchStopArrivals(
  stopId: string,
  apiKey: string,
): Promise<{ arrivals: TheBusArrival[]; timestamp?: string; error?: string }> {
  const url = new URL(ARRIVALS_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("stop", stopId);

  let response: Response;

  try {
    response = await fetch(url.toString(), { cache: "no-store" });
  } catch {
    return {
      arrivals: [],
      error: "Unable to reach TheBus API. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    return {
      arrivals: [],
      error: `TheBus API returned ${response.status}.`,
    };
  }

  let data: RawTheBusArrivalsResponse;

  try {
    data = (await response.json()) as RawTheBusArrivalsResponse;
  } catch {
    return {
      arrivals: [],
      error: "Received an invalid response from TheBus API.",
    };
  }

  if (data.errorMessage) {
    return { arrivals: [], error: data.errorMessage };
  }

  if (!Array.isArray(data.arrivals)) {
    return {
      arrivals: [],
      error: "Received an unexpected response from TheBus API.",
    };
  }

  const arrivals = data.arrivals
    .filter((item) => item.canceled !== "1")
    .map(normalizeArrival)
    .sort((a, b) => {
      const aMin = a.minutesUntil ?? Number.MAX_SAFE_INTEGER;
      const bMin = b.minutesUntil ?? Number.MAX_SAFE_INTEGER;
      return aMin - bMin;
    });

  return { arrivals, timestamp: data.timestamp };
}

export async function fetchArrivalTracking(
  stopId: string,
  arrivalId: string,
  apiKey: string,
): Promise<{
  arrival: TheBusArrival | null;
  vehicleLocation: { lat: number; lng: number } | null;
  timestamp?: string;
  error?: string;
}> {
  const result = await fetchStopArrivals(stopId, apiKey);

  if (result.error) {
    return { arrival: null, vehicleLocation: null, error: result.error };
  }

  const arrival = result.arrivals.find((item) => item.id === arrivalId) ?? null;

  if (!arrival) {
    return { arrival: null, vehicleLocation: null, error: "This bus is no longer listed at this stop." };
  }

  let vehicleLocation = vehicleLocationFromArrival(arrival);

  if (arrival.vehicle) {
    const vehicleResult = await fetchVehicleLocation(arrival.vehicle, apiKey);
    if (vehicleResult.location) {
      vehicleLocation = vehicleResult.location;
    }
  }

  return {
    arrival,
    vehicleLocation,
    timestamp: result.timestamp,
  };
}
