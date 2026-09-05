import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";

import { DirectionsMap } from "@/components/directions/DirectionsMap";
import { ServiceAlertBanner } from "@/components/alerts/ServiceAlertBanner";
import {
  AlertTriangleIcon,
  FigmaIcon,
  LiveSignalIcon,
  RouteLineBadge,
  ScheduleIcon,
} from "@/components/icons/FigmaIcon";
import { Button } from "@/components/ui/Button";
import {
  fetchServiceAlerts,
  fetchWalkingDirections,
} from "@/lib/api/transit";
import {
  alertAffectsRoute,
  alertAffectsStop,
  SERVICE_ALERT_REFRESH_MS,
  SERVICE_ALERTS_QUERY_KEY,
} from "@/lib/service-alerts";
import {
  parseTripRouteSearch,
  resolvePlannedJourney,
  type TripRouteSearch,
} from "@/lib/trip-planning";
import { useI18n } from "@/lib/i18n";
import type {
  JourneyOption,
  TransitAlert,
  WalkingManeuver,
  WalkingRouteStep,
} from "@/types/transit";

export const Route = createFileRoute("/directions/$journeyId")({
  validateSearch: (search): TripRouteSearch => parseTripRouteSearch(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const journey = await resolvePlannedJourney(params.journeyId, deps);
    if (!journey) throw notFound();
    return journey;
  },
  component: DirectionsPage,
});

type TimelineLine = "dotted" | "solid";
type TripSheetSnap = "expanded" | "default" | "collapsed";

const TRIP_SHEET_TOP: Record<TripSheetSnap, string> = {
  expanded: "calc(3.5rem + env(safe-area-inset-top))",
  default: "36dvh",
  collapsed: "calc(100dvh - 15rem)",
};

const TRIP_SHEET_SNAP_ORDER: TripSheetSnap[] = [
  "expanded",
  "default",
  "collapsed",
];

function tripSheetHandleLabel(snap: TripSheetSnap) {
  if (snap === "expanded") return "Show less trip details";
  if (snap === "collapsed") return "Show more trip details";
  return "Expand trip details";
}

function TimelineSegment({
  line,
  position,
}: {
  line: TimelineLine;
  position: "incoming" | "outgoing";
}) {
  const positionClass =
    position === "incoming" ? "top-0 h-4" : "top-4 bottom-0";
  const lineClass =
    line === "solid"
      ? "w-1 bg-transit-blue"
      : "trip-timeline-dotted";

  return (
    <span
      className={`absolute left-1/2 -translate-x-1/2 ${positionClass} ${lineClass}`}
    />
  );
}

function TimelineRail({
  marker = true,
  icon,
  incoming,
  outgoing,
}: {
  marker?: boolean;
  icon?: "walking";
  incoming?: TimelineLine;
  outgoing?: TimelineLine;
}) {
  return (
    <span className="relative flex h-full min-h-8 w-5 justify-center" aria-hidden="true">
      {incoming ? <TimelineSegment line={incoming} position="incoming" /> : null}
      {outgoing ? <TimelineSegment line={outgoing} position="outgoing" /> : null}
      {icon === "walking" ? (
        <span className="absolute top-[9px] z-10 flex h-[26px] w-5 items-center justify-center bg-canvas">
          <FigmaIcon name="walking" size={18} className="h-[18px] w-3" />
        </span>
      ) : marker ? (
        <span className="absolute top-3 z-10 h-5 w-5">
          {incoming === "dotted" ? (
            <span className="absolute inset-x-0 top-0 h-1/2 bg-canvas" />
          ) : null}
          {outgoing === "dotted" ? (
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-canvas" />
          ) : null}
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-transit-blue bg-canvas" />
        </span>
      ) : null}
    </span>
  );
}

