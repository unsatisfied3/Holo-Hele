"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isOnboardingComplete } from "@/lib/onboarding";

export function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(
      isOnboardingComplete() ? "/home" : "/onboarding/landing",
    );
  }, [router]);

  return (
    <div className="app-shell flex min-h-dvh items-center justify-center bg-canvas-soft">
      <p className="text-sm font-medium text-body">Loading Holo Hele…</p>
    </div>
  );
}
