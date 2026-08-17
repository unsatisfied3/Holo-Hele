import { useEffect } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { HoloHeleLogo } from "@/components/brand/HoloHeleLogo";
import { LandingSplash } from "@/components/onboarding/LandingSplash";

const LANDING_DURATION_MS = 3_000;

export const Route = createFileRoute("/onboarding/landing")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      void navigate({ to: "/onboarding/language" });
    }, LANDING_DURATION_MS);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas">
      <div className="flex flex-1 flex-col items-center justify-end px-6 pb-6 pt-[max(env(safe-area-inset-top),2.5rem)]">
        <HoloHeleLogo />
      </div>

      <LandingSplash />
    </main>
  );
}
