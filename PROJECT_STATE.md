# Holo Hele — Project State

Last updated: 2026-09-03

## Project overview

Holo Hele is a mobile-first redesign prototype for finding and understanding Oʻahu public transit. It currently demonstrates onboarding, nearby stops, stop arrivals, route and vehicle maps, saved transit information, schedules, service-alert presentation, and a real scheduled direct-trip flow with optional live enrichment and a clearly labeled simulated fallback. It runs as a responsive web app and can also be packaged in a Tauri 2 desktop shell.

## Tech stack

- **Framework:** React 19 with Vite
- **Language:** TypeScript
- **Runtime/API server:** Bun
- **Styling:** Tailwind CSS 4 utilities, shared CSS variables in `src/styles.css`, and Inter fonts
- **Maps:** Leaflet and React Leaflet with CARTO Light tiles/OpenStreetMap attribution
- **State management:** React state and TanStack Query
- **Routing:** TanStack Router with file-based routes
- **Transit APIs:** TheBus official GTFS feed; optional TheBus HEA arrivals and vehicle endpoints
- **Desktop packaging:** Tauri 2 with Rust and the official notification plugin
- **Testing/tooling:** Playwright, ESLint, and TypeScript

## Current app structure

The React client lives in `src/` and `components/`. File routes render pages; reusable UI lives under `components/`. `lib/` contains API calls, persistence, TheBus integration, and mock fixtures. `server/index.ts` exposes a read-only Bun API, while `server/gtfs.ts` indexes official GTFS data in memory. Shared types are in `types/transit.ts`, and `src-tauri/` contains the desktop wrapper.

## Implemented features

- **Onboarding** — A timed landing screen advances to language selection and optional location permission. Choices persist locally.
- **Nearby stops and island map** — Uses device coordinates or downtown Honolulu as fallback. The nearby sheet shows ten official GTFS stops and an HEA key enriches up to four with live arrivals. Home also loads all 3,843 stops in the current GTFS feed, rendering only viewport-relevant, zoom-thinned markers. Official transit-center anchors provide sparse bus-icon context at wide zooms, and a selected stop uses the Figma primary-blue glow.
- **Stop details** — Loads a bundled preview stop or any stop available from GTFS, displays lines and arrivals, distinguishes scheduled from estimated times, and refreshes live arrivals every 30 seconds.
- **Vehicle tracking** — For live arrivals, combines HEA vehicle data with a GTFS trip sequence, route geometry, remaining stop markers, approach line, and stops-away information. Live tracking refreshes every 15 seconds and includes loading/error states.
- **Route details** — The Hawaiʻi Kai Route 1L example loads an official GTFS trip, shape, stops, and times. Other route URLs show a preview-unavailable state.
- **Schedules** — Favorite stop and bus flows can open official GTFS daily departures for a selected service date and choose a line. A calendar control replaces the old Today icon, supports month navigation, and keeps today visibly marked when another date is selected. Times are scheduled, not live estimates.
- **Favorites** — Saved buses and curated stops have searchable Stops/Buses tabs, with Stops first and selected by default, filled-heart saved states, context-aware back navigation, and local persistence. Curated disruption examples remain available for portfolio simulation; a matching official notice takes precedence when one is active.
- **Rider alerts** — The Bun API retrieves, normalizes, and caches current TheBus Service Disruption notices. The in-app page handles live, stale, and unavailable states, while exact route/stop matches add restrained contextual indicators. Contextual blades separate a short alert-type heading from the rider-facing impact description. Curated scenarios use the same production-style presentation but remain technically separate from the live response.
- **Search** — Provides debounced autocomplete across the official island-wide GTFS stop index, plus curated buses and places. Its empty, focused, saved, and categorized-result states follow the approved Figma frames. Bus and stop results include independent favorite controls with lighter outline hearts for unsaved items and filled blue hearts for saved items; place results begin trip planning.
- **Trip planning and guidance** — Place results with coordinates request real direct walk–bus–walk options from the active TheBus GTFS feed. Exact-trip HEA matches enrich boarding estimates and vehicle positions; unmatched options remain scheduled. Plan Trip shows whole-trip departure/arrival times, compact mode sequences, disruption context, loading/unavailable/no-direct states, interactive Leave/Arrive/Now and date selection, and Best route/Least walking/Fewest transfers sorting on a white canvas. Trip Details presents its aligned walk–ride–walk rail in an accessible three-position draggable bottom sheet over the full route map; its walking disclosures request prototype-only Valhalla/OpenStreetMap pedestrian geometry and turn language, with independent approximate fallbacks. The combined bus section expands into the real scheduled GTFS stop sequence and times without showing stop IDs in the primary view. Preview implementation labels are hidden behind neutral **Starting point** copy, permission-backed trips use **Your location**, and the primary-blue **Start** action enters the separate **Trip Guidance** flow. Trip Guidance watches an already-authorized rider location and refreshes the boarding-stop feed every 15 seconds, displaying only the live vehicle whose GTFS trip ID exactly matches the chosen journey. A short, accurate stop dwell advances walking to waiting automatically. Boarding advances automatically only after multiple readings show the rider and exact selected vehicle leaving the stop together at vehicle-like speed; manual stage actions remain available as fallbacks. Onboard progress prefers the exact live vehicle position, advances monotonically through the actual GTFS stop sequence, and supplies two-stop, next-stop, and destination-stop warnings. Reaching and briefly remaining at the final ride stop advances automatically to the final walk. Accessible stage dots support tap and horizontal-swipe preview without changing actual progress. Location, vehicle, scheduled, low-confidence, and paused states retain readable guidance. A clearly labeled curated journey remains available when official planning is unavailable.
- **Settings and localization** — Persists language, location, and service-notification preferences; requests notification permission only after rider intent; provides a test notification; and links to TheBus resources, legal pages, and rider alerts. English and Japanese interface copy are implemented across the current primary flows; other listed languages remain future options.

