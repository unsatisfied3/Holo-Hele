import { Link } from "@tanstack/react-router";

import { getAlertToneClasses } from "@/components/alerts/alertPresentation";
import { AlertTriangleIcon } from "@/components/icons/FigmaIcon";
import type { DemoAlertScenario } from "@/lib/mock/service-alerts";
import {
  getAlertBannerDescription,
  getAlertBannerHeading,
} from "@/lib/service-alerts";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { TransitAlert } from "@/types/transit";

export function ServiceAlertBanner({
  alert,
  busId,
  stopId,
  routePageId,
  demo,
  fromFavorites = false,
}: {
  alert: TransitAlert;
  busId?: string;
  stopId?: string;
  routePageId?: string;
  demo?: DemoAlertScenario;
  fromFavorites?: boolean;
}) {
  const { t } = useI18n();
  const tone = getAlertToneClasses(alert);
  const heading = getAlertBannerHeading(alert);
  const description = getAlertBannerDescription(alert, stopId);

  return (
    <Link
      to="/alerts/$alertId"
      params={{ alertId: alert.id }}
      search={{
        bus: busId,
        stop: stopId,
        routePage: routePageId,
        demo,
        from: fromFavorites ? "favorites" : undefined,
      }}
      aria-label={t("View service alert: {heading}", { heading })}
      className={cn(
        "flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue",
        tone.surface,
        tone.hoverSurface,
      )}
    >
      <AlertTriangleIcon className={cn("h-6 w-6 shrink-0", tone.text)} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{heading}</span>
        <span className="mt-0.5 block text-xs leading-snug text-body">
          {description}
        </span>
      </span>
      <span className={cn("text-sm font-medium underline underline-offset-4", tone.text)}>
        {t("Details")}
      </span>
    </Link>
  );
}
