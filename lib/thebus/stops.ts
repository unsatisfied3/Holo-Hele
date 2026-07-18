import type { StopLocation } from "@/types/transit";

/** Curated Oʻahu stops aligned with wireframe UX references. */
export const HONOLULU_STOPS: StopLocation[] = [
  {
    id: "1280",
    name: "S Beretania St + Pali Hwy + Bishop St",
    lat: 21.3018,
    lng: -157.8519,
    kind: "stop",
  },
  {
    id: "437",
    name: "S King St + Punchbowl St",
    lat: 21.3049,
    lng: -157.8572,
    kind: "stop",
  },
  {
    id: "45",
    name: "Hotel St + Bishop St",
    lat: 21.3094,
    lng: -157.8601,
    kind: "stop",
  },
  {
    id: "702",
    name: "Ala Moana Blvd + Atkinson Dr",
    lat: 21.2912,
    lng: -157.8431,
    kind: "stop",
  },
  {
    id: "1619",
    name: "Aloha Stadium Station",
    lat: 21.3724,
    lng: -157.9301,
    kind: "station",
  },
];

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function walkMinutesFromMeters(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}

export function getStopById(id: string): StopLocation | undefined {
  return HONOLULU_STOPS.find((stop) => stop.id === id);
}

export function getNearestStops(
  lat: number,
  lng: number,
  limit = 4,
): Array<StopLocation & { distanceMeters: number; walkMinutes: number }> {
  return HONOLULU_STOPS.map((stop) => {
    const distanceMeters = haversineMeters(lat, lng, stop.lat, stop.lng);
    return {
      ...stop,
      distanceMeters,
      walkMinutes: walkMinutesFromMeters(distanceMeters),
    };
  })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
