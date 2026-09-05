import { useEffect, useRef } from "react";

import { RouteLineBadge, ScheduleIcon } from "@/components/icons/FigmaIcon";
import { ArrivalTimeDisplay } from "@/components/transit/ArrivalTimeDisplay";
import type {
  StopLocation,
  StopsAwaySource,
  TheBusArrival,
} from "@/types/transit";
import { useI18n } from "@/lib/i18n";

interface TrackingSummaryProps {
  stop: StopLocation;
  arrivals: TheBusArrival[];
  activeArrivalId: string;
  stopsAway: number | null;
  stopsAwaySource: StopsAwaySource;
  onArrivalSelect: (arrival: TheBusArrival) => void;
}

function trackingStatus(
  arrival: TheBusArrival,
  active: boolean,
  stopsAway: number | null,
  stopsAwaySource: StopsAwaySource,
  t: (message: string, values?: Record<string, string | number>) => string,
): string {
  if (
    arrival.minutesUntil === 0 ||
    (active && stopsAwaySource === "exact" && stopsAway === 0)
  ) {
    return t("Arriving now");
  }

  if (
    active &&
    stopsAwaySource === "exact" &&
    stopsAway != null &&
    stopsAway > 2
  ) {
    return t("Stops away: {count}", { count: stopsAway });
  }

  if (arrival.minutesUntil != null) {
    return t("Arrives in {minutes} min", { minutes: arrival.minutesUntil });
  }

  if (active && stopsAwaySource === "estimated" && stopsAway != null) {
    return t("About {count} stops away", { count: stopsAway });
  }

  return arrival.estimated
    ? t("Expected at {time}", { time: arrival.stopTime })
    : t("Scheduled for {time}", { time: arrival.stopTime });
}

export function TrackingSummary({
  stop,
  arrivals,
  activeArrivalId,
  stopsAway,
  stopsAwaySource,
  onArrivalSelect,
}: TrackingSummaryProps) {
  const { t } = useI18n();
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndex = Math.max(
    0,
    arrivals.findIndex((arrival) => arrival.id === activeArrivalId),
  );

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollTo({
      left: carousel.clientWidth * activeIndex,
      behavior: "auto",
    });
  }, [activeIndex]);

  useEffect(
    () => () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    },
    [],
  );

  function selectIndex(index: number) {
    const arrival = arrivals[index];
    const carousel = carouselRef.current;
    if (!arrival || !carousel) return;

    carousel.scrollTo({
      left: carousel.clientWidth * index,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    if (arrival.id !== activeArrivalId) onArrivalSelect(arrival);
  }

  function settleCarousel() {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const carousel = carouselRef.current;
      if (!carousel || carousel.clientWidth === 0) return;
      const index = Math.max(
        0,
        Math.min(
          arrivals.length - 1,
          Math.round(carousel.scrollLeft / carousel.clientWidth),
        ),
      );
      const arrival = arrivals[index];
      if (arrival && arrival.id !== activeArrivalId) onArrivalSelect(arrival);
    }, 140);
  }

  return (
    <section
      aria-label={t("Buses serving this stop")}
      className="tracking-summary pointer-events-none absolute inset-x-0 bottom-0 z-[1200] pb-[max(env(safe-area-inset-bottom),1rem)]"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-80">
        <div
          ref={carouselRef}
          onScroll={settleCarousel}
          className="tracking-carousel flex items-start snap-x snap-mandatory overflow-x-auto rounded-[var(--radius-md)]"
        >
          {arrivals.map((arrival) => {
            const active = arrival.id === activeArrivalId;
            return (
              <article
                key={arrival.id}
                aria-current={active ? "true" : undefined}
                className="w-full shrink-0 snap-center overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-canvas"
              >
                <div className="flex min-h-20 items-center gap-3 px-4 py-4">
                  <RouteLineBadge route={arrival.route} />

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-medium leading-snug text-ink">
                      {arrival.headsign}
                    </h2>
                    <p className="mt-1 truncate text-xs text-body">{stop.name}</p>
                  </div>

                  <ArrivalTimeDisplay arrival={arrival} colorNearLive />
                </div>

                <p className="flex items-center gap-1.5 border-t border-hairline bg-canvas-softer px-5 py-3 text-xs text-body">
                  <ScheduleIcon className="h-3.5 w-3.5 shrink-0" />
                  <strong className="font-semibold text-ink">
                    {trackingStatus(
                      arrival,
                      active,
                      stopsAway,
                      stopsAwaySource,
                      t,
                    )}
                  </strong>
                </p>
              </article>
            );
          })}
        </div>

        {arrivals.length > 1 ? (
          <div
            className="mt-3 flex items-center justify-center gap-1.5"
            aria-label={t("Choose a bus to track")}
          >
            {arrivals.map((arrival, index) => (
              <button
                key={arrival.id}
                type="button"
                aria-label={t("Track route {route}, bus {current} of {total}", { route: arrival.route, current: index + 1, total: arrivals.length })}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => selectIndex(index)}
                className={`h-2 w-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-transit-blue ${
                  index === activeIndex ? "bg-ink" : "bg-charcoal-500"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
