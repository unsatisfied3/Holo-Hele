import type { LanguageCode } from "@/types/transit";

const ONBOARDING_KEY = "holo-hele-onboarding-complete";
const LANGUAGE_KEY = "holo-hele-language";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function completeOnboarding(): void {
  window.localStorage.setItem(ONBOARDING_KEY, "true");
}

export function getSavedLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(LANGUAGE_KEY);
  return value as LanguageCode | null;
}

export function saveLanguage(code: LanguageCode): void {
  window.localStorage.setItem(LANGUAGE_KEY, code);
}

export function resetOnboarding(): void {
  window.localStorage.removeItem(ONBOARDING_KEY);
  window.localStorage.removeItem(LANGUAGE_KEY);
}
