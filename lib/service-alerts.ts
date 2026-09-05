import type { TransitAlert } from "@/types/transit";

export const SERVICE_ALERTS_QUERY_KEY = ["service-alerts"] as const;
export const SERVICE_ALERT_REFRESH_MS = 5 * 60 * 1000;

export type AlertPresentationTone = "closure" | "detour" | "default";

export function normalizeRouteId(route: string): string {
  return route.trim().toLocaleUpperCase().replace(/\s+LINE$/, "");
}

export function getAlertPresentationTone(
  alert: TransitAlert,
): AlertPresentationTone {
  const noticeText = `${alert.title} ${alert.description}`;

  if (alert.type === "stop-closure" || alert.type === "stop-skipped") {
    return "closure";
  }

  if (alert.type === "detour" || /\bdetour(?:ed)?\b|\brerout(?:e|ed|ing)\b/i.test(noticeText)) {
    return "detour";
  }

  const indicatesClosure =
    /\b(?:closed?|closure|suspended?)\b/i.test(noticeText) ||
    /\bno\s+(?:(?:east|west|north|south)bound\s+)?service\b/i.test(noticeText);

  return indicatesClosure ? "closure" : "default";
}

export function alertAffectsRoute(alert: TransitAlert, route: string): boolean {
  const normalizedRoute = normalizeRouteId(route);
  return alert.affectedRoutes.some(
    (affectedRoute) => normalizeRouteId(affectedRoute) === normalizedRoute,
  );
}

export function alertAffectsStop(alert: TransitAlert, stopId: string): boolean {
  const normalizedStop = stopId.trim();
  return alert.affectedStops.some((stop) => stop.trim() === normalizedStop);
}

export function alertAffectsBusAtStop(
  alert: TransitAlert,
  route: string,
  stopId: string,
): boolean {
  if (alert.systemWide || !alertAffectsStop(alert, stopId)) return false;

  const closesEntireStop =
    alert.type === "stop-closure" && alert.affectedRoutes.length === 0;
  return closesEntireStop || alertAffectsRoute(alert, route);
}

export function findAlertForRoute(
  alerts: TransitAlert[],
  route: string,
): TransitAlert | undefined {
  return alerts.find(
    (alert) => !alert.systemWide && alertAffectsRoute(alert, route),
  );
}

export function findAlertForBusAtStop(
  alerts: TransitAlert[],
  route: string,
  stopId: string,
): TransitAlert | undefined {
  return alerts.find((alert) => alertAffectsBusAtStop(alert, route, stopId));
}

export function findAlertForStop(
  alerts: TransitAlert[],
  stopId: string,
): TransitAlert | undefined {
  return alerts.find(
    (alert) => !alert.systemWide && alertAffectsStop(alert, stopId),
  );
}

export function getStopAlertLabel(
  alert: TransitAlert,
  stopId: string,
): string {
  if (!alertAffectsStop(alert, stopId)) {
    return alert.title;
  }

  const routes = [...new Set(alert.affectedRoutes.map(normalizeRouteId))];
  const isRouteSpecificSkippedStop =
    alert.type === "stop-skipped" ||
    (alert.type === "stop-closure" && routes.length > 0);

  if (isRouteSpecificSkippedStop) {
    if (routes.length === 1) {
      return `Bus ${routes[0]} is temporarily skipping this stop.`;
    }

    if (routes.length > 1) {
      const lastRoute = routes.at(-1);
      return `Buses ${routes.slice(0, -1).join(", ")} and ${lastRoute} are temporarily skipping this stop.`;
    }
  }

  return alert.type === "stop-closure"
    ? "Entire stop temporarily closed"
    : alert.title;
}

export function getAlertBannerHeading(alert: TransitAlert): string {
  const noticeText = `${alert.title} ${alert.description}`;

  if (/\bweather\b/i.test(noticeText)) return "Weather disruption";
  if (alert.type === "detour") return "Detour in effect";
  if (alert.type === "stop-skipped") return "Stop skipped";
  if (alert.type === "stop-closure") {
    return alert.affectedRoutes.length > 0 ? "Stop skipped" : "Stop closure";
  }
  if (alert.type === "service-disruption") return "Service disruption";
  if (alert.type === "service-change") return "Service change";
  if (alert.type === "roadwork") return "Roadwork";

  return alert.title;
}

export function getAlertBannerDescription(
  alert: TransitAlert,
  stopId?: string,
): string {
  if (
    stopId &&
    (alert.type === "stop-skipped" || alert.type === "stop-closure")
  ) {
    return getStopAlertLabel(alert, stopId);
  }

  return alert.description;
}

export function getCompactStopAlertLabel(
  alert: TransitAlert,
  stopId: string,
): string {
  if (!alertAffectsStop(alert, stopId)) return alert.title;

  const routes = [...new Set(alert.affectedRoutes.map(normalizeRouteId))];

  if (alert.type === "stop-skipped" || alert.type === "stop-closure") {
    const isFullStopClosure =
      alert.type === "stop-closure" && routes.length === 0;
    return routes.length > 0
      ? `STOP SKIPPED · ${routes.join(", ")}`
      : isFullStopClosure
        ? "STOP CLOSED"
        : alert.title;
  }

  const noticeText = `${alert.title} ${alert.description}`;
  if (/\bweather\b/i.test(noticeText) && routes.length > 0) {
    return `WEATHER DISRUPTION · ${routes.join(", ")}`;
  }

  return alert.title;
}

export function shouldNotifyForAlert({
  alert,
  favoriteRoutes,
  notificationsEnabled,
  notifiedAlertIds,
}: {
  alert: TransitAlert;
  favoriteRoutes: string[];
  notificationsEnabled: boolean;
  notifiedAlertIds: string[];
}): boolean {
  if (!notificationsEnabled || notifiedAlertIds.includes(alert.id)) return false;
  if (alert.systemWide) return true;
  return favoriteRoutes.some((route) => alertAffectsRoute(alert, route));
}

export function getAlertNotificationCopy(alert: TransitAlert): {
  title: string;
  body: string;
} {
  const route = alert.affectedRoutes[0];
  const stop = alert.affectedStops[0];

  if (alert.systemWide) {
    return {
      title: "TheBus service disruption",
      body: "Multiple routes are affected. Check Holo Hele before traveling.",
    };
  }

  const isRouteSpecificSkippedStop =
    alert.type === "stop-skipped" ||
    (alert.type === "stop-closure" && route != null);

  if (isRouteSpecificSkippedStop && route && stop) {
    return {
      title: `Line ${route} skipping Stop ${stop}`,
      body: `Line ${route} is temporarily not serving this stop. Other lines may continue normally.`,
    };
  }

  if (alert.type === "stop-closure" && stop) {
    return {
      title: `Stop ${stop} temporarily closed`,
      body: "Use the nearby alternative stop shown in the alert.",
    };
  }

  if (route && alert.type === "detour") {
    return {
      title: `Line ${route} detour`,
      body: "A detour is affecting your saved route.",
    };
  }

  if (route) {
    return {
      title: `Line ${route} service disruption`,
      body: "Service changes may affect your trip. View the alert for details.",
    };
  }

  return {
    title: alert.title,
    body: "Check Holo Hele for service alert details.",
  };
}
