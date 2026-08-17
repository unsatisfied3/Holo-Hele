import { MOCK_ARRIVALS } from "@/lib/mock/nearby";
import {
  findMockArrival,
  getMockRouteStops,
  getMockVehicleLocation,
} from "@/lib/mock/tracking";
import { fetchArrivalTracking, fetchStopArrivals } from "@/lib/thebus/client";
import { getTheBusApiKey, isTheBusApiKeyConfigured } from "@/lib/thebus/config";
import { getStopById } from "@/lib/thebus/stops";
import { estimateStopsAway } from "@/lib/tracking/route-visualization";
import {
  getGtfsNearbyStops,
  getGtfsDailyStopSchedule,
  getGtfsRouteSchedule,
  getGtfsStop,
  getGtfsStopSchedule,
  getGtfsTrackingRoute,
} from "@/server/gtfs";
import type { NearbyStopResult, TrackingRouteStop } from "@/types/transit";

const DEFAULT_LAT = 21.3047;
const DEFAULT_LNG = -157.8567;
const port = Number(Bun.env.API_PORT ?? 3001);
const defaultOrigins = [
  "http://localhost:1420",
  "http://127.0.0.1:1420",
  "tauri://localhost",
  "http://tauri.localhost",
  "https://tauri.localhost",
];
const allowedOrigins = new Set(
  (Bun.env.API_ALLOWED_ORIGINS ?? defaultOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(
  body: unknown,
  status = 200,
  origin: string | null = null,
): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders(origin),
  });
}

