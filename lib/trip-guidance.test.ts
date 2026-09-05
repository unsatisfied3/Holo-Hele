import { describe, expect, test } from "bun:test";

import {
  boardingProximity,
  getOffAlertCopy,
  hasLikelyBoardedBus,
  hasReachedAlightingStop,
  nearestStopIndex,
  nextStopProgressIndex,
  stopsRemaining,
} from "@/lib/trip-guidance";
import type { JourneyStop } from "@/types/transit";

const stops: JourneyStop[] = [
  {
    id: "1",
    name: "Boarding stop",
    detail: "",
    coordinate: [21.3, -157.85],
    time: "10:00 AM",
  },
  {
    id: "2",
    name: "Middle stop",
    detail: "",
    coordinate: [21.301, -157.851],
    time: "10:04 AM",
  },
  {
    id: "3",
    name: "Arrival stop",
    detail: "",
    coordinate: [21.302, -157.852],
    time: "10:08 AM",
  },
];

describe("trip guidance", () => {
  test("classifies boarding-stop proximity", () => {
    expect(boardingProximity(undefined, stops[0].coordinate).state).toBe(
      "unknown",
    );
    expect(
      boardingProximity([21.3003, -157.85], stops[0].coordinate).state,
    ).toBe("at-stop");
    expect(
      boardingProximity([21.3015, -157.85], stops[0].coordinate).state,
    ).toBe("approaching");
    expect(
      boardingProximity([21.31, -157.85], stops[0].coordinate).state,
    ).toBe("away");
  });

  test("advances stop progress monotonically", () => {
    expect(nearestStopIndex(stops, [21.3011, -157.8511])).toBe(1);
    expect(nearestStopIndex(stops, [21.3, -157.85], 1)).toBe(1);
    expect(nextStopProgressIndex(stops, stops[2].coordinate, 0)).toBe(1);
    expect(nextStopProgressIndex(stops, stops[2].coordinate, 1)).toBe(2);
    expect(stopsRemaining(stops, 1)).toBe(1);
    expect(stopsRemaining(stops, 2)).toBe(0);
  });

  test("uses actionable two-stop and destination alerts", () => {
    expect(getOffAlertCopy(2, "Ala Moana Center")).toBe(
      "Get ready · 2 stops to Ala Moana Center",
    );
    expect(getOffAlertCopy(1, "Ala Moana Center")).toBe(
      "Get off at the next stop · Ala Moana Center",
    );
    expect(getOffAlertCopy(0, "Ala Moana Center")).toBe(
      "This is your stop · Ala Moana Center",
    );
  });

  test("requires the rider and selected vehicle to leave the boarding stop together", () => {
    expect(
      hasLikelyBoardedBus({
        riderLocation: [21.301, -157.851],
        vehicleLocation: [21.30105, -157.85105],
        boardingStop: stops[0].coordinate,
        riderAccuracyMeters: 20,
        riderSpeedMetersPerSecond: 7,
      }),
    ).toBe(true);

    expect(
      hasLikelyBoardedBus({
        riderLocation: stops[0].coordinate,
        vehicleLocation: [21.30105, -157.85105],
        boardingStop: stops[0].coordinate,
        riderAccuracyMeters: 20,
        riderSpeedMetersPerSecond: 0,
      }),
    ).toBe(false);

    expect(
      hasLikelyBoardedBus({
        riderLocation: [21.301, -157.851],
        vehicleLocation: [21.30105, -157.85105],
        boardingStop: stops[0].coordinate,
        riderAccuracyMeters: 150,
        riderSpeedMetersPerSecond: 7,
      }),
    ).toBe(false);
  });

  test("reaches the alighting stage only at the final stop", () => {
    expect(
      hasReachedAlightingStop(stops[2].coordinate, stops[2].coordinate, 1, 2),
    ).toBe(false);
    expect(
      hasReachedAlightingStop(stops[2].coordinate, stops[2].coordinate, 2, 2),
    ).toBe(true);
  });
});
