import type { StopLocation } from "@/types/transit";

/** Curated Oʻahu stops aligned with wireframe UX references. */
export const HONOLULU_STOPS: StopLocation[] = [
  {
    id: "1280",
    name: "Bishop St + Queen St",
    lat: 21.307569,
    lng: -157.862935,
    kind: "stop",
  },
  {
    id: "437",
    name: "S Beretania St + Bishop St",
    lat: 21.310404,
    lng: -157.858507,
    kind: "stop",
  },
  {
    id: "45",
    name: "S Beretania St + Punchbowl St",
    lat: 21.307244,
    lng: -157.856142,
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
    name: "Makaikai St + Ainamakua Dr",
    lat: 21.47062,
    lng: -158.00275,
    kind: "station",
  },
  {
    id: "1712",
    name: "KAMEHAMEHA HWY + PUAHUULA PL",
    lat: 21.396434,
    lng: -157.797518,
    kind: "stop",
  },
  {
    id: "1016",
    name: "KAPIOLANI BL + MCCULLY ST",
    lat: 21.289386,
    lng: -157.831987,
    kind: "stop",
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
