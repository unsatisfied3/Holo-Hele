import { expect, test } from "@playwright/test";

import { JOURNEY_OPTIONS } from "@/lib/mock/journeys";

test("onboarding and transit routes render at mobile width", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("img", { name: "Holo Hele" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/onboarding\/language$/, { timeout: 6_000 });
  const languageOptions = page.getByRole("radio");
  const englishOption = page.getByRole("radio", { name: "English" });
  await expect(languageOptions).toHaveCount(8);
  await expect(englishOption).toBeChecked();
  await expect(page.locator("img[data-language-icon]")).toHaveCount(8);
  await expect(page.locator('[data-language-icon="en"]')).toHaveAttribute(
    "src", "/icons/languages/us-circle.png",
  );
  await page.keyboard.press("Tab");
  await expect(englishOption).toBeFocused();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/location$/);
  await expect(page.getByRole("heading", { name: "Enable Location" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Allow Access" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Not Now" })).toBeVisible();
  await expect(page.locator("[data-location-illustration]")).toHaveAttribute(
    "src", "/images/allow-location-illustration.svg",
  );

  await page.evaluate(() => {
    window.localStorage.setItem("holo-hele-onboarding-complete", "true");
  });
  await page.goto("/home");
  await expect(page.getByRole("button", { name: "Nearby Stops" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.locator(".home-user-location-marker")).toBeVisible();
  await expect(page.locator(".map-stop-marker").nth(1)).toBeVisible();
  await page.locator(".map-stop-marker").nth(1).click();
  await expect(
    page.getByRole("region", { name: /Selected stop/ }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  await expect(page.locator(".map-stop-marker--selected")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Arrivals" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Track Route|View schedule for Route/ }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close stop details" }).click();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await page.getByRole("button", { name: "Nearby Stops" }).click();
  await expect(page.getByText(/Updated /)).toBeVisible();
  await expect(page.getByRole("link", { name: /Track Route/ }).first()).toBeVisible();

  await page.getByRole("link", { name: /^View stop / }).first().click();
  await expect(page.getByRole("heading", { name: "Stop", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/stops\/\d+/);

  expect(pageErrors).toEqual([]);
});

test("tracking route keeps map and live arrival context visible", async ({ page }) => {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({
    latitude: 21.311,
    longitude: -157.868,
  });
  const arrivals = [
    {
      id: "mock-1280-a1",
      route: "A",
      headsign: "Aloha Stadium Stn - Connection to Waipahu",
      direction: "Westbound",
      stopTime: "2:08 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 8,
      vehicle: "MOCK-A",
      trip: null,
      latitude: 21.307,
      longitude: -157.854,
      shape: null,
    },
    {
      id: "mock-1280-4a",
      route: "4",
      headsign: "McCully via UH Manoa",
      direction: "Eastbound",
      stopTime: "2:16 PM",
      estimated: true,
      canceled: false,
      minutesUntil: 16,
      vehicle: "MOCK-4",
      trip: null,
      latitude: 21.308,
      longitude: -157.855,
      shape: null,
    },
  ];

  await page.route("**/api/arrivals?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        stop: "1280",
        arrivals,
        lines: ["A", "4"],
        fetchedAt: new Date().toISOString(),
        dataSource: "mock",
      },
    });
  });

  await page.route("**/api/tracking?*", async (route) => {
    const arrivalId = new URL(route.request().url()).searchParams.get("arrival");
    const arrival =
      arrivals.find((item) => item.id === arrivalId) ?? arrivals[0];
    await route.fulfill({
      contentType: "application/json",
      json: {
        stop: "1280",
        arrival,
        vehicleLocation: { lat: 21.307, lng: -157.854 },
        stopsAway: 3,
        stopsAwaySource: "exact",
        routeStops: [
          {
            id: "437",
            name: "S King St + Punchbowl St",
            lat: 21.3049,
            lng: -157.8572,
            kind: "stop",
            markerKind: "intermediate",
            sequence: 1,
          },
          {
            id: "1280",
            name: "S Beretania St + Pali Hwy + Bishop St",
            lat: 21.3018,
            lng: -157.8519,
            kind: "stop",
            markerKind: "destination",
            sequence: 2,
          },
        ],
        fetchedAt: new Date().toISOString(),
        dataSource: "mock",
      },
    });
  });

  await page.goto("/stops/1280/track/mock-1280-a1");
  await expect(page.getByRole("heading", { name: "Tracking" })).toBeVisible();
  await expect(page.getByText(/Stops away:/)).toBeVisible();
  await expect(page.getByText("Aloha Stadium Stn - Connection to Waipahu")).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".tracking-user-location-marker")).toBeVisible();
  await expect(page.locator(".tracking-route-line--full")).toBeVisible();
  await expect(page.locator(".tracking-route-line--approach")).toBeVisible();
  await expect(page.locator(".tracking-direction-arrow")).toBeVisible();
  await expect(page.locator(".tracking-stop-tooltip")).toHaveCount(0);
  await page
    .locator('.leaflet-marker-icon[title^="S King St + Punchbowl St"]')
    .click();
  await expect(page.locator(".tracking-stop-tooltip")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /S King St \+ Punchbowl St/ }),
  ).toBeVisible();

  const summaryContentBox = await page
    .getByRole("region", { name: "Buses serving this stop" })
    .locator(":scope > div")
    .boundingBox();

  expect(summaryContentBox?.width).toBeLessThanOrEqual(320);
  await expect(page.locator(".tracking-carousel")).toHaveCSS(
    "align-items",
    "flex-start",
  );
  const activeCard = page.locator('article[aria-current="true"]');
  const activeCardBox = await activeCard.boundingBox();
  const statusRowBox = await activeCard.locator("p").last().boundingBox();
  expect(activeCardBox).not.toBeNull();
  expect(statusRowBox).not.toBeNull();
  if (activeCardBox && statusRowBox) {
    expect(
      Math.abs(
        activeCardBox.y + activeCardBox.height -
          (statusRowBox.y + statusRowBox.height),
      ),
    ).toBeLessThanOrEqual(1);
  }
  await page
    .getByRole("button", { name: "Track route 4, bus 2 of 2" })
    .click();
  await expect(page).toHaveURL(/mock-1280-4a$/);
  await expect(page.getByText("McCully via UH Manoa")).toBeVisible();
});

