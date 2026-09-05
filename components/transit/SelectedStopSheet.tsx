import { Link } from "@tanstack/react-router";

import type { NearbyStopResult, TheBusArrival } from "@/types/transit";
import { useI18n } from "@/lib/i18n";

function formatRouteTime(arrival: TheBusArrival | undefined, t: (message: string, values?: Record<string, string | number>) => string): string {
  if (!arrival) return "—";
  if (!arrival.estimated) return arrival.stopTime;
  if (arrival.minutesUntil == null) return arrival.stopTime;
  if (arrival.minutesUntil === 0) return t("Now");
  return t("{minutes} min", { minutes: arrival.minutesUntil });
}

export function SelectedStopSheet({
  stopResult,
  loading = false,
  onClose,
}: {
  stopResult: NearbyStopResult;
  loading?: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { stop, lines, arrivals } = stopResult;
  const visibleLines = lines.slice(0, 12);

  return (
    <section
      aria-label={t("Selected stop {name}", { name: stop.name })}
      className="home-screen__sheet home-screen__selected-stop absolute inset-x-0 bottom-0 z-[1000] overflow-x-hidden overflow-y-auto rounded-t-[var(--radius-xl)] border-t border-hairline bg-canvas"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("Close stop details")}
        className="flex h-6 w-full items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-transit-blue"
      >
        <span className="h-1 w-8 rounded-full bg-charcoal-500" />
      </button>

      <div className="px-4 pb-4">
        <div className="flex items-start gap-2">
          <span className="shrink-0 rounded-[2px] bg-brand-blue px-1 py-0.5 text-sm font-normal leading-none text-on-primary">
            {stop.id}
          </span>
          <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-ink">
            {stop.name}
          </h2>
        </div>

        <p className="mt-[10px] text-xs font-normal uppercase tracking-[0.02em] text-mute">
          {loading ? t("Loading services…") : t("{count} services", { count: lines.length })}
        </p>

        {stopResult.error ? (
          <p className="mt-[10px] text-xs leading-relaxed text-body">
            {t("Service information is temporarily unavailable. You can still open this stop’s arrivals page.")}
          </p>
        ) : null}

        <ul
          className="selected-stop-sheet__grid grid grid-cols-4 gap-1.5"
          aria-busy={loading}
        >
          {visibleLines.map((line) => {
            const arrival = arrivals.find((item) => item.route === line);
            const routeTime = formatRouteTime(arrival, t);
            const isArrivingNow = arrival?.estimated && arrival.minutesUntil === 0;
            const label = `Route ${line}, ${arrival?.estimated ? "arriving" : "scheduled"} ${routeTime}`;
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-[2px] bg-brand-blue px-1 text-[0.8125rem] font-bold leading-none text-on-primary"
                >
                  {line}
                </span>
                <span
                  aria-hidden="true"
                  className={`min-w-0 truncate text-[0.6875rem] ${
                    isArrivingNow ? "font-bold text-live" : "font-normal text-ink"
                  }`}
                >
                  {routeTime}
                </span>
              </>
            );
            const tileClassName =
              "flex min-h-8 min-w-0 items-center gap-1 rounded-[2px] bg-canvas-softer p-1 transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

            return (
              <li key={line}>
                {arrival ? (
                  <Link
                    to="/stops/$id/track/$arrivalId"
                    params={{ id: stop.id, arrivalId: arrival.id }}
                    aria-label={`Track ${label}`}
                    className={tileClassName}
                  >
                    {content}
                  </Link>
                ) : (
                  <Link
                    to="/schedule"
                    search={{ stop: stop.id, route: line }}
                    aria-label={`View schedule for ${label}`}
                    className={tileClassName}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            to="/stops/$id"
            params={{ id: stop.id }}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-xs)] bg-brand-blue px-3 text-sm font-bold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transit-blue"
          >
            {t("Arrivals")}
          </Link>
          <Link
            to="/plan"
            search={{ destination: stop.name }}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-xs)] border border-brand-blue bg-canvas px-3 text-sm font-normal text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-transit-blue"
          >
            {t("Direction")}
          </Link>
        </div>
      </div>
    </section>
  );
}
