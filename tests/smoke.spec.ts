import { expect, test } from "@playwright/test";

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
  await page.getByRole("button", { name: "Close stop details" }).click();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await page.getByRole("button", { name: "Nearby Stops" }).click();
  await expect(page.getByText(/Updated /)).toBeVisible();

  await page
    .getByRole("link", {
      name: "View stop S Beretania St + Pali Hwy + Bishop St",
    })
    .click();
  await expect(page.getByRole("heading", { name: "Stop", exact: true })).toBeVisible();
  await expect(page.getByText("S Beretania St + Pali Hwy + Bishop St")).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("tracking route keeps map and live arrival context visible", async ({ page }) => {
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
  await expect(page.getByRole("tab", { name: "buses" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("A - Ahua Lagoon Drive Skyline Station")).toBeVisible();

  await page.getByRole("tab", { name: "stops" }).click();
  await expect(page.getByText("S Beretania St + Pali Hwy + Bishop St")).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove S Beretania St + Pali Hwy + Bishop St from favorites",
    })
    .click();
  await expect(page.getByText("S Beretania St + Pali Hwy + Bishop St")).toHaveCount(0);

  await page.goto("/stops/1280");
  const saveButton = page.getByRole("button", { name: "Save to favorites" });
  await saveButton.click();
  await expect(
    page.getByRole("button", { name: "Remove from favorites" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.goto("/favorites");
  await page.getByRole("tab", { name: "stops" }).click();
  await expect(
    page.getByText("S Beretania St + Pali Hwy + Bishop St"),
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
      name: "Remove S Beretania St + Pali Hwy + Bishop St from favorites",
    })
    .click();
  await expect(page.getByText("S Beretania St + Pali Hwy + Bishop St")).toHaveCount(0);
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
});

test("search flows through trip options, directions, and live guidance", async ({
  page,
}) => {
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

  await page.goto("/home");
  await page.getByRole("searchbox", { name: "Search destination" }).click();
  await expect(page).toHaveURL(/\/search$/);
  const search = page.getByRole("searchbox", {
    name: "Search buses, stops, and places",
  });
  await search.fill("Ala Moana");

  await expect(page.getByRole("heading", { name: "Buses" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stops" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Places" })).toBeVisible();
  await page
    .getByRole("button", { name: /^Ala Moana Center 1450/ })
    .click();

  await expect(page).toHaveURL(/\/plan\?destination=Ala(\+|%20)Moana/);
  await expect(
    page.getByRole("heading", { name: "Recommended Route" }),
  ).toBeVisible();
  await expect(page.getByText(/trip planning data is currently simulated/i)).toBeVisible();

  await page
    .getByRole("link")
    .filter({ hasText: "Travel Time: 14 min" })
    .click();
  await expect(page.getByRole("heading", { name: "Direction" })).toBeVisible();
  await expect(page.getByText("S King St + Alakea St")).toBeVisible();

  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: "Live Direction" })).toBeVisible();
  await expect(page.getByText("Pali Hwy + S Beretania St")).toBeVisible();
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

  await search.fill("Hawaiʻi Kai");
  await page
    .getByRole("button", { name: /1L - Hawaiʻi Kai - Limited Stops/ })
    .click();

  await expect(page).toHaveURL(/\/routes\/1l-hawaii-kai$/);
  await expect(page.getByRole("heading", { name: "Route" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Route map" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Route stops" })).toBeVisible();
  await expect(page.getByText("Hawaiʻi Kai Park & Ride")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(2);

  const routeMap = page.getByRole("region", { name: "Route map" });
  await routeMap.dblclick();
  await expect(page.locator(".route-map__intermediate-stop")).toHaveCount(1);
});
