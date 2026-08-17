import { describe, expect, test } from "bun:test";

import {
  createServiceAlertService,
  parseServiceDisruptionLines,
} from "@/server/service-alerts";

describe("TheBus service disruption parser", () => {
  test("parses single, multiple, and alphanumeric routes exactly", () => {
    const [alert] = parseServiceDisruptionLines([
      "August 15, 2026 03:00pm - BUS STOP CLOSURE - KAPIOLANI BOULEVARD",
      "Route(s) 1, 1L, A, 40, 88A, W LINE.",
      "No service at Kapiolani Boulevard (stop #437) until further notice.",
    ]);

    expect(alert.affectedRoutes).toEqual(["1", "1L", "A", "40", "88A", "W"]);
    expect(alert.affectedStops).toEqual(["437"]);
    expect(alert.type).toBe("stop-closure");
    expect(alert.id).toMatch(/^thebus-/);
  });

  test("extracts affected stops but not suggested alternative stops", () => {
    const [alert] = parseServiceDisruptionLines([
      "July 27, 2026 04:00am - Road Work",
      "Route(s) 5, 6.",
      "No Eastbound service at Mahukona/Kapiolani (Bus Stop #848). Passengers may board buses at Bus Stop #760 or stop #849.",
    ]);

    expect(alert.affectedStops).toEqual(["848"]);
    expect(alert.type).toBe("roadwork");
  });

  test("keeps a valid missing-route entry and recognizes a system-wide alert", () => {
    const [alert] = parseServiceDisruptionLines([
      "August 16, 2026 - System-wide service disruption",
      "All routes are temporarily suspended while conditions are assessed.",
    ]);

    expect(alert.affectedRoutes).toEqual([]);
    expect(alert.systemWide).toBe(true);
    expect(alert.severity).toBe("critical");
  });

  test("skips a malformed entry without a description", () => {
    expect(
      parseServiceDisruptionLines([
        "August 16, 2026 - Missing description",
        "Route(s) 1.",
      ]),
    ).toEqual([]);
  });

  test("creates the same stable ID for the same entry", () => {
    const lines = [
      "August 16, 2026 - Detour",
      "Route(s) 1L.",
      "Route 1L is detoured near downtown.",
    ];
    expect(parseServiceDisruptionLines(lines)[0].id).toBe(
      parseServiceDisruptionLines(lines)[0].id,
    );
  });
});

describe("service alert fetch and cache", () => {
  const alertHtml = `
    <h1>Service Disruption</h1>
    <p>August 16, 2026 - Detour</p>
    <p>Route(s) 1L.</p>
    <p>Route 1L is detoured near downtown.</p>
  `;

  test("uses the five-minute cache instead of refetching", async () => {
    let calls = 0;
    const service = createServiceAlertService({
      fetcher: async () => {
        calls += 1;
        return new Response(alertHtml);
      },
      now: () => 1_000,
    });

    expect((await service()).status).toBe("live");
    expect((await service()).cached).toBe(true);
    expect(calls).toBe(1);
  });

  test("returns last-known-good alerts when refresh fails", async () => {
    let timestamp = 1_000;
    let fail = false;
    const service = createServiceAlertService({
      fetcher: async () => {
        if (fail) throw new Error("offline");
        return new Response(alertHtml);
      },
      now: () => timestamp,
      cacheMs: 100,
    });

    const initial = await service();
    fail = true;
    timestamp += 101;
    const stale = await service();
    expect(stale.status).toBe("stale");
    expect(stale.alerts).toEqual(initial.alerts);
  });

  test("fails independently when TheBus or the parser is unavailable", async () => {
    const unavailable = createServiceAlertService({
      fetcher: async () => {
        throw new Error("offline");
      },
      now: () => 1_000,
    });
    const changedMarkup = createServiceAlertService({
      fetcher: async () => new Response("<html>Unexpected page</html>"),
      now: () => 1_000,
    });

    expect((await unavailable()).status).toBe("unavailable");
    expect((await changedMarkup()).status).toBe("unavailable");
  });
});
