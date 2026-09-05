import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  AlertTriangleIcon,
  FigmaIcon,
  RouteLineBadge,
} from "@/components/icons/FigmaIcon";
import { getAlertToneClasses } from "@/components/alerts/alertPresentation";
import { fetchServiceAlerts } from "@/lib/api/transit";
import { JOURNEY_OPTIONS } from "@/lib/mock/journeys";
import {
  canUseLocationWithoutPrompt,
  getLocationPreference,
} from "@/lib/onboarding";
import { fetchCachedTripPlan } from "@/lib/trip-planning";
import {
  alertAffectsRoute,
  alertAffectsStop,
  SERVICE_ALERT_REFRESH_MS,
  SERVICE_ALERTS_QUERY_KEY,
} from "@/lib/service-alerts";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type {
  JourneyOption,
  TransitAlert,
  TripTimeMode,
} from "@/types/transit";

interface PlanSearch {
  destination: string;
  destinationDetail?: string;
  destinationLat?: number;
  destinationLng?: number;
}

interface TripOrigin {
  name: string;
  lat: number;
  lng: number;
  isFallback: boolean;
}

const DOWNTOWN_PREVIEW_ORIGIN: TripOrigin = {
  name: "Downtown Honolulu preview",
  lat: 21.3047,
  lng: -157.8567,
  isFallback: true,
};

function optionalNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const Route = createFileRoute("/plan")({
  validateSearch: (search): PlanSearch => ({
    destination:
      typeof search.destination === "string" && search.destination.trim()
        ? search.destination
        : "Ala Moana Center",
    destinationDetail:
      typeof search.destinationDetail === "string"
        ? search.destinationDetail
        : undefined,
    destinationLat: optionalNumber(search.destinationLat),
    destinationLng: optionalNumber(search.destinationLng),
  }),
  component: PlanTripPage,
});

function findImportantJourneyAlert(
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

type TripSort = "best-route" | "least-walking" | "fewest-transfers";
type TimePeriod = "AM" | "PM";

const WHEEL_ITEM_HEIGHT = 44;
const HOUR_VALUES = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTE_VALUES = Array.from({ length: 60 }, (_, index) => index);
const PERIOD_VALUES: TimePeriod[] = ["AM", "PM"];

function getDefaultTripDateTime() {
  const date = new Date();
  date.setSeconds(0, 0);
  return date;
}

function toDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTripTime(value?: string, locale = "en-US") {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function TimeWheelColumn<T extends string | number>({
  label,
  values,
  value,
  onChange,
  formatValue = String,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatValue?: (value: T) => string;
}) {
  const listId = useId().replaceAll(":", "");
  const listRef = useRef<HTMLDivElement>(null);
  const selectedIndex = values.indexOf(value);

  useEffect(() => {
    listRef.current?.scrollTo({ top: selectedIndex * WHEEL_ITEM_HEIGHT });
  }, [selectedIndex]);

  const selectIndex = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(values.length - 1, index));
    const nextValue = values[boundedIndex];
    if (nextValue !== undefined) onChange(nextValue);
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${listId}-${selectedIndex}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          selectIndex(selectedIndex + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          selectIndex(selectedIndex - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          selectIndex(0);
        } else if (event.key === "End") {
          event.preventDefault();
          selectIndex(values.length - 1);
        }
      }}
      onScroll={(event) => {
        const nextIndex = Math.round(
          event.currentTarget.scrollTop / WHEEL_ITEM_HEIGHT,
        );
        selectIndex(nextIndex);
      }}
      className="time-wheel relative z-10 h-[132px] snap-y snap-mandatory overflow-y-auto overscroll-contain text-center focus-visible:rounded-[var(--radius-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal-700"
    >
      <div className="h-11" aria-hidden="true" />
      {values.map((option, index) => {
        const selected = option === value;
        return (
          <button
            key={String(option)}
            id={`${listId}-${index}`}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={selected}
            onClick={() => onChange(option)}
            className={cn(
              "flex h-11 w-full snap-center items-center justify-center text-lg transition-colors",
              selected ? "font-semibold text-ink" : "font-medium text-mute",
            )}
          >
            {formatValue(option)}
          </button>
        );
      })}
      <div className="h-11" aria-hidden="true" />
    </div>
  );
}