test("tracking error keeps navigation and recovery available", async ({ page }) => {
  await page.route("**/api/tracking?*", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      json: { error: "Unable to reach TheBus API." },
    });
  });

  await page.goto("/stops/1280/track/unavailable");
  await expect(page.getByRole("heading", { name: "Tracking" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bus location unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to stop" })).toBeVisible();
});

test("rider can browse bus and stop favorites, then save a removed stop", async ({ page }) => {
  await page.route("**/api/arrivals?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        stop: "1280",
        arrivals: [],
        lines: [],
        fetchedAt: new Date().toISOString(),
        dataSource: "mock",
      },
    });
  });

  await page.goto("/favorites");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("tab", { name: "stops" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(await page.getByRole("tab").allTextContents()).toEqual([
    "Stops",
    "Buses",
  ]);
  await expect(page.getByText("Bishop St + Queen St")).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove Bishop St + Queen St from favorites",
    })
    .click();
  await expect(page.getByText("Bishop St + Queen St")).toHaveCount(0);

  await page.goto("/favorites?tab=buses");
  await expect(page.getByRole("tab", { name: "buses" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("A - Ahua Lagoon Drive Skyline Station")).toBeVisible();

  await page.goto("/stops/1280");
  const saveButton = page.getByRole("button", { name: "Save to favorites" });
  await saveButton.click();
  await expect(
    page.getByRole("button", { name: "Remove from favorites" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.goto("/favorites");
  await expect(
    page.getByText("Bishop St + Queen St"),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "stops" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("searchbox", { name: "Search favorites" }).fill("Ala Moana");
  await expect(page.getByText("No matching stops")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search favorites" }).clear();
  await page
    .getByRole("button", {
      name: "Remove Bishop St + Queen St from favorites",
    })
    .click();
  await expect(page.getByText("Bishop St + Queen St")).toHaveCount(0);
});

test("settings persist language and location preferences", async ({ page }) => {
  await page.goto("/settings");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByText("Version 0.1.0")).toBeVisible();
  await expect(page.getByRole("link", { name: "Website" })).toHaveAttribute(
    "href",
    "https://www.thebus.org/",
  );

  await page.getByLabel("Language").selectOption("haw");
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("holo-hele-language")),
    )
    .toBe("haw");

  await page.getByText("Use my location", { exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Use my location" }),
  ).not.toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("holo-hele-use-location"),
      ),
    )
    .toBe("false");

  await page.getByText("Use my location", { exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Use my location" }),
  ).toBeChecked();
  await expect(page.getByText("Location is ready for nearby stop searches.")).toHaveCount(0);
});

test("Japanese language switches immediately and persists across pages", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByLabel("Language").selectOption("ja");
  await expect(page.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
  await expect(page.getByText("位置情報を使用", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  await page.goto("/favorites");
  await expect(page.getByRole("heading", { name: "お気に入り" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "バス停" })).toBeVisible();
  await expect(page.getByRole("link", { name: "マップ" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "お気に入り" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("holo-hele-language")),
    )
    .toBe("ja");
});

test("contextual service alert blades separate heading and description", async ({
  page,
}) => {
  await page.goto("/buses/1l-437");

  const alertBlade = page.getByRole("link", {
    name: "View service alert: Detour in effect",
  });
  await expect(alertBlade).toBeVisible();
  await expect(
    alertBlade.getByText("Detour in effect", { exact: true }),
  ).toBeVisible();
  await expect(
    alertBlade.getByText(/Route 1L is detoured near S Beretania St \+ Bishop St/),
  ).toBeVisible();
  await expect(alertBlade.getByText("Details", { exact: true })).toBeVisible();
});

test("alert details preserve navigation back to favorite stops", async ({
  page,
}) => {
  await page.goto("/stops/437?from=favorites");
  await page
    .getByRole("link", { name: /View service alert:/ })
    .click();
  await expect(page.getByRole("heading", { name: "Alert details" })).toBeVisible();
  await expect(page).toHaveURL(/\/alerts\/.*from=favorites/);

  await page.getByRole("link", { name: "Back to stop" }).click();
  await expect(page).toHaveURL(/\/stops\/437\?from=favorites$/);
  await page.getByRole("link", { name: "Back to favorite stops" }).click();
  await expect(page).toHaveURL(/\/favorites\?tab=stops$/);
});

test("passive trip screens do not prompt for undecided location permission", async ({
  context,
  page,
}) => {
  await context.clearPermissions();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: () => {
          window.sessionStorage.setItem("location-requested", "true");
        },
        watchPosition: () => {
          window.sessionStorage.setItem("location-requested", "true");
          return 1;
        },
        clearWatch: () => undefined,
      },
    });
  });
  await page.route("**/api/trip-plan?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        journeys: [],
        origin: {
          name: "Downtown Honolulu preview",
          detail: "Downtown Honolulu preview",
          coordinate: [21.3047, -157.8567],
        },
        destination: {
          name: "Ala Moana Center",
          detail: "1450 Ala Moana Blvd, Honolulu, HI 96814",
          coordinate: [21.29072, -157.84278],
        },
        fetchedAt: new Date().toISOString(),
        dataSource: "scheduled",
      },
    });
  });

  await page.goto("/home");
  await expect(page.getByRole("searchbox", { name: "Search destination" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem("location-requested")))
    .toBeNull();

  await page.goto(
    "/plan?destination=Ala+Moana+Center&destinationLat=21.29072&destinationLng=-157.84278",
  );

  await expect(page.getByText("Downtown Honolulu preview", { exact: true })).toBeVisible();
  await expect(page.getByText(/using a downtown preview origin/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "No direct trip found" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem("location-requested")))
    .toBeNull();
});

