import { describe, expect, test } from "bun:test";

import {
  alertAffectsRoute,
  shouldNotifyForAlert,
} from "@/lib/service-alerts";
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
