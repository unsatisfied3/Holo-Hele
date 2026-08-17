import type {
  NearbyStopsResponse,
  DailyStopScheduleResponse,
  RouteScheduleResponse,
  ScheduleDay,
  StopArrivalsResponse,
  StopLocation,
  TrackingResponse,
} from "@/types/transit";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

interface ApiErrorBody {
  error?: string;
}

async function getJson<T>(path: string, fallbackMessage: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const body = (await response.json()) as T & ApiErrorBody;

  if (!response.ok) {
    throw new Error(body.error ?? fallbackMessage);
  }

  return body;
}

export function fetchNearbyStops(
  lat: number,
  lng: number,
): Promise<NearbyStopsResponse> {
  const search = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  return getJson(`/api/nearby?${search}`, "Unable to load nearby stops.");
}

export function fetchStopArrivals(stopId: string): Promise<StopArrivalsResponse> {
  const search = new URLSearchParams({ stop: stopId });
  return getJson(
    `/api/arrivals?${search}`,
    "Unable to load arrivals for this stop.",
  );
}

export function fetchTracking(
  stopId: string,
  arrivalId: string,
): Promise<TrackingResponse> {
  const search = new URLSearchParams({ stop: stopId, arrival: arrivalId });
  return getJson(`/api/tracking?${search}`, "Unable to load bus tracking.");
}

export function fetchStopLocation(stopId: string): Promise<{ stop: StopLocation }> {
  const search = new URLSearchParams({ stop: stopId });
  return getJson(`/api/stop?${search}`, "Unable to load this stop.");
}

export function fetchRouteSchedule(
  route: string,
  destination: string,
): Promise<RouteScheduleResponse> {
  const search = new URLSearchParams({ route, destination });
  return getJson(
    `/api/route-schedule?${search}`,
    "Unable to load this route schedule.",
  );
}

export function fetchDailyStopSchedule(
  stopId: string,
  route?: string,
  day: ScheduleDay = "today",
): Promise<DailyStopScheduleResponse> {
  const search = new URLSearchParams({ stop: stopId });
  if (route) search.set("route", route);
  if (day === "tomorrow") search.set("day", day);
  return getJson(
    `/api/daily-schedule?${search}`,
    "Unable to load the daily schedule.",
  );
}
