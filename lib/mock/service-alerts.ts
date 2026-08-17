export interface ServiceAlertPreview {
  id: string;
  title: string;
  summary: string;
  details: string;
  affectedRoutes: string[];
  affectedStops: string[];
  affectedBusIds: string[];
  statusLabel: string;
  isPreview: true;
}

/**
 * Design-preview content only. This stays separate from transit API data so it
 * can never be presented as a current TheBus service notice.
 */
export const SERVICE_ALERT_PREVIEWS: ServiceAlertPreview[] = [
  {
    id: "preview-1l-downtown-detour",
    title: "Detour in effect",
    summary:
      "Route 1L is using a temporary downtown detour near S Beretania St + Bishop St.",
    details:
      "Some stops may be skipped or served from a nearby temporary stop. Allow extra travel time and check the stop signs in the area.",
    affectedRoutes: ["1L"],
    affectedStops: ["S Beretania St + Bishop St"],
    affectedBusIds: ["1l-437"],
    statusLabel: "Posted 2 days ago",
    isPreview: true,
  },
];

export function getServiceAlertForBus(
  busId: string,
): ServiceAlertPreview | undefined {
  return SERVICE_ALERT_PREVIEWS.find((alert) =>
    alert.affectedBusIds.includes(busId),
  );
}
