import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

import { ServiceAlertMonitor } from "@/components/alerts/ServiceAlertMonitor";
import { useI18n } from "@/lib/i18n";

function RootLayout() {
  return (
    <>
      <ServiceAlertMonitor />
      <Outlet />
    </>
  );
}

function NotFoundPage() {
  const { t } = useI18n();
  return (
    <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-ink">{t("Page not found")}</h1>
      <p className="text-sm text-body">{t("This page is not available in Holo Hele.")}</p>
      <Link
        to="/home"
        className="rounded-[var(--radius-pill)] bg-primary px-5 py-3 text-sm font-medium text-on-primary"
      >
        {t("Back to map")}
      </Link>
    </main>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});