function WalkingDirectionDetails({
  id,
  directions,
  isLoading = false,
  isRouted = false,
}: {
  id: string;
  directions: Array<string | WalkingRouteStep>;
  isLoading?: boolean;
  isRouted?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div id={id} className="pb-3 pl-1">
      <div className="mb-1.5 flex items-start gap-2 rounded-[var(--radius-xs)] bg-alert-subtle px-2.5 py-2 text-xs leading-snug text-body">
        <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-alert" />
        <span>
          {isLoading
            ? t("Finding street-level walking directions…")
            : isRouted
              ? t("Walking directions use OpenStreetMap. Use caution and confirm current street conditions.")
              : t("Approximate walking directions. Use caution and confirm street conditions.")}
        </span>
      </div>
      <ol className="divide-y divide-hairline">
        {directions.map((direction, index) => {
          const instruction =
            typeof direction === "string" ? direction : direction.instruction;
          const maneuver =
            typeof direction === "string" ? undefined : direction.maneuver;
          return (
            <li
              key={`${instruction}-${index}`}
              className="grid grid-cols-[24px_1fr] items-start gap-2.5 py-2.5 text-sm leading-snug text-ink"
            >
              <WalkingManeuverIcon
                instruction={instruction}
                isFirst={index === 0}
                maneuver={maneuver}
              />
              <span>{instruction}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function walkingManeuverForInstruction(
  instruction: string,
  isFirst: boolean,
): WalkingManeuver {
  const normalized = instruction.toLowerCase();

  if (normalized.includes("slight left")) return "slight-left";
  if (normalized.includes("slight right")) return "slight-right";
  if (normalized.includes("turn left") || normalized.includes("on your left")) {
    return "left";
  }
  if (normalized.includes("turn right") || normalized.includes("on your right")) {
    return "right";
  }
  if (
    normalized.includes("destination") ||
    normalized.includes("reach the stop") ||
    normalized.includes("reach your stop")
  ) {
    return "destination";
  }
  if (isFirst || normalized.startsWith("start")) return "start";
  return "straight";
}

function WalkingManeuverIcon({
  instruction,
  isFirst,
  maneuver,
}: {
  instruction: string;
  isFirst: boolean;
  maneuver?: WalkingManeuver;
}) {
  const displayedManeuver =
    maneuver ?? walkingManeuverForInstruction(instruction, isFirst);

  if (displayedManeuver === "start" || displayedManeuver === "destination") {
    return (
      <span
        aria-hidden="true"
        data-maneuver={displayedManeuver}
        className="mt-0.5 flex h-5 w-5 items-center justify-center"
      >
        <span
          className={
            displayedManeuver === "start"
              ? "h-3 w-3 rounded-full border-[3px] border-body"
              : "h-3 w-3 rounded-full bg-transit-blue"
          }
        />
      </span>
    );
  }

  const transform =
    displayedManeuver === "left"
      ? "rotate(-90 12 12)"
      : displayedManeuver === "right"
        ? "rotate(90 12 12)"
        : displayedManeuver === "slight-left"
          ? "rotate(-45 12 12)"
          : displayedManeuver === "slight-right"
            ? "rotate(45 12 12)"
            : undefined;

  return (
    <svg
      aria-hidden="true"
      data-maneuver={displayedManeuver}
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 text-body"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform={transform}>
        <path d="M12 20V5" />
        <path d="m7 10 5-5 5 5" />
      </g>
    </svg>
  );
}

function findJourneyAlert(
  alerts: TransitAlert[],
  journey: JourneyOption,
): TransitAlert | undefined {
  return (
    alerts.find(
      (alert) =>
        !alert.systemWide &&
        alert.severity !== "info" &&
        alertAffectsRoute(alert, journey.route) &&
        (alert.affectedStops.length === 0 ||
          alertAffectsStop(alert, journey.boardStop.id) ||
          alertAffectsStop(alert, journey.alightStop.id)),
    ) ?? alerts.find((alert) => alert.systemWide && alert.severity !== "info")
  );
}

function DirectionsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const journey = Route.useLoaderData();
  const search = Route.useSearch();
  const { destination } = search;
  const [saved, setSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    walkStart: false,
    ride: false,
    walkEnd: false,
  });
  const [sheetSnap, setSheetSnap] = useState<TripSheetSnap>("default");
  const [dragTop, setDragTop] = useState<number>();
  const shellRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startTop: number;
    currentTop: number;
  } | undefined>(undefined);
  const didDragRef = useRef(false);
  const alertsQuery = useQuery({
    queryKey: SERVICE_ALERTS_QUERY_KEY,
    queryFn: fetchServiceAlerts,
    staleTime: SERVICE_ALERT_REFRESH_MS,
    refetchInterval: SERVICE_ALERT_REFRESH_MS,
  });
  const walkingDirectionsQuery = useQuery({
    queryKey: [
      "walking-directions",
      journey.id,
      journey.origin.coordinate,
      journey.destination.coordinate,
    ],
    queryFn: () => fetchWalkingDirections(journey),
    enabled: journey.dataSource !== "mock",
    retry: false,
    gcTime: 0,
  });
  const routedWalking = walkingDirectionsQuery.data;
  const mapJourney = useMemo<JourneyOption>(
    () => ({
      ...journey,
      path: {
        ...journey.path,
        walkStart: routedWalking?.start?.path ?? journey.path.walkStart,
        walkEnd: routedWalking?.end?.path ?? journey.path.walkEnd,
      },
    }),
    [journey, routedWalking],
  );
  const journeyAlert = findJourneyAlert(alertsQuery.data?.alerts ?? [], journey);
  const usesPreviewOrigin = journey.origin.name.toLowerCase().includes("preview");
  const originDisplayName = usesPreviewOrigin
    ? t("Starting point")
    : journey.origin.name === "Current location"
      ? t("Your location")
      : journey.origin.name;
  const showOriginDetail =
    !usesPreviewOrigin &&
    journey.origin.detail.toLowerCase() !== "approximate device location";
  const startWalkingDirections: Array<string | WalkingRouteStep> =
    routedWalking?.start?.steps ?? journey.walkingInstructions.filter(
      (instruction) => !instruction.toLowerCase().startsWith("board route"),
    );
  const endWalkingDirections: Array<string | WalkingRouteStep> =
    routedWalking?.end?.steps ?? [
      `Head toward ${journey.destination.name}.`,
      `Continue for approximately ${journey.walkEndDistance} until you reach your destination.`,
    ];
  const rideStopSequence = journey.rideStopSequence ?? [
    journey.boardStop,
    journey.alightStop,
  ];
  const intermediateRideStops = rideStopSequence.slice(1, -1);
  const backSearch = {
    destination,
    destinationDetail: search.destinationDetail,
    destinationLat: search.destinationLat,
    destinationLng: search.destinationLng,
  };

  function getSheetSnapTops() {
    const shellBounds = shellRef.current?.getBoundingClientRect();
    const headerBounds = headerRef.current?.getBoundingClientRect();
    if (!shellBounds || !headerBounds) return null;

    const expanded = Math.max(0, headerBounds.bottom - shellBounds.top);
    const collapsed = Math.max(expanded, shellBounds.height - 240);
    const defaultTop = Math.min(
      collapsed,
      Math.max(expanded, shellBounds.height * 0.36),
    );

    return { expanded, default: defaultTop, collapsed };
  }

  function handleSheetPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const shellBounds = shellRef.current?.getBoundingClientRect();
    const sheetBounds = sheetRef.current?.getBoundingClientRect();
    if (!shellBounds || !sheetBounds) return;

    const currentTop = sheetBounds.top - shellBounds.top;
    didDragRef.current = false;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTop: currentTop,
      currentTop,
    };
    setDragTop(currentTop);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSheetPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;
    const snapTops = getSheetSnapTops();
    if (!dragState || dragState.pointerId !== event.pointerId || !snapTops) return;

    const distance = event.clientY - dragState.startY;
    if (Math.abs(distance) > 4) didDragRef.current = true;
    const nextTop = Math.min(
      snapTops.collapsed,
      Math.max(snapTops.expanded, dragState.startTop + distance),
    );
    dragState.currentTop = nextTop;
    setDragTop(nextTop);
  }

  function finishSheetDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;
    const snapTops = getSheetSnapTops();
    if (!dragState || dragState.pointerId !== event.pointerId || !snapTops) return;

    const nearestSnap = TRIP_SHEET_SNAP_ORDER.reduce((nearest, candidate) =>
      Math.abs(snapTops[candidate] - dragState.currentTop) <
      Math.abs(snapTops[nearest] - dragState.currentTop)
        ? candidate
        : nearest,
    );
    setSheetSnap(nearestSnap);
    setDragTop(undefined);
    dragStateRef.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleSheetClick() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setSheetSnap((current) =>
      current === "expanded"
        ? "default"
        : current === "collapsed"
          ? "default"
          : "expanded",
    );
  }

  function handleSheetKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    setSheetSnap((current) => {
      const currentIndex = TRIP_SHEET_SNAP_ORDER.indexOf(current);
      const direction = event.key === "ArrowUp" ? -1 : 1;
      const nextIndex = Math.min(
        TRIP_SHEET_SNAP_ORDER.length - 1,
        Math.max(0, currentIndex + direction),
      );
      return TRIP_SHEET_SNAP_ORDER[nextIndex];
    });
  }

  return (
    <main ref={shellRef} className="app-shell relative h-dvh overflow-hidden bg-canvas">
      <div
        className="absolute inset-0 z-0"
        role="region"
        aria-label={t("Trip route overview")}
      >
        <DirectionsMap journey={mapJourney} showControls={false} />
      </div>

      <header
        ref={headerRef}
        className="absolute inset-x-0 top-0 z-[1200] flex min-h-14 items-center border-b border-hairline bg-canvas px-3 pt-[env(safe-area-inset-top)]"
      >
        <Link
          to="/plan"
          search={backSearch}
          aria-label={t("Back to route options")}
          className="flex h-10 w-10 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={22} className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-ink">
          {t("Trip Details")}
        </h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section
        ref={sheetRef}
        data-sheet-state={sheetSnap}
        data-dragging={dragTop === undefined ? "false" : "true"}
        aria-label={t("Trip Details")}
        className="trip-details-sheet absolute inset-x-0 bottom-0 z-[1100] flex min-h-0 flex-col overflow-hidden rounded-t-[var(--radius-xl)] border-t border-hairline bg-canvas shadow-[0_-4px_18px_rgba(0,0,0,0.1)]"
        style={{
          top: dragTop ?? TRIP_SHEET_TOP[sheetSnap],
        }}
      >
        <button
          type="button"
          aria-label={t(tripSheetHandleLabel(sheetSnap))}
          aria-controls="trip-sheet-content"
          aria-expanded={sheetSnap === "expanded"}
          onClick={handleSheetClick}
          onKeyDown={handleSheetKeyDown}
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={finishSheetDrag}
          onPointerCancel={finishSheetDrag}
          className="flex h-8 w-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        >
          <span className="sheet-handle" aria-hidden="true" />
        </button>

        <div
          id="trip-sheet-content"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >

      <section className="border-b border-hairline bg-canvas px-4 pb-4 pt-1">
        {journey.dataSource === "mock" ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-body">
            {t("Simulated trip preview")}
          </p>
        ) : null}

        <div>
          <p
            className="flex items-center gap-2 text-xl font-bold text-ink"
            aria-label={t("Bus ride {minutes} min", { minutes: journey.rideMinutes })}
          >
            <FigmaIcon name="busRoute" size={24} className="h-6 w-6" />
            <span>{t("{minutes} min", { minutes: journey.rideMinutes })}</span>
          </p>
          <p className="mt-1 text-sm text-body">
            {t("Arrive {time}", { time: journey.destination.time })}
          </p>
          <div className="mt-3 flex items-start">
            <RouteLineBadge route={journey.route} />
          </div>
        </div>

      </section>

      {journeyAlert ? (
        <div className="shrink-0 border-b border-hairline bg-canvas">
          <ServiceAlertBanner alert={journeyAlert} />
        </div>
      ) : null}

      <section className="mt-2 bg-canvas" aria-label={t("Trip itinerary")}>
        <ol className="px-4 py-1">
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail outgoing="dotted" />
            <div className="flex items-start justify-between gap-3 border-b border-hairline py-3">
              <div>
                <strong className="text-base font-semibold text-ink">{originDisplayName}</strong>
                {showOriginDetail ? (
                  <p className="mt-0.5 text-xs text-body">{journey.origin.detail}</p>
                ) : null}
              </div>
              <time className="shrink-0 text-sm text-ink">{journey.origin.time}</time>
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail marker={false} icon="walking" incoming="dotted" outgoing="dotted" />
            <div className="border-b border-hairline">
              <button
                type="button"
                className="min-h-11 w-full py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-expanded={expandedSections.walkStart}
                aria-controls="walk-start-directions"
                onClick={() =>
                  setExpandedSections((current) => ({
                    ...current,
                    walkStart: !current.walkStart,
                  }))
                }
              >
                <span className="text-sm font-semibold text-ink">{t("Walk")}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-body">
                  <FigmaIcon
                    name="chevronDown"
                    size={14}
                    className={`h-3.5 w-3.5 transition-transform ${expandedSections.walkStart ? "rotate-180" : ""}`}
                  />
                  {t("About {minutes} min, {distance}", {
                    minutes: routedWalking?.start?.durationMinutes ?? journey.walkStartMinutes,
                    distance: routedWalking?.start?.distance ?? journey.walkStartDistance,
                  })}
                </span>
              </button>
              {expandedSections.walkStart ? (
                <WalkingDirectionDetails
                  id="walk-start-directions"
                  directions={startWalkingDirections.length > 0
                    ? startWalkingDirections
                    : [t("Continue toward {place}.", { place: journey.boardStop.name })]}
                  isLoading={walkingDirectionsQuery.isFetching}
                  isRouted={Boolean(routedWalking?.start)}
                />
              ) : null}
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail incoming="dotted" outgoing="solid" />
            <div className="border-b border-hairline">
              <div className="pt-3">
                <strong className="text-base font-semibold leading-snug text-ink">
                  {journey.boardStop.name}
                </strong>
              </div>
              <button
                type="button"
                className="min-h-11 w-full py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-expanded={expandedSections.ride}
                aria-controls="ride-stop-sequence"
                onClick={() =>
                  setExpandedSections((current) => ({
                    ...current,
                    ride: !current.ride,
                  }))
                }
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-2 text-sm font-semibold leading-snug text-ink">
                    <RouteLineBadge route={journey.route} />
                    <span>{journey.routeHeadsign}</span>
                  </span>
                  {journey.dataSource === "live" && journey.etaMinutes != null ? (
                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-live">
                      <LiveSignalIcon className="h-3.5 w-3.5" />
                      {journey.etaMinutes <= 0 ? t("Now") : t("{minutes} min", { minutes: journey.etaMinutes })}
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-body">
                      <ScheduleIcon className="h-3.5 w-3.5" />
                      {journey.dataSource === "mock" ? `${t("Simulated")} · ` : ""}
                      {journey.boardStop.time}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 text-xs text-body">
                  <FigmaIcon
                    name="chevronDown"
                    size={14}
                    className={`h-3.5 w-3.5 transition-transform ${expandedSections.ride ? "rotate-180" : ""}`}
                  />
                  {t("Ride {count} stops", { count: journey.rideStops })} · {t("{minutes} min", { minutes: journey.rideMinutes })}
                </span>
              </button>
            </div>
          </li>
          {expandedSections.ride && intermediateRideStops.length > 0 ? (
            <li className="contents">
              <ol id="ride-stop-sequence" className="contents">
                {intermediateRideStops.map((stop, index) => (
                  <li
                    key={`${stop.id}-${index}`}
                    className="grid grid-cols-[20px_1fr] gap-x-2.5"
                  >
                    <TimelineRail incoming="solid" outgoing="solid" />
                    <div className="flex items-start justify-between gap-3 border-b border-hairline py-3">
                      <span className="text-sm font-medium leading-snug text-ink">
                        {stop.name}
                      </span>
                      <time className="shrink-0 text-xs text-body">{stop.time}</time>
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          ) : null}
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail incoming="solid" outgoing="dotted" />
            <div className="flex items-start justify-between gap-3 border-b border-hairline py-3">
              <strong className="text-base font-semibold leading-snug text-ink">
                {journey.alightStop.name}
              </strong>
              <time className="shrink-0 text-sm text-ink">{journey.alightStop.time}</time>
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail marker={false} icon="walking" incoming="dotted" outgoing="dotted" />
            <div className="border-b border-hairline">
              <button
                type="button"
                className="min-h-11 w-full py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-expanded={expandedSections.walkEnd}
                aria-controls="walk-end-directions"
                onClick={() =>
                  setExpandedSections((current) => ({
                    ...current,
                    walkEnd: !current.walkEnd,
                  }))
                }
              >
                <span className="text-sm font-semibold text-ink">{t("Walk")}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-body">
                  <FigmaIcon
                    name="chevronDown"
                    size={14}
                    className={`h-3.5 w-3.5 transition-transform ${expandedSections.walkEnd ? "rotate-180" : ""}`}
                  />
                  {t("About {minutes} min, {distance}", {
                    minutes: routedWalking?.end?.durationMinutes ?? journey.walkEndMinutes,
                    distance: routedWalking?.end?.distance ?? journey.walkEndDistance,
                  })}
                </span>
              </button>
              {expandedSections.walkEnd ? (
                <WalkingDirectionDetails
                  id="walk-end-directions"
                  directions={endWalkingDirections}
                  isLoading={walkingDirectionsQuery.isFetching}
                  isRouted={Boolean(routedWalking?.end)}
                />
              ) : null}
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail incoming="dotted" />
            <div className="flex items-start justify-between gap-3 py-3">
              <div>
                <strong className="text-base font-semibold text-ink">{journey.destination.name}</strong>
                <p className="mt-0.5 text-xs text-body">{journey.destination.detail}</p>
              </div>
              <time className="shrink-0 text-sm text-ink">{journey.destination.time}</time>
            </div>
          </li>
        </ol>
      </section>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-hairline bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
          <Button
            className="min-h-11 rounded-[var(--radius-md)] !bg-transit-blue px-5 text-sm !text-white hover:!bg-brand-blue focus-visible:!outline-transit-blue"
            onClick={() =>
              void navigate({
                to: "/live-directions/$journeyId",
                params: { journeyId: journey.id },
                search,
              })
            }
          >
            {t("Start")}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 rounded-[var(--radius-md)] border-transit-blue px-5 text-sm text-transit-blue"
            onClick={() => setSaved((value) => !value)}
            aria-pressed={saved}
          >
            {t(saved ? "Saved" : "Favorite")}
          </Button>
        </div>
      </section>
    </main>
  );
}
