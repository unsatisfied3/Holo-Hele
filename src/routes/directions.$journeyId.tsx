import { useState } from "react";
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
import { fetchServiceAlerts } from "@/lib/api/transit";
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
import type { JourneyOption, TransitAlert } from "@/types/transit";

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

function TimelineSegment({
  line,
  position,
}: {
  line: TimelineLine;
  position: "incoming" | "outgoing";
}) {
  const positionClass =
    position === "incoming" ? "top-0 h-3" : "top-3 bottom-0";
  const lineClass =
    line === "solid"
      ? "w-1 rounded-full bg-transit-blue"
      : "border-l-[3px] border-dotted border-charcoal-500";

  return (
    <span
      className={`absolute left-1/2 -translate-x-1/2 ${positionClass} ${lineClass}`}
    />
  );
}

function TimelineRail({
  marker = true,
  incoming,
  outgoing,
}: {
  marker?: boolean;
  incoming?: TimelineLine;
  outgoing?: TimelineLine;
}) {
  return (
    <span className="relative flex h-full min-h-8 w-5 justify-center" aria-hidden="true">
      {incoming ? <TimelineSegment line={incoming} position="incoming" /> : null}
      {outgoing ? <TimelineSegment line={outgoing} position="outgoing" /> : null}
      {marker ? (
        <span className="absolute top-1.5 z-10 h-3 w-3 rounded-full border-[3px] border-transit-blue bg-canvas" />
      ) : null}
    </span>
  );
}

