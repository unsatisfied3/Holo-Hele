import { isTauri } from "@tauri-apps/api/core";

import { getAlertNotificationCopy } from "@/lib/service-alerts";
import type { TransitAlert } from "@/types/transit";

const SERVICE_NOTIFICATIONS_KEY = "holo-hele-service-notifications";
const NOTIFIED_ALERT_IDS_KEY = "holo-hele-notified-alert-ids";
const ALERT_BASELINE_KEY = "holo-hele-alert-baseline-ready";
export const SERVICE_NOTIFICATIONS_CHANGED_EVENT =
  "holo-hele-service-notifications-changed";
const MAX_NOTIFIED_ALERT_IDS = 100;

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported";

export type NotificationDeliveryResult =
  | { status: "sent" }
  | { status: "denied" | "unsupported" | "error"; message: string };

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function getServiceNotificationsEnabled(): boolean {
  return hasWindow() && window.localStorage.getItem(SERVICE_NOTIFICATIONS_KEY) === "true";
}

export function setServiceNotificationsEnabled(enabled: boolean): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(SERVICE_NOTIFICATIONS_KEY, String(enabled));
  window.dispatchEvent(new Event(SERVICE_NOTIFICATIONS_CHANGED_EVENT));
}

export function getNotifiedAlertIds(): string[] {
  if (!hasWindow()) return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(NOTIFIED_ALERT_IDS_KEY) ?? "[]",
    ) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function markAlertNotified(alertId: string): boolean {
  if (!hasWindow()) return false;
  const ids = getNotifiedAlertIds();
  if (ids.includes(alertId)) return false;
  window.localStorage.setItem(
    NOTIFIED_ALERT_IDS_KEY,
    JSON.stringify([...ids, alertId].slice(-MAX_NOTIFIED_ALERT_IDS)),
  );
  return true;
}

export function isAlertBaselineReady(): boolean {
  return hasWindow() && window.localStorage.getItem(ALERT_BASELINE_KEY) === "true";
}

export function establishAlertBaseline(alertIds: string[]): void {
  if (!hasWindow()) return;
  const ids = [...new Set([...getNotifiedAlertIds(), ...alertIds])].slice(
    -MAX_NOTIFIED_ALERT_IDS,
  );
  window.localStorage.setItem(NOTIFIED_ALERT_IDS_KEY, JSON.stringify(ids));
  window.localStorage.setItem(ALERT_BASELINE_KEY, "true");
}

export function browserPermissionStatus(
  notificationApi: Pick<typeof Notification, "permission"> | undefined,
): NotificationPermissionStatus {
  if (!notificationApi) return "unsupported";
  return notificationApi.permission === "default"
    ? "prompt"
    : notificationApi.permission;
}

export async function getNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!hasWindow()) return "unsupported";

  if (isTauri()) {
    try {
      const { isPermissionGranted } = await import(
        "@tauri-apps/plugin-notification"
      );
      return (await isPermissionGranted()) ? "granted" : "prompt";
    } catch {
      return "unsupported";
    }
  }

  return browserPermissionStatus(window.Notification);
}

export async function requestServiceNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!hasWindow()) return "unsupported";

  if (isTauri()) {
    try {
      const { isPermissionGranted, requestPermission } = await import(
        "@tauri-apps/plugin-notification"
      );
      if (await isPermissionGranted()) return "granted";
      const permission = await requestPermission();
      return permission === "default" ? "prompt" : permission;
    } catch {
      return "unsupported";
    }
  }

  if (!("Notification" in window)) return "unsupported";
  if (window.Notification.permission === "granted") return "granted";
  if (window.Notification.permission === "denied") return "denied";
  const permission = await window.Notification.requestPermission();
  return permission === "default" ? "prompt" : permission;
}

export async function sendLocalNotification({
  title,
  body,
}: {
  title: string;
  body: string;
}): Promise<NotificationDeliveryResult> {
  if (!hasWindow()) {
    return { status: "unsupported", message: "Notifications are unavailable here." };
  }

  if (isTauri()) {
    try {
      const { isPermissionGranted, sendNotification } = await import(
        "@tauri-apps/plugin-notification"
      );
      if (!(await isPermissionGranted())) {
        return {
          status: "denied",
          message: "Notification permission is not enabled for Holo Hele.",
        };
      }
      sendNotification({ title, body, autoCancel: true });
      return { status: "sent" };
    } catch {
      return {
        status: "error",
        message: "The device could not send this notification.",
      };
    }
  }

  if (!("Notification" in window)) {
    return {
      status: "unsupported",
      message: "This browser does not support system notifications.",
    };
  }
  if (window.Notification.permission !== "granted") {
    return {
      status: "denied",
      message: "Notification permission is not enabled for Holo Hele.",
    };
  }

  try {
    new window.Notification(title, { body });
    return { status: "sent" };
  } catch {
    return {
      status: "error",
      message: "The browser could not send this notification.",
    };
  }
}

export function sendServiceAlertNotification(
  alert: TransitAlert,
): Promise<NotificationDeliveryResult> {
  return sendLocalNotification(getAlertNotificationCopy(alert));
}
