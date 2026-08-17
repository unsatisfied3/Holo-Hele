import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchServiceAlerts } from "@/lib/api/transit";
import { getFavoriteBusIds } from "@/lib/favorites";
import { FAVORITE_BUS_PRESETS } from "@/lib/mock/favorites";
import {
  establishAlertBaseline,
  getNotifiedAlertIds,
  getServiceNotificationsEnabled,
  isAlertBaselineReady,
  markAlertNotified,
  sendServiceAlertNotification,
  SERVICE_NOTIFICATIONS_CHANGED_EVENT,
} from "@/lib/notifications";
import {
  SERVICE_ALERT_REFRESH_MS,
  SERVICE_ALERTS_QUERY_KEY,
  shouldNotifyForAlert,
} from "@/lib/service-alerts";

export function ServiceAlertMonitor() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    getServiceNotificationsEnabled,
  );
  const alertsQuery = useQuery({
    queryKey: SERVICE_ALERTS_QUERY_KEY,
    queryFn: fetchServiceAlerts,
    refetchInterval: SERVICE_ALERT_REFRESH_MS,
    staleTime: SERVICE_ALERT_REFRESH_MS,
  });

  useEffect(() => {
    const sync = () => setNotificationsEnabled(getServiceNotificationsEnabled());
    window.addEventListener(SERVICE_NOTIFICATIONS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SERVICE_NOTIFICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const response = alertsQuery.data;
    if (!response || response.status === "unavailable") return;

    if (!isAlertBaselineReady()) {
      establishAlertBaseline(response.alerts.map((alert) => alert.id));
      return;
    }

    const favoriteIds = getFavoriteBusIds();
    const favoriteRoutes = FAVORITE_BUS_PRESETS.filter((bus) =>
      favoriteIds.includes(bus.id),
    ).map((bus) => bus.route);
    const notifiedAlertIds = getNotifiedAlertIds();

    for (const alert of response.alerts) {
      if (
        shouldNotifyForAlert({
          alert,
          favoriteRoutes,
          notificationsEnabled,
          notifiedAlertIds,
        }) &&
        markAlertNotified(alert.id)
      ) {
        void sendServiceAlertNotification(alert);
      }
    }
  }, [alertsQuery.data, notificationsEnabled]);

  return null;
}
