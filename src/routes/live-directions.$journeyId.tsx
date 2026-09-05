import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
  DirectionsMap,
  type DirectionsMapPhase,
} from "@/components/directions/DirectionsMap";
import {
  BusStopSignIcon,
  FigmaIcon,
  RouteLineBadge,
  ScheduleIcon,
} from "@/components/icons/FigmaIcon";
import { Button } from "@/components/ui/Button";
import {
  fetchStopArrivals,
  fetchWalkingDirections,
} from "@/lib/api/transit";
import {
  canUseLocationWithoutPrompt,
  getLocationPreference,
} from "@/lib/onboarding";
import {
  parseTripRouteSearch,
  resolvePlannedJourney,
  type TripRouteSearch,
} from "@/lib/trip-planning";
import {
  boardingProximity,
  distanceBetweenCoordinates,
  getOffAlertCopy,
  hasLikelyBoardedBus,
  hasReachedAlightingStop,
  nextStopProgressIndex,
  roundedWalkingDistance,
  stopsRemaining,
} from "@/lib/trip-guidance";
import { useI18n } from "@/lib/i18n";
import type {
  JourneyCoordinate,
  TheBusArrival,
  WalkingRouteStep,
} from "@/types/transit";

const LIVE_REFRESH_MS = 15_000;
const BOARDING_STOP_DWELL_MS = 3_500;
const ALIGHTING_STOP_DWELL_MS = 3_500;
const REQUIRED_BOARDING_EVIDENCE_SAMPLES = 2;

type RiderLocationStatus =
  | "checking"
  | "active"
  | "disabled"
  | "permission-required"
  | "unavailable"
  | "stale";

type GuidanceStage =
  | "walk-to-stop"
  | "wait-for-bus"
  | "onboard"
  | "final-walk";
type JourneyProgress =
  | "walking-to-stop"
  | "waiting-for-bus"
  | "onboard"
  | "after-ride";

const GUIDANCE_STAGES: GuidanceStage[] = [
  "walk-to-stop",
  "wait-for-bus",
  "onboard",
  "final-walk",
];

export const Route = createFileRoute("/live-directions/$journeyId")({
  validateSearch: (search): TripRouteSearch => parseTripRouteSearch(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const journey = await resolvePlannedJourney(params.journeyId, deps);
    if (!journey) throw notFound();
    return journey;
  },
  component: LiveDirectionsPage,
});

type Translate = (message: string, values?: Record<string, string | number>) => string;

function minuteLabel(minutes: number, t: Translate) {
  return t("{minutes} minutes", { minutes });
}

function arrivalCoordinate(
  arrival: TheBusArrival | undefined,
): JourneyCoordinate | undefined {
  return arrival?.latitude != null &&
    arrival.longitude != null &&
    Number.isFinite(arrival.latitude) &&
    Number.isFinite(arrival.longitude)
    ? [arrival.latitude, arrival.longitude]
    : undefined;
}

function busArrivalLabel(arrival: TheBusArrival | undefined, t: Translate) {
  if (arrival?.minutesUntil == null) return t("Live");
  if (arrival.minutesUntil <= 0) return t("Now");
  return t("{minutes} min", { minutes: arrival.minutesUntil });
}

function busArrivalCopy(arrival: TheBusArrival, t: Translate) {
  if (arrival.minutesUntil == null) return t("Your bus arrival is updating");
  if (arrival.minutesUntil <= 0) return t("Your bus is arriving now");
  return t("Your bus arrives in {minutes} min", { minutes: arrival.minutesUntil });
}

function updateAge(updatedAt: number, t: Translate) {
  if (!updatedAt) return t("Updated now");
  const seconds = Math.max(0, Math.round((Date.now() - updatedAt) / 1_000));
  if (seconds < 15) return t("Updated now");
  if (seconds < 60) return t("Updated {seconds} sec ago", { seconds });
  const minutes = Math.floor(seconds / 60);
  return t("Updated {minutes} min ago", { minutes });
}