## User flows

### Onboarding

Landing splash → choose language → allow or decline location → Home map.

### Familiar trip

Nearby map or favorite stop → stop arrivals → select a trackable live arrival → vehicle tracking map.

### Search by route

Search → select Hawaiʻi Kai Route 1L → official GTFS route map and complete scheduled stop sequence.

### Saved transit and schedules

Favorites → bus or stop → choose Schedule/line → use the calendar to view official departures for an active service date and return to today from its persistent marker.

### Unfamiliar trip preview

Search for Ala Moana Center → current direct GTFS journey options → expandable Trip Details timeline and scheduled stop sequence → **Start** walking guidance → automatically enter waiting after reaching the boarding stop → automatically enter onboard guidance when the rider and exact live bus depart together, or use the fallback confirmation → receive stop progress and get-off warnings → automatically enter the final walk at the alighting stop, or use the fallback confirmation.

### Disrupted trip preview

Favorite Route 1L or its bus page → detour indicator → in-app rider-alert details.

## Data sources

### TheBus official GTFS

Provides stops, routes, trips, stop times, calendars, shapes, and scheduled service. It is downloaded from `thebus.org` on first use and cached for the server process. It powers the island-wide map, nearby stops, scheduled arrivals, direct trip planning, expandable journey stop sequences, route details, tracking stop sequences, and daily schedules. It is scheduled—not live—and has no timed refresh.

### TheBus HEA API

Provides estimated arrivals and vehicle positions when `THEBUS_API_KEY` is configured. It supports stop details, nearby-stop enrichment, tracking, and exact-trip enrichment of planned boarding stops. Without it, trip options continue using official scheduled GTFS data. HEA does not provide disruptions here.

### TheBus Service Disruption page

The Bun API fetches `thebus.org/Updates/ServiceDisruption.asp`, parses current notices into the shared `TransitAlert` model, and caches successful results for five minutes. It extracts exact alphanumeric route IDs and explicit affected stop numbers; suggested alternative stops remain in the description rather than being marked closed. A last-known-good response is returned as stale when refresh fails, and an unavailable response stays isolated from other API features. The broader Rider Alerts index remains a second-phase source because its mixed notices and linked detail pages require more fragile crawling.

### CARTO Light / OpenStreetMap

Provides basemap tiles. Transit markers and overlays come from Holo Hele data.

### Browser geolocation

Provides rider coordinates after permission; otherwise maps use a fixed downtown Honolulu center.

## Live data vs mock data

### Live

- HEA arrivals and vehicle locations, only when a valid server-side API key is configured.
- Browser geolocation while permission is enabled and the app is open.
- Current official TheBus Service Disruption notices, retrieved server-side and refreshed at a five-minute cadence.

