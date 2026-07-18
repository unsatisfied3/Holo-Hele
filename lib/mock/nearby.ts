import { getNearestStops } from "@/lib/thebus/stops";
import { withMockTracking } from "@/lib/mock/tracking";
import type { NearbyStopResult, TheBusArrival } from "@/types/transit";

type MockArrivalInput = Omit<
  TheBusArrival,
  "vehicle" | "trip" | "latitude" | "longitude" | "shape"
>;

function buildMockArrivals(
  entries: Record<string, MockArrivalInput[]>,
): Record<string, TheBusArrival[]> {
  return Object.fromEntries(
    Object.entries(entries).map(([stopId, arrivals]) => [
      stopId,
      arrivals.map((arrival) =>
        withMockTracking({
          ...arrival,
          vehicle: arrival.estimated ? `MOCK-${arrival.route}` : null,
        }),
      ),
    ]),
  );
}

/** Sample arrivals — clearly separated from live TheBus data. */
export const MOCK_ARRIVALS = buildMockArrivals({
  "1280": [
    {
      id: "mock-1280-a1",
      route: "A",
      headsign: "Aloha Stadium Stn - Connection to Waipahu",
      direction: "Westbound",
      stopTime: "2:08 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 8,
    },
    {
      id: "mock-1280-now",
      route: "A",
      headsign: "Aloha Stadium Stn - Connection to Waipahu",
      direction: "Westbound",
      stopTime: "2:10 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 0,
    },
    {
      id: "mock-1280-4a",
      route: "4",
      headsign: "McCully via UH Manoa",
      direction: "Eastbound",
      stopTime: "2:16 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 16,
    },
    {
      id: "mock-1280-a2",
      route: "A",
      headsign: "Aloha Stadium Stn - Connection to Waipahu",
      direction: "Westbound",
      stopTime: "2:48 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 48,
    },
    {
      id: "mock-1280-4b",
      route: "4",
      headsign: "McCully via UH Manoa",
      direction: "Westbound",
      stopTime: "2:58 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 58,
    },
    {
      id: "mock-1280-a3",
      route: "A",
      headsign: "Aloha Stadium Stn - Connection to Waipahu",
      direction: "Westbound",
      stopTime: "9:05 PM",
      estimated: true,
      canceled: false,
      minutesUntil: null,
    },
    {
      id: "mock-1280-4c",
      route: "4",
      headsign: "McCully via UH Manoa",
      direction: "Eastbound",
      stopTime: "10:05 PM",
      estimated: false,
      canceled: false,
      minutesUntil: null,
    },
  ],
  "437": [
    {
      id: "mock-437-19",
      route: "19",
      headsign: "Airport",
      direction: "Westbound",
      stopTime: "2:18 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 8,
    },
    {
      id: "mock-437-2",
      route: "2",
      headsign: "Kalihi Transit Center",
      direction: "Eastbound",
      stopTime: "2:25 PM",
      estimated: false,
      canceled: false,
      minutesUntil: 15,
    },
  ],
  "45": [
    {
      id: "mock-45-2",
      route: "2",
      headsign: "Kalihi Transit Center",
      direction: "Westbound",
      stopTime: "2:12 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 3,
    },
  ],
  "702": [
    {
      id: "mock-702-19",
      route: "19",
      headsign: "Ala Moana Center",
      direction: "Eastbound",
      stopTime: "2:20 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 6,
    },
    {
      id: "mock-702-13",
      route: "13",
      headsign: "Fort Shafter",
      direction: "Westbound",
      stopTime: "2:28 PM",
      estimated: false,
      canceled: false,
      minutesUntil: 14,
    },
  ],
  "1619": [
    {
      id: "mock-1619-a",
      route: "A",
      headsign: "Aloha Stadium Stn - Connection to Waipahu",
      direction: "Westbound",
      stopTime: "2:10 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 0,
    },
  ],
});

export const MOCK_LINES: Record<string, string[]> = {
  "1280": [
    "98A", "2L", "52", "40", "C", "4", "42", "96", "91", "83", "97", "53", "90",
    "84A", "20", "92", "98", "51", "54", "93", "91A", "95", "A", "81", "86", "6",
    "65", "82", "87", "122", "80", "PH6", "151",
  ],
  "437": ["2", "13", "19"],
  "45": ["2", "13", "19", "42"],
  "702": ["19", "13", "40"],
  "1619": ["A"],
};

export function buildMockNearbyStops(
  lat: number,
  lng: number,
  limit = 4,
): NearbyStopResult[] {
  const now = new Date().toLocaleString("en-US", { timeZone: "Pacific/Honolulu" });

  return getNearestStops(lat, lng, limit).map((stop) => {
    const arrivals = MOCK_ARRIVALS[stop.id] ?? [];
    const lines = MOCK_LINES[stop.id] ?? [...new Set(arrivals.map((a) => a.route))];

    return {
      stop,
      walkMinutes: stop.walkMinutes,
      distanceMeters: stop.distanceMeters,
      lines,
      arrivals,
      nextArrival: arrivals[0],
      dataUpdatedAt: now,
    };
  });
}