import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  CalendarIcon,
  FigmaIcon,
  RouteLineBadge,
} from "@/components/icons/FigmaIcon";
import { fetchDailyStopSchedule } from "@/lib/api/transit";
import { getFavoriteBusById } from "@/lib/mock/favorites";
import { useI18n } from "@/lib/i18n";
import type { ScheduleDay } from "@/types/transit";

interface ScheduleSearch {
  stop?: string;
  route?: string;
  bus?: string;
  from?: "favorites";
  day?: ScheduleDay;
  date?: string;
}

export const Route = createFileRoute("/schedule")({
  validateSearch: (search: Record<string, unknown>): ScheduleSearch => ({
    stop: typeof search.stop === "string" ? search.stop : undefined,
    route: typeof search.route === "string" ? search.route : undefined,
    bus: typeof search.bus === "string" ? search.bus : undefined,
    from: search.from === "favorites" ? "favorites" : undefined,
    day: search.day === "tomorrow" ? "tomorrow" : undefined,
    date: typeof search.date === "string" && isIsoDate(search.date)
      ? search.date
      : undefined,
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const favoriteBus = search.bus ? getFavoriteBusById(search.bus) : undefined;
  const stopId = search.stop ?? favoriteBus?.stopId;
  const today = getHonoluluToday();
  const scheduleDate = search.date ?? (search.day === "tomorrow" ? addDays(today, 1) : today);
  const scheduleQuery = useQuery({
    queryKey: ["daily-stop-schedule", stopId, search.route, scheduleDate],
    queryFn: () => fetchDailyStopSchedule(stopId ?? "", search.route, scheduleDate),
    enabled: Boolean(stopId),
  });
  const data = scheduleQuery.data;
  const error = scheduleQuery.error instanceof Error
    ? scheduleQuery.error.message
    : scheduleQuery.isError
      ? t("Unable to load the daily schedule.")
      : null;

  return (
    <main className="app-shell relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
      <header className="flex items-center border-b border-hairline px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        {favoriteBus ? (
          <ScheduleBackLink to="bus" id={favoriteBus.id} />
        ) : stopId ? (
          <ScheduleBackLink
            to="stop"
            id={stopId}
            fromFavorites={search.from === "favorites"}
          />
        ) : (
          <ScheduleBackLink to="favorites" />
        )}
        <h1 className="flex-1 text-center text-base font-semibold text-ink">
          {t(search.route ? "Schedule" : "Choose a Line")}
        </h1>
        <span className="h-10 w-8" aria-hidden="true" />
      </header>

      {!stopId ? (
        <ScheduleMessage title={t("Choose a saved stop first")} body={t("Open a favorite stop and select Schedule.")} />
      ) : scheduleQuery.isPending ? (
        <ScheduleMessage title={t("Loading schedule…")} />
      ) : error ? (
        <ScheduleMessage title={t("Schedule unavailable")} body={error} />
      ) : !data ? null : search.route ? (
        <DailySchedule
          stopId={stopId}
          route={search.route}
          favoriteHeadsign={favoriteBus?.headsign}
          fromFavorites={search.from === "favorites"}
          scheduleDate={scheduleDate}
          today={today}
          data={data}
        />
      ) : (
        <LineChooser
          stopId={stopId}
          fromFavorites={search.from === "favorites"}
          scheduleDate={scheduleDate}
          today={today}
          data={data}
        />
      )}
    </main>
  );
}

function LineChooser({
  stopId,
  fromFavorites,
  scheduleDate,
  today,
  data,
}: {
  stopId: string;
  fromFavorites: boolean;
  scheduleDate: string;
  today: string;
  data: Awaited<ReturnType<typeof fetchDailyStopSchedule>>;
}) {
  const { t, locale } = useI18n();
  const headsignByRoute = new Map<string, string>();
  for (const departure of data.departures) {
    if (!headsignByRoute.has(departure.route)) {
      headsignByRoute.set(departure.route, departure.headsign);
    }
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b-[6px] border-canvas-soft px-4 py-5">
        <h2 className="text-base font-semibold text-ink">{data.stop.name}</h2>
        <p className="mt-1 text-xs text-body">{t("Stop {id}", { id: data.stop.id })}</p>
      </div>
      {data.routes.length === 0 ? (
        <ScheduleMessage
          title={t("No active lines on {date}", { date: formatScheduleDate(scheduleDate, today, locale) })}
          body={t("Try another stop or choose a different day.")}
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {data.routes.map((route) => (
            <li key={route}>
              <Link
                to="/schedule"
                search={{
                  stop: stopId,
                  route,
                  from: fromFavorites ? "favorites" : undefined,
                  date: scheduleDate === today ? undefined : scheduleDate,
                }}
                aria-label={`Route ${route}: ${headsignByRoute.get(route) ?? `Route ${route}`}`}
                className="flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
              >
                <RouteLineBadge route={route} />
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">
                  {headsignByRoute.get(route) ?? `Route ${route}`}
                </span>
                <span aria-hidden="true" className="text-lg text-body">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DailySchedule({
  stopId,
  route,
  favoriteHeadsign,
  fromFavorites,
  scheduleDate,
  today,
  data,
}: {
  stopId: string;
  route: string;
  favoriteHeadsign?: string;
  fromFavorites: boolean;
  scheduleDate: string;
  today: string;
  data: Awaited<ReturnType<typeof fetchDailyStopSchedule>>;
}) {
  const { t, locale } = useI18n();
  const navigate = Route.useNavigate();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const matchingDirection = favoriteHeadsign
    ? data.departures.filter((departure) =>
        departure.headsign.toLocaleLowerCase().includes(
          favoriteHeadsign.toLocaleLowerCase().replace(/\s+/g, " "),
        ),
      )
    : [];
  const departures = matchingDirection.length > 0 ? matchingDirection : data.departures;
  const headsign = favoriteHeadsign ?? departures[0]?.headsign ?? `Route ${route}`;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b-[6px] border-canvas-soft px-4 py-5">
        <div className="flex items-start gap-3">
          <RouteLineBadge route={route} />
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-snug text-ink">{headsign}</h2>
            <p className="mt-1 text-xs text-body">{data.stop.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsDatePickerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isDatePickerOpen}
          className="mt-4 flex min-h-10 w-full items-center gap-2 rounded-[var(--radius-xs)] border border-brand-blue-border bg-brand-blue-subtle px-3 text-left text-brand-blue transition-colors hover:bg-brand-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <CalendarIcon className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">
            {t(formatScheduleDate(scheduleDate, today, locale))}
          </span>
        </button>
      </div>

      {departures.length === 0 ? (
        <ScheduleMessage
          title={t("No Route {route} service on {date}", { route, date: formatScheduleDate(scheduleDate, today, locale) })}
          body={t("Try another line or choose a different day.")}
        />
      ) : (
        <ul className="divide-y divide-hairline" aria-label={`Route ${route} scheduled departures`}>
          {departures.map((departure) => (
            <li key={departure.id} className="px-4 py-4">
              <time className="text-sm font-semibold text-ink">{departure.time}</time>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/schedule"
        search={{
          stop: stopId,
          from: fromFavorites ? "favorites" : undefined,
          date: scheduleDate === today ? undefined : scheduleDate,
        }}
        className="mx-4 my-5 flex min-h-11 items-center justify-center rounded-[var(--radius-xs)] border border-brand-blue-border bg-brand-blue-subtle px-5 text-sm font-medium text-brand-blue transition-colors hover:bg-brand-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {t("Choose another line")}
      </Link>

      {isDatePickerOpen ? (
        <ScheduleDatePicker
          selectedDate={scheduleDate}
          today={today}
          onClose={() => setIsDatePickerOpen(false)}
          onSelect={(date) => {
            setIsDatePickerOpen(false);
            void navigate({
              search: (previous) => ({
                ...previous,
                day: undefined,
                date: date === today ? undefined : date,
              }),
            });
          }}
        />
      ) : null}
    </section>
  );
}

function ScheduleDatePicker({
  selectedDate,
  today,
  onClose,
  onSelect,
}: {
  selectedDate: string;
  today: string;
  onClose: () => void;
  onSelect: (date: string) => void;
}) {
  const { t, locale } = useI18n();
  const selected = parseIsoDate(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1, 12)),
  );
  const selectedButtonRef = useRef<HTMLButtonElement>(null);
  const dates = useMemo(() => getCalendarDates(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(visibleMonth);

  useEffect(() => {
    selectedButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) =>
      new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1, 12)),
    );
  };

  return (
    <div className="absolute inset-0 z-[1200] flex items-end" role="presentation">
      <button
        type="button"
        aria-label={t("Close date picker")}
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-date-picker-title"
        className="relative w-full rounded-t-[var(--radius-md)] border-t border-hairline bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2"
      >
        <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-charcoal-500" aria-hidden="true" />
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label={t("Previous month")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ChevronIcon direction="left" />
          </button>
          <h2 id="schedule-date-picker-title" className="min-w-36 text-center text-sm font-semibold text-ink">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label={t("Next month")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 text-center" aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} className="text-xs font-medium text-body">{weekday}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-y-1" role="grid" aria-label={monthLabel}>
          {dates.map((date) => {
            const isoDate = toIsoDate(date);
            const isSelected = isoDate === selectedDate;
            const isToday = isoDate === today;
            const isCurrentMonth = date.getUTCMonth() === visibleMonth.getUTCMonth();
            const fullLabel = new Intl.DateTimeFormat(locale, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            }).format(date);
            return (
              <button
                key={isoDate}
                ref={isSelected ? selectedButtonRef : undefined}
                type="button"
                role="gridcell"
                aria-label={`${fullLabel}${isToday ? `, ${t("Today")}` : ""}`}
                aria-selected={isSelected}
                onClick={() => onSelect(isoDate)}
                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] pb-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected
                    ? "bg-brand-blue text-on-primary"
                    : isCurrentMonth
                      ? "text-ink hover:bg-canvas-soft"
                      : "text-charcoal-600 hover:bg-canvas-soft"
                }`}
              >
                {date.getUTCDate()}
                {isToday ? (
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? "bg-on-primary" : "bg-brand-blue"}`}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarDates(month: Date): Date[] {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) =>
    new Date(Date.UTC(year, monthIndex, index - firstWeekday + 1, 12)),
  );
}

function getHonoluluToday(): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Honolulu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toIsoDate(parseIsoDate(value)) === value;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toIsoDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function formatScheduleDate(value: string, today: string, locale = "en-US"): string {
  if (value === today) return "Today";
  if (value === addDays(today, 1)) return "Tomorrow";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseIsoDate(value));
}

function ScheduleBackLink({
  to,
  id,
  fromFavorites = false,
}: {
  to: "bus" | "stop" | "favorites";
  id?: string;
  fromFavorites?: boolean;
}) {
  const { t } = useI18n();
  const className =
    "flex h-10 w-8 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  const icon = <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />;

  if (to === "bus" && id) {
    return (
      <Link to="/buses/$busId" params={{ busId: id }} aria-label={t("Back to bus")} className={className}>
        {icon}
      </Link>
    );
  }

  if (to === "stop" && id) {
    return (
      <Link
        to="/stops/$id"
        params={{ id }}
        search={{ from: fromFavorites ? "favorites" : undefined }}
        aria-label={t("Back to stop")}
        className={className}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Link
      to="/favorites"
      search={{ tab: "stops" }}
      aria-label={t("Back to favorite stops")}
      className={className}
    >
      {icon}
    </Link>
  );
}

function ScheduleMessage({ title, body }: { title: string; body?: string }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {body ? <p className="mt-2 text-sm leading-relaxed text-body">{body}</p> : null}
    </section>
  );
}
