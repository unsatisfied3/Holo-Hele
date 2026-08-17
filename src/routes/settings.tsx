import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import packageInfo from "@/package.json";
import { HoloHeleLogo } from "@/components/brand/HoloHeleLogo";
import { AppShell } from "@/components/layout/AppShell";
import {
  SettingsRowIcon,
  type SettingsRowIconName,
} from "@/components/settings/SettingsRowIcon";
import { languages } from "@/lib/mock/languages";
import {
  getLocationPreference,
  getSavedLanguage,
  saveLanguage,
  saveLocationPreference,
} from "@/lib/onboarding";
import type { LanguageCode } from "@/types/transit";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const informationSections: Array<{
  title: string;
  rows: Array<{
    label: string;
    href: string;
    icon?: SettingsRowIconName;
  }>;
}> = [
  {
    title: "Resources",
    rows: [
      {
        label: "FAQ",
        href: "https://www.thebus.org/AboutTheBus/FAQ.asp",
        icon: "help",
      },
      {
        label: "Fares and passes",
        href: "https://www.thebus.org/Fare/TheBusFares.asp",
        icon: "ticket",
      },
      {
        label: "Videos",
        href: "https://www.youtube.com/@TheBusHonolulu",
        icon: "video",
      },
      {
        label: "System map",
        href: "https://www.thebus.org/Route/Routes.asp",
        icon: "map",
      },
      {
        label: "Rider alerts and service disruptions",
        href: "/alerts",
        icon: "alert",
      },
    ],
  },
  {
    title: "TheBus",
    rows: [
      { label: "Phone numbers", href: "tel:+18088485555", icon: "phone" },
      {
        label: "File a report",
        href: "https://www.thebus.org/CustomerService/CustomerComment.asp",
        icon: "report",
      },
      { label: "Website", href: "https://www.thebus.org/", icon: "globe" },
      {
        label: "Rate Holo Hele",
        href: "https://www.thebus.org/CustomerService/CustomerComment.asp",
        icon: "star",
      },
    ],
  },
  {
    title: "Legal",
    rows: [
      {
        label: "Terms of service",
        href: "https://www.thebus.org/Terms.asp",
        icon: "legal",
      },
      {
        label: "Privacy policy",
        href: "https://www.thebus.org/Privacy.asp",
        icon: "legal",
      },
    ],
  },
];

function InformationLink({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon?: SettingsRowIconName;
}) {
  const external = href.startsWith("http");
  const className =
    "flex min-h-[52px] items-center gap-3 border-b border-hairline py-2.5 text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-transit-blue";
  const content = (
    <>
      {icon ? (
        <SettingsRowIcon name={icon} className="h-5 w-5 shrink-0" />
      ) : null}
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <span className="pr-1 text-xl leading-none text-transit-blue" aria-hidden="true">
        ›
      </span>
    </>
  );

  if (href === "/alerts") {
    return (
      <Link to="/alerts" className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={className}
    >
      {content}
    </a>
  );
}

function SettingsPage() {
  const [language, setLanguage] = useState<LanguageCode>(
    () => getSavedLanguage() ?? "en",
  );
  const [useLocation, setUseLocation] = useState(getLocationPreference);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  function updateLanguage(value: LanguageCode) {
    setLanguage(value);
    saveLanguage(value);
  }

  function updateLocation(enabled: boolean) {
    setLocationMessage(null);

    if (!enabled) {
      saveLocationPreference(false);
      setUseLocation(false);
      return;
    }

    saveLocationPreference(true);
    setUseLocation(true);

    if (!navigator.geolocation) {
      setLocationMessage(
        "Location is turned on, but it is not available on this device.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationMessage("Location is ready for nearby stop searches.");
      },
      () => {
        setLocationMessage(
          "Location is turned on, but device permission is blocked. Enable it in device settings to use nearby stops.",
        );
      },
      { maximumAge: 60_000, timeout: 8_000 },
    );
  }

  return (
    <AppShell>
      <main className="h-full min-h-0 overflow-y-auto bg-canvas">
        <header className="border-b border-hairline px-5 pb-3 pt-[max(env(safe-area-inset-top),1.25rem)] text-center">
          <h1 className="text-lg font-semibold text-ink">Settings</h1>
        </header>

        <div className="px-5 pb-8">
          <div className="py-5 text-center">
            <HoloHeleLogo variant="compact" />
            <p className="mt-2 text-xs text-mute">Version {packageInfo.version}</p>
          </div>

          <section aria-labelledby="preferences-heading">
            <h2
              id="preferences-heading"
              className="pb-1 pt-1 text-lg font-semibold text-ink"
            >
              Preferences
            </h2>

            <label className="flex min-h-[56px] items-center gap-3 border-b border-hairline py-2.5">
              <SettingsRowIcon name="globe" className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                Language
              </span>
              <select
                aria-label="Language"
                value={language}
                onChange={(event) =>
                  updateLanguage(event.target.value as LanguageCode)
                }
                className="min-h-10 max-w-40 rounded-[var(--radius-xs)] border border-hairline bg-canvas px-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-transit-blue"
              >
                {languages.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.nativeLabel}
                  </option>
                ))}
              </select>
            </label>

            <div className="border-b border-hairline">
              <label className="flex min-h-[56px] cursor-pointer items-center gap-3 py-2.5">
                <SettingsRowIcon name="map" className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    Use my location
                  </span>
                  <span className="mt-0.5 block text-xs text-body">
                    Find nearby stops when the map opens
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={useLocation}
                  onChange={(event) => updateLocation(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-charcoal-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-canvas after:shadow-sm after:transition-transform peer-checked:bg-transit-blue peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-transit-blue" />
              </label>
              {locationMessage ? (
                <p role="status" className="pb-3 pl-8 text-xs leading-relaxed text-body">
                  {locationMessage}
                </p>
              ) : null}
            </div>

          </section>

          {informationSections.map((section) => (
            <section
              key={section.title}
              aria-labelledby={`settings-${section.title.toLowerCase()}`}
              className="pt-6"
            >
              <h2
                id={`settings-${section.title.toLowerCase()}`}
                className="pb-1 text-lg font-semibold text-ink"
              >
                {section.title}
              </h2>
              {section.rows.map((row) => (
                <InformationLink key={row.label} {...row} />
              ))}
            </section>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
