import type { TransitAlert } from "@/types/transit";

export type DemoAlertScenario =
  | "route-1l"
  | "stop-437"
  | "stop-1712"
  | "stop-1016"
  | "system-wide";

export const FAVORITE_DISRUPTION_STOP_IDS = ["1712", "1016"] as const;

/**
 * Design-preview content only. This stays separate from transit API data so it
 * can never be presented as a current TheBus service notice.
 */
export const SERVICE_ALERT_PREVIEWS: TransitAlert[] = [
  {
    id: "preview-1l-downtown-detour",
    title: "Detour in effect",
    description:
      "Route 1L is detoured near S Beretania St + Bishop St. Some stops may be skipped. Allow extra time.",
    affectedRoutes: ["1L"],
    affectedStops: ["437"],
    systemWide: false,
    type: "detour",
    severity: "warning",
    source: "holohele-demo",
    sourceUrl: "/alerts",
    isLive: false,
  },
  {
    id: "preview-stop-437-closure",
    title: "Bus 1L is temporarily skipping this stop.",
    description:
      "Bus 1L riders should use the nearby alternative stop until Bus 1L resumes service at Stop 437. Other buses may continue serving Stop 437 normally.",
    affectedRoutes: ["1L"],
    affectedStops: ["437"],
    systemWide: false,
    type: "stop-skipped",
    severity: "warning",
    source: "holohele-demo",
    sourceUrl: "/alerts",
    isLive: false,
  },
  {
    id: "preview-stop-1712-weather-service",
    title: "Weather disruption",
    description:
      "Route 65 westbound is not serving Stop 1712. Nearby stops may be crowded.",
    affectedRoutes: ["65"],
    affectedStops: ["1712"],
    systemWide: false,
    type: "service-disruption",
    severity: "critical",
    source: "holohele-demo",
    sourceUrl: "/alerts",
    isLive: false,
  },
  {
    id: "preview-stop-1016-closure",
    title: "Stop 1016 temporarily closed",
    description:
      "Buses 3 and 7 are temporarily skipping Stop 1016. Other buses may continue serving this stop normally.",
    affectedRoutes: ["3", "7"],
    affectedStops: ["1016"],
    systemWide: false,
    type: "stop-closure",
    severity: "critical",
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
  "stop-1712": "preview-stop-1712-weather-service",
  "stop-1016": "preview-stop-1016-closure",
  "system-wide": "preview-system-wide-disruption",
};

const STOP_DEMO_SCENARIOS: Record<string, DemoAlertScenario> = {
  "437": "stop-437",
  "1712": "stop-1712",
  "1016": "stop-1016",
};

export function parseDemoAlertScenario(
  value: unknown,
): DemoAlertScenario | undefined {
  return typeof value === "string" && value in SCENARIO_ALERT_IDS
    ? (value as DemoAlertScenario)
    : undefined;
}

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

export function getServiceAlertForStop(
  stopId: string,
): TransitAlert | undefined {
  const scenario = STOP_DEMO_SCENARIOS[stopId];
  return scenario ? getDemoAlert(scenario) : undefined;
}

export function getStopDemoAlertScenario(
  stopId: string,
): DemoAlertScenario | undefined {
  return STOP_DEMO_SCENARIOS[stopId];
}

export function getFavoriteStopDisruptionPreview(
  stopId: string,
): TransitAlert | undefined {
  return FAVORITE_DISRUPTION_STOP_IDS.includes(
    stopId as (typeof FAVORITE_DISRUPTION_STOP_IDS)[number],
  )
    ? getServiceAlertForStop(stopId)
    : undefined;
}
