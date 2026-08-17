import { describe, expect, test } from "bun:test";

import {
  browserPermissionStatus,
  getNotificationPermission,
  sendLocalNotification,
} from "@/lib/notifications";

describe("notification environment fallbacks", () => {
  test("reports unsupported when the browser Notification API is missing", () => {
    expect(browserPermissionStatus(undefined)).toBe("unsupported");
  });

  test("preserves denied permission and maps browser default to prompt", () => {
    expect(browserPermissionStatus({ permission: "denied" })).toBe("denied");
    expect(browserPermissionStatus({ permission: "default" })).toBe("prompt");
  });

  test("fails gracefully when no browser notification backend exists", async () => {
    expect(
      await sendLocalNotification({ title: "Test", body: "Test body" }),
    ).toEqual({
      status: "unsupported",
      message: "Notifications are unavailable here.",
    });
  });

  test("fails gracefully when a Tauri notification runtime is unavailable", async () => {
    const scope = globalThis as unknown as Record<string, unknown>;
    const previousWindow = scope.window;
    const previousIsTauri = scope.isTauri;

    scope.window = {};
    scope.isTauri = true;
    try {
      expect(await getNotificationPermission()).toBe("unsupported");
    } finally {
      if (previousWindow != null) scope.window = previousWindow;
      else delete scope.window;
      if (previousIsTauri == null) delete scope.isTauri;
      else scope.isTauri = previousIsTauri;
    }
  });
});