function WalkingDirectionDetails({
  id,
  directions,
  destinationLabel,
}: {
  id: string;
  directions: string[];
  destinationLabel: string;
}) {
  return (
    <div id={id} className="pb-3 pl-1">
      <div className="mb-1.5 flex items-start gap-2 rounded-[var(--radius-xs)] bg-alert-subtle px-2.5 py-2 text-xs leading-snug text-body">
        <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-alert" />
        <span>Approximate walking directions. Use caution and confirm street conditions.</span>
      </div>
      <ol className="divide-y divide-hairline">
        {directions.map((instruction) => (
          <li key={instruction} className="py-2 text-sm leading-snug text-ink">
            {instruction}
          </li>
        ))}
        <li className="flex items-start gap-2 py-2 text-sm font-medium leading-snug text-brand-blue">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white">
            i
          </span>
          Destination: {destinationLabel}
        </li>
      </ol>
    </div>
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
  const alertsQuery = useQuery({
    queryKey: SERVICE_ALERTS_QUERY_KEY,
    queryFn: fetchServiceAlerts,
    staleTime: SERVICE_ALERT_REFRESH_MS,
    refetchInterval: SERVICE_ALERT_REFRESH_MS,
  });
  const journeyAlert = findJourneyAlert(alertsQuery.data?.alerts ?? [], journey);
  const usesPreviewOrigin = journey.origin.name.toLowerCase().includes("preview");
  const originDisplayName = usesPreviewOrigin
    ? "Starting point"
    : journey.origin.name === "Current location"
      ? "Your location"
      : journey.origin.name;
  const showOriginDetail =
    !usesPreviewOrigin &&
    journey.origin.detail.toLowerCase() !== "approximate device location";
  const startWalkingDirections = journey.walkingInstructions.filter(
    (instruction) => !instruction.toLowerCase().startsWith("board route"),
  );
  const rideStopSequence = journey.rideStopSequence ?? [
    journey.boardStop,
    journey.alightStop,
  ];
  const backSearch = {
    destination,
    destinationDetail: search.destinationDetail,
    destinationLat: search.destinationLat,
    destinationLng: search.destinationLng,
  };

  return (
    <main className="app-shell min-h-dvh !overflow-y-auto bg-canvas">
      <header className="sticky top-0 z-[1200] flex min-h-14 shrink-0 items-center border-b border-hairline bg-canvas px-3 pt-[env(safe-area-inset-top)]">
        <Link
          to="/plan"
          search={backSearch}
          aria-label="Back to route options"
          className="flex h-10 w-10 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={22} className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-ink">
          Trip Details
        </h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section
        className="h-52 shrink-0 border-b border-hairline bg-canvas"
        role="region"
        aria-label="Trip route overview"
      >
        <DirectionsMap journey={journey} showControls={false} compact />
      </section>

      <section className="shrink-0 border-b border-hairline bg-canvas px-4 py-4">
        {journey.dataSource === "mock" ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-body">
            Simulated trip preview
          </p>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-bold text-ink">
              <time>{journey.origin.time}</time>
              <span className="mx-2 text-mute" aria-hidden="true">–</span>
              <time>{journey.destination.time}</time>
            </p>
            <p className="mt-1 text-sm text-body">
              {originDisplayName} to {journey.destination.name}
            </p>
          </div>
          <p className="shrink-0 text-right text-sm font-semibold text-ink">
            {journey.travelMinutes} min
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5" aria-label="Trip modes">
          <span className="inline-flex items-end gap-1 rounded-[var(--radius-xs)] bg-canvas-soft px-2 py-1 text-xs text-ink">
            <FigmaIcon name="walking" size={18} className="h-[18px] w-3" />
            {journey.walkStartMinutes} min
          </span>
          <FigmaIcon name="chevronRight" size={18} className="h-[18px] w-[18px]" />
          <RouteLineBadge route={journey.route} />
          {journey.walkEndMinutes > 0 ? (
            <>
              <FigmaIcon name="chevronRight" size={18} className="h-[18px] w-[18px]" />
              <span className="inline-flex items-end gap-1 rounded-[var(--radius-xs)] bg-canvas-soft px-2 py-1 text-xs text-ink">
                <FigmaIcon name="walking" size={18} className="h-[18px] w-3" />
                {journey.walkEndMinutes} min
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs font-medium">
          {journey.dataSource === "live" && journey.etaMinutes != null ? (
            <>
              <LiveSignalIcon className="h-3.5 w-3.5 text-live" />
              <span className="text-live">Live · Bus arrives in {journey.etaMinutes} min</span>
            </>
          ) : journey.dataSource === "scheduled" ? (
            <>
              <ScheduleIcon className="h-4 w-4 text-body" />
              <span className="text-body">Scheduled departure</span>
            </>
          ) : (
            <span className="text-body">Simulated timing</span>
          )}
        </div>
      </section>

      {journeyAlert ? (
        <div className="shrink-0 border-b border-hairline bg-canvas">
          <ServiceAlertBanner alert={journeyAlert} />
        </div>
      ) : null}

      <section className="mt-2 shrink-0 bg-canvas pb-20" aria-label="Trip itinerary">
        <ol className="px-4 py-1">
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail outgoing="dotted" />
            <div className="flex items-start justify-between gap-3 border-b border-hairline py-3">
              <div>
                <strong className="text-sm text-ink">{originDisplayName}</strong>
                {showOriginDetail ? (
                  <p className="mt-0.5 text-xs text-body">{journey.origin.detail}</p>
                ) : null}
              </div>
              <time className="shrink-0 text-sm text-ink">{journey.origin.time}</time>
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail marker={false} incoming="dotted" outgoing="dotted" />
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
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <FigmaIcon name="walking" size={18} className="h-[18px] w-3 shrink-0" />
                  Walk
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-body">
                  <FigmaIcon
                    name="chevronDown"
                    size={14}
                    className={`h-3.5 w-3.5 transition-transform ${expandedSections.walkStart ? "rotate-180" : ""}`}
                  />
                  About {journey.walkStartMinutes} min, {journey.walkStartDistance}
                </span>
              </button>
              {expandedSections.walkStart ? (
                <WalkingDirectionDetails
                  id="walk-start-directions"
                  directions={startWalkingDirections.length > 0
                    ? startWalkingDirections
                    : [`Continue toward ${journey.boardStop.name}.`]}
                  destinationLabel={journey.boardStop.name}
                />
              ) : null}
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail incoming="dotted" outgoing="solid" />
            <div className="border-b border-hairline">
              <button
                type="button"
                className="min-h-11 w-full py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-expanded={expandedSections.ride}
                aria-controls="ride-stop-sequence"
                onClick={() =>
                  setExpandedSections((current) => ({
                    ...current,
                    ride: !current.ride,
                  }))
                }
              >
                <span className="flex items-start gap-2 text-sm font-semibold leading-snug text-ink">
                  <RouteLineBadge route={journey.route} />
                  <span>{journey.routeHeadsign}</span>
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 text-xs text-body">
                  <FigmaIcon
                    name="chevronDown"
                    size={14}
                    className={`h-3.5 w-3.5 transition-transform ${expandedSections.ride ? "rotate-180" : ""}`}
                  />
                  Ride {journey.rideStops} stops · {journey.rideMinutes} min
                </span>
              </button>
              {expandedSections.ride ? (
                <ol id="ride-stop-sequence" className="pb-3 pl-5">
                  {rideStopSequence.map((stop, index) => (
                    <li
                      key={`${stop.id}-${index}`}
                      className="relative flex items-start justify-between gap-3 border-l-2 border-transit-blue pb-3 pl-4 text-xs last:border-transparent last:pb-0"
                    >
                      <span className="absolute -left-[5px] top-0.5 h-2 w-2 rounded-full border-2 border-transit-blue bg-canvas" />
                      <span className="font-medium leading-snug text-ink">{stop.name}</span>
                      <time className="shrink-0 text-body">{stop.time}</time>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail incoming="solid" outgoing="dotted" />
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
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <FigmaIcon name="walking" size={18} className="h-[18px] w-3 shrink-0" />
                  Walk
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-body">
                  <FigmaIcon
                    name="chevronDown"
                    size={14}
                    className={`h-3.5 w-3.5 transition-transform ${expandedSections.walkEnd ? "rotate-180" : ""}`}
                  />
                  About {journey.walkEndMinutes} min, {journey.walkEndDistance}
                </span>
              </button>
              {expandedSections.walkEnd ? (
                <WalkingDirectionDetails
                  id="walk-end-directions"
                  directions={[
                    `Head toward ${journey.destination.name}.`,
                    `Continue for approximately ${journey.walkEndDistance} until you reach your destination.`,
                  ]}
                  destinationLabel={journey.destination.name}
                />
              ) : null}
            </div>
          </li>
          <li className="grid grid-cols-[20px_1fr] gap-x-2.5">
            <TimelineRail incoming="dotted" />
            <div className="flex items-start justify-between gap-3 py-3">
              <div>
                <strong className="text-sm text-ink">{journey.destination.name}</strong>
                <p className="mt-0.5 text-xs text-body">{journey.destination.detail}</p>
              </div>
              <time className="shrink-0 text-sm text-ink">{journey.destination.time}</time>
            </div>
          </li>
        </ol>
      </section>

        <div className="fixed inset-x-0 bottom-0 z-[1100] mx-auto flex w-full max-w-[430px] gap-2 border-x border-t border-hairline bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
          <Button
            className="min-h-11 flex-1 rounded-[var(--radius-md)] !bg-transit-blue px-5 text-sm !text-white hover:!bg-brand-blue focus-visible:!outline-transit-blue"
            onClick={() =>
              void navigate({
                to: "/live-directions/$journeyId",
                params: { journeyId: journey.id },
                search,
              })
            }
          >
            Start
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 flex-1 rounded-[var(--radius-md)] border-transit-blue px-5 text-sm text-transit-blue"
            onClick={() => setSaved((value) => !value)}
            aria-pressed={saved}
          >
            {saved ? "Saved" : "Favorite"}
          </Button>
        </div>
    </main>
  );
}
