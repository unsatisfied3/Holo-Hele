import { NextResponse } from "next/server";

import { MOCK_ARRIVALS } from "@/lib/mock/nearby";
import { findMockArrival, getMockVehicleLocation } from "@/lib/mock/tracking";
import { estimateStopsAway } from "@/lib/tracking/route-visualization";
import { fetchArrivalTracking } from "@/lib/thebus/client";
import { getTheBusApiKey, isTheBusApiKeyConfigured } from "@/lib/thebus/config";
import { getStopById } from "@/lib/thebus/stops";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stopId = searchParams.get("stop")?.trim();
  const arrivalId = searchParams.get("arrival")?.trim();

  if (!stopId || !arrivalId) {
    return NextResponse.json(
      { error: "Missing stop or arrival parameter." },
      { status: 400 },
    );
  }

  const stop = getStopById(stopId);

  if (!stop) {
    return NextResponse.json({ error: "Stop not found." }, { status: 404 });
  }

  if (!isTheBusApiKeyConfigured()) {
    const arrival = findMockArrival(stopId, arrivalId, MOCK_ARRIVALS);

    if (!arrival) {
      return NextResponse.json(
        { error: "This bus is no longer listed at this stop." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      stop: stopId,
      arrival,
      vehicleLocation: getMockVehicleLocation(stop, arrival),
      stopsAway: estimateStopsAway(arrival),
      fetchedAt: new Date().toISOString(),
      dataSource: "mock" as const,
    });
  }

  const apiKey = getTheBusApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Transit data is not configured. Set THEBUS_API_KEY on the server.",
        stop: stopId,
      },
      { status: 503 },
    );
  }

  const result = await fetchArrivalTracking(stopId, arrivalId, apiKey);

  if (result.error && !result.arrival) {
    return NextResponse.json(
      {
        stop: stopId,
        error: result.error,
        fetchedAt: new Date().toISOString(),
        dataSource: "live" as const,
      },
      { status: result.error.includes("no longer listed") ? 404 : 502 },
    );
  }

  if (!result.arrival) {
    return NextResponse.json(
      { error: "This bus is no longer listed at this stop." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    stop: stopId,
    arrival: result.arrival,
    vehicleLocation: result.vehicleLocation,
    stopsAway: estimateStopsAway(result.arrival),
    fetchedAt: result.timestamp ?? new Date().toISOString(),
    dataSource: "live" as const,
    error: result.error,
  });
}