function TripTimeSheet({
  currentTime,
  onClose,
  onApply,
}: {
  currentTime?: string;
  onClose: () => void;
  onApply: (mode: TripTimeMode, requestedTime?: string) => void;
}) {
  const { t, locale } = useI18n();
  const startingDate = currentTime ? new Date(currentTime) : getDefaultTripDateTime();
  const safeStartingDate = Number.isFinite(startingDate.getTime())
    ? startingDate
    : getDefaultTripDateTime();
  const [sheetNow] = useState(getDefaultTripDateTime);
  const [draftMode, setDraftMode] = useState<TripTimeMode>("leave");
  const [editorTab, setEditorTab] = useState<"time" | "date">("time");
  const [draftDate, setDraftDate] = useState(toDateValue(safeStartingDate));
  const [draftHour, setDraftHour] = useState(safeStartingDate.getHours() % 12 || 12);
  const [draftMinute, setDraftMinute] = useState(safeStartingDate.getMinutes());
  const [draftPeriod, setDraftPeriod] = useState<TimePeriod>(
    safeStartingDate.getHours() >= 12 ? "PM" : "AM",
  );

  const selectMode = (mode: TripTimeMode) => {
    setDraftMode(mode);
    if (mode !== "now") return;
    const now = getDefaultTripDateTime();
    setDraftDate(toDateValue(now));
    setDraftHour(now.getHours() % 12 || 12);
    setDraftMinute(now.getMinutes());
    setDraftPeriod(now.getHours() >= 12 ? "PM" : "AM");
    setEditorTab("time");
  };

  const markEdited = () => {
    if (draftMode === "now") setDraftMode("leave");
  };

  const currentPeriod: TimePeriod = sheetNow.getHours() >= 12 ? "PM" : "AM";
  const isCurrentSelection =
    draftDate === toDateValue(sheetNow) &&
    draftHour === (sheetNow.getHours() % 12 || 12) &&
    draftMinute === sheetNow.getMinutes() &&
    draftPeriod === currentPeriod;
  const selectedDateTime = new Date(`${draftDate}T00:00:00`);
  selectedDateTime.setHours(
    (draftHour % 12) + (draftPeriod === "PM" ? 12 : 0),
    draftMinute,
    0,
    0,
  );
  const isPastSelection =
    draftMode !== "now" &&
    !isCurrentSelection &&
    selectedDateTime.getTime() < sheetNow.getTime();
  const dateOptions = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sheetNow);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return {
      value: toDateValue(date),
      label:
        index === 0
          ? t("Today")
          : index === 1
            ? t("Tomorrow")
            : new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date),
      detail: new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }).format(date),
    };
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const applySelection = () => {
    if (draftMode === "now" || isCurrentSelection) {
      onApply("now");
      return;
    }
    if (!Number.isFinite(selectedDateTime.getTime()) || isPastSelection) return;
    onApply(draftMode, selectedDateTime.toISOString());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-time-title"
        className="w-full max-w-[430px] rounded-t-[var(--radius-xl)] border border-hairline bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4"
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-charcoal-500" aria-hidden="true" />
        <h2 id="trip-time-title" className="text-base font-semibold text-ink">
          {t("Choose trip time")}
        </h2>

        <div className="mt-4 grid grid-cols-3 border-b border-hairline" aria-label={t("Trip time type")}>
          {(["now", "leave", "arrive"] as TripTimeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              autoFocus={mode === "leave"}
              aria-pressed={draftMode === mode}
              disabled={mode === "now" && isCurrentSelection}
              onClick={() => selectMode(mode)}
              className={cn(
                "relative min-h-11 px-2 text-sm font-medium disabled:cursor-default disabled:text-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-charcoal-700",
                draftMode === mode ? "text-transit-blue" : "text-body",
              )}
            >
              {t(mode === "now" ? "Now" : mode === "leave" ? "Leave" : "Arrive")}
              {draftMode === mode ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-transit-blue" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="py-6">
          <div className="grid grid-cols-2 rounded-[var(--radius-md)] bg-canvas-soft p-1" aria-label={t("Date and time editor")}>
            {(["time", "date"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={editorTab === tab}
                onClick={() => setEditorTab(tab)}
                className={cn(
                  "min-h-9 rounded-[var(--radius-xs)] text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal-700",
                  editorTab === tab ? "bg-canvas text-ink" : "text-body",
                )}
              >
                {t(tab === "time" ? "Time" : "Date")}
              </button>
            ))}
          </div>

          {editorTab === "time" ? (
            <div className="relative mt-3 grid grid-cols-3 gap-2" aria-label={t("Time picker")}>
              <div
                className="pointer-events-none absolute inset-x-0 top-11 h-11 rounded-[var(--radius-md)] bg-canvas-soft"
                aria-hidden="true"
              />
              <TimeWheelColumn
                label={t("Hour")}
                values={HOUR_VALUES}
                value={draftHour}
                onChange={(hour) => {
                  setDraftHour(hour);
                  markEdited();
                }}
              />
              <TimeWheelColumn
                label={t("Minute")}
                values={MINUTE_VALUES}
                value={draftMinute}
                onChange={(minute) => {
                  setDraftMinute(minute);
                  markEdited();
                }}
                formatValue={(minute) => String(minute).padStart(2, "0")}
              />
              <TimeWheelColumn
                label={t("AM or PM")}
                values={PERIOD_VALUES}
                value={draftPeriod}
                onChange={(period) => {
                  setDraftPeriod(period);
                  markEdited();
                }}
              />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("Trip date")}>
              {dateOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={draftDate === option.value}
                  onClick={() => {
                    setDraftDate(option.value);
                    markEdited();
                  }}
                  className={cn(
                    "min-h-12 rounded-[var(--radius-md)] border px-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-700",
                    draftDate === option.value
                      ? "border-brand-blue-border bg-brand-blue-subtle text-brand-blue"
                      : "border-hairline bg-canvas text-ink",
                  )}
                >
                  <span className="block text-xs font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-body">{option.detail}</span>
                </button>
              ))}
            </div>
          )}

          {isPastSelection ? (
            <p className="mt-3 text-xs font-medium text-closure" role="status">
              {t("Choose a future date or time.")}
            </p>
          ) : null}
          </div>

        <div className="grid grid-cols-2 gap-3 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-[var(--radius-md)] border border-hairline bg-canvas text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-700"
          >
            {t("Cancel")}
          </button>
          <button
            type="button"
            onClick={applySelection}
            disabled={isPastSelection}
            className="min-h-11 rounded-[var(--radius-md)] bg-transit-blue text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("Done")}
          </button>
        </div>
      </section>
    </div>
  );
}