### Scheduled official data

- GTFS nearby stops, route shapes, stop sequences, service calendars, stop times, and selected-date schedules.
- The complete GTFS stop location list returned by `/api/stops`; service information for a selected map stop is requested separately.

### Mock / prototype

- Route 1L detour, Route 1L skipped-stop, Route 65 weather disruption, Routes 3/7 skipped-stop, and system-wide alert scenarios in `lib/mock/service-alerts.ts`. These are plausible future alert shapes modeled after TheBus notices, not a claim that every exact scenario is a verified historical alert.
- Search bus/place records and fallback journey options, coordinates, positions, stops, and timings in `lib/mock/journeys.ts`.
- Favorite bus definitions in `lib/mock/favorites.ts`.
- Deterministic tracking arrivals, positions, and stop sequences used when directly exercising known mock fixture IDs without an HEA key.

### Hybrid

- Nearby stops always originate from GTFS; with an HEA key, only the closest four are enriched with HEA arrivals. A failed HEA request retains scheduled data and reports that results may be incomplete.
- Home loads all stop locations once, filters them to the map viewport, and uses screen-grid thinning below zoom 16. Ordinary stops remain compact dots at wide zooms; manually verified public stop IDs for official transit centers are prioritized as small bus icons so the dots have clear context without random visual emphasis. Center anchors that collide at island zoom still obey the same thinning and appear as riders zoom closer. This keeps the island visible without mounting thousands of Leaflet markers. A selected non-nearby stop reuses the normal `/api/arrivals` request and query cache.
- Live tracking uses HEA for the selected vehicle and GTFS for route shape/stop order. If GTFS matching fails, the UI does not invent named live stops.

## Favorites

Stops can be toggled from stop detail, and the four predefined bus favorites can be toggled from their bus pages. The Favorites page opens to its first **Stops** tab by default while preserving direct `?tab=buses` links. IDs are stored under separate `localStorage` keys and persist in the same browser and origin; there is no account or cross-device synchronization. Default preview favorites appear only while a storage key is uninitialized, so removing all items remains persistent.

The Favorites screen and empty-query Search screen consume saved stops. Bus detail and schedule flows consume saved bus definitions. A dynamically loaded GTFS stop ID can be stored, but the Favorites list currently resolves only the curated stops in `lib/thebus/stops.ts`, so other saved stops may not appear.

## Alerts and disruptions

`GET /api/alerts` returns normalized official service disruptions plus source status metadata. Deterministic alert IDs support duplicate suppression, route matching is exact (`1` does not match `1L`), stop matching uses explicit stop numbers only, and `systemWide` represents broad notices intentionally. TanStack Query polls every five minutes. `/alerts` provides loading, empty, stale, and unavailable states plus official source attribution, while `/alerts/[alertId]` shows only the selected notice. Detours/reroutes use yellow; notices that explicitly report no service, closure, or suspension use red regardless of whether TheBus categorizes the cause as Weather, utilities, roadwork, or a stop closure. A selected curated scenario appears above the general live list when requested.

Favorite-bus and bus-detail alerts require the notice to affect both that exact route and the bus favorite's saved stop; a whole-stop closure with no route list affects every bus at that stop. A `stop-skipped` notice affects only its named routes at that stop. Stop contexts distinguish an entire stop closure from named routes that are temporarily skipping it. Route pages retain route-wide matching. These alert rules do not modify arrival data.

Favorites keeps Stop 1712 and Stop 1016 as curated disruption examples within the normal Stops list. Each uses a matching official notice while that notice is present in a live alert response; otherwise a mock fixture keeps the portfolio state reviewable. Their GTFS names and coordinates are bundled with the other curated stop metadata. Opening either stop shows the same semantic alert blade as Route 1L—below the navigation bar and above the stop information—and **Details** opens only that alert's explanation before returning to the stop. The Buses tab does not generate entries from affected route IDs, because a route number alone is not a saved bus definition.

Stop-specific skipped-bus copy now describes the rider impact directly: one affected bus “is temporarily skipping this stop,” multiple buses “are temporarily skipping this stop,” and the curated Bus 65 example says weather is affecting service near the stop. Whole-stop closures retain their distinct closed-stop wording. Contextual stop copy uses “Bus/Buses”; official TheBus alert text is preserved as received.