test("trip planning unavailable state offers recovery and a labeled preview", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("holo-hele-use-location", "false");
  });
  await page.route("**/api/trip-plan?*", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      json: { error: "Trip planning is temporarily unavailable." },
    });
  });
  await page.route("**/api/alerts*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        alerts: [],
        fetchedAt: new Date().toISOString(),
        sourceUrl: "https://www.thebus.org/",
        status: "live",
        cached: false,
      },
    });
  });

  await page.goto(
    "/plan?destination=Ala+Moana+Center&destinationLat=21.29072&destinationLng=-157.84278",
  );

  await expect(
    page.getByRole("heading", { name: "Current trips are temporarily unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByText("Simulated preview").first()).toBeVisible();
});

test("search flows through trip options, directions, and live guidance", async ({
  page,
}) => {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({
    latitude: 21.3049,
    longitude: -157.8569,
  });
  const tripRequestModes: string[] = [];
  const tripRequestedTimes: string[] = [];
  const liveJourney = {
    ...JOURNEY_OPTIONS[0],
    id: "gtfs-smoke-42-131-761",
    tripId: "smoke-42",
    dataSource: "live" as const,
    scheduleDeviationMinutes: 4,
    origin: {
      ...JOURNEY_OPTIONS[0].origin,
      name: "Downtown Honolulu preview",
      detail: "Approximate device location",
    },
  };

  await page.route("**/api/nearby?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        stops: [],
        userLocation: { lat: 21.3047, lng: -157.8567 },
        fetchedAt: new Date().toISOString(),
        dataSource: "mock",
      },
    });
  });

  await page.route("**/api/trip-plan?*", async (route) => {
    const requestUrl = new URL(route.request().url());
    tripRequestModes.push(requestUrl.searchParams.get("timeMode") ?? "");
    tripRequestedTimes.push(requestUrl.searchParams.get("requestedTime") ?? "");
    await route.fulfill({
      contentType: "application/json",
      json: {
        journeys: [liveJourney],
        origin: liveJourney.origin,
        destination: liveJourney.destination,
        fetchedAt: new Date().toISOString(),
        dataSource: "live",
      },
    });
  });

  await page.route("**/api/walking-directions?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        start: {
          path: liveJourney.path.walkStart,
          distance: "160 m",
          durationMinutes: 2,
          steps: [
            {
              maneuver: "start",
              instruction:
                "Head southwest on S King Street toward Punchbowl Street.",
            },
            {
              maneuver: "right",
              instruction: "Turn right onto Punchbowl Street.",
            },
            {
              maneuver: "destination",
              instruction: "The bus stop is on your right.",
            },
          ],
        },
        end: {
          path: liveJourney.path.walkEnd,
          distance: "220 m",
          durationMinutes: 3,
          steps: [
            {
              maneuver: "start",
              instruction: "Walk east toward Ala Moana Center.",
            },
            {
              maneuver: "destination",
              instruction: "You have arrived at your destination.",
            },
          ],
        },
        dataSource: "routed",
      },
    });
  });

  await page.route("**/api/arrivals?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        stop: "131",
        arrivals: [
          {
            id: "different-trip",
            route: "42",
            headsign: "Waikīkī Beach & Hotels",
            direction: "Eastbound",
            stopTime: "9:43 AM",
            estimated: true,
            canceled: false,
            minutesUntil: 1,
            vehicle: "OTHER-BUS",
            trip: "different-trip",
            latitude: 21.3055,
            longitude: -157.8578,
            shape: null,
          },
          {
            id: "smoke-42-arrival",
            route: "42",
            headsign: "Waikīkī Beach & Hotels",
            direction: "Eastbound",
            stopTime: "9:45 AM",
            estimated: true,
            canceled: false,
            minutesUntil: 3,
            vehicle: "MATCHED-BUS",
            trip: "smoke-42",
            latitude: 21.307,
            longitude: -157.86,
            shape: null,
          },
        ],
        lines: ["42"],
        fetchedAt: new Date().toISOString(),
        dataSource: "live",
      },
    });
  });

  await page.route("**/api/alerts*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        alerts: [
          {
            id: "smoke-route-42-detour",
            title: "Route 42 detour in effect",
            description: "Route 42 is using a temporary routing near the destination.",
            affectedRoutes: ["42"],
            affectedStops: [],
            systemWide: false,
            type: "detour",
            severity: "warning",
            source: "thebus-live",
            isLive: true,
          },
        ],
        fetchedAt: new Date().toISOString(),
        sourceUrl: "https://www.thebus.org/",
        status: "live",
        cached: false,
      },
    });
  });

  await page.route("**/api/search-stops?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        stops: [
          {
            id: "953",
            name: "ALA MOANA BL + AHUI ST",
            lat: 21.295348,
            lng: -157.85873,
            kind: "stop",
            lines: ["42", "60", "65", "67", "88A"],
          },
        ],
        fetchedAt: new Date().toISOString(),
        dataSource: "scheduled",
      },
    });
  });

  await page.goto("/home");
  await page.getByRole("searchbox", { name: "Search destination" }).click();
  await expect(page).toHaveURL(/\/search$/);
  const search = page.getByRole("searchbox", {
    name: "Search buses, stops, and places",
  });
  await search.fill("Ala");

  await expect(page.getByRole("heading", { name: "Buses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stops" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Places" })).toBeVisible();
  await expect(page.getByText("Stop 953")).toBeVisible();
  await expect(page.getByText("Lines: 42, 60, 65, 67, 88A")).toBeVisible();
  await page
    .getByRole("button", { name: /^Ala Moana Center 1450/ })
    .click();

  await expect(page).toHaveURL(/\/plan\?destination=Ala(\+|%20)Moana/);
  await expect(
    page.getByRole("heading", { name: "Trip options" }),
  ).toBeVisible();
  await expect(page.getByText("Delayed · In 3 min", { exact: true })).toBeVisible();
  await expect(page.getByText("Route 42 detour in effect")).toBeVisible();
  await page.getByRole("button", { name: /^Leave by / }).click();
  await expect(
    page.getByRole("dialog", { name: "Choose trip time" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Leave", exact: true, pressed: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Now", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Date", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Date", exact: true }).click();
  await expect(page.getByRole("radiogroup", { name: "Trip date" })).toBeVisible();
  await page.getByRole("radio", { name: /Tomorrow/ }).click();
  await expect(page.getByRole("button", { name: "Now", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Time", exact: true }).click();
  await page
    .getByRole("listbox", { name: "Hour" })
    .getByRole("option", { name: "10", exact: true })
    .click();
  await page
    .getByRole("listbox", { name: "Minute" })
    .getByRole("option", { name: "30", exact: true })
    .click();
  await page
    .getByRole("listbox", { name: "AM or PM" })
    .getByRole("option", { name: "PM", exact: true })
    .click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: "Leave by 10:30 PM" }),
  ).toBeVisible();
  await expect.poll(() => tripRequestModes).toContain("leave");
  await expect.poll(() => tripRequestedTimes.some(Boolean)).toBe(true);
  await page.getByRole("button", { name: "Leave by 10:30 PM" }).click();
  await page.getByRole("button", { name: "Now", exact: true }).click();
  await expect(page.getByRole("listbox", { name: "Hour" })).toBeVisible();
  await expect(page.getByRole("listbox", { name: "Minute" })).toBeVisible();
  await expect(page.getByRole("listbox", { name: "AM or PM" })).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: /^Leave by / })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Leave by 10:30 PM" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^Leave by / }).click();
  await expect(
    page.getByRole("button", { name: "Leave", exact: true, pressed: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: /Filter by/ }).click();
  await page
    .getByRole("menuitemradio", { name: "Fewest transfers" })
    .click();
  await page.getByRole("button", { name: /Filter by/ }).click();
  await expect(
    page.getByRole("menuitemradio", {
      name: "Fewest transfers",
      checked: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: /14 minute trip.*Route 42/ }).click();
  await expect(page.getByRole("heading", { name: "Trip Details" })).toBeVisible();
  const tripSheet = page.getByRole("region", { name: "Trip details" });
  await expect(tripSheet).toHaveAttribute("data-sheet-state", "default");
  const sheetHandle = page.getByRole("button", {
    name: "Expand trip details",
  });
  const handleBounds = await sheetHandle.boundingBox();
  expect(handleBounds).not.toBeNull();
  if (handleBounds) {
    await page.mouse.move(
      handleBounds.x + handleBounds.width / 2,
      handleBounds.y + handleBounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      handleBounds.x + handleBounds.width / 2,
      handleBounds.y + handleBounds.height / 2 + 250,
      { steps: 6 },
    );
    await page.mouse.up();
  }
  await expect(tripSheet).toHaveAttribute("data-sheet-state", "collapsed");
  const showMoreTripDetails = page.getByRole("button", {
    name: "Show more trip details",
  });
  await showMoreTripDetails.press("ArrowUp");
  await expect(tripSheet).toHaveAttribute("data-sheet-state", "default");
  await page
    .getByRole("button", { name: "Expand trip details" })
    .press("ArrowUp");
  await expect(tripSheet).toHaveAttribute("data-sheet-state", "expanded");
  await page
    .getByRole("button", { name: "Show less trip details" })
    .press("ArrowDown");
  await expect(tripSheet).toHaveAttribute("data-sheet-state", "default");
  await expect(page.getByText("8 min", { exact: true })).toBeVisible();
  await expect(page.getByText("Arrive 9:56 AM", { exact: true })).toBeVisible();
  await expect(page.getByText("Bus arrives in 3 min", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Live · Bus arrives/)).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Trip route overview" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Trip itinerary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trip itinerary" })).toHaveCount(0);
  await expect(page.getByText("Waikīkī Beach & Hotels", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Starting point", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Approximate device location")).toHaveCount(0);
  await expect(page.getByText(/preview to Ala Moana Center/)).toHaveCount(0);
  await expect(page.getByText("Stop 131")).toHaveCount(0);
  await expect(
    page.getByText("Ala Moana Blvd + Ala Moana Center", { exact: true }),
  ).toBeVisible();
  const walkDirections = page.getByRole("button", {
    name: /Walk About 2 min, 160 m/,
  });
  await expect(walkDirections).toHaveAttribute("aria-expanded", "false");
  await walkDirections.click();
  await expect(
    page.getByText(/Walking directions use OpenStreetMap/).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Head southwest on S King Street toward Punchbowl Street."),
  ).toBeVisible();
  await expect(
    page.locator('#walk-start-directions [data-maneuver="start"]'),
  ).toBeVisible();
  await expect(
    page.locator('#walk-start-directions [data-maneuver="right"]'),
  ).toBeVisible();
  await expect(
    page.getByText("Turn right onto Punchbowl Street."),
  ).toBeVisible();
  await expect(
    page.getByText("Destination: S King St + Punchbowl St"),
  ).toHaveCount(0);
  await expect(page.getByText("S King St + Punchbowl St")).toBeVisible();
  const rideStops = page.getByRole("button", {
    name: /Waikīkī Beach & Hotels.*Ride 5 stops · 8 min/,
  });
  await rideStops.click();
  await expect(
    page.locator("#ride-stop-sequence").getByText("S King St + South St", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("#ride-stop-sequence").getByText(
      "S King St + Ward Ave",
      { exact: true },
    ),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Trip Details" })).toBeVisible();

  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: "Trip Guidance" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Walk 2 minutes to/ })).toBeVisible();
  await expect(page.getByText("Your location is updating")).toHaveCount(0);
  await expect(page.getByText(/Your bus arrives in 3 min/)).toBeVisible();
  await expect(page.getByText(/\d+ m left/)).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Walking directions" }),
  ).toBeVisible();
  await expect(
    page.getByText("Head southwest on S King Street toward Punchbowl Street."),
  ).toBeVisible();
  await expect(page.getByText(/Board Route 42/)).toHaveCount(0);
  await expect(page.getByText(/Your bus arrives in 1 min/)).toHaveCount(0);
  await expect(page.locator(".journey-user-marker")).toBeVisible();
  await expect(page.locator(".journey-bus-marker")).toBeVisible();
  await expect(page.getByText(/Approaching boarding stop/)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Journey stages" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Show journey part/ })).toHaveCount(4);
  await page.getByRole("button", { name: "Show journey part 4 of 4" }).click();
  await expect(
    page.getByRole("heading", { name: "Walk 3 minutes to your destination" }),
  ).toBeVisible();
  await expect(page.getByText("220 m left", { exact: true })).toBeVisible();
  await expect(page.getByText("Walk east toward Ala Moana Center.")).toBeVisible();
  await page.getByRole("button", { name: "Show journey part 1 of 4" }).click();
  await page.context().setGeolocation({
    latitude: liveJourney.boardStop.coordinate[0],
    longitude: liveJourney.boardStop.coordinate[1],
  });
  await expect(page.getByRole("heading", { name: /Walk 2 minutes to/ })).toBeVisible();
  await page.getByRole("button", { name: "Show journey part 2 of 4" }).click();
  await expect(page.getByRole("heading", { name: "Wait for" })).toBeVisible();
  await expect(page.getByText(/Your bus arrives in 3 min/)).toBeVisible();
  await expect(page.getByText(liveJourney.boardStop.name, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show journey part 3 of 4" }).click();
  await expect(page.getByRole("list", { name: "Stops on this ride" })).toBeVisible();
  await expect(page.getByText(liveJourney.alightStop.name, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "I’m on the bus" })).toBeVisible();
  await page.getByRole("button", { name: "Show journey part 1 of 4" }).click();
  await page.getByRole("button", { name: "I’m at the stop" }).click();
  await expect(page.getByRole("heading", { name: "Wait for" })).toBeVisible();
  await page.getByRole("button", { name: "I’m on the bus" }).click();
  await expect(page.getByRole("heading", { name: "Get off in 3 stops" })).toBeVisible();
  await expect(page.getByText(/3 stops to Ala Moana Blvd/)).toBeVisible();
  await expect(page.locator(".journey-user-marker")).toBeVisible();
  await expect(page.locator(".journey-bus-marker")).toBeVisible();
  await expect(page.locator(".journey-direction-arrow")).toHaveCount(0);
  await page.context().setGeolocation({
    latitude: 21.30282,
    longitude: -157.85942,
  });
  await expect(page.getByText(/2 stops to Ala Moana Blvd/)).toBeVisible();
  await page.context().setGeolocation({
    latitude: 21.29982,
    longitude: -157.85864,
  });
  await expect(
    page.getByRole("heading", { name: "Get off at the next stop" }),
  ).toBeVisible();
  await expect(page.getByText(/Get off at the next stop · Ala Moana Blvd/)).toBeVisible();
  await page.context().setGeolocation({
    latitude: 21.289896,
    longitude: -157.844534,
  });
  await expect(page.getByRole("heading", { name: "This is your stop" })).toBeVisible();
  await page.getByRole("button", { name: "I’m off the bus" }).click();
  await expect(
    page.getByRole("heading", { name: "Walk 3 minutes to your destination" }),
  ).toBeVisible();
  await expect(page.getByText("Continue toward Ala Moana Center.")).toHaveCount(0);
  await expect(page.getByText("Walk east toward Ala Moana Center.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Finish trip" })).toBeVisible();
});

