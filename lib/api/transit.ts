import type {
  NearbyStopsResponse,
  MapStopsResponse,
  DailyStopScheduleResponse,
  RouteScheduleResponse,
  ServiceAlertsResponse,
  StopArrivalsResponse,
  StopLocation,
  StopSearchResponse,
  TrackingResponse,
  JourneyOption,
  TripPlanResponse,
  TripTimeMode,
  WalkingDirectionsResponse,
} from "@/types/transit";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

interface ApiErrorBody {
  error?: string;
}

async function getJson<T>(
  path: string,
  fallbackMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
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

export function fetchMapStops(): Promise<MapStopsResponse> {
  return getJson("/api/stops", "Unable to load island-wide bus stops.");
}

export function fetchStopSearch(
  query: string,
  signal?: AbortSignal,
): Promise<StopSearchResponse> {
  const search = new URLSearchParams({ q: query });
  return getJson(
    `/api/search-stops?${search}`,
    "Unable to search official bus stops.",
    signal,
  );
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
  serviceDate?: string,
): Promise<DailyStopScheduleResponse> {
  const search = new URLSearchParams({ stop: stopId });
  if (route) search.set("route", route);
  if (serviceDate) search.set("date", serviceDate);
  return getJson(
    `/api/daily-schedule?${search}`,
    "Unable to load the daily schedule.",
  );
}

export function fetchServiceAlerts(): Promise<ServiceAlertsResponse> {
  return getJson("/api/alerts", "Unable to load service alerts.");
}

export function fetchTripPlan({
  origin,
  destination,
  departureOffsetMinutes = 0,
  tripTimeMode = "now",
  requestedTime,
}: {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; detail: string; lat: number; lng: number };
  departureOffsetMinutes?: number;
  tripTimeMode?: TripTimeMode;
  requestedTime?: string;
}): Promise<TripPlanResponse> {
  const search = new URLSearchParams({
    lat: String(origin.lat),
    lng: String(origin.lng),
    origin: origin.name,
    destination: destination.name,
    destinationDetail: destination.detail,
    destinationLat: String(destination.lat),
    destinationLng: String(destination.lng),
    departureOffsetMinutes: String(departureOffsetMinutes),
    timeMode: tripTimeMode,
  });
  if (requestedTime) search.set("requestedTime", requestedTime);
  return getJson(
    `/api/trip-plan?${search}`,
    "Unable to plan this trip right now.",
  );
}

export function fetchWalkingDirections(
  journey: JourneyOption,
): Promise<WalkingDirectionsResponse> {
  const search = new URLSearchParams({
    originLat: String(journey.origin.coordinate[0]),
    originLng: String(journey.origin.coordinate[1]),
    boardLat: String(journey.boardStop.coordinate[0]),
    boardLng: String(journey.boardStop.coordinate[1]),
    alightLat: String(journey.alightStop.coordinate[0]),
    alightLng: String(journey.alightStop.coordinate[1]),
    destinationLat: String(journey.destination.coordinate[0]),
    destinationLng: String(journey.destination.coordinate[1]),
  });
  return getJson(
    `/api/walking-directions?${search}`,
    "Unable to load detailed walking directions.",
  );
}
