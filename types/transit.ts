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

export interface TrackingRouteStop extends StopLocation {
  sequence: number;
  markerKind: "intermediate" | "destination";
}

export type StopsAwaySource = "exact" | "estimated" | "unavailable";

export interface TrackingResponse {
  stop: string;
  arrival: TheBusArrival;
  vehicleLocation: VehicleLocation | null;
  /** Stops remaining before the bus reaches this stop. Check stopsAwaySource before labeling it. */
  stopsAway: number | null;
  stopsAwaySource: StopsAwaySource;
  routeStops: TrackingRouteStop[];
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
  dataSource: "mock" | "scheduled" | "live";
  error?: string;
}

export interface StopArrivalsResponse {
  stop: string;
  arrivals: TheBusArrival[];
  lines: string[];
  dataSource: "mock" | "scheduled" | "live";
  fetchedAt: string;
  error?: string;
}

export interface DailyScheduleDeparture {
  id: string;
  route: string;
  headsign: string;
  time: string;
  tripId: string;
}

export type ScheduleDay = "today" | "tomorrow";

export interface DailyStopScheduleResponse {
  stop: StopLocation;
  serviceDate: string;
  routes: string[];
  departures: DailyScheduleDeparture[];
  dataSource: "scheduled";
  fetchedAt: string;
}

export interface ScheduledRouteStop extends StopLocation {
  sequence: number;
  scheduledTime: string;
}

export interface RouteScheduleResponse {
  route: string;
  name: string;
  headsign: string;
  origin: string;
  destination: string;
  serviceDate: string;
  tripId: string;
  path: Array<[number, number]>;
  stops: ScheduledRouteStop[];
  dataSource: "scheduled";
  fetchedAt: string;
}