test("live guidance keeps the route when rider and vehicle locations are unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("holo-hele-use-location", "false");
  });

  await page.goto(
    "/live-directions/recommended-42?destination=Ala+Moana+Center",
  );

  await expect(page.getByRole("heading", { name: "Trip Guidance" })).toBeVisible();
  await expect(page.getByText(/Your location is unavailable/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Settings" })).toBeVisible();
  await expect(
    page.getByLabel("Scheduled arrival time 9:45 AM"),
  ).toBeVisible();
  await expect(
    page.getByText("Scheduled arrival · 9:45 AM", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("9:45 AM", { exact: true })).toBeVisible();
  await expect(page.getByText(/Live bus location is unavailable/)).toHaveCount(0);
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeVisible();
  await expect(page.locator(".journey-user-marker")).toHaveCount(0);
  await expect(page.locator(".journey-bus-marker")).toHaveCount(0);
});

test("search results can save buses and stops without opening them", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("holo-hele-favorite-buses", "[]");
    window.localStorage.setItem("holo-hele-favorite-stops", "[]");
  });
  await page.route("**/api/search-stops?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        stops: [
          {
            id: "2839",
            name: "ALA ALOALO ST + LIKINI ST",
            lat: 21.349,
            lng: -157.886,
            kind: "stop",
            lines: ["3"],
          },
        ],
        fetchedAt: new Date().toISOString(),
        dataSource: "scheduled",
      },
    });
  });

  await page.goto("/search");
  await page
    .getByRole("searchbox", { name: "Search buses, stops, and places" })
    .fill("ala");

  const saveBus = page.getByRole("button", {
    name: "Save Route A to favorites",
  });
  await saveBus.click();
  await expect(
    page.getByRole("button", { name: "Remove Route A from favorites" }),
  ).toHaveAttribute("aria-pressed", "true");

  const saveStop = page.getByRole("button", {
    name: "Save ALA ALOALO ST + LIKINI ST to favorites",
  });
  await saveStop.click();
  await expect(
    page.getByRole("button", {
      name: "Remove ALA ALOALO ST + LIKINI ST from favorites",
    }),
  ).toHaveAttribute("aria-pressed", "true");

  await expect
    .poll(() =>
      page.evaluate(() => ({
        buses: window.localStorage.getItem("holo-hele-favorite-buses"),
        stops: window.localStorage.getItem("holo-hele-favorite-stops"),
      })),
    )
    .toEqual({ buses: '["a-437"]', stops: '["2839"]' });
});

