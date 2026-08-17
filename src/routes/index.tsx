import { createFileRoute, Navigate } from "@tanstack/react-router";

import { isOnboardingComplete } from "@/lib/onboarding";

export const Route = createFileRoute("/")({
  component: RootRedirect,
});

function RootRedirect() {
  return (
    <Navigate
      to={isOnboardingComplete() ? "/home" : "/onboarding/landing"}
      replace
    />
  );
}
