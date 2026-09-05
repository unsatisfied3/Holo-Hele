import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  AlertTriangleIcon,
  FigmaIcon,
} from "@/components/icons/FigmaIcon";
import { getAlertToneClasses } from "@/components/alerts/alertPresentation";
import { AppShell } from "@/components/layout/AppShell";
import { fetchServiceAlerts } from "@/lib/api/transit";
import {
  removeFavoriteBus,
  removeFavoriteStop,
  useFavoriteBusIds,
  useFavoriteStopIds,
} from "@/lib/favorites";
import {
  FAVORITE_BUS_PRESETS,
  type FavoriteBusDefinition,
} from "@/lib/mock/favorites";
import {
  FAVORITE_DISRUPTION_STOP_IDS,
  getFavoriteStopDisruptionPreview,
  getServiceAlertForBus,
  getServiceAlertForStop,
} from "@/lib/mock/service-alerts";
import {
  alertAffectsBusAtStop,
  findAlertForBusAtStop,
  findAlertForStop,
  getCompactStopAlertLabel,
  SERVICE_ALERT_REFRESH_MS,
  SERVICE_ALERTS_QUERY_KEY,
} from "@/lib/service-alerts";
import { getStopById } from "@/lib/thebus/stops";
import { cn } from "@/lib/utils";
import type { StopLocation } from "@/types/transit";
import type { TransitAlert } from "@/types/transit";
import { useI18n } from "@/lib/i18n";

type FavoriteTab = "buses" | "stops";

interface FavoritesSearch {
  tab?: FavoriteTab;
}

interface ShowcaseStopDisruption {
  alert: TransitAlert;
  stop: StopLocation;
}

export const Route = createFileRoute("/favorites")({
  validateSearch: (search: Record<string, unknown>): FavoritesSearch => ({
    tab: search.tab === "stops" || search.tab === "buses" ? search.tab : undefined,
  }),
  component: FavoritesPage,
});

function FavoriteButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-blue transition-colors hover:bg-brand-blue-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
    >
      <FigmaIcon
        name="favorites"
        size={20}
        className="icon-brand-blue h-5 w-5"
      />
    </button>
  );
}

function FavoritesPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab = search.tab ?? "stops";
  const [query, setQuery] = useState("");
  const favoriteStopIds = useFavoriteStopIds();
  const favoriteBusIds = useFavoriteBusIds();
  const alertsQuery = useQuery({
    queryKey: SERVICE_ALERTS_QUERY_KEY,
    queryFn: fetchServiceAlerts,
    refetchInterval: SERVICE_ALERT_REFRESH_MS,
    staleTime: SERVICE_ALERT_REFRESH_MS,
  });
  const liveAlerts = alertsQuery.data?.alerts ?? [];
  const currentOfficialAlerts =
    alertsQuery.data?.status === "live" ? liveAlerts : [];
  const favoriteStops = favoriteStopIds
    .map(getStopById)
    .filter((stop): stop is StopLocation => stop != null);
  const favoriteBuses = FAVORITE_BUS_PRESETS.filter((bus) =>
    favoriteBusIds.includes(bus.id),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const showcaseStopDisruptions = FAVORITE_DISRUPTION_STOP_IDS.filter(
    (stopId) => !favoriteStopIds.includes(stopId),
  ).flatMap((stopId) => {
      const stop = getStopById(stopId);
      const alert =
        findAlertForStop(currentOfficialAlerts, stopId) ??
        getFavoriteStopDisruptionPreview(stopId);
      return stop && alert ? [{ alert, stop }] : [];
    });
  const visibleStops = favoriteStops.filter(
    (stop) =>
      !normalizedQuery ||
      stop.name.toLocaleLowerCase().includes(normalizedQuery) ||
      stop.id.includes(normalizedQuery),
  );
  const visibleBuses = favoriteBuses.filter(
    (bus) =>
      !normalizedQuery ||
      bus.route.toLocaleLowerCase().includes(normalizedQuery) ||
      bus.headsign.toLocaleLowerCase().includes(normalizedQuery) ||
      bus.stopName.toLocaleLowerCase().includes(normalizedQuery),
  );
  const visibleShowcaseStops = showcaseStopDisruptions.filter(
    ({ alert, stop }) =>
      !normalizedQuery ||
      stop.name.toLocaleLowerCase().includes(normalizedQuery) ||
      stop.id.includes(normalizedQuery) ||
      alert.title.toLocaleLowerCase().includes(normalizedQuery),
  );
  const visibleItemCount =
    activeTab === "buses"
      ? visibleBuses.length
      : visibleStops.length + visibleShowcaseStops.length;
  const allItemCount =
    activeTab === "buses"
      ? favoriteBuses.length
      : favoriteStops.length + showcaseStopDisruptions.length;

  return (
    <AppShell>
      <main className="flex h-full min-h-0 flex-col bg-canvas">
        <header className="border-b-[6px] border-canvas-soft bg-canvas px-4 pb-5 pt-[max(env(safe-area-inset-top),3rem)]">
          <h1 className="text-center text-lg font-medium text-ink">{t("Favorites")}</h1>
          <label className="mt-7 flex h-12 items-center gap-2.5 rounded-[var(--radius-pill)] border border-hairline bg-canvas-softer px-4">
            <FigmaIcon name="search" size={22} className="h-[22px] w-[22px] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Search")}
              aria-label={t("Search favorites")}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mute focus:outline-none"
            />
          </label>
        </header>

        <div
          role="tablist"
          aria-label={t("Favorite type")}
          className="grid grid-cols-2 border-b border-hairline bg-canvas py-1.5"
        >
          {(["stops", "buses"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => {
                void navigate({ search: { tab }, replace: true });
                setQuery("");
              }}
              className={cn(
                "mx-2.5 min-h-[34px] rounded-[6px] text-sm font-medium capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                activeTab === tab
                  ? "bg-brand-blue-subtle text-brand-blue"
                  : "text-body hover:bg-canvas-softer",
              )}
            >
              {t(tab === "buses" ? "Buses" : "Stops")}
            </button>
          ))}
        </div>

        {allItemCount === 0 ? (
          <EmptyFavorites activeTab={activeTab} />
        ) : visibleItemCount === 0 ? (
          <section className="flex flex-1 items-center justify-center px-8 pb-12 text-center">
            <div>
              <h2 className="text-base font-semibold text-ink">
                {t(activeTab === "buses" ? "No matching buses" : "No matching stops")}
              </h2>
              <p className="mt-2 text-sm text-body">
                {t("Try a route, destination, stop name, or stop number.")}
              </p>
            </div>
          </section>
        ) : activeTab === "buses" ? (
          <FavoriteBusList
            buses={visibleBuses}
            liveAlerts={liveAlerts}
          />
        ) : (
          <FavoriteStopList
            stops={visibleStops}
            showcaseDisruptions={visibleShowcaseStops}
            liveAlerts={liveAlerts}
          />
        )}
      </main>
    </AppShell>
  );
}

