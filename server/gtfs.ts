import { strFromU8, unzipSync } from "fflate";

import type {
  NearbyStopResult,
  DailyScheduleDeparture,
  ScheduleDay,
  StopLocation,
  TheBusArrival,
  TrackingRouteStop,
  VehicleLocation,
} from "@/types/transit";
import {
  haversineMeters,
  walkMinutesFromMeters,
} from "@/lib/thebus/stops";

const ACTIVE_GTFS_URL =
  "https://www.thebus.org/transitdata/production/google_transit.zip";

interface GtfsStop extends StopLocation {
  internalId: string;
}

interface GtfsTrip {
  tripId: string;
  routeId: string;
  serviceId: string;
  shapeId: string;
  headsign: string;
}

interface GtfsStopTime {
  stopId: string;
  sequence: number;
  arrivalTime: string;
  departureTime: string;
}

interface GtfsCalendar {
  startDate: string;
  endDate: string;
  weekdays: Record<string, boolean>;
}

interface GtfsIndex {
  stops: GtfsStop[];
  stopsById: Map<string, GtfsStop>;
  tripStopIds: Map<string, string[]>;
  routeIdsByShortName: Map<string, string[]>;
  routeShortNameById: Map<string, string>;
  trips: GtfsTrip[];
  tripStopTimes: Map<string, GtfsStopTime[]>;
  shapesById: Map<string, Array<[number, number]>>;
  calendarsByServiceId: Map<string, GtfsCalendar>;
  exceptionsByServiceId: Map<string, Map<string, number>>;
}

let gtfsIndexPromise: Promise<GtfsIndex> | null = null;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    if (row.some(Boolean)) rows.push(row);
  }

  return rows;
}

