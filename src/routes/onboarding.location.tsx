import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  completeOnboarding,
  saveLocationPreference,
} from "@/lib/onboarding";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/onboarding/location")({
  component: LocationPage,
});

function LocationPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  function finishOnboarding(useLocation: boolean) {
    saveLocationPreference(useLocation);
    completeOnboarding();
    void navigate({ to: "/home" });
  }

  function handleAllowAccess() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => finishOnboarding(true),
        () => finishOnboarding(false),
        { maximumAge: 60_000, timeout: 8_000 },
      );
      return;
    }

    finishOnboarding(false);
  }

  return (
    <main className="app-shell flex h-dvh min-h-0 flex-col bg-canvas">
      <div
        aria-hidden="true"
        className="location-illustration-stage relative min-h-0 flex-1 overflow-hidden"
      >
        <img
          alt=""
          aria-hidden="true"
          className="location-illustration-art pointer-events-none select-none"
          data-location-illustration
          draggable={false}
          height={792}
          src="/images/allow-location-illustration.svg"
          width={527}
        />
      </div>

      <section className="shrink-0 bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-10">
        <header className="mx-auto w-full max-w-[303px] text-center">
          <h1 className="text-2xl font-bold text-ink">{t("Enable Location")}</h1>
          <p className="mt-1 text-sm font-normal leading-[21px] text-body">
            {t("Holo Hele needs your location to find nearby stops and routes")}
          </p>
        </header>

        <div className="mt-8 flex flex-col gap-2">
          <button
            className="flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] bg-brand-blue px-5 text-sm font-normal text-on-primary transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            type="button"
            onClick={handleAllowAccess}
          >
            {t("Allow Access")}
          </button>
          <button
            className="flex min-h-10 w-full items-center justify-center rounded-[var(--radius-md)] bg-canvas px-5 text-sm font-normal text-body transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            type="button"
            onClick={() => finishOnboarding(false)}
          >
            {t("Not Now")}
          </button>
        </div>
      </section>
    </main>
  );
}
