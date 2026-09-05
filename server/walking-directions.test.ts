import { describe, expect, test } from "bun:test";

import {
  decodePolyline6,
  getWalkingDirections,
  parseValhallaRoute,
  walkingManeuverFromValhalla,
} from "@/server/walking-directions";

describe("walking directions", () => {
  test("decodes Valhalla polyline6 geometry", () => {
    expect(decodePolyline6("??AA")).toEqual([
      [0, 0],
      [0.000001, 0.000001],
    ]);
  });

  test("maps Valhalla maneuver types to Holo Hele icons", () => {
    expect(walkingManeuverFromValhalla(1)).toBe("start");
    expect(walkingManeuverFromValhalla(9)).toBe("slight-right");
    expect(walkingManeuverFromValhalla(10)).toBe("right");
    expect(walkingManeuverFromValhalla(15)).toBe("left");
    expect(walkingManeuverFromValhalla(16)).toBe("slight-left");
    expect(walkingManeuverFromValhalla(4)).toBe("destination");
  });

  test("parses routed steps without repeating the timeline destination", () => {
    const route = parseValhallaRoute(
      {
        trip: {
          legs: [{
            shape: "??AA",
            summary: { length: 0.42, time: 300 },
            maneuvers: [
              { type: 1, instruction: "Walk north on Bishop Street." },
              { type: 10, instruction: "Turn right onto Hotel Street." },
              { type: 6, instruction: "Your destination is on the left." },
            ],
          }],
        },
      },
    );

    expect(route).toMatchObject({
      distance: "420 m",
      durationMinutes: 5,
      steps: [
        { maneuver: "start", instruction: "Walk north on Bishop Street." },
        { maneuver: "right", instruction: "Turn right onto Hotel Street." },
      ],
    });
  });

  test("falls back to approximate legs when routing requests fail", async () => {
    const result = await getWalkingDirections(
      {
        origin: [0, 0],
        board: [0.001, 0.001],
        alight: [0.002, 0.002],
        destination: [0.003, 0.003],
      },
      async () => {
        throw new Error("routing unavailable");
      },
    );

    expect(result).toEqual({
      dataSource: "approximate",
      error:
        "Some walking directions are approximate because pedestrian routing is temporarily unavailable.",
    });
  });
});