Favorite-stop alert chips use compact uppercase labels (`STOP SKIPPED · 1L`, `STOP SKIPPED · 3, 7`, and `WEATHER DISRUPTION · 65`). Opening a stop switches to the corresponding full explanatory sentence. The portfolio simulation currently omits visible demo markers, while the fixtures remain technically isolated from live TheBus responses.

The existing Route 1L demonstration alert remains under `lib/mock/`, joined by Stop 437 and system-wide portfolio scenarios. When no live Stop 437 alert exists, the seeded favorite and detail page show a `stop-skipped` scenario: Route 1L temporarily does not serve Stop 437 while other routes may continue serving it. These fixtures use production-style copy for portfolio simulation but are never returned by the live API.

## Notifications

Saved bus routes are the notification subscription source; there is no second route list. When Service alerts is enabled in Settings, Holo Hele requests permission contextually and uses the official Tauri notification plugin in the desktop shell or the browser Notifications API on the web. While the app process is running, the alert monitor refreshes every five minutes, matches new notices to exact saved routes (or an intentional system-wide alert), and stores up to 100 notified IDs to avoid repeat alerts. The first successful alert load establishes a quiet baseline so installing or opening the feature does not announce every already-active notice. Permission denial and unsupported environments leave in-app alerts usable. Settings includes a repeatable test notification.

This is local notification delivery, not production remote push. There is no service worker/background worker, push provider, backend scheduler, device-token store, or guaranteed delivery after Holo Hele is completely terminated.

## Important UX decisions

- Live estimated arrivals and scheduled GTFS times use different icons and color rules; green is reserved for near-term live estimates.
- Live stop arrivals refresh automatically every 30 seconds, and tracking refreshes every 15 seconds.
- Visible trip options refresh every 30 seconds so exact-trip HEA boarding estimates can update before a journey is selected.
- Search presents buses, stops, and places together. Only place results begin trip planning; each option is labeled as live, scheduled, or simulated fallback.
- Directions and all guidance stages consume the same returned journey, preventing mismatched routes, stop names, timestamps, or map geometry. Automatic transitions require stable proximity or combined rider/vehicle evidence across time; explicit actions remain available when location or exact-trip live data is insufficient.
- Plan Trip and Trip Details use white page backgrounds, including loading, unavailable, no-direct-trip, and short-content states. Trip Details keeps mode icons beside their labels so its dotted walking and solid transit rail remains continuous.
- Trip Details walking disclosures use prototype-only Valhalla/OpenStreetMap pedestrian routing when available and explicitly fall back to approximate stop-proximity guidance per leg. Holo Hele does not persist those coordinates.
- Route names use exact normalized values so Route `1` and Route `1L` remain distinct.
- Important map information also appears in text-based sheets or lists.
- Service disruptions are surfaced in the rider’s saved context instead of changing real arrival times.
- The visual language follows `DESIGN.md`: mobile-first, flat surfaces, shared tokens, Inter typography, and restrained transit blue.

## Important files

- `DESIGN.md` — canonical design and interaction rules
- `src/router.tsx` and `src/routes/` — route registration and page flows
- `src/styles.css` — design tokens and global responsive/map styles
- `components/home/HomeScreen.tsx` — home map, nearby stops, and selected-stop state
- `components/map/TransitMap.tsx` — viewport filtering, zoom-aware marker density, and map interactions
- `components/stops/StopDetailScreen.tsx` — arrivals and live refresh behavior
- `components/tracking/TrackingScreen.tsx` — tracking queries, location, carousel, and states
- `src/routes/favorites.tsx` — saved buses/stops UI
- `src/routes/alerts.tsx`, `src/routes/alerts_.$alertId.tsx`, and `components/alerts/` — live/demo alert list, single-alert details, contextual banners, and running-app monitor
- `src/routes/schedule.tsx` — selected-date GTFS schedule and calendar flow
- `src/routes/plan.tsx` and `src/routes/directions.$journeyId.tsx` — trip options, time/filter controls, compact route summary, and expandable walk/ride itinerary
- `lib/favorites.ts` and `lib/onboarding.ts` — local persistence
- `lib/api/transit.ts` — browser-to-Bun API client
- `lib/trip-planning.ts` — short-lived client journey cache and route-loader resolution
- `lib/trip-guidance.ts` — boarding proximity, automatic boarding/alighting evidence checks, guarded stop progression, remaining-stop counts, and get-off copy
- `lib/service-alerts.ts` and `lib/notifications.ts` — exact matching, notification decisions/copy, permission abstraction, and alert-notification persistence
- `lib/thebus/client.ts` — HEA arrivals and vehicle client
- `server/index.ts`, `server/gtfs.ts`, and `server/service-alerts.ts` — API endpoints, GTFS indexing, and TheBus alert parsing/caching
- `lib/mock/` — clearly separated demonstration fixtures
- `types/transit.ts` — shared data contracts