function rowsToRecords(text: string): Record<string, string>[] {
  const [headers = [], ...rows] = parseCsv(text);
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function requireGtfsFile(
  archive: Record<string, Uint8Array>,
  filename: string,
): string {
  const key = Object.keys(archive).find((entry) =>
    entry.toLowerCase().endsWith(filename.toLowerCase()),
  );
  if (!key) throw new Error(`GTFS archive is missing ${filename}.`);
  return strFromU8(archive[key]);
}

async function loadGtfsIndex(): Promise<GtfsIndex> {
  const response = await fetch(ACTIVE_GTFS_URL, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`TheBus GTFS feed returned ${response.status}.`);
  }

  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const stopRecords = rowsToRecords(requireGtfsFile(archive, "stops.txt"));
  const stopTimeRecords = rowsToRecords(
    requireGtfsFile(archive, "stop_times.txt"),
  );
  const routeRecords = rowsToRecords(requireGtfsFile(archive, "routes.txt"));
  const tripRecords = rowsToRecords(requireGtfsFile(archive, "trips.txt"));
  const shapeRecords = rowsToRecords(requireGtfsFile(archive, "shapes.txt"));
  const calendarRecords = rowsToRecords(requireGtfsFile(archive, "calendar.txt"));
  const calendarDateRecords = rowsToRecords(
    requireGtfsFile(archive, "calendar_dates.txt"),
  );
  const stopsById = new Map<string, GtfsStop>();
  const stops: GtfsStop[] = [];

  for (const record of stopRecords) {
    const lat = Number.parseFloat(record.stop_lat);
    const lng = Number.parseFloat(record.stop_lon);
    if (!record.stop_id || !record.stop_name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const publicId = record.stop_code || record.stop_id;
    const stop: GtfsStop = {
      internalId: record.stop_id,
      id: publicId,
      name: record.stop_name,
      lat,
      lng,
      kind: "stop",
    };
    stops.push(stop);
    stopsById.set(record.stop_id, stop);
    stopsById.set(publicId, stop);
  }

  const tripStopTimes = new Map<string, GtfsStopTime[]>();

  for (const record of stopTimeRecords) {
    if (!record.trip_id || !record.stop_id) continue;
    const stop = stopsById.get(record.stop_id);
    if (!stop) continue;
    const sequence = tripStopTimes.get(record.trip_id) ?? [];
    sequence.push({
      stopId: stop.id,
      sequence: Number(record.stop_sequence),
      arrivalTime: record.arrival_time,
      departureTime: record.departure_time,
    });
    tripStopTimes.set(record.trip_id, sequence);
  }

  for (const sequence of tripStopTimes.values()) {
    sequence.sort((a, b) => a.sequence - b.sequence);
  }

  const tripStopIds = new Map(
    Array.from(tripStopTimes, ([tripId, sequence]) => [
      tripId,
      sequence.map((item) => item.stopId),
    ]),
  );

  const routeIdsByShortName = new Map<string, string[]>();
  const routeShortNameById = new Map<string, string>();
  for (const record of routeRecords) {
    if (!record.route_id || !record.route_short_name) continue;
    const key = record.route_short_name.trim().toLocaleUpperCase();
    const routeIds = routeIdsByShortName.get(key) ?? [];
    routeIds.push(record.route_id);
    routeIdsByShortName.set(key, routeIds);
    routeShortNameById.set(record.route_id, record.route_short_name.trim());
  }

  const trips: GtfsTrip[] = tripRecords.flatMap((record) => {
    if (!record.trip_id || !record.route_id || !record.service_id) return [];
    return [
      {
        tripId: record.trip_id,
        routeId: record.route_id,
        serviceId: record.service_id,
        shapeId: record.shape_id,
        headsign: record.trip_headsign,
      },
    ];
  });

  const shapeSequences = new Map<
    string,
    Array<{ position: [number, number]; sequence: number }>
  >();
  for (const record of shapeRecords) {
    const lat = Number.parseFloat(record.shape_pt_lat);
    const lng = Number.parseFloat(record.shape_pt_lon);
    if (!record.shape_id || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }
    const sequence = shapeSequences.get(record.shape_id) ?? [];
    sequence.push({
      position: [lat, lng],
      sequence: Number(record.shape_pt_sequence),
    });
    shapeSequences.set(record.shape_id, sequence);
  }

  const shapesById = new Map(
    Array.from(shapeSequences, ([shapeId, sequence]) => [
      shapeId,
      sequence
        .sort((a, b) => a.sequence - b.sequence)
        .map((item) => item.position),
    ]),
  );

  const calendarsByServiceId = new Map<string, GtfsCalendar>();
  for (const record of calendarRecords) {
    if (!record.service_id) continue;
    calendarsByServiceId.set(record.service_id, {
      startDate: record.start_date,
      endDate: record.end_date,
      weekdays: {
        sunday: record.sunday === "1",
        monday: record.monday === "1",
        tuesday: record.tuesday === "1",
        wednesday: record.wednesday === "1",
        thursday: record.thursday === "1",
        friday: record.friday === "1",
        saturday: record.saturday === "1",
      },
    });
  }

  const exceptionsByServiceId = new Map<string, Map<string, number>>();
  for (const record of calendarDateRecords) {
    if (!record.service_id || !record.date) continue;
    const exceptions = exceptionsByServiceId.get(record.service_id) ?? new Map();
    exceptions.set(record.date, Number(record.exception_type));
    exceptionsByServiceId.set(record.service_id, exceptions);
  }

  return {
    stops,
    stopsById,
    tripStopIds,
    routeIdsByShortName,
    routeShortNameById,
    trips,
    tripStopTimes,
    shapesById,
    calendarsByServiceId,
    exceptionsByServiceId,
  };
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase();
}

function normalizeRouteShortName(value: string): string {
  return value.trim().replace(/\s+LINE$/i, "").toLocaleUpperCase();
}

function getHonoluluServiceTime(now = new Date()): {
  dateKey: string;
  displayDate: string;
  weekday: string;
  seconds: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Honolulu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = parts.year ?? "";
  const month = parts.month ?? "";
  const day = parts.day ?? "";
  const hour = Number(parts.hour ?? 0);
  const minute = Number(parts.minute ?? 0);
  const second = Number(parts.second ?? 0);

  return {
    dateKey: `${year}${month}${day}`,
    displayDate: `${year}-${month}-${day}`,
    weekday: (parts.weekday ?? "").toLocaleLowerCase(),
    seconds: hour * 3600 + minute * 60 + second,
  };
}

function parseGtfsTimeSeconds(value: string): number | null {
  const [hours, minutes, seconds] = value.split(":").map(Number);
  if (![hours, minutes, seconds].every(Number.isFinite)) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatGtfsTime(value: string): string {
  const totalSeconds = parseGtfsTimeSeconds(value);
  if (totalSeconds == null) return value;
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function isServiceActive(
  index: GtfsIndex,
  serviceId: string,
  dateKey: string,
  weekday: string,
): boolean {
  const exception = index.exceptionsByServiceId.get(serviceId)?.get(dateKey);
  if (exception === 1) return true;
  if (exception === 2) return false;

  const calendar = index.calendarsByServiceId.get(serviceId);
  return Boolean(
    calendar &&
      dateKey >= calendar.startDate &&
      dateKey <= calendar.endDate &&
      calendar.weekdays[weekday],
  );
}

interface GtfsStopServiceSummary {
  lines: string[];
  arrivals: TheBusArrival[];
}

async function getGtfsIndex(): Promise<GtfsIndex> {
  gtfsIndexPromise ??= loadGtfsIndex().catch((error) => {
    gtfsIndexPromise = null;
    throw error;
  });
  return gtfsIndexPromise;
}

function buildStopServiceSummaries(
  index: GtfsIndex,
  stopIds: Set<string>,
  maxArrivalsPerStop = 24,
): Map<string, GtfsStopServiceSummary> {
  const serviceTime = getHonoluluServiceTime();
  const lineSets = new Map<string, Set<string>>();
  const arrivalsByStop = new Map<string, TheBusArrival[]>();

  for (const stopId of stopIds) {
    lineSets.set(stopId, new Set());
    arrivalsByStop.set(stopId, []);
  }

  for (const trip of index.trips) {
    if (
      !isServiceActive(
        index,
        trip.serviceId,
        serviceTime.dateKey,
        serviceTime.weekday,
      )
    ) {
      continue;
    }

    const routeName = index.routeShortNameById.get(trip.routeId);
    const stopTimes = index.tripStopTimes.get(trip.tripId);
    if (!routeName || !stopTimes) continue;
    const route = normalizeRouteShortName(routeName);

    for (const stopTime of stopTimes) {
      if (!stopIds.has(stopTime.stopId)) continue;
      lineSets.get(stopTime.stopId)?.add(route);

      const scheduledTime = stopTime.arrivalTime || stopTime.departureTime;
      const scheduledSeconds = parseGtfsTimeSeconds(scheduledTime);
      if (scheduledSeconds == null || scheduledSeconds < serviceTime.seconds) {
        continue;
      }

      arrivalsByStop.get(stopTime.stopId)?.push({
        id: `gtfs-${trip.tripId}-${stopTime.sequence}`,
        route,
        headsign: trip.headsign || `Route ${route}`,
        direction: trip.headsign,
        stopTime: formatGtfsTime(scheduledTime),
        estimated: false,
        canceled: false,
        minutesUntil: Math.max(
          0,
          Math.ceil((scheduledSeconds - serviceTime.seconds) / 60),
        ),
        vehicle: null,
        trip: trip.tripId,
        latitude: null,
        longitude: null,
        shape: trip.shapeId || null,
      });
    }
  }

  return new Map(
    [...stopIds].map((stopId) => {
      const arrivals = arrivalsByStop.get(stopId) ?? [];
      arrivals.sort(
        (first, second) =>
          (first.minutesUntil ?? Number.POSITIVE_INFINITY) -
          (second.minutesUntil ?? Number.POSITIVE_INFINITY),
      );
      const lines = [...(lineSets.get(stopId) ?? [])].sort((first, second) =>
        first.localeCompare(second, undefined, { numeric: true }),
      );
      return [
        stopId,
        { lines, arrivals: arrivals.slice(0, maxArrivalsPerStop) },
      ];
    }),
  );
}

export async function getGtfsStop(
  stopId: string,
): Promise<StopLocation | null> {
  const index = await getGtfsIndex();
  const stop = index.stopsById.get(stopId);
  if (!stop) return null;
  return {
    id: stop.id,
    name: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    kind: stop.kind,
  };
}

export async function getGtfsStopSchedule(
  stopId: string,
): Promise<GtfsStopServiceSummary | null> {
  const index = await getGtfsIndex();
  const stop = index.stopsById.get(stopId);
  if (!stop) return null;
  return buildStopServiceSummaries(index, new Set([stop.id])).get(stop.id) ?? null;
}

export async function getGtfsDailyStopSchedule(
  stopId: string,
  routeFilter?: string,
  day: ScheduleDay = "today",
): Promise<{
  stop: StopLocation;
  serviceDate: string;
  routes: string[];
  departures: DailyScheduleDeparture[];
} | null> {
  const index = await getGtfsIndex();
  const stop = index.stopsById.get(stopId);
  if (!stop) return null;

  const serviceDate = day === "tomorrow"
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : new Date();
  const serviceTime = getHonoluluServiceTime(serviceDate);
  const normalizedFilter = routeFilter
    ? normalizeRouteShortName(routeFilter)
    : null;
  const routeSet = new Set<string>();
  const departures: Array<DailyScheduleDeparture & { seconds: number }> = [];

  for (const trip of index.trips) {
    if (
      !isServiceActive(
        index,
        trip.serviceId,
        serviceTime.dateKey,
        serviceTime.weekday,
      )
    ) {
      continue;
    }

    const routeName = index.routeShortNameById.get(trip.routeId);
    const stopTimes = index.tripStopTimes.get(trip.tripId);
    if (!routeName || !stopTimes) continue;
    const route = normalizeRouteShortName(routeName);
    const stopTime = stopTimes.find((item) => item.stopId === stop.id);
    if (!stopTime) continue;

    routeSet.add(route);
    if (normalizedFilter && route !== normalizedFilter) continue;

    const scheduledTime = stopTime.departureTime || stopTime.arrivalTime;
    const seconds = parseGtfsTimeSeconds(scheduledTime);
    if (seconds == null) continue;
    departures.push({
      id: `${trip.tripId}-${stopTime.sequence}`,
      route,
      headsign: trip.headsign || `Route ${route}`,
      time: formatGtfsTime(scheduledTime),
      tripId: trip.tripId,
      seconds,
    });
  }

  departures.sort((first, second) => first.seconds - second.seconds);
  const routes = [...routeSet].sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true }),
  );

  return {
    stop: {
      id: stop.id,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      kind: stop.kind,
    },
    serviceDate: serviceTime.displayDate,
    routes,
    departures: departures.map((departure) => ({
      id: departure.id,
      route: departure.route,
      headsign: departure.headsign,
      time: departure.time,
      tripId: departure.tripId,
    })),
  };
}

