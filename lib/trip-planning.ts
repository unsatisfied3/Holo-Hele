import { fetchTripPlan } from "@/lib/api/transit";
import { getJourneyById } from "@/lib/mock/journeys";
import type {
  JourneyOption,
  TripPlanResponse,
  TripTimeMode,
} from "@/types/transit";

export interface TripRouteSearch {
  destination: string;
  destinationDetail?: string;
  destinationLat?: number;
  destinationLng?: number;
  originName?: string;
  originLat?: number;
  originLng?: number;
  departureOffsetMinutes?: number;
  tripTimeMode?: TripTimeMode;
  requestedTime?: string;
}

const tripPlanCache = new Map<
  string,
  { response: TripPlanResponse; cachedAt: number }
>();
const CACHE_DURATION_MS = 30_000;

function optionalNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseTripRouteSearch(
  search: Record<string, unknown>,
): TripRouteSearch {
  return {
    destination:
      typeof search.destination === "string" && search.destination.trim()
        ? search.destination
        : "Ala Moana Center",
    destinationDetail:
      typeof search.destinationDetail === "string"
        ? search.destinationDetail
        : undefined,
    destinationLat: optionalNumber(search.destinationLat),
    destinationLng: optionalNumber(search.destinationLng),
    originName:
      typeof search.originName === "string" ? search.originName : undefined,
    originLat: optionalNumber(search.originLat),
    originLng: optionalNumber(search.originLng),
    departureOffsetMinutes: optionalNumber(search.departureOffsetMinutes),
    tripTimeMode:
      search.tripTimeMode === "leave" || search.tripTimeMode === "arrive"
        ? search.tripTimeMode
        : "now",
    requestedTime:
      typeof search.requestedTime === "string" ? search.requestedTime : undefined,
  };
}

function planCacheKey(search: TripRouteSearch): string | null {
  if (
    search.originLat == null ||
    search.originLng == null ||
    search.destinationLat == null ||
    search.destinationLng == null
  ) {
    return null;
  }
  return [
    search.originLat.toFixed(5),
    search.originLng.toFixed(5),
    search.destination,
    search.destinationLat.toFixed(5),
    search.destinationLng.toFixed(5),
    String(search.departureOffsetMinutes ?? 0),
    search.tripTimeMode ?? "now",
    search.requestedTime ?? "",
  ].join("|");
}

export async function fetchCachedTripPlan(
  search: TripRouteSearch,
): Promise<TripPlanResponse | null> {
  const cacheKey = planCacheKey(search);
  if (!cacheKey) return null;
  const cached = tripPlanCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_DURATION_MS) {
    return cached.response;
  }

  const response = await fetchTripPlan({
    origin: {
      name: search.originName ?? "Current location",
      lat: search.originLat as number,
      lng: search.originLng as number,
    },
    destination: {
      name: search.destination,
      detail: search.destinationDetail ?? search.destination,
      lat: search.destinationLat as number,
      lng: search.destinationLng as number,
    },
    departureOffsetMinutes: search.departureOffsetMinutes,
    tripTimeMode: search.tripTimeMode,
    requestedTime: search.requestedTime,
  });
  tripPlanCache.set(cacheKey, { response, cachedAt: Date.now() });
  return response;
}

export async function resolvePlannedJourney(
  journeyId: string,
  search: TripRouteSearch,
): Promise<JourneyOption | undefined> {
  const mockJourney = getJourneyById(journeyId);
  if (mockJourney) return mockJourney;
  const plan = await fetchCachedTripPlan(search);
  return plan?.journeys.find((journey) => journey.id === journeyId);
}
