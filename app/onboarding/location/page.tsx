"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { completeOnboarding } from "@/lib/onboarding";

export default function LocationPage() {
  const router = useRouter();

  function finishOnboarding() {
    completeOnboarding();
    router.push("/home");
  }

  function handleAllowAccess() {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => finishOnboarding(),
        () => finishOnboarding(),
        { maximumAge: 60_000, timeout: 8_000 },
      );
      return;
    }

    finishOnboarding();
  }

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas">
      <div
        aria-hidden="true"
        className="relative flex flex-1 items-end justify-center overflow-hidden bg-canvas-soft"
      >
        <div className="relative mb-0 h-[494px] w-full max-w-md">
          <div className="absolute inset-x-0 bottom-24 h-40 rounded-t-[50%] bg-canvas" />
          <div className="absolute bottom-36 left-1/2 h-32 w-24 -translate-x-1/2 rounded-t-full bg-primary" />
          <div className="absolute bottom-48 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-canvas" />
        </div>
      </div>

      <div className="bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-8">
        <header className="mb-8 px-2">
          <h1 className="text-2xl font-bold text-ink">Enable location</h1>
          <p className="mt-2 text-sm leading-relaxed text-body">
            Holo Hele needs your location to find nearby stops and routes.
          </p>
        </header>

        <div className="space-y-3 px-2">
          <Button fullWidth onClick={handleAllowAccess}>
            Allow access
          </Button>
          <Button fullWidth variant="ghost" onClick={finishOnboarding}>
            Not now
          </Button>
        </div>
      </div>
    </main>
  );
}