export async function getGtfsNearbyStops({
  lat,
  lng,
  limit = 10,
}: {
  lat: number;
  lng: number;
  limit?: number;
}): Promise<NearbyStopResult[]> {
  const index = await getGtfsIndex();
  const nearestStops = index.stops
    .map((stop) => {
      const distanceMeters = haversineMeters(lat, lng, stop.lat, stop.lng);
      return {
        stop,
        distanceMeters,
        walkMinutes: walkMinutesFromMeters(distanceMeters),
      };
    })
    .sort((first, second) => first.distanceMeters - second.distanceMeters)
    .slice(0, limit);
  const summaries = buildStopServiceSummaries(
    index,
    new Set(nearestStops.map(({ stop }) => stop.id)),
  );
  const updatedAt = new Date().toISOString();

  return nearestStops.map(({ stop, distanceMeters, walkMinutes }) => {
    const summary = summaries.get(stop.id) ?? { lines: [], arrivals: [] };
    return {
      stop: {
        id: stop.id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        kind: stop.kind,
      },
      distanceMeters,
      walkMinutes,
      lines: summary.lines,
      arrivals: summary.arrivals,
      nextArrival: summary.arrivals[0],
      dataUpdatedAt: updatedAt,
    };
  });
}

export async function getGtfsStops(): Promise<StopLocation[]> {
  const index = await getGtfsIndex();
  return index.stops.map(({ id, name, lat, lng, kind }) => ({
    id,
    name,
    lat,
    lng,
    kind,
  }));
}

