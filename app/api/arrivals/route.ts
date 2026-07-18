import { NextResponse } from "next/server";

import { MOCK_ARRIVALS, MOCK_LINES } from "@/lib/mock/nearby";
import { fetchStopArrivals } from "@/lib/thebus/client";
import { getTheBusApiKey, isTheBusApiKeyConfigured } from "@/lib/thebus/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stop = searchParams.get("stop")?.trim();

  if (!stop) {
    return NextResponse.json({ error: "Missing stop parameter." }, { status: 400 });
  }

  if (!isTheBusApiKeyConfigured()) {
    const arrivals = MOCK_ARRIVALS[stop] ?? [];
    const lines =
      MOCK_LINES[stop] ?? [...new Set(arrivals.map((arrival) => arrival.route))];

    return NextResponse.json({
      stop,
      arrivals,
      lines,
      fetchedAt: new Date().toISOString(),
      dataSource: "mock" as const,
    });
  }

  const apiKey = getTheBusApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Transit data is not configured. Set THEBUS_API_KEY on the server.",
        stop,
      },
      { status: 503 },
    );
  }

  const result = await fetchStopArrivals(stop, apiKey);

  if (result.error) {
    return NextResponse.json(
      {
        stop,
        arrivals: [],
        lines: [],
        fetchedAt: new Date().toISOString(),
        dataSource: "live" as const,
        error: result.error,
      },
      { status: 502 },
    );
  }

  const lines = [...new Set(result.arrivals.map((arrival) => arrival.route))];

  return NextResponse.json({
    stop,
    arrivals: result.arrivals,
    lines,
    fetchedAt: result.timestamp ?? new Date().toISOString(),
    dataSource: "live" as const,
  });
}
