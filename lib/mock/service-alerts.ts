import type { TransitAlert } from "@/types/transit";

export type DemoAlertScenario = "route-1l" | "stop-437" | "system-wide";

/**
 * Design-preview content only. This stays separate from transit API data so it
 * can never be presented as a current TheBus service notice.
 */
export const SERVICE_ALERT_PREVIEWS: TransitAlert[] = [
  {
    id: "preview-1l-downtown-detour",
    title: "Detour in effect",
    description:
      "Route 1L is using a temporary downtown detour near S Beretania St + Bishop St. Some stops may be skipped or served from a nearby temporary stop. Allow extra travel time and check the stop signs in the area.",
    affectedRoutes: ["1L"],
    affectedStops: [],
    systemWide: false,
    type: "detour",
    severity: "warning",
    source: "holohele-demo",
    sourceUrl: "/alerts",
    isLive: false,
  },
  {
    id: "preview-stop-437-closure",
    title: "Stop 437 temporarily closed",
    description:
      "Route 1L riders should use the nearby alternative stop until service at Stop 437 resumes.",
    affectedRoutes: ["1L"],
    affectedStops: ["437"],
    systemWide: false,
    type: "stop-closure",
    severity: "warning",
    source: "holohele-demo",
    sourceUrl: "/alerts",
    isLive: false,
  },
  {
    id: "preview-system-wide-disruption",
    title: "TheBus service disruption",
    description:
      "Multiple routes are currently affected. Check your trip before traveling.",
    affectedRoutes: [],
    affectedStops: [],
    systemWide: true,
    type: "service-disruption",
    severity: "critical",
    source: "holohele-demo",
    sourceUrl: "/alerts",
    isLive: false,
  },
];

const SCENARIO_ALERT_IDS: Record<DemoAlertScenario, string> = {
  "route-1l": "preview-1l-downtown-detour",
  "stop-437": "preview-stop-437-closure",
  "system-wide": "preview-system-wide-disruption",
};

export function getDemoAlert(scenario: DemoAlertScenario): TransitAlert {
  const alert = SERVICE_ALERT_PREVIEWS.find(
    (candidate) => candidate.id === SCENARIO_ALERT_IDS[scenario],
  );
  if (!alert) throw new Error(`Missing demo alert scenario: ${scenario}`);
  return alert;
}

export function getServiceAlertForBus(
  busId: string,
): TransitAlert | undefined {
  return busId === "1l-437" ? getDemoAlert("route-1l") : undefined;
}