test("route search opens the Hawaiʻi Kai scheduled route", async ({ page }) => {
  await page.route("**/api/route-schedule?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        route: "1L",
        name: "1L - Hawaiʻi Kai",
        headsign: "HAWAII KAI",
        origin: "Hālawa Aloha Stadium Station",
        destination: "Hawaiʻi Kai Park & Ride",
        serviceDate: "2026-08-12",
        tripId: "test-trip",
        path: [
          [21.3724, -157.9301],
          [21.3346, -157.8205],
          [21.2969, -157.711],
        ],
        stops: [
          {
            id: "1",
            name: "Hālawa Aloha Stadium Station",
            lat: 21.3724,
            lng: -157.9301,
            kind: "station",
            sequence: 1,
            scheduledTime: "4:51 PM",
          },
          {
            id: "2",
            name: "S King St + Punchbowl St",
            lat: 21.3346,
            lng: -157.8205,
            kind: "stop",
            sequence: 2,
            scheduledTime: "5:10 PM",
          },
          {
            id: "3",
            name: "Hawaiʻi Kai Park & Ride",
            lat: 21.2969,
            lng: -157.711,
            kind: "stop",
            sequence: 3,
            scheduledTime: "5:39 PM",
          },
        ],
        dataSource: "scheduled",
        fetchedAt: new Date().toISOString(),
      },
    });
  });

  await page.goto("/search");
  const search = page.getByRole("searchbox", {
    name: "Search buses, stops, and places",
  });

  await search.fill("1L");
  await page
    .getByRole("button", { name: /1L - Hawaiʻi Kai - Limited Stops/ })
    .click();

  await expect(page).toHaveURL(/\/routes\/1l-hawaii-kai$/);
  await expect(
    page.getByRole("heading", { name: "Route", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Route map" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Route stops" })).toBeVisible();
  await expect(
    page.getByText("Hawaiʻi Kai Park & Ride", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(3);
  await expect(page.locator(".route-map__intermediate-stop")).toHaveCount(1);
});