function FavoriteBusList({
  buses,
  liveAlerts,
}: {
  buses: FavoriteBusDefinition[];
  liveAlerts: TransitAlert[];
}) {
  const { t } = useI18n();
  return (
    <section aria-label={t("Favorite buses")} className="min-h-0 flex-1 overflow-y-auto">
      <ul className="px-4">
        {buses.map((bus) => {
          const liveServiceAlert = findAlertForBusAtStop(
            liveAlerts,
            bus.route,
            bus.stopId,
          );
          const demoServiceAlert = getServiceAlertForBus(bus.id);
          const serviceAlert =
            liveServiceAlert ??
            (demoServiceAlert &&
            alertAffectsBusAtStop(demoServiceAlert, bus.route, bus.stopId)
              ? demoServiceAlert
              : undefined);
          const alertTone = serviceAlert
            ? getAlertToneClasses(serviceAlert)
            : undefined;

          return (
          <li key={bus.id} className="flex min-h-[64px] items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-subtle">
              <FigmaIcon
                name="busRoute"
                size={14}
                className="icon-brand-blue h-3.5 w-3.5"
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center border-b border-hairline">
              <Link
                to="/buses/$busId"
                params={{ busId: bus.id }}
                className="min-w-0 flex-1 rounded-[var(--radius-xs)] py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <p className="text-sm font-normal leading-snug text-ink">
                  {bus.route} - {bus.headsign}
                </p>
                <p className="mt-0.5 truncate text-xs text-body">{bus.stopName}</p>
                {serviceAlert ? (
                  <p
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-1 text-xs font-medium uppercase",
                      alertTone?.surface,
                      alertTone?.text,
                    )}
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{serviceAlert.title}</span>
                  </p>
                ) : null}
              </Link>
              <FavoriteButton
                label={`Remove Route ${bus.route} from favorites`}
                onClick={() => removeFavoriteBus(bus.id)}
              />
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

function FavoriteStopList({
  stops,
  showcaseDisruptions,
  liveAlerts,
}: {
  stops: StopLocation[];
  showcaseDisruptions: ShowcaseStopDisruption[];
  liveAlerts: TransitAlert[];
}) {
  const { t } = useI18n();
  return (
    <section aria-label={t("Favorite stops")} className="min-h-0 flex-1 overflow-y-auto">
      <ul className="px-4">
        {stops.map((stop) => {
          const serviceAlert =
            findAlertForStop(liveAlerts, stop.id) ?? getServiceAlertForStop(stop.id);
          const alertTone = serviceAlert
            ? getAlertToneClasses(serviceAlert)
            : undefined;
          return (
          <li key={stop.id} className="flex min-h-[56px] items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-subtle">
              <FigmaIcon
                name="busStopSign"
                size={14}
                className="icon-brand-blue h-3.5 w-3.5"
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center border-b border-hairline">
              <Link
                to="/stops/$id"
                params={{ id: stop.id }}
                search={{ from: "favorites" }}
                className="min-w-0 flex-1 rounded-[var(--radius-xs)] py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <p className="truncate text-sm font-normal leading-snug text-ink">{stop.name}</p>
                {serviceAlert ? (
                  <p
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-1 text-xs font-medium uppercase",
                      alertTone?.surface,
                      alertTone?.text,
                    )}
                  >
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{getCompactStopAlertLabel(serviceAlert, stop.id)}</span>
                  </p>
                ) : null}
              </Link>
              <FavoriteButton
                label={`Remove ${stop.name} from favorites`}
                onClick={() => removeFavoriteStop(stop.id)}
              />
            </div>
          </li>
          );
        })}
        {showcaseDisruptions.map(({ alert, stop }) => {
          const alertTone = getAlertToneClasses(alert);
          return (
            <li
              key={`${alert.id}:${stop.id}`}
              className="flex min-h-[56px] items-center gap-2"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-subtle">
                <FigmaIcon
                  name="busStopSign"
                  size={14}
                  className="icon-brand-blue h-3.5 w-3.5"
                />
              </div>
              <Link
                to="/stops/$id"
                params={{ id: stop.id }}
                search={{ from: "favorites" }}
                className="min-w-0 flex-1 border-b border-hairline py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <p className="truncate text-sm font-normal leading-snug text-ink">
                  {stop.name}
                </p>
                <p className="mt-0.5 text-xs text-body">Stop {stop.id}</p>
                <p
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-1.5 py-1 text-xs font-medium uppercase",
                    alertTone.surface,
                    alertTone.text,
                  )}
                >
                  <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{getCompactStopAlertLabel(alert, stop.id)}</span>
                </p>
              </Link>
              <span
                aria-label={`${stop.name} saved favorite`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-blue"
              >
                <FigmaIcon
                  name="favorites"
                  size={20}
                  className="icon-brand-blue h-5 w-5"
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptyFavorites({ activeTab }: { activeTab: FavoriteTab }) {
  const { t } = useI18n();
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-8 pb-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-softer">
        <FigmaIcon
          name={activeTab === "buses" ? "busRoute" : "busStopSign"}
          size={20}
          className="h-5 w-5"
        />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-ink">
        {t(activeTab === "buses" ? "No favorite buses yet" : "No favorite stops yet")}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-body">
        {t(
          activeTab === "buses"
            ? "Save a bus from its detail page and it will appear here."
            : "Save a stop from its arrival page and it will appear here.",
        )}
      </p>
      <Link
        to="/home"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-primary px-5 text-sm font-medium text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t("Explore nearby stops")}
      </Link>
    </section>
  );
}
