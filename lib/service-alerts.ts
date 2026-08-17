import type { TransitAlert } from "@/types/transit";

export const SERVICE_ALERTS_QUERY_KEY = ["service-alerts"] as const;
export const SERVICE_ALERT_REFRESH_MS = 5 * 60 * 1000;

export function normalizeRouteId(route: string): string {
  return route.trim().toLocaleUpperCase().replace(/\s+LINE$/, "");
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

export function findAlertForRoute(
  alerts: TransitAlert[],
  route: string,
): TransitAlert | undefined {
  return alerts.find(
    (alert) => !alert.systemWide && alertAffectsRoute(alert, route),
  );
}

export function findAlertForStop(
  alerts: TransitAlert[],
  stopId: string,
): TransitAlert | undefined {
  return alerts.find(
    (alert) => !alert.systemWide && alertAffectsStop(alert, stopId),
  );
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

  if (alert.type === "stop-closure" && stop) {
    return {
      title: `Stop ${stop} temporarily closed`,
      body: route
        ? `Route ${route} may be using an alternative stop.`
        : "Use the nearby alternative stop shown in the alert.",
    };
  }

  if (route && alert.type === "detour") {
    return {
      title: `Route ${route} detour`,
      body: "A detour is affecting your saved route.",
    };
  }

  if (route) {
    return {
      title: `Route ${route} service disruption`,
      body: "Service changes may affect your trip. View the alert for details.",
    };
  }

  return {
    title: alert.title,
    body: "Check Holo Hele for service alert details.",
  };
}