## Persistence

`localStorage` stores onboarding completion, selected language, location preference, favorite stop IDs, favorite bus IDs, the service-notification preference, notification baseline state, and up to 100 notified alert IDs. Storage is per browser and origin; `localhost`, `127.0.0.1`, and a LAN address do not share it. TanStack Query data is memory-only. The GTFS index and five-minute service-alert cache are memory-only on the Bun server. There is no database, login, IndexedDB store, or offline cache.

## Demo functionality

- Open `/buses/1l-437` or the Route 1L favorite to demonstrate a contextual detour and in-app alert details.
- Open `/alerts?demo=route-1l`, `/alerts?demo=stop-437`, or `/alerts?demo=system-wide` to exercise curated portfolio scenarios with production-style alert copy.
- In development, open `/settings?demoAlerts=1` after enabling Service alerts to reveal Route 1L, Stop 437, and system-wide demo-notification buttons. The normal **Send test notification** control is available whenever notifications are enabled.
- Open `/routes/1l-hawaii-kai` to demonstrate the official scheduled Hawaiʻi Kai route map and stop sequence.
- Search for “Ala”, choose **Ala Moana Center**, select a current direct journey, and press **Start**. With accurate location and an exact-trip HEA vehicle match, Trip Guidance can advance from walk to wait to ride to final walk automatically. The visible fallback buttons allow the flow to be reviewed without physically completing the trip, and routes/times vary with the active schedule and HEA response.
- With no HEA key, known fixture URLs such as `/stops/1280/track/mock-1280-a1` exercise mock tracking directly.
- Clearing the two favorites storage keys restores the seeded favorite buses and stops.

## Known limitations

- Service disruptions depend on a legacy TheBus HTML page whose structure may change; last-known-good and unavailable states prevent it from affecting other transit features. The broader Rider Alerts index is not yet parsed.
- Local notifications require Holo Hele to be running. True closed-app remote push requires backend alert processing, device registration/tokens, and a platform push provider.
- Trip planning currently supports direct bus trips only. Leave/arrive/date controls and result sorting are implemented, but **Fewest transfers** cannot change the result meaningfully while every journey has zero transfers. Trip Details requests street-aware walking geometry and turn language from the public Valhalla/OpenStreetMap prototype endpoint; failed requests retain approximate stop-proximity guidance and straight connectors. A scheduled one-transfer prototype can be built from the existing GTFS index after the journey model is changed from one route to multiple legs; production-quality multi-transfer routing, accessibility routing, transfer-risk recovery, and turn-by-turn rerouting still require a privacy-reviewed or self-hosted routing engine such as OpenTripPlanner.
- The current late-night empty state says **No direct trip found** and does not yet distinguish “service has ended for this time” from “a transfer is required.” That copy should split into time-unavailable and route-unavailable states when transfer planning is added.
- Search places remain curated rather than geocoded, and bus suggestions remain curated until arbitrary route-detail pages are supported. Stop autocomplete uses the complete official GTFS stop index. Mock journeys are used only as a clearly labeled fallback when official planning is unavailable or a saved place lacks coordinates.
- Route detail is implemented only for the Hawaiʻi Kai Route 1L preview.
- Search uses official GTFS autocomplete for stops, but still uses two curated buses and three curated places rather than a general route index or geocoder.
- Favorites do not sync across browsers/devices, bus favorites are preset-only, and non-curated saved stops may be hidden.
- HEA live enrichment is limited to the four closest nearby stops.
- GTFS is cached for the lifetime of the API process and is not refreshed on a timer.
- English and Japanese are translated across the current interface. Hawaiian, Ilocano, Tagalog, Chinese, Korean, and Vietnamese remain listed but fall back to English until translations are added.
- Location and live updates work only while the app is running and depend on permissions/connectivity.
- Home and Plan Trip never initiate a geolocation permission prompt. They use current location only when browser permission is already granted; otherwise Home uses downtown Honolulu and Plan Trip uses its labeled downtown preview origin. Permission prompts remain explicit onboarding or Settings actions.
- Trip Guidance is foreground and stop-aware rather than production turn-by-turn navigation. It follows an already-authorized device position and exact-trip live bus marker, automatically recognizes stable arrival at the boarding stop, and conservatively infers boarding when rider and vehicle evidence agree. It does not yet map-match noisy movement to the route, use native activity recognition, reroute, guarantee progress through GPS or HEA loss, or provide background get-off notifications. Automatic boarding is unavailable without an exact live vehicle position, so the manual fallback remains necessary in scheduled-only journeys. Opening Trip Guidance does not trigger an unexpected location permission prompt.
- The repository contains desktop Tauri packaging, but no verified production mobile release workflow.