export async function getGtfsRouteSchedule({
  route,
  destination,
}: {
  route: string;
  destination: string;
}): Promise<{
  route: string;
  name: string;
  headsign: string;
  origin: string;
  destination: string;
  serviceDate: string;
  tripId: string;
  path: Array<[number, number]>;
  stops: Array<StopLocation & { sequence: number; scheduledTime: string }>;
} | null> {
  const index = await getGtfsIndex();
  const routeKey = route.trim().toLocaleUpperCase();
  const routeIds = new Set(index.routeIdsByShortName.get(routeKey) ?? []);
  if (routeIds.size === 0) return null;

  const serviceTime = getHonoluluServiceTime();
  const destinationKey = normalizeSearch(destination);
  const candidates = index.trips.flatMap((trip) => {
    if (
      !routeIds.has(trip.routeId) ||
      !normalizeSearch(trip.headsign).includes(destinationKey) ||
      !isServiceActive(
        index,
        trip.serviceId,
        serviceTime.dateKey,
        serviceTime.weekday,
      )
    ) {
      return [];
    }

    const stopTimes = index.tripStopTimes.get(trip.tripId);
    const firstTime = stopTimes?.[0]?.departureTime || stopTimes?.[0]?.arrivalTime;
    const firstSeconds = firstTime ? parseGtfsTimeSeconds(firstTime) : null;
    if (!stopTimes?.length || firstSeconds == null) return [];
    return [{ trip, stopTimes, firstSeconds }];
  });

  if (candidates.length === 0) return null;
  const futureCandidates = candidates
    .filter((candidate) => candidate.firstSeconds >= serviceTime.seconds)
    .sort((a, b) => a.firstSeconds - b.firstSeconds);
  const selected =
    futureCandidates[0] ??
    candidates.sort((a, b) => b.firstSeconds - a.firstSeconds)[0];

  const stops = selected.stopTimes.flatMap((stopTime) => {
    const stop = index.stopsById.get(stopTime.stopId);
    if (!stop) return [];
    return [
      {
        id: stop.id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        kind: stop.kind,
        sequence: stopTime.sequence,
        scheduledTime: formatGtfsTime(
          stopTime.arrivalTime || stopTime.departureTime,
        ),
      },
    ];
  });
  if (stops.length < 2) return null;

  const path = index.shapesById.get(selected.trip.shapeId) ??
    stops.map((stop): [number, number] => [stop.lat, stop.lng]);

  return {
    route: routeKey,
    name: `${routeKey} - Hawaiʻi Kai`,
    headsign: selected.trip.headsign,
    origin: stops[0].name,
    destination: stops.at(-1)?.name ?? selected.trip.headsign,
    serviceDate: serviceTime.displayDate,
    tripId: selected.trip.tripId,
    path,
    stops,
  };
}

