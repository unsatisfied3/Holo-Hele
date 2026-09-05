import type {
  JourneyCoordinate,
  WalkingDirectionsResponse,
  WalkingManeuver,
  WalkingRouteLeg,
  WalkingRouteStep,
} from "@/types/transit";

const REQUEST_TIMEOUT_MS = 6_000;

// Prototype only: this public service receives route coordinates. A production
// release must use a privacy-reviewed provider or a self-hosted Valhalla service.
const DEFAULT_VALHALLA_BASE_URL = "https://valhalla1.openstreetmap.de";

interface ValhallaManeuver {
  type?: number;
  instruction?: string;
}

interface ValhallaLeg {
  shape?: string;
  summary?: {
    length?: number;
    time?: number;
  };
  maneuvers?: ValhallaManeuver[];
}

interface ValhallaRouteResponse {
  trip?: {
    legs?: ValhallaLeg[];
  };
}

function formatWalkingDistance(kilometers: number) {
  const meters = Math.max(0, kilometers * 1_000);
  if (meters < 1_000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1_000).toFixed(1)} km`;
}

export function decodePolyline6(encoded: string): JourneyCoordinate[] {
  const coordinates: JourneyCoordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    const deltas: number[] = [];
    for (let coordinateIndex = 0; coordinateIndex < 2; coordinateIndex += 1) {
      let result = 0;
      let shift = 0;
      let byte: number;

      do {
        if (index >= encoded.length) return [];
        byte = encoded.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      deltas.push(result & 1 ? ~(result >> 1) : result >> 1);
    }

    latitude += deltas[0];
    longitude += deltas[1];
    coordinates.push([latitude / 1e6, longitude / 1e6]);
  }

  return coordinates;
}

export function walkingManeuverFromValhalla(type: number | undefined): WalkingManeuver {
  if (type === 1 || type === 2 || type === 3) return "start";
  if (type === 4 || type === 5 || type === 6) return "destination";
  if (type === 9) return "slight-right";
  if (type === 16) return "slight-left";
  if ([10, 11, 12, 18, 20, 23].includes(type ?? -1)) return "right";
  if ([13, 14, 15, 19, 21, 24].includes(type ?? -1)) return "left";
  return "straight";
}

export function parseValhallaRoute(
  response: ValhallaRouteResponse,
): WalkingRouteLeg | undefined {
  const leg = response.trip?.legs?.[0];
  if (
    !leg?.shape ||
    !Number.isFinite(leg.summary?.length) ||
    !Number.isFinite(leg.summary?.time)
  ) {
    return undefined;
  }

  const path = decodePolyline6(leg.shape);
  const steps: WalkingRouteStep[] = (leg.maneuvers ?? []).flatMap(
    (maneuver) => {
      const instruction = maneuver.instruction?.trim();
      if (!instruction || [4, 5, 6].includes(maneuver.type ?? -1)) return [];
      return [{
        instruction,
        maneuver: walkingManeuverFromValhalla(maneuver.type),
      }];
    },
  );

  if (path.length < 2 || steps.length === 0) return undefined;

  return {
    path,
    steps,
    distance: formatWalkingDistance(leg.summary?.length ?? 0),
    durationMinutes: Math.max(1, Math.ceil((leg.summary?.time ?? 0) / 60)),
  };
}

export async function requestPedestrianRoute(
  start: JourneyCoordinate,
  end: JourneyCoordinate,
): Promise<WalkingRouteLeg | undefined> {
  const baseUrl = (Bun.env.VALHALLA_BASE_URL ?? DEFAULT_VALHALLA_BASE_URL)
    .replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/route`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locations: [
        { lat: start[0], lon: start[1] },
        { lat: end[0], lon: end[1] },
      ],
      costing: "pedestrian",
      units: "kilometers",
      language: "en-US",
      directions_type: "instructions",
      shape_format: "polyline6",
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) return undefined;
  return parseValhallaRoute((await response.json()) as ValhallaRouteResponse);
}

export async function getWalkingDirections(
  {
    origin,
    board,
    alight,
    destination,
  }: {
    origin: JourneyCoordinate;
    board: JourneyCoordinate;
    alight: JourneyCoordinate;
    destination: JourneyCoordinate;
  },
  requestRoute = requestPedestrianRoute,
): Promise<WalkingDirectionsResponse> {
  const [start, end] = await Promise.all([
    requestRoute(origin, board).catch(() => undefined),
    requestRoute(alight, destination).catch(() => undefined),
  ]);
  const dataSource: WalkingDirectionsResponse["dataSource"] =
    start && end ? "routed" : start || end ? "partial" : "approximate";

  return {
    start,
    end,
    dataSource,
    ...(dataSource === "routed"
      ? {}
      : {
          error:
            "Some walking directions are approximate because pedestrian routing is temporarily unavailable.",
        }),
  };
}