## Current bugs / issues

- The complete parallel Playwright suite still contains unrelated flaky/stale assertions around favorite persistence, tracking marker overlap, and older stop fixtures; the focused trip-planning flow passes.
- Browser and installed-Tauri notification toasts have not been manually exercised in this environment. Unit coverage verifies preference, permission, fallback, matching, and duplicate behavior, and `cargo check` verifies the native plugin integration compiles.

## Next priorities

1. Strengthen Trip Guidance with a confidence-based journey state machine, route map-matching, rider/vehicle correlation history, recoverable automatic transitions, and deterministic replay scenarios for noisy or missing data.
2. Add native background location/activity support and get-off notifications only after the mobile permission, privacy, and battery behavior is defined.
3. Monitor the Service Disruption parser and add fixture coverage when TheBus markup changes.
4. Decide whether the mixed Rider Alerts index is maintainable enough for a cached index/detail integration.
5. Refactor `JourneyOption` into multiple transit legs and add a scheduled one-transfer GTFS prototype, including transfer stop, wait time, both route identities, and transfer-aware empty states.
6. Add a privacy-reviewed/self-hosted routing service and geocoding for production multi-transfer routing, walking, accessibility preferences, and arbitrary destinations.
7. Generalize route details and bus favorites, resolve arbitrary GTFS favorite stops, and stabilize the remaining parallel Playwright smoke assertions.

## Recent changes

### 2026-09-03

- Added conservative automatic Trip Guidance transitions: a short boarding-stop dwell enters waiting; multiple accurate rider/vehicle readings can infer boarding; and dwelling at the final ride stop opens the final walk.
- Added reusable, unit-tested boarding and alighting evidence rules with accuracy, speed, stop-departure, rider-to-vehicle, and final-stop constraints. Exact-trip live vehicle data is required for automatic boarding, while manual actions remain available for scheduled, unavailable, or low-confidence cases.
- Changed onboard stop progression to prefer the selected live vehicle over rider GPS when both are available, while keeping progress monotonic and limiting jumps.
- Added a full schedule calendar with month navigation and a persistent marker for today, while preserving the stop and route header hierarchy.
- Made Favorites open to Stops by default, added save/remove hearts to Search bus and stop results, and refined outline-heart weight.
- Added English/Japanese interface translation coverage across primary screens and persisted language switching.
- Refined alert blades to use shorter headings and descriptions with **Details** links, and kept stop-to-alert-to-favorites back navigation contextual.
- Verified the automatic guidance helpers with unit coverage, then passed the complete 37-test unit suite, ESLint, TypeScript, and the Vite production build. A foreground mobile visual check showed no browser console errors.

### 2026-08-16

