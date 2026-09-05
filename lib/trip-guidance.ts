import { haversineMeters } from "@/lib/thebus/stops";
import type { JourneyCoordinate, JourneyStop } from "@/types/transit";

export const BOARDING_STOP_REACHED_METERS = 70;
export const BOARDING_STOP_APPROACHING_METERS = 250;
export const DESTINATION_REACHED_METERS = 70;
export const AUTOMATIC_BOARDING_MAX_ACCURACY_METERS = 100;
export const AUTOMATIC_BOARDING_MAX_VEHICLE_DISTANCE_METERS = 110;
export const AUTOMATIC_BOARDING_MIN_DEPARTURE_METERS = 70;
export const AUTOMATIC_BOARDING_MIN_SPEED_METERS_PER_SECOND = 1.8;
export const AUTOMATIC_ALIGHTING_REACHED_METERS = 90;

export type BoardingProximity =
  | "unknown"
  | "away"
  | "approaching"
  | "at-stop";

export function distanceBetweenCoordinates(
  first: JourneyCoordinate,
  second: JourneyCoordinate,
): number {
  return haversineMeters(first[0], first[1], second[0], second[1]);
}

export function boardingProximity(
  riderLocation: JourneyCoordinate | undefined,
  boardingStop: JourneyCoordinate,
): { state: BoardingProximity; distanceMeters?: number } {
  if (!riderLocation) return { state: "unknown" };

  const distanceMeters = distanceBetweenCoordinates(
    riderLocation,
    boardingStop,
  );
  if (distanceMeters <= BOARDING_STOP_REACHED_METERS) {
    return { state: "at-stop", distanceMeters };
  }
  if (distanceMeters <= BOARDING_STOP_APPROACHING_METERS) {
    return { state: "approaching", distanceMeters };
  }
  return { state: "away", distanceMeters };
}

export function nearestStopIndex(
  stops: JourneyStop[],
  location: JourneyCoordinate | undefined,
  minimumIndex = 0,
): number {
  if (!location || stops.length === 0) return Math.max(0, minimumIndex);

  let nearestIndex = Math.min(Math.max(0, minimumIndex), stops.length - 1);
  let nearestDistance = Number.POSITIVE_INFINITY;
  stops.forEach((stop, index) => {
    if (index < minimumIndex) return;
    const distance = distanceBetweenCoordinates(location, stop.coordinate);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

export function nextStopProgressIndex(
  stops: JourneyStop[],
  location: JourneyCoordinate | undefined,
  currentIndex: number,
): number {
  const candidate = nearestStopIndex(stops, location, currentIndex);
  return Math.max(currentIndex, Math.min(currentIndex + 1, candidate));
}

export function stopsRemaining(stops: JourneyStop[], currentIndex: number) {
  if (stops.length < 2) return 0;
  return Math.max(0, stops.length - 1 - currentIndex);
}

interface AutomaticBoardingInput {
  riderLocation: JourneyCoordinate | undefined;
  vehicleLocation: JourneyCoordinate | undefined;
  boardingStop: JourneyCoordinate;
  riderAccuracyMeters?: number;
  riderSpeedMetersPerSecond?: number;
}

/**
 * Uses several independent signals so a nearby bus or a single noisy GPS
 * reading cannot advance the rider into the onboard stage by itself.
 */
export function hasLikelyBoardedBus({
  riderLocation,
  vehicleLocation,
  boardingStop,
  riderAccuracyMeters,
  riderSpeedMetersPerSecond,
}: AutomaticBoardingInput): boolean {
  if (!riderLocation || !vehicleLocation) return false;
  if (
    riderAccuracyMeters != null &&
    riderAccuracyMeters > AUTOMATIC_BOARDING_MAX_ACCURACY_METERS
  ) {
    return false;
  }
  if (
    riderSpeedMetersPerSecond != null &&
    riderSpeedMetersPerSecond < AUTOMATIC_BOARDING_MIN_SPEED_METERS_PER_SECOND
  ) {
    return false;
  }

  const riderToVehicle = distanceBetweenCoordinates(
    riderLocation,
    vehicleLocation,
  );
  const riderFromBoardingStop = distanceBetweenCoordinates(
    riderLocation,
    boardingStop,
  );
  const vehicleFromBoardingStop = distanceBetweenCoordinates(
    vehicleLocation,
    boardingStop,
  );

  return (
    riderToVehicle <= AUTOMATIC_BOARDING_MAX_VEHICLE_DISTANCE_METERS &&
    riderFromBoardingStop >= AUTOMATIC_BOARDING_MIN_DEPARTURE_METERS &&
    vehicleFromBoardingStop >= AUTOMATIC_BOARDING_MIN_DEPARTURE_METERS
  );
}

export function hasReachedAlightingStop(
  location: JourneyCoordinate | undefined,
  alightingStop: JourneyCoordinate,
  currentStopIndex: number,
  finalStopIndex: number,
): boolean {
  if (!location || currentStopIndex < finalStopIndex) return false;
  return (
    distanceBetweenCoordinates(location, alightingStop) <=
    AUTOMATIC_ALIGHTING_REACHED_METERS
  );
}

export function getOffAlertCopy(
  remainingStops: number,
  alightStopName: string,
): string {
  if (remainingStops <= 0) return `This is your stop · ${alightStopName}`;
  if (remainingStops === 1) return `Get off at the next stop · ${alightStopName}`;
  if (remainingStops === 2) return `Get ready · 2 stops to ${alightStopName}`;
  return `${remainingStops} stops to ${alightStopName}`;
}

export function roundedWalkingDistance(distanceMeters: number) {
  if (distanceMeters < 100) return Math.max(10, Math.round(distanceMeters / 10) * 10);
  return Math.round(distanceMeters / 25) * 25;
}