function parseCoordinate(
  searchParams: URLSearchParams,
  name: "lat" | "lng",
  fallback: number,
): number | null {
  const raw = searchParams.get(name);
  if (raw == null) return fallback;
  const value = Number(raw);
  const limit = name === "lat" ? 90 : 180;
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

async function nearby(url: URL, origin: string | null): Promise<Response> {
  const lat = parseCoordinate(url.searchParams, "lat", DEFAULT_LAT);
  const lng = parseCoordinate(url.searchParams, "lng", DEFAULT_LNG);

  if (lat == null || lng == null) {
    return json({ error: "Latitude or longitude is invalid." }, 400, origin);
  }

  let officialStops: NearbyStopResult[];
  try {
    officialStops = await getGtfsNearbyStops({ lat, lng, limit: 10 });
  } catch {
    return json(
      {
        error:
          "Official nearby stop data is temporarily unavailable. Check your connection and try again.",
      },
      502,
      origin,
    );
  }

  if (!isTheBusApiKeyConfigured()) {
    return json(
      {
        stops: officialStops,
        userLocation: { lat, lng },
        fetchedAt: new Date().toISOString(),
        dataSource: "scheduled" as const,
      },
      200,
      origin,
    );
  }

  const apiKey = getTheBusApiKey();
  if (!apiKey) {
    return json(
      { error: "Transit data is not configured. Set THEBUS_API_KEY on the server." },
      503,
      origin,
    );
  }

  const stops: NearbyStopResult[] = await Promise.all(
    officialStops.map(async (scheduledStop, stopIndex) => {
      if (stopIndex >= 4) return scheduledStop;

      const { arrivals, timestamp, error } = await fetchStopArrivals(
        scheduledStop.stop.id,
        apiKey,
      );
      const displayedArrivals = error ? scheduledStop.arrivals : arrivals;
      return {
        ...scheduledStop,
        lines: scheduledStop.lines,
        arrivals: displayedArrivals,
        nextArrival: displayedArrivals[0],
        dataUpdatedAt: timestamp,
        error,
      };
    }),
  );

  const hasErrors = stops.some((stop) => stop.error);
  return json(
    {
      stops,
      userLocation: { lat, lng },
      fetchedAt: new Date().toISOString(),
      dataSource: "live" as const,
      ...(hasErrors
        ? { error: "Some nearby stops could not be loaded. Arrivals shown may be incomplete." }
        : {}),
    },
    200,
    origin,
  );
}

async function arrivals(url: URL, origin: string | null): Promise<Response> {
  const stop = url.searchParams.get("stop")?.trim();
  if (!stop) return json({ error: "Missing stop parameter." }, 400, origin);

  if (!isTheBusApiKeyConfigured()) {
    try {
      const schedule = await getGtfsStopSchedule(stop);
      if (!schedule) return json({ error: "Stop not found." }, 404, origin);
      return json(
        {
          stop,
          arrivals: schedule.arrivals,
          lines: schedule.lines,
          fetchedAt: new Date().toISOString(),
          dataSource: "scheduled" as const,
        },
        200,
        origin,
      );
    } catch {
      return json(
        { error: "The official stop schedule is temporarily unavailable." },
        502,
        origin,
      );
    }
  }

  const apiKey = getTheBusApiKey();
  if (!apiKey) {
    return json(
      {
        stop,
        error: "Transit data is not configured. Set THEBUS_API_KEY on the server.",
      },
      503,
      origin,
    );
  }

  const result = await fetchStopArrivals(stop, apiKey);
  if (result.error) {
    return json(
      {
        stop,
        arrivals: [],
        lines: [],
        fetchedAt: new Date().toISOString(),
        dataSource: "live" as const,
        error: result.error,
      },
      502,
      origin,
    );
  }

  return json(
    {
      stop,
      arrivals: result.arrivals,
      lines: [...new Set(result.arrivals.map((arrival) => arrival.route))],
      fetchedAt: result.timestamp ?? new Date().toISOString(),
      dataSource: "live" as const,
    },
    200,
    origin,
  );
}

async function tracking(url: URL, origin: string | null): Promise<Response> {
  const stopId = url.searchParams.get("stop")?.trim();
  const arrivalId = url.searchParams.get("arrival")?.trim();
  if (!stopId || !arrivalId) {
    return json({ error: "Missing stop or arrival parameter." }, 400, origin);
  }

  const stop = getStopById(stopId) ?? (await getGtfsStop(stopId));
  if (!stop) return json({ error: "Stop not found." }, 404, origin);

  if (!isTheBusApiKeyConfigured()) {
    const arrival = findMockArrival(stopId, arrivalId, MOCK_ARRIVALS);
    if (!arrival) {
      return json(
        { error: "This bus is no longer listed at this stop." },
        404,
        origin,
      );
    }

    const stopsAway = estimateStopsAway(arrival);

    return json(
      {
        stop: stopId,
        arrival,
        vehicleLocation: getMockVehicleLocation(stop, arrival),
        stopsAway,
        stopsAwaySource:
          stopsAway == null ? ("unavailable" as const) : ("estimated" as const),
        routeStops: getMockRouteStops(stop, stopsAway),
        fetchedAt: new Date().toISOString(),
        dataSource: "mock" as const,
      },
      200,
      origin,
    );
  }

  const apiKey = getTheBusApiKey();
  if (!apiKey) {
    return json(
      {
        error: "Transit data is not configured. Set THEBUS_API_KEY on the server.",
        stop: stopId,
      },
      503,
      origin,
    );
  }

  const result = await fetchArrivalTracking(stopId, arrivalId, apiKey);
  if (result.error && !result.arrival) {
    return json(
      {
        stop: stopId,
        error: result.error,
        fetchedAt: new Date().toISOString(),
        dataSource: "live" as const,
      },
      result.error.includes("no longer listed") ? 404 : 502,
      origin,
    );
  }

  if (!result.arrival) {
    return json(
      { error: "This bus is no longer listed at this stop." },
      404,
      origin,
    );
  }

  let routeStops: TrackingRouteStop[] = [];
  let stopsAway = estimateStopsAway(result.arrival);
  let stopsAwaySource: "exact" | "estimated" | "unavailable" =
    stopsAway == null ? "unavailable" : "estimated";

  if (result.arrival.trip && result.vehicleLocation) {
    try {
      const gtfsRoute = await getGtfsTrackingRoute({
        tripId: result.arrival.trip,
        destinationStopId: stopId,
        vehicleLocation: result.vehicleLocation,
      });
      if (gtfsRoute) {
        routeStops = gtfsRoute.routeStops;
        stopsAway = gtfsRoute.stopsAway;
        stopsAwaySource = "exact";
      }
    } catch {
      // Keep the estimated count, but never invent named live route stops.
    }
  }

  return json(
    {
      stop: stopId,
      arrival: result.arrival,
      vehicleLocation: result.vehicleLocation,
      stopsAway,
      stopsAwaySource,
      routeStops,
      fetchedAt: result.timestamp ?? new Date().toISOString(),
      dataSource: "live" as const,
      error: result.error,
    },
    200,
    origin,
  );
}

async function routeSchedule(url: URL, origin: string | null): Promise<Response> {
  const route = url.searchParams.get("route")?.trim();
  const destination = url.searchParams.get("destination")?.trim();
  if (!route || !destination) {
    return json({ error: "Missing route or destination parameter." }, 400, origin);
  }

  try {
    const schedule = await getGtfsRouteSchedule({ route, destination });
    if (!schedule) {
      return json(
        { error: "No active trip was found for this route and direction." },
        404,
        origin,
      );
    }

    return json(
      {
        ...schedule,
        dataSource: "scheduled" as const,
        fetchedAt: new Date().toISOString(),
      },
      200,
      origin,
    );
  } catch {
    return json(
      {
        error:
          "The official route schedule is temporarily unavailable. Try again shortly.",
      },
      502,
      origin,
    );
  }
}

async function dailyStopSchedule(
  url: URL,
  origin: string | null,
): Promise<Response> {
  const stop = url.searchParams.get("stop")?.trim();
  const route = url.searchParams.get("route")?.trim();
  const dayParam = url.searchParams.get("day")?.trim();
  if (!stop) return json({ error: "Missing stop parameter." }, 400, origin);
  if (dayParam && dayParam !== "today" && dayParam !== "tomorrow") {
    return json({ error: "Invalid day parameter." }, 400, origin);
  }
  const day = dayParam === "tomorrow" ? "tomorrow" : "today";

  try {
    const schedule = await getGtfsDailyStopSchedule(stop, route, day);
    if (!schedule) return json({ error: "Stop not found." }, 404, origin);
    return json(
      {
        ...schedule,
        dataSource: "scheduled" as const,
        fetchedAt: new Date().toISOString(),
      },
      200,
      origin,
    );
  } catch {
    return json(
      { error: "The official daily schedule is temporarily unavailable." },
      502,
      origin,
    );
  }
}

async function stopLocation(url: URL, origin: string | null): Promise<Response> {
  const stopId = url.searchParams.get("stop")?.trim();
  if (!stopId) return json({ error: "Missing stop parameter." }, 400, origin);

  try {
    const stop = await getGtfsStop(stopId);
    return stop
      ? json({ stop }, 200, origin)
      : json({ error: "Stop not found." }, 404, origin);
  } catch {
    return json(
      { error: "Official stop information is temporarily unavailable." },
      502,
      origin,
    );
  }
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const origin = request.headers.get("Origin");
    if (origin && !allowedOrigins.has(origin)) {
      return json({ error: "Origin is not allowed." }, 403, origin);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed." }, 405, origin);
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ status: "ok" }, 200, origin);
    }
    if (url.pathname === "/api/nearby") return nearby(url, origin);
    if (url.pathname === "/api/stop") return stopLocation(url, origin);
    if (url.pathname === "/api/arrivals") return arrivals(url, origin);
    if (url.pathname === "/api/tracking") return tracking(url, origin);
    if (url.pathname === "/api/route-schedule") {
      return routeSchedule(url, origin);
    }
    if (url.pathname === "/api/daily-schedule") {
      return dailyStopSchedule(url, origin);
    }
    return json({ error: "Not found." }, 404, origin);
  },
});

console.info(`Holo Hele API listening on http://127.0.0.1:${server.port}`);