- Added server-side TheBus Service Disruption parsing, normalization, deterministic IDs, five-minute caching, stale/unavailable handling, and `/api/alerts`.
- Connected exact live route/stop alerts to Rider Alerts, Favorites, bus detail, stop detail, and route detail while preserving technically isolated curated scenarios.
- Added opt-in Tauri/browser local notifications for new alerts affecting saved routes, duplicate suppression, Settings permission/test controls, and hidden development demo controls.
- Added focused parser, cache, matching, duplicate, preference, system-wide, and unsupported-notification tests.
- Added parser-drift detection so alert-like source content that no longer matches the parser becomes stale or unavailable rather than appearing as a false empty feed.
- Verified 22 alert/notification unit tests, lint, TypeScript/Vite production build, Tauri `cargo check`, and a live alert response with in-process caching from the official source.
- Tightened bus alerts to exact route-plus-stop matching, added full-versus-partial stop closure copy, semantic yellow detour/red closure colors, and a dedicated selected-alert detail route.
- Surfaced the Route 1L skipped-stop scenario in Favorite Stops and Stop 437 detail when no live alert takes precedence, without implying the whole stop is closed.
- Made alert colors follow service impact rather than source category, aligned Affected Lines/Stops heading typography, and moved selected demos above the live list.
- Added this verified project-state snapshot.
- Updated the Settings smoke test to match the intentionally removed Reset onboarding control.
- Added official next-day GTFS schedule loading and preserved the selected day through line selection.
- Documented the current alert, favorites, location, and notification boundaries.

### 2026-08-17

- Added two curated disruption-stop favorites with official-alert precedence and fallback fixtures so the portfolio state remains available after a notice ends.
- Removed the separate Current disruptions blade and route-only entries from the Buses tab; the existing Route 1L favorite remains the curated bus example.

### 2026-08-18

- Added top-positioned stop-detail alert blades for the Stop 1712 weather-service and Stop 1016 closure demos, matching the Route 1L hierarchy.
- Connected each View action to its own alert explanation with stop-aware back navigation.
- Added compact Favorites labels for skipped stops and weather disruptions, with full rider-facing explanations after opening a stop.
- Corrected Stop 437 to a route-specific `stop-skipped` scenario: Route 1L is not serving the stop temporarily while other routes may continue normally.
- Removed visible demo/portfolio markers for controlled presentation, capitalized `DETOUR IN EFFECT`, and changed Alert Details to a white canvas. Mock fixtures remain isolated from the live API.
- Documented that the curated alerts are realistic future scenarios modeled after TheBus notice patterns, not necessarily verified historical alerts.
- Verified 27 alert/notification unit tests, ESLint, TypeScript, the Vite production build, and the affected alert/favorites screens in the in-app browser.

### 2026-08-19

- Added `/api/stops`, backed by the official active GTFS index, for lightweight island-wide stop locations.
- Populated Home with all 3,843 current Oʻahu stops while mounting only viewport-visible markers.
- Added compact, screen-grid-thinned markers below zoom 16 and full stop markers at neighborhood zoom 16 and above.
- Added one stable, small bus-icon anchor for each verified official transit center at wide zooms; all other stops remain dots, and the selected stop uses the Figma primary-blue glow.
- Kept the Nearby Stops sheet at ten enriched results and moved service loading for other map stops to an on-demand `/api/arrivals` request.
- Verified the API stop count, a non-nearby stop selection with real scheduled services, zoomed-out marker density, and horizontal layout in the in-app browser.
- Added real direct trip planning from device/downtown origin to curated place coordinates using active GTFS calendars, stop sequences, times, and sliced route shapes.
- Added exact-trip HEA boarding estimates, delay-adjusted total/arrival times, live vehicle approach geometry, and scheduled fallback when HEA has no match.
- Connected Plan Trip, Directions, Start Trip, walking guidance, and explicit **I’m on the bus** confirmation to the same official journey response; retained the mock journey as a labeled offline fallback.
- Added debounced official GTFS stop autocomplete with ranked, capped suggestions and line metadata while retaining curated bus/place search.
- Standardized Holo Hele-generated disruption copy on “Line/Lines” without rewriting official TheBus alert text.

### 2026-08-23

- Prevented destination selection and Plan Trip navigation from repeatedly prompting for geolocation; passive planning now uses location only after permission is already granted.
- Applied the same permission gate to Home so loading the map cannot reopen an undecided location prompt; enabling location through onboarding or Settings remains the explicit permission path.
- Implemented the seven approved Figma frames across saved/focused search, categorized autocomplete results, Plan Trip, Direction, and walking/onboard Live Direction.
- Added the exported Figma walking, swap, chevron, and close icons; aligned spacing, type, cards, timeline, instruction panels, pager controls, and mobile layout with `DESIGN.md`.
- Preserved official GTFS/HEA journey data, labeled mock fallback behavior, explicit boarding confirmation, and the existing no-prompt location policy.
- Verified ESLint, TypeScript, the Vite production build, and the focused Playwright search-to-live-guidance flow.