function LiveDirectionsPage() {
  const { t } = useI18n();
  const journey = Route.useLoaderData();
  const search = Route.useSearch();
  const [saved, setSaved] = useState(false);
  const [stage, setStage] = useState<GuidanceStage>("walk-to-stop");
  const [journeyProgress, setJourneyProgress] =
    useState<JourneyProgress>("walking-to-stop");
  const swipeStartX = useRef<number | null>(null);
  const previousRiderSample = useRef<{
    coordinate: JourneyCoordinate;
    timestamp: number;
  } | undefined>(undefined);
  const boardingEvidenceSamples = useRef(0);
  const [onboardStopIndex, setOnboardStopIndex] = useState(0);
  const [riderLocation, setRiderLocation] = useState<JourneyCoordinate>();
  const [riderLocationAccuracy, setRiderLocationAccuracy] = useState<number>();
  const [riderSpeed, setRiderSpeed] = useState<number>();
  const [locationStatus, setLocationStatus] =
    useState<RiderLocationStatus>("checking");
  const isWalkingToStop = stage === "walk-to-stop";
  const isWaitingForBus = stage === "wait-for-bus";
  const isOnboard = stage === "onboard";
  const isFinalWalk = stage === "final-walk";
  const phase: Exclude<DirectionsMapPhase, "preview"> = isOnboard
    ? "transit"
    : isFinalWalk
      ? "final-walk"
      : "walking";

  useEffect(() => {
    let disposed = false;
    let watchId: number | undefined;
    let hasReceivedLocation = false;

    async function startLocationWatch() {
      if (!getLocationPreference()) {
        setLocationStatus("disabled");
        return;
      }
      if (!navigator.geolocation) {
        setLocationStatus("unavailable");
        return;
      }
      if (!(await canUseLocationWithoutPrompt()) || disposed) {
        if (!disposed) setLocationStatus("permission-required");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          hasReceivedLocation = true;
          const coordinate: JourneyCoordinate = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          const timestamp = position.timestamp || Date.now();
          const previousSample = previousRiderSample.current;
          let measuredSpeed = position.coords.speed ?? undefined;

          if (measuredSpeed == null && previousSample) {
            const elapsedSeconds =
              (timestamp - previousSample.timestamp) / 1_000;
            if (elapsedSeconds >= 1 && elapsedSeconds <= 30) {
              measuredSpeed =
                distanceBetweenCoordinates(
                  previousSample.coordinate,
                  coordinate,
                ) / elapsedSeconds;
            }
          }

          previousRiderSample.current = { coordinate, timestamp };
          setRiderLocation(coordinate);
          setRiderLocationAccuracy(position.coords.accuracy);
          setRiderSpeed(measuredSpeed);
          setLocationStatus("active");
        },
        () => {
          setLocationStatus(hasReceivedLocation ? "stale" : "unavailable");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 15_000,
          timeout: 10_000,
        },
      );
    }

    void startLocationWatch();

    return () => {
      disposed = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const arrivalsQuery = useQuery({
    queryKey: ["live-direction-arrivals", journey.boardStop.id],
    queryFn: () => fetchStopArrivals(journey.boardStop.id),
    enabled: Boolean(
      !isFinalWalk && journey.tripId && journey.dataSource !== "mock",
    ),
    refetchInterval: LIVE_REFRESH_MS,
  });
  const walkingDirectionsQuery = useQuery({
    queryKey: ["walking-directions", journey.id],
    queryFn: () => fetchWalkingDirections(journey),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const journeyArrival = useMemo(
    () =>
      journey.tripId
        ? arrivalsQuery.data?.arrivals.find(
            (arrival) =>
              arrival.estimated && arrival.trip === journey.tripId,
          )
        : undefined,
    [arrivalsQuery.data, journey.tripId],
  );
  const refreshedVehicleLocation = arrivalCoordinate(journeyArrival);
  const initialVehicleLocation =
    journey.dataSource === "live" ? journey.simulation.transitPosition : undefined;
  const vehicleLocation =
    refreshedVehicleLocation ??
    (arrivalsQuery.isPending || arrivalsQuery.isRefetchError
      ? initialVehicleLocation
      : undefined);
  const vehicleLabel = journeyArrival
    ? busArrivalLabel(journeyArrival, t)
    : journey.etaMinutes != null
      ? t("{minutes} min", { minutes: journey.etaMinutes })
      : t("Bus");
  const routedWalking = walkingDirectionsQuery.data;
  const fallbackWalkingSteps = journey.walkingInstructions.filter(
    (instruction) => !instruction.toLowerCase().startsWith("board route"),
  );
  const startWalkingSteps: Array<string | WalkingRouteStep> =
    routedWalking?.start?.steps.filter(
      (instruction) => instruction.maneuver !== "destination",
    ) ?? fallbackWalkingSteps;
  const finalWalkingSteps: Array<string | WalkingRouteStep> =
    routedWalking?.end?.steps.filter(
      (instruction) => instruction.maneuver !== "destination",
    ) ?? [t("Continue toward {place}.", { place: journey.destination.name })];
  const rideStopSequence = useMemo(
    () =>
      journey.rideStopSequence?.length
        ? journey.rideStopSequence
        : [journey.boardStop, journey.alightStop],
    [journey],
  );
  const boarding = boardingProximity(riderLocation, journey.boardStop.coordinate);
  const progressLocation = refreshedVehicleLocation ?? riderLocation;

  useEffect(() => {
    if (
      journeyProgress !== "walking-to-stop" ||
      locationStatus !== "active" ||
      boarding.state !== "at-stop" ||
      (riderLocationAccuracy != null && riderLocationAccuracy > 100)
    ) {
      return;
    }

    const dwellTimer = window.setTimeout(() => {
      setJourneyProgress("waiting-for-bus");
      setStage("wait-for-bus");
    }, BOARDING_STOP_DWELL_MS);

    return () => window.clearTimeout(dwellTimer);
  }, [
    boarding.state,
    journeyProgress,
    locationStatus,
    riderLocationAccuracy,
  ]);

  const likelyBoarded = hasLikelyBoardedBus({
    riderLocation,
    vehicleLocation: refreshedVehicleLocation,
    boardingStop: journey.boardStop.coordinate,
    riderAccuracyMeters: riderLocationAccuracy,
    riderSpeedMetersPerSecond: riderSpeed,
  });

  useEffect(() => {
    if (journeyProgress !== "waiting-for-bus" || !likelyBoarded) {
      boardingEvidenceSamples.current = 0;
      return;
    }

    boardingEvidenceSamples.current += 1;
    if (
      boardingEvidenceSamples.current < REQUIRED_BOARDING_EVIDENCE_SAMPLES
    ) {
      return;
    }

    boardingEvidenceSamples.current = 0;
    setOnboardStopIndex(0);
    setJourneyProgress("onboard");
    setStage("onboard");
  }, [journeyProgress, likelyBoarded, refreshedVehicleLocation, riderLocation]);

  useEffect(() => {
    if (journeyProgress !== "onboard" || !progressLocation) return;
    const animationFrame = window.requestAnimationFrame(() => {
      setOnboardStopIndex((currentIndex) =>
        nextStopProgressIndex(
          rideStopSequence,
          progressLocation,
          currentIndex,
        ),
      );
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [journeyProgress, progressLocation, rideStopSequence]);

  function moveStage(direction: -1 | 1) {
    const currentIndex = GUIDANCE_STAGES.indexOf(stage);
    const nextIndex = Math.min(
      GUIDANCE_STAGES.length - 1,
      Math.max(0, currentIndex + direction),
    );
    setStage(GUIDANCE_STAGES[nextIndex]);
  }

  const remainingStops = stopsRemaining(rideStopSequence, onboardStopIndex);
  const totalRideSegments = Math.max(1, rideStopSequence.length - 1);
  const remainingRideMinutes = Math.max(
    0,
    Math.round(journey.rideMinutes * (remainingStops / totalRideSegments)),
  );
  const visibleRideStops = rideStopSequence.slice(
    Math.min(onboardStopIndex, rideStopSequence.length - 1),
  );
  const getOffAlert = getOffAlertCopy(
    remainingStops,
    journey.alightStop.name,
  );

  const reachedAlightingStop = hasReachedAlightingStop(
    progressLocation,
    journey.alightStop.coordinate,
    onboardStopIndex,
    rideStopSequence.length - 1,
  );

  useEffect(() => {
    if (journeyProgress !== "onboard" || !reachedAlightingStop) return;

    const dwellTimer = window.setTimeout(() => {
      setJourneyProgress("after-ride");
      setStage("final-walk");
    }, ALIGHTING_STOP_DWELL_MS);

    return () => window.clearTimeout(dwellTimer);
  }, [journeyProgress, reachedAlightingStop]);

  const isFinalWalkActive = journeyProgress === "after-ride";
  const destinationDistance = isFinalWalkActive && riderLocation
    ? distanceBetweenCoordinates(riderLocation, journey.destination.coordinate)
    : undefined;
  const destinationReached =
    destinationDistance != null && destinationDistance <= 70;
  const usesScheduledBusFallback =
    journey.dataSource === "mock" ||
    !journey.tripId ||
    (!arrivalsQuery.isPending && !vehicleLocation);
  let locationStatusContent: React.ReactNode;
  if (locationStatus === "active") {
    locationStatusContent = t("Your location is updating");
  } else if (locationStatus === "checking") {
    locationStatusContent = t("Finding your location…");
  } else if (locationStatus === "stale") {
    locationStatusContent = t("Location update paused · Showing your last position");
  } else {
    locationStatusContent = (
      <>
        {t("Your location is unavailable")} ·{" "}
        <Link
          to="/settings"
          className="font-semibold text-transit-blue underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {t("Open Settings")}
        </Link>
      </>
    );
  }

  let busStatusContent: React.ReactNode;
  if (usesScheduledBusFallback) {
    busStatusContent = (
      <>
        {t("Scheduled arrival · {time}", { time: journey.boardStop.time })}
      </>
    );
  } else if (arrivalsQuery.isPending) {
    busStatusContent = vehicleLocation
      ? t("Refreshing the last available bus position…")
      : t("Locating the bus for this trip…");
  } else if (arrivalsQuery.isRefetchError && vehicleLocation) {
    busStatusContent = t("Bus update paused · Showing the last available position");
  } else if (journeyArrival && vehicleLocation) {
    busStatusContent = `${busArrivalCopy(journeyArrival, t)} · ${updateAge(arrivalsQuery.dataUpdatedAt, t)}`;
  } else if (journeyArrival) {
    busStatusContent = `${busArrivalCopy(journeyArrival, t)} · ${t("Vehicle position unavailable")}`;
  } else {
    busStatusContent = (
      <>
        {t("Scheduled arrival · {time}", { time: journey.boardStop.time })}
      </>
    );
  }

  return (
    <main className="app-shell relative h-dvh overflow-hidden bg-canvas">
      <div className="absolute inset-0">
        <DirectionsMap
          journey={journey}
          phase={phase}
          showControls={false}
          riderLocation={
            isFinalWalk && !isFinalWalkActive ? null : riderLocation ?? null
          }
          vehicleLocation={isFinalWalk ? null : vehicleLocation ?? null}
          vehicleLabel={vehicleLabel}
          showDirectionArrow={false}
        />
      </div>

      <header className="absolute inset-x-0 top-0 z-[1200] flex min-h-16 items-center border-b border-hairline bg-canvas px-3 pt-[env(safe-area-inset-top)]">
        <Link
          to="/directions/$journeyId"
          params={{ journeyId: journey.id }}
          search={search}
          aria-label={t("Back to directions")}
          className="flex h-10 w-10 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-medium text-ink">
          {t("Trip Guidance")}
        </h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section
        aria-live="polite"
        className="absolute inset-x-3 bottom-[5.75rem] z-[1100] overflow-hidden rounded-[2px] border border-charcoal-600 bg-canvas [touch-action:pan-y]"
        onPointerDown={(event) => {
          swipeStartX.current = event.clientX;
        }}
        onPointerCancel={() => {
          swipeStartX.current = null;
        }}
        onPointerUp={(event) => {
          if (swipeStartX.current == null) return;
          const distance = event.clientX - swipeStartX.current;
          swipeStartX.current = null;
          if (Math.abs(distance) < 44) return;
          moveStage(distance < 0 ? 1 : -1);
        }}
      >
        <div className="flex min-h-[43px] items-center gap-3 bg-charcoal-400 px-6 py-2.5">
          {!isWaitingForBus ? (
            <FigmaIcon
              name={isOnboard ? "busRoute" : "walking"}
              size={20}
              className={isOnboard ? "h-5 w-5" : "h-5 w-[14px]"}
            />
          ) : null}
          <h2 className="min-w-0 flex-1 text-xs font-medium text-ink">
            {isWaitingForBus ? (
              <>{t("Wait for")}</>
            ) : isWalkingToStop ? (
              <>{t("Walk {minutes} minutes to", {
                minutes: routedWalking?.start?.durationMinutes ??
                  journey.walkStartMinutes,
              })}</>
            ) : isOnboard ? (
              remainingStops <= 0 ? (
                <>{t("This is your stop")}</>
              ) : remainingStops === 1 ? (
                <>{t("Get off at the next stop")}</>
              ) : (
                <>
                  {t("Get off in")} <strong>{t("{count} stops", { count: remainingStops })}</strong>
                </>
              )
            ) : (
              <>
                {t("Walk")} <strong>{minuteLabel(
                  routedWalking?.end?.durationMinutes ?? journey.walkEndMinutes,
                  t,
                )}</strong> {t("to your destination")}
              </>
            )}
          </h2>
          {isOnboard ? (
            <span className="shrink-0 text-xs font-semibold text-ink">
              {minuteLabel(remainingRideMinutes, t)}
            </span>
          ) : null}
        </div>

        <div className="px-5 py-3.5">
          {journey.dataSource === "mock" ? (
            <p className="mb-2 text-[11px] font-medium text-body">
              {t("Simulated guidance")}
            </p>
          ) : null}
          {locationStatus !== "active" ||
          (isOnboard && !progressLocation) ? (
            <div className="mb-3 space-y-1.5 border-b border-hairline pb-3 text-[11px] font-medium leading-snug text-body">
              {locationStatus !== "active" ? (
                <p className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-charcoal-600"
                    aria-hidden="true"
                  />
                  <span>{locationStatusContent}</span>
                </p>
              ) : null}
              {isOnboard && !progressLocation ? (
                <p>
                  {t("Stop progress is paused · The scheduled stop sequence remains available")}
                </p>
              ) : null}
            </div>
          ) : null}
          {isWaitingForBus ? (
            <div>
              <div className="flex items-start gap-3">
                <RouteLineBadge route={journey.route} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-ink">
                    {journey.routeHeadsign}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-body">
                    {journey.boardStop.name}
                  </p>
                </div>
              </div>
              <p
                className="mt-3 flex items-start gap-2 border-t border-hairline pt-3 text-xs font-medium leading-snug text-body"
                aria-label={usesScheduledBusFallback ? `Scheduled arrival time ${journey.boardStop.time}` : undefined}
              >
                {usesScheduledBusFallback ? (
                  <ScheduleIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                ) : (
                  <FigmaIcon name="liveSignal" size={12} className="mt-0.5 h-3 w-3 shrink-0" />
                )}
                <span>{busStatusContent}</span>
              </p>
            </div>
          ) : isOnboard ? (
            <div>
              <div className="flex items-start gap-3 border-b border-hairline pb-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)] bg-transit-blue" aria-hidden="true">
                  <FigmaIcon name="busRoute" size={17} className="h-[17px] w-[14px] brightness-0 invert" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold leading-snug text-ink">
                    {journey.alightStop.name}
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${remainingStops <= 2 ? "text-transit-blue" : "text-body"}`} role="status">
                    {getOffAlert}
                  </p>
                </div>
                <time className="shrink-0 text-xs font-semibold text-ink">
                  {journey.alightStop.time}
                </time>
              </div>
              <ol
                aria-label={t("Stops on this ride")}
                className="max-h-[30dvh] overflow-y-auto py-1 pl-1"
              >
                {visibleRideStops.map((stop, index) => {
                  const isCurrentStop = index === 0;
                  const isAlightingStop = index === visibleRideStops.length - 1;
                  return (
                    <li key={`${stop.id}-${index}`} className="relative grid min-h-9 grid-cols-[16px_1fr_auto] items-center gap-2 text-xs">
                      {!isAlightingStop ? (
                        <span className="absolute bottom-0 left-[7px] top-1/2 w-0.5 bg-transit-blue" aria-hidden="true" />
                      ) : null}
                      {index > 0 ? (
                        <span className="absolute bottom-1/2 left-[7px] top-0 w-0.5 bg-transit-blue" aria-hidden="true" />
                      ) : null}
                      <span
                        className={`relative z-10 mx-auto rounded-full border-2 border-transit-blue bg-canvas ${isCurrentStop || isAlightingStop ? "h-3 w-3" : "h-2.5 w-2.5"}`}
                        aria-hidden="true"
                      />
                      <span className={`${isCurrentStop || isAlightingStop ? "font-semibold text-ink" : "font-medium text-body"}`}>
                        {stop.name}
                      </span>
                      <time className="text-[11px] font-medium text-body">{stop.time}</time>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {isFinalWalk ? (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas-softer" aria-hidden="true">
                    <FigmaIcon name="placeFilled" size={16} className="h-4 w-4" />
                  </span>
                ) : (
                  <BusStopSignIcon />
                )}
                <p className="min-w-0 text-sm font-medium text-ink">
                  {isWalkingToStop ? journey.boardStop.name : journey.destination.name}
                </p>
              </div>
              <p className="mt-2 text-xs font-medium text-ink">
                {isWalkingToStop
                  ? `${boarding.distanceMeters != null
                      ? `${roundedWalkingDistance(boarding.distanceMeters)} m`
                      : routedWalking?.start?.distance ?? journey.walkStartDistance} left`
                  : destinationReached
                    ? journey.destination.name
                    : `${destinationDistance != null
                        ? `${roundedWalkingDistance(destinationDistance)} m`
                        : routedWalking?.end?.distance ?? journey.walkEndDistance} left`}
              </p>
              <ol aria-label={t("Walking directions")} className="relative ml-1 mt-2 pl-4 text-xs leading-[1.45] text-body">
                {(isWalkingToStop ? startWalkingSteps : finalWalkingSteps).map((direction, index) => {
                  const instruction = typeof direction === "string" ? direction : direction.instruction;
                  return (
                    <li
                      key={`${instruction}-${index}`}
                      className="relative pb-2.5 last:pb-0 before:absolute before:-left-4 before:top-[0.55rem] before:w-2 before:border-t before:border-dotted before:border-charcoal-600 after:absolute after:-left-4 after:bottom-0 after:top-0 after:border-l after:border-dotted after:border-charcoal-600 last:after:bottom-auto last:after:h-[0.55rem]"
                    >
                      {instruction}
                    </li>
                  );
                })}
              </ol>
              {isWalkingToStop ? (
                <p
                  className="mt-3 flex items-start gap-2 border-t border-hairline pt-3 text-xs font-medium leading-snug text-body"
                  aria-label={
                    usesScheduledBusFallback
                      ? `Scheduled arrival time ${journey.boardStop.time}`
                      : undefined
                  }
                >
                  {usesScheduledBusFallback ? (
                    <ScheduleIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <FigmaIcon
                      name="liveSignal"
                      size={12}
                      className="mt-0.5 h-3 w-3 shrink-0"
                    />
                  )}
                  <span>{busStatusContent}</span>
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <nav
        aria-label={t("Journey stages")}
        className="absolute inset-x-0 bottom-[4.15rem] z-[1150] flex h-7 items-center justify-center gap-1"
      >
        {GUIDANCE_STAGES.map((guidanceStage, index) => (
          <button
            key={guidanceStage}
            type="button"
            aria-label={t("Show journey part {current} of {total}", { current: index + 1, total: GUIDANCE_STAGES.length })}
            aria-current={stage === guidanceStage ? "step" : undefined}
            onClick={() => setStage(guidanceStage)}
            className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span
              className={`h-2 w-2 rounded-full border transition-colors ${
                stage === guidanceStage
                  ? "border-transit-blue bg-transit-blue"
                  : "border-charcoal-600 bg-canvas"
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </nav>

      <div className="absolute inset-x-0 bottom-0 z-[1200] flex min-h-16 gap-2 border-t border-hairline bg-canvas px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <Link
          to="/home"
          className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-pill)] border border-hairline bg-canvas px-4 text-sm font-medium text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("End")}
        </Link>
        {journeyProgress === "walking-to-stop" ? (
          <Button
            className="min-h-9 bg-transit-blue px-4 text-sm font-semibold text-on-primary hover:bg-transit-blue"
            onClick={() => {
              setJourneyProgress("waiting-for-bus");
              setStage("wait-for-bus");
            }}
          >
            {t("I’m at the stop")}
          </Button>
        ) : journeyProgress === "waiting-for-bus" ? (
          <Button
            className="min-h-9 bg-transit-blue px-4 text-sm font-semibold text-on-primary hover:bg-transit-blue"
            onClick={() => {
              setOnboardStopIndex(0);
              setJourneyProgress("onboard");
              setStage("onboard");
            }}
          >
            {t("I’m on the bus")}
          </Button>
        ) : journeyProgress === "onboard" ? (
          <Button
            className="min-h-9 bg-transit-blue px-4 text-sm font-semibold text-on-primary hover:bg-transit-blue"
            onClick={() => {
              setJourneyProgress("after-ride");
              setStage("final-walk");
            }}
          >
            {t("I’m off the bus")}
          </Button>
        ) : (
          <Link
            to="/home"
            className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-pill)] bg-transit-blue px-4 text-sm font-semibold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("Finish trip")}
          </Link>
        )}
        <Button
          variant="secondary"
          className="min-h-9 rounded-[var(--radius-pill)] border-transit-blue px-4 text-sm text-transit-blue"
          onClick={() => setSaved((value) => !value)}
          aria-pressed={saved}
        >
          {t(saved ? "Saved" : "Favorite")}
        </Button>
      </div>
    </main>
  );
}
