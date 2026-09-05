import type { LanguageCode } from "@/types/transit";

const ONBOARDING_KEY = "holo-hele-onboarding-complete";
const LANGUAGE_KEY = "holo-hele-language";
const LOCATION_KEY = "holo-hele-use-location";
export const LANGUAGE_CHANGE_EVENT = "holo-hele-language-change";

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
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

export function getLocationPreference(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(LOCATION_KEY) !== "false";
}

export function saveLocationPreference(enabled: boolean): void {
  window.localStorage.setItem(LOCATION_KEY, String(enabled));
}

/**
 * Passive screens may use location only after the rider has already granted
 * browser permission. Permission prompts belong to explicit onboarding or
 * Settings actions, not routine navigation.
 */
export async function canUseLocationWithoutPrompt(): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !getLocationPreference() ||
    !navigator.geolocation ||
    !navigator.permissions
  ) {
    return false;
  }

  try {
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });
    return permission.state === "granted";
  } catch {
    return false;
  }
}

export function resetOnboarding(): void {
  window.localStorage.removeItem(ONBOARDING_KEY);
  window.localStorage.removeItem(LANGUAGE_KEY);
  window.localStorage.removeItem(LOCATION_KEY);
}