function distanceSquared(
  point: VehicleLocation,
  stop: Pick<StopLocation, "lat" | "lng">,
): number {
  const lat = point.lat - stop.lat;
  const lng = point.lng - stop.lng;
  return lat * lat + lng * lng;
}

export async function getGtfsTrackingRoute({
  tripId,
  destinationStopId,
  vehicleLocation,
}: {
  tripId: string;
  destinationStopId: string;
  vehicleLocation: VehicleLocation;
}): Promise<{ routeStops: TrackingRouteStop[]; stopsAway: number } | null> {
  const index = await getGtfsIndex();
  const stopIds = index.tripStopIds.get(tripId);
  if (!stopIds) return null;

  const destinationIndex = stopIds.findIndex((stopId) => stopId === destinationStopId);
  if (destinationIndex < 0) return null;

  let currentIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let stopIndex = 0; stopIndex <= destinationIndex; stopIndex += 1) {
    const stop = index.stopsById.get(stopIds[stopIndex]);
    if (!stop) continue;
    const distance = distanceSquared(vehicleLocation, stop);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      currentIndex = stopIndex;
    }
  }

  const firstUpcomingIndex =
    currentIndex === destinationIndex ? destinationIndex : currentIndex + 1;
  const upcomingStopIds = stopIds.slice(firstUpcomingIndex);
  const routeStops = upcomingStopIds.flatMap(
    (stopId, offset): TrackingRouteStop[] => {
      const stop = index.stopsById.get(stopId);
      if (!stop) return [];
      const sequence = firstUpcomingIndex + offset;
      return [
        {
          id: stop.id,
          name: stop.name,
          lat: stop.lat,
          lng: stop.lng,
          kind: stop.kind,
          markerKind:
            sequence === destinationIndex ? "destination" : "intermediate",
          sequence,
        },
      ];
    },
  );

  return {
    routeStops,
    stopsAway: Math.max(0, destinationIndex - currentIndex),
  };
}
