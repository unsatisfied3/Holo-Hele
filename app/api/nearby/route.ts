import { NextResponse } from "next/server";

import { buildMockNearbyStops } from "@/lib/mock/nearby";
import { fetchStopArrivals } from "@/lib/thebus/client";
import { getTheBusApiKey, isTheBusApiKeyConfigured } from "@/lib/thebus/config";
import { getNearestStops } from "@/lib/thebus/stops";
import type { NearbyStopResult } from "@/types/transit";

const DEFAULT_LAT = 21.3047;
const DEFAULT_LNG = -157.8567;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat") ?? DEFAULT_LAT);
  const lng = Number(searchParams.get("lng") ?? DEFAULT_LNG);

  if (!isTheBusApiKeyConfigured()) {
    return NextResponse.json({
      stops: buildMockNearbyStops(lat, lng, 4),
      userLocation: { lat, lng },
      fetchedAt: new Date().toISOString(),
      dataSource: "mock" as const,
    });
  }

  const apiKey = getTheBusApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Transit data is not configured. Set THEBUS_API_KEY on the server.",
      },
      { status: 503 },
    );
  }

  const nearest = getNearestStops(lat, lng, 4);

  const stops: NearbyStopResult[] = await Promise.all(
    nearest.map(async (stop) => {
      const { arrivals, timestamp, error } = await fetchStopArrivals(stop.id, apiKey);
      const lines = [...new Set(arrivals.map((item) => item.route))];

      return {
        stop,
        walkMinutes: stop.walkMinutes,
        distanceMeters: stop.distanceMeters,
        lines,
        arrivals,
        nextArrival: arrivals[0],
        dataUpdatedAt: timestamp,
        error,
      };
    }),
  );

  const hasErrors = stops.some((stop) => stop.error);

  return NextResponse.json({
    stops,
    userLocation: { lat, lng },
    fetchedAt: new Date().toISOString(),
    dataSource: "live" as const,
    ...(hasErrors
      ? {
          error:
            "Some nearby stops could not be loaded. Arrivals shown may be incomplete.",
        }
      : {}),
  });
}
