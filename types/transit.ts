export type ArrivalSource = "live" | "scheduled" | "unavailable";

export type LanguageCode =
  | "en"
  | "haw"
  | "ilo"
  | "tl"
  | "ja"
  | "zh"
  | "ko"
  | "vi";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export interface StopLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: "stop" | "station";
}

export interface TheBusArrival {
  id: string;
  route: string;
  headsign: string;
  direction: string;
  stopTime: string;
  estimated: boolean;
  canceled: boolean;
  minutesUntil: number | null;
  vehicle: string | null;
  trip: string | null;
  latitude: number | null;
  longitude: number | null;
  shape: string | null;
}

export interface VehicleLocation {
  lat: number;
  lng: number;
}

export interface TrackingResponse {
  stop: string;
  arrival: TheBusArrival;
  vehicleLocation: VehicleLocation | null;
  /** Stops remaining before the bus reaches this stop (estimated when sequence data is unavailable). */
  stopsAway: number | null;
  fetchedAt: string;
  dataSource: "mock" | "live";
  error?: string;
}

export interface NearbyStopResult {
  stop: StopLocation;
  walkMinutes: number;
  distanceMeters: number;
  lines: string[];
  arrivals: TheBusArrival[];
  nextArrival?: TheBusArrival;
  dataUpdatedAt?: string;
  error?: string;
}

export interface NearbyStopsResponse {
  stops: NearbyStopResult[];
  userLocation?: { lat: number; lng: number };
  fetchedAt: string;
  dataSource: "mock" | "live";
  error?: string;
}

export interface StopArrivalsResponse {
  stop: string;
  arrivals: TheBusArrival[];
  lines: string[];
  dataSource: "mock" | "live";
  fetchedAt: string;
  error?: string;
}
