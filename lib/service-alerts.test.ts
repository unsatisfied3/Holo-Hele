import { describe, expect, test } from "bun:test";

import {
  alertAffectsBusAtStop,
  alertAffectsRoute,
  getAlertNotificationCopy,
  getAlertPresentationTone,
  getCompactStopAlertLabel,
  getStopAlertLabel,
  shouldNotifyForAlert,
} from "@/lib/service-alerts";
import {
  getFavoriteStopDisruptionPreview,
  getServiceAlertForBus,
  getServiceAlertForStop,
  getStopDemoAlertScenario,
  parseDemoAlertScenario,
} from "@/lib/mock/service-alerts";
import type { TransitAlert } from "@/types/transit";

function alert(overrides: Partial<TransitAlert> = {}): TransitAlert {
  return {
    id: "alert-1",
    title: "Detour",
    description: "Service is detoured.",
    affectedRoutes: ["1L"],
    affectedStops: [],
    systemWide: false,
    type: "detour",
    severity: "warning",
    source: "thebus-live",
    isLive: true,
    ...overrides,
  };
}

describe("exact service alert matching", () => {
  test("provides the Route 1L skipped-stop demo only at Stop 437", () => {
    const stop437Alert = getServiceAlertForStop("437");
    expect(stop437Alert?.id).toBe("preview-stop-437-closure");
    expect(stop437Alert?.type).toBe("stop-skipped");
    expect(stop437Alert?.affectedRoutes).toEqual(["1L"]);
    expect(getServiceAlertForStop("1280")).toBeUndefined();
  });

  test("uses presentation-ready disruption copy without demo markers", () => {
    expect(getServiceAlertForBus("1l-437")?.title).toBe("DETOUR IN EFFECT");
    expect(getFavoriteStopDisruptionPreview("1712")?.description).not.toMatch(
      /demo|portfolio/i,
    );
    expect(getFavoriteStopDisruptionPreview("1016")?.description).not.toMatch(
      /demo|portfolio/i,
    );
  });

  test("colors service closures by meaning even under other source categories", () => {
    expect(
      getAlertPresentationTone(
        alert({
          title: "Line 1L is temporarily skipping this stop.",
          description: "Line 1L is temporarily not serving Stop 437.",
          type: "stop-skipped",
          affectedRoutes: ["1L"],
          affectedStops: ["437"],
        }),
      ),
    ).toBe("closure");
    expect(
      getAlertPresentationTone(
        alert({
          title: "Weather",
          description: "No Westbound service on Pali Highway.",
          type: "other",
        }),
      ),
    ).toBe("closure");
    expect(
      getAlertPresentationTone(
        alert({
          title: "Downed Utility Wires and Trees",
          description: "Service is suspended in both directions.",
          type: "other",
        }),
      ),
    ).toBe("closure");
  });

  test("keeps reroutes yellow and neutral notices in the default treatment", () => {
    expect(getAlertPresentationTone(alert())).toBe("detour");
    expect(
      getAlertPresentationTone(
        alert({
          title: "Weather advisory",
          description: "Allow extra travel time.",
          type: "other",
        }),
      ),
    ).toBe("default");
  });

  test("favorite 1L matches alert 1L", () => {
    expect(alertAffectsRoute(alert(), "1L")).toBe(true);
    expect(
      shouldNotifyForAlert({
        alert: alert(),
        favoriteRoutes: ["1L"],
        notificationsEnabled: true,
        notifiedAlertIds: [],
      }),
    ).toBe(true);
  });

  test("favorite 1L does not match route 1 or unrelated routes", () => {
    expect(alertAffectsRoute(alert({ affectedRoutes: ["1"] }), "1L")).toBe(false);
    expect(
      shouldNotifyForAlert({
        alert: alert({ affectedRoutes: ["A"] }),
        favoriteRoutes: ["1L"],
        notificationsEnabled: true,
        notifiedAlertIds: [],
      }),
    ).toBe(false);
  });

  test("bus alert matching requires the route to be affected at the current stop", () => {
    const routeCClosureElsewhere = alert({
      type: "stop-closure",
      affectedRoutes: ["C"],
      affectedStops: ["848"],
    });
    const routeCClosureHere = alert({
      type: "stop-closure",
      affectedRoutes: ["C"],
      affectedStops: ["437"],
    });

    expect(alertAffectsBusAtStop(routeCClosureElsewhere, "C", "437")).toBe(false);
    expect(alertAffectsBusAtStop(routeCClosureHere, "C", "437")).toBe(true);
    expect(alertAffectsBusAtStop(routeCClosureHere, "A", "437")).toBe(false);
  });

  test("a whole-stop closure affects every bus at that stop", () => {
    const wholeStopClosure = alert({
      type: "stop-closure",
      affectedRoutes: [],
      affectedStops: ["437"],
    });

    expect(alertAffectsBusAtStop(wholeStopClosure, "C", "437")).toBe(true);
    expect(alertAffectsBusAtStop(wholeStopClosure, "C", "848")).toBe(false);
  });

  test("a skipped-stop alert affects only its named route at that stop", () => {
    const route1LSkippedStop = alert({
      type: "stop-skipped",
      affectedRoutes: ["1L"],
      affectedStops: ["437"],
    });

    expect(alertAffectsBusAtStop(route1LSkippedStop, "1L", "437")).toBe(true);
    expect(alertAffectsBusAtStop(route1LSkippedStop, "C", "437")).toBe(false);
    expect(alertAffectsBusAtStop(route1LSkippedStop, "1L", "848")).toBe(false);
    expect(getAlertNotificationCopy(route1LSkippedStop)).toEqual({
      title: "Line 1L skipping Stop 437",
      body: "Line 1L is temporarily not serving this stop. Other lines may continue normally.",
    });
  });

  test("stop closure copy distinguishes whole-stop and route-specific closures", () => {
    expect(
      getStopAlertLabel(
        alert({
          type: "stop-closure",
          affectedRoutes: [],
          affectedStops: ["437"],
        }),
        "437",
      ),
    ).toBe("Entire stop temporarily closed");
    expect(
      getStopAlertLabel(
        alert({
          type: "stop-closure",
          affectedRoutes: ["1L", "C"],
          affectedStops: ["437"],
        }),
        "437",
      ),
    ).toBe("Lines 1L and C are temporarily skipping this stop.");
    expect(
      getStopAlertLabel(
        alert({
          type: "stop-skipped",
          affectedRoutes: ["1L"],
          affectedStops: ["437"],
        }),
        "437",
      ),
    ).toBe("Line 1L is temporarily skipping this stop.");
  });

  test("uses compact impact labels in favorite stops", () => {
    expect(
      getCompactStopAlertLabel(
        alert({
          type: "stop-skipped",
          affectedRoutes: ["1L"],
          affectedStops: ["437"],
        }),
        "437",
      ),
    ).toBe("STOP SKIPPED · 1L");
    expect(
      getCompactStopAlertLabel(
        alert({
          type: "stop-closure",
          affectedRoutes: ["3", "7"],
          affectedStops: ["1016"],
        }),
        "1016",
      ),
    ).toBe("STOP SKIPPED · 3, 7");

    const weatherPreview = getFavoriteStopDisruptionPreview("1712");
    expect(getCompactStopAlertLabel(weatherPreview!, "1712")).toBe(
      "WEATHER DISRUPTION · 65",
    );
  });

  test("keeps saved disruption-stop fallbacks clearly separated as demos", () => {
    const weatherPreview = getFavoriteStopDisruptionPreview("1712");
    const closurePreview = getFavoriteStopDisruptionPreview("1016");

    expect(weatherPreview?.source).toBe("holohele-demo");
    expect(weatherPreview?.affectedRoutes).toEqual(["65"]);
    expect(getStopAlertLabel(weatherPreview!, "1712")).toBe(
      "Weather is affecting Line 65 service near this stop.",
    );
    expect(closurePreview?.source).toBe("holohele-demo");
    expect(closurePreview?.type).toBe("stop-closure");
    expect(getFavoriteStopDisruptionPreview("1280")).toBeUndefined();
  });

  test("maps saved stop demos to their specific alert-detail scenarios", () => {
    expect(getStopDemoAlertScenario("1712")).toBe("stop-1712");
    expect(getStopDemoAlertScenario("1016")).toBe("stop-1016");
    expect(parseDemoAlertScenario("stop-1712")).toBe("stop-1712");
    expect(parseDemoAlertScenario("stop-1016")).toBe("stop-1016");
    expect(parseDemoAlertScenario("unknown-stop")).toBeUndefined();
  });

  test("does not notify when disabled or already notified", () => {
    expect(
      shouldNotifyForAlert({
        alert: alert(),
        favoriteRoutes: ["1L"],
        notificationsEnabled: false,
        notifiedAlertIds: [],
      }),
    ).toBe(false);
    expect(
      shouldNotifyForAlert({
        alert: alert(),
        favoriteRoutes: ["1L"],
        notificationsEnabled: true,
        notifiedAlertIds: ["alert-1"],
      }),
    ).toBe(false);
  });

  test("notifies for a system-wide alert", () => {
    expect(
      shouldNotifyForAlert({
        alert: alert({ systemWide: true, affectedRoutes: [] }),
        favoriteRoutes: [],
        notificationsEnabled: true,
        notifiedAlertIds: [],
      }),
    ).toBe(true);
  });
});