test("schedule date picker loads the selected service date", async ({ page }) => {
  const requestedDates: string[] = [];
  await page.route("**/api/daily-schedule?*", async (route) => {
    const date = new URL(route.request().url()).searchParams.get("date") ?? "";
    requestedDates.push(date);
    await route.fulfill({
      contentType: "application/json",
      json: {
        stop: {
          id: "437",
          name: "S BERETANIA ST + BISHOP ST",
          lat: 21.3093,
          lng: -157.8583,
          kind: "stop",
        },
        serviceDate: date,
        routes: ["A"],
        departures: [
          {
            id: `trip-${date}`,
            route: "A",
            headsign: "AHUA LAGOON DRIVE SKYLINE STATION",
            time: "6:04 AM",
            tripId: "trip-a",
          },
        ],
        dataSource: "scheduled",
        fetchedAt: new Date().toISOString(),
      },
    });
  });

  await page.goto("/schedule?stop=%22437%22&route=%22A%22&bus=%22a-437%22");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /[A-Z][a-z]+ \d{4}/ })).toBeVisible();

  const selectedDate = page.getByRole("gridcell", { selected: true });
  const selectedLabel = await selectedDate.getAttribute("aria-label");
  if (!selectedLabel) throw new Error("Selected calendar day needs an accessible label.");
  expect(selectedLabel).toContain("Today");
  const nextDate = new Date(`${selectedLabel.replace(", Today", "")} 12:00:00 UTC`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(nextDate);
  await page.getByRole("gridcell", { name: nextLabel }).click();

  await expect.poll(() => requestedDates.at(-1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByRole("button", { name: "Tomorrow", exact: true })).toBeVisible();
});