### 2026-08-24

- Refined Plan Trip cards into a compact, continuous option list with whole-trip times, duration, mode sequence, boarding countdown, delay/early treatment, and disruption context without repeated live or headsign labels.
- Added interactive Leave/Arrive/Now planning, a mobile time wheel, separate upcoming-date selection, and Best route/Least walking/Fewest transfers controls while preserving scheduled-versus-live semantics.
- Redesigned Direction as itinerary-led **Trip Details** with a compact map, white canvas, neutral preview-origin copy, primary-blue Start action, aligned walking/transit rail, and expandable walk and ride sections.
- Added complete scheduled GTFS stop sequences to planned journeys so the ride disclosure shows every boarding, intermediate, and alighting stop with times; stop IDs remain hidden in the primary timeline.
- Added approximate walking-direction disclosures with separated steps, a safety caution, and destination cue without claiming street-level turn-by-turn routing.
- Made Plan Trip results and late-night empty states use a white background and documented scheduled one-transfer planning as the next achievable trip-planning milestone.
- Verified the focused Trip Details/Live Direction Playwright flow, TypeScript, ESLint, production build, and affected mobile screens in the in-app browser.

### 2026-08-27

- Changed Search Places results to use a filled dark location marker while preserving the neutral icon background and leaving other place actions unchanged.
- Replaced the browser-native blue Search clear control with the app's neutral filled close icon, including an explicit accessible **Clear search** label.
- Documented the current Live Direction boundary and the next location-assisted milestone: continuously display the permission-backed rider position, poll only the vehicle matched to the planned GTFS trip, retain manual boarding confirmation, and show unavailable or stale states without fabricating movement.
- Implemented that location-assisted milestone: Live Direction passively watches an already-granted rider position, refreshes boarding-stop arrivals every 15 seconds, selects the bus by exact planned trip ID, dynamically maps the matched vehicle, and preserves the route through loading, unavailable, and paused-update states.
- Added focused mobile smoke coverage for the matched-bus/rider-marker flow and for guidance remaining usable when neither live position is available.

### 2026-08-29

- Added prototype-only Valhalla/OpenStreetMap pedestrian routing for both walking legs, with transient coordinate requests, maneuver-specific Trip Details instructions, routed geometry, a six-second timeout, and independent approximate fallbacks.
- Removed redundant terminal “you have arrived” steps because boarding, alighting, and destination endpoints already appear in the journey timeline.
- Added boarding-stop proximity to Trip Guidance without treating proximity as proof of boarding.
- Kept explicit **I’m on the bus**, **I’m off the bus**, and **Finish trip** actions as the only journey-progress controls, and restored three accessible dots for tap/swipe stage preview without inferring boarding.
- Added guarded foreground progress through each journey's real GTFS stop sequence after boarding, including two-stop, next-stop, destination-stop, paused-progress, and final-walk states.
- Added focused unit tests for proximity/progress/get-off copy and extended the mobile trip flow through boarding, automatic stop progress, exit confirmation, and final walking guidance.
- Changed contextual alert blades to a two-line alert-type heading and rider-impact description while preserving semantic colors and selected-alert View links.

### 2026-08-14

- Completed the Favorites buses/stops flow, local favorite persistence, bus detail pages, line selection, and official daily schedules.
- Added the contextual Route 1L demonstration disruption and in-app Rider Alerts screen.

### 2026-07-17

- Created the initial Holo Hele prototype commit.
- Subsequent working-tree changes migrated the client from Next.js to Vite/TanStack Router with a Bun API and Tauri shell, and expanded maps, tracking, onboarding, settings, search, and route flows.

## Notes for future developers / AI

- Treat `DESIGN.md` as the visual source of truth and reuse its tokens/components.
- Never label GTFS scheduled times as live or modify real arrival data to support demo alerts.
- Keep HEA credentials server-side; production clients should use `VITE_API_BASE_URL` to reach the deployed Bun API.
- Route comparisons must preserve exact identities such as `1` versus `1L`.
- Keep mock data under `lib/mock/` and technically separate from production responses. Production-style alert simulations without visible markers are for controlled portfolio demonstrations only.
- Update only the affected sections of this file after meaningful feature or architecture changes, and append a dated Recent changes entry.