function JourneyCard({
  journey,
  search,
  serviceAlert,
}: {
  journey: JourneyOption;
  serviceAlert?: TransitAlert;
  search: {
    destination: string;
    destinationDetail?: string;
    destinationLat?: number;
    destinationLng?: number;
    originName?: string;
    originLat?: number;
    originLng?: number;
    tripTimeMode?: TripTimeMode;
    requestedTime?: string;
  };
}) {
  const { t } = useI18n();
  const isLive = journey.dataSource === "live";
  const isNearLive =
    isLive && journey.etaMinutes != null && journey.etaMinutes <= 20;
  const liveScheduleStatus =
    isLive && journey.scheduleDeviationMinutes != null
      ? journey.scheduleDeviationMinutes >= 2
        ? t("Delayed")
        : journey.scheduleDeviationMinutes <= -2
          ? t("Early")
          : undefined
      : undefined;
  const liveStatusTone =
    liveScheduleStatus === "Delayed"
      ? "text-closure"
      : liveScheduleStatus === "Early"
        ? "text-alert"
        : isNearLive
          ? "text-live"
          : "text-body";
  const alertTone = serviceAlert
    ? getAlertToneClasses(serviceAlert)
    : undefined;

  return (
    <Link
      to="/directions/$journeyId"
      params={{ journeyId: journey.id }}
      search={search}
      aria-label={t("{minutes} minute trip, {start} to {end}, Route {route} to {headsign}", {
        minutes: journey.travelMinutes,
        start: journey.origin.time,
        end: journey.destination.time,
        route: journey.route,
        headsign: journey.routeHeadsign,
      })}
      className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-[var(--radius-md)] border border-hairline bg-canvas px-3 py-4 transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-700"
    >
      <div className="flex self-stretch flex-col items-center justify-start text-center text-ink">
        <strong className="block text-2xl font-semibold leading-none">
          {journey.travelMinutes}
        </strong>
        <span className="mt-1 block text-sm font-medium">{t("min")}</span>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">
          <time>{journey.origin.time}</time>
          <span className="mx-1.5 text-mute" aria-hidden="true">–</span>
          <time>{journey.destination.time}</time>
        </p>

        <div className="mt-2 flex min-w-0 items-center gap-1.5">
          {journey.walkStartMinutes > 0 ? (
            <>
              <span className="inline-flex shrink-0 items-end gap-0.5 rounded-[var(--radius-xs)] bg-canvas-softer px-1.5 py-1 text-xs text-ink">
                <FigmaIcon name="walking" size={18} className="h-[18px] w-[13px]" />
                {journey.walkStartMinutes}
              </span>
              <FigmaIcon name="chevronRight" size={16} className="h-4 w-4 shrink-0" />
            </>
          ) : null}
          <RouteLineBadge route={journey.route} />
          {journey.walkEndMinutes > 0 ? (
            <>
              <FigmaIcon name="chevronRight" size={16} className="h-4 w-4 shrink-0" />
              <span className="inline-flex shrink-0 items-end gap-0.5 rounded-[var(--radius-xs)] bg-canvas-softer px-1.5 py-1 text-xs text-ink">
                <FigmaIcon name="walking" size={18} className="h-[18px] w-[13px]" />
                {journey.walkEndMinutes}
              </span>
            </>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-snug text-body">
          {isLive && journey.etaMinutes != null ? (
            <span className={cn("font-semibold", liveStatusTone)}>
              {liveScheduleStatus ? `${liveScheduleStatus} · ` : null}
              {t("In {minutes} min", { minutes: journey.etaMinutes })}
            </span>
          ) : journey.dataSource === "scheduled" ? (
            <span className="font-medium text-ink">
              {t("Scheduled · At {time}", { time: journey.boardStop.time })}
            </span>
          ) : (
            <span className="font-medium text-body">
              {t("Simulated · At {time}", { time: journey.boardStop.time })}
            </span>
          )}{" "}
          <span aria-hidden="true">·</span> {t("from {stop}", { stop: journey.boardStop.name })}
        </p>

        {serviceAlert ? (
          <p
            className={cn(
              "mt-2 flex items-start gap-1.5 rounded-[var(--radius-xs)] px-2 py-1.5 text-xs font-medium leading-snug",
              alertTone?.surface,
              alertTone?.text,
            )}
          >
            <AlertTriangleIcon className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>{serviceAlert.title}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function PlanTripPage() {
  const { t, locale } = useI18n();
  const {
    destination,
    destinationDetail,
    destinationLat,
    destinationLng,
  } = Route.useSearch();
  const hasLocationPreference = getLocationPreference();
  const [origin, setOrigin] = useState<TripOrigin | null>(() =>
    hasLocationPreference ? null : DOWNTOWN_PREVIEW_ORIGIN,
  );
  const [tripTimeMode, setTripTimeMode] = useState<TripTimeMode>("now");
  const [requestedTime, setRequestedTime] = useState<string>();
  const [currentClock, setCurrentClock] = useState(() => new Date().toISOString());
  const [tripSort, setTripSort] = useState<TripSort>("best-route");
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function resolveOrigin() {
      if (!(await canUseLocationWithoutPrompt())) {
        if (active) setOrigin(DOWNTOWN_PREVIEW_ORIGIN);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!active) return;
          setOrigin({
            name: "Current location",
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            isFallback: false,
          });
        },
        () => {
          if (active) setOrigin(DOWNTOWN_PREVIEW_ORIGIN);
        },
        { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 },
      );
    }

    void resolveOrigin();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentClock(new Date().toISOString());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const hasDestinationCoordinates =
    destinationLat != null && destinationLng != null;
  const tripPlanQuery = useQuery({
    queryKey: [
      "trip-plan",
      origin?.lat,
      origin?.lng,
      destination,
      destinationLat,
      destinationLng,
      tripTimeMode,
      requestedTime,
    ],
    enabled: origin != null && hasDestinationCoordinates,
    queryFn: () =>
      fetchCachedTripPlan({
        destination,
        destinationDetail,
        destinationLat,
        destinationLng,
        originName: origin?.name,
        originLat: origin?.lat,
        originLng: origin?.lng,
        tripTimeMode,
        requestedTime,
      }).then((response) => {
        if (!response) throw new Error("Trip coordinates are unavailable.");
        return response;
    }),
    staleTime: 30_000,
    refetchInterval: tripTimeMode === "now" ? 30_000 : false,
    retry: 1,
  });
  const alertsQuery = useQuery({
    queryKey: SERVICE_ALERTS_QUERY_KEY,
    queryFn: fetchServiceAlerts,
    staleTime: SERVICE_ALERT_REFRESH_MS,
    refetchInterval: SERVICE_ALERT_REFRESH_MS,
  });

  const useMockFallback = !hasDestinationCoordinates || tripPlanQuery.isError;
  const journeys = useMockFallback
    ? JOURNEY_OPTIONS
    : tripPlanQuery.data?.journeys ?? [];
  const sortedJourneys = [...journeys].sort((first, second) => {
    if (tripSort === "least-walking") {
      return (
        first.walkStartMinutes +
          first.walkEndMinutes -
          (second.walkStartMinutes + second.walkEndMinutes) ||
        first.travelMinutes - second.travelMinutes
      );
    }
    if (tripSort === "fewest-transfers") {
      return (
        (first.transfers ?? 0) - (second.transfers ?? 0) ||
        first.travelMinutes - second.travelMinutes
      );
    }
    return first.travelMinutes - second.travelMinutes;
  });
  const recommended = sortedJourneys[0];
  const alternatives = sortedJourneys.slice(1);
  const directionSearch = {
    destination,
    destinationDetail,
    destinationLat,
    destinationLng,
    originName: origin?.name,
    originLat: origin?.lat,
    originLng: origin?.lng,
    tripTimeMode,
    requestedTime,
  };
  const departureLabel =
    tripTimeMode === "arrive"
      ? t("Arrive by {time}", { time: formatTripTime(requestedTime, locale) })
      : t("Leave by {time}", { time: formatTripTime(
          tripTimeMode === "now" ? currentClock : requestedTime,
          locale,
        ) });
  const tripSortLabels: Record<TripSort, string> = {
    "best-route": "Best route",
    "least-walking": "Least walking",
    "fewest-transfers": "Fewest transfers",
  };

  return (
    <main className="app-shell min-h-dvh overflow-y-auto bg-canvas">
      <header className="border-b border-hairline bg-canvas px-3 pb-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex min-h-12 items-center">
          <Link
            to="/search"
            aria-label={t("Back to search")}
            className="flex h-10 w-10 items-center justify-start rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal-700"
          >
            <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold text-ink">
            {t("Plan Trip")}
          </h1>
          <span className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-1.5">
          <div className="space-y-2">
            <div className="flex h-10 items-center gap-3 rounded-[var(--radius-pill)] border border-hairline px-4">
              <FigmaIcon name="myLocation" size={16} className="h-4 w-4 shrink-0" />
              <span className="text-sm text-body">
                {origin?.name === "Current location" ? t("Current location") : origin?.name ?? t("Finding your location…")}
              </span>
            </div>
            <div className="flex h-12 items-center gap-3 rounded-[var(--radius-pill)] border border-hairline px-4">
              <FigmaIcon name="place" size={16} className="h-4 w-4" />
              <span className="truncate text-sm text-body">{destination}</span>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("Swap origin and destination")}
            title="Origin swapping is not available yet"
            disabled
            className="flex h-11 w-11 items-center justify-center rounded-full"
          >
            <FigmaIcon name="swap" size={34} className="h-8 w-[34px]" />
          </button>
        </div>
      </header>

      <div className="flex min-h-[52px] items-center gap-2 border-b border-hairline bg-canvas px-4 py-1.5">
        <button
          type="button"
          aria-label={t("Refresh trip options")}
          title={t("Refresh trip options")}
          disabled={!origin || !hasDestinationCoordinates || tripPlanQuery.isFetching}
          onClick={() => void tripPlanQuery.refetch()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors hover:bg-canvas-soft disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-700"
        >
          <FigmaIcon
            name="refresh"
            size={24}
            className={cn(
              "h-6 w-6",
              tripPlanQuery.isFetching && "animate-spin motion-reduce:animate-none",
            )}
          />
        </button>

        <div>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={timeSheetOpen}
            onClick={() => {
              setTimeSheetOpen(true);
              setFilterMenuOpen(false);
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-md)] bg-canvas-soft px-3 text-xs font-bold text-ink transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-700"
          >
            {departureLabel}
            <FigmaIcon name="chevronSmall" size={20} className="h-5 w-5" />
          </button>
        </div>

        <div
          className="relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setFilterMenuOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setFilterMenuOpen(false);
          }}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={filterMenuOpen}
            aria-label={t("Filter by, {filter} selected", { filter: t(tripSortLabels[tripSort]) })}
            onClick={() => {
              setFilterMenuOpen((open) => !open);
              setTimeSheetOpen(false);
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-md)] bg-canvas-soft px-3 text-xs font-bold text-ink transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-700"
          >
            {t("Filter by")}
            <FigmaIcon name="chevronSmall" size={20} className="h-5 w-5" />
          </button>
          {filterMenuOpen ? (
            <div
              role="menu"
              aria-label={t("Filter trip options")}
              className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-40 overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-canvas"
            >
              {(Object.keys(tripSortLabels) as TripSort[]).map((sort) => (
                <button
                  key={sort}
                  type="button"
                  role="menuitemradio"
                  aria-checked={tripSort === sort}
                  onClick={() => {
                    setTripSort(sort);
                    setFilterMenuOpen(false);
                  }}
                  className={cn(
                    "flex min-h-10 w-full items-center px-3 text-left text-xs transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-charcoal-700",
                    tripSort === sort
                      ? "font-semibold text-ink"
                      : "font-medium text-body",
                  )}
                >
                  {t(tripSortLabels[sort])}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-3 pr-4 pt-2 text-xs leading-relaxed text-body" role="status">
        {tripPlanQuery.isPending && hasDestinationCoordinates ? (
          <p>{t("Finding current TheBus trips…")}</p>
        ) : useMockFallback && !tripPlanQuery.isError ? (
          <p>{t("Official planning is unavailable. Showing a simulated preview.")}</p>
        ) : null}
        {origin?.isFallback ? (
          <p className="mt-1">{t("Location unavailable · using a downtown preview origin.")}</p>
        ) : null}
        {tripPlanQuery.data?.error ? (
          <p className="mt-1">{tripPlanQuery.data.error}</p>
        ) : null}
      </div>

      {tripPlanQuery.isError && hasDestinationCoordinates ? (
        <section
          role="alert"
          className="mx-3 mt-3 rounded-[var(--radius-md)] border border-hairline bg-canvas px-4 py-3"
        >
          <h2 className="text-sm font-semibold text-ink">
            {t("Current trips are temporarily unavailable")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-body">
            {t("Check your connection and try again. Simulated options are shown below so you can still preview the flow.")}
          </p>
          <button
            type="button"
            onClick={() => void tripPlanQuery.refetch()}
            className="mt-3 inline-flex min-h-9 items-center rounded-[var(--radius-xs)] border border-brand-blue-border bg-brand-blue-subtle px-3 text-xs font-semibold text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            {t("Try again")}
          </button>
        </section>
      ) : null}

      {tripPlanQuery.isPending && hasDestinationCoordinates ? (
        <section className="space-y-2 px-4 py-5" aria-label={t("Loading trip options")}>
          <span className="sr-only">{t("Finding current trip options")}</span>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-[var(--radius-md)] bg-canvas-muted motion-reduce:animate-none"
            />
          ))}
        </section>
      ) : recommended ? (
        <section className="px-4 py-4">
          <h2 className="mb-2 text-sm font-bold text-ink">{t("Trip options")}</h2>
          <div className="flex flex-col gap-2">
            <JourneyCard
              journey={recommended}
              search={directionSearch}
              serviceAlert={findImportantJourneyAlert(
                alertsQuery.data?.alerts ?? [],
                recommended,
              )}
            />
            {alternatives.map((journey) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                search={directionSearch}
                serviceAlert={findImportantJourneyAlert(
                  alertsQuery.data?.alerts ?? [],
                  journey,
                )}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-ink">{t("No direct trip found")}</h2>
          <p className="mt-2 text-sm text-body">
            {t("This first release plans direct bus trips. Trips requiring a transfer are not available yet.")}
          </p>
          <Link to="/search" className="mt-5 inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-transit-blue-soft px-5 text-sm font-semibold text-transit-blue">
            {t("Choose another destination")}
          </Link>
        </section>
      )}
      {timeSheetOpen ? (
        <TripTimeSheet
          currentTime={tripTimeMode === "now" ? currentClock : requestedTime}
          onClose={() => setTimeSheetOpen(false)}
          onApply={(mode, time) => {
            setTripTimeMode(mode);
            setRequestedTime(time);
            if (mode === "now") setCurrentClock(new Date().toISOString());
            setTimeSheetOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}
