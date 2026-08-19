I want to implement **service alerts and notification functionality** in the current Holo Hele prototype.

This task should build on the existing project rather than creating a separate experimental system.

Before making changes, read:

* `PROJECT_STATE.md`
* `DESIGN.md`
* the existing favorites implementation
* the existing Rider Alerts implementation
* the existing Bun API
* the existing Tauri configuration

The current Git checkpoint should be:

* Branch: `refactor/bun-tauri`
* Commit: `a4f7b45`
* Commit message: `chore: checkpoint current Holo Hele prototype`

Verify the current repository state before modifying anything.

Do not reset or overwrite the checkpoint.

---

# Current project context

The app currently uses:

* React 19
* Vite
* TypeScript
* TanStack Router
* TanStack Query
* Bun API server
* official TheBus GTFS data
* optional TheBus HEA arrivals/vehicle data
* Tauri 2 desktop shell
* localStorage persistence

The app already has:

* Favorites
* stop details
* live/scheduled arrivals
* route pages
* schedules
* a Rider Alerts page
* a contextual Route 1L disruption indicator
* a static mock Route 1L disruption in `lib/mock/service-alerts.ts`

Notifications are currently not implemented.

Do not rebuild these systems unnecessarily.

Reuse the existing architecture.

---

# Main goal

Add a prototype-quality but technically real service-alert system that:

1. retrieves real service disruption information from TheBus when possible,
2. normalizes it into Holo Hele data,
3. displays relevant alerts using the existing UI,
4. connects alerts to saved/favorite routes where possible,
5. can produce an actual system notification while the app is running,
6. includes reliable demo controls for portfolio recording,
7. falls back gracefully if TheBus data cannot be retrieved.

This does **not** need to become a production push-notification platform yet.

The priority is to demonstrate the intended UX accurately while using real data wherever practical.

---

# Important architecture decision

The React frontend should **not scrape TheBus webpages directly**.

The project already has a Bun API layer in:

`server/index.ts`

Use the Bun server as the service-alert data layer unless inspection of the existing architecture reveals a strong reason not to.

Recommended flow:

TheBus website
↓
Bun server fetches/parses alerts
↓
normalizes alerts into Holo Hele data
↓
React retrieves them through `lib/api/transit.ts` or an appropriate dedicated client
↓
TanStack Query caches/polls them
↓
existing alert UI and notification logic consume them

Keep webpage parsing out of React components.

---

# Official TheBus alert sources

Start with these official sources:

`https://www.thebus.org/Updates/ServiceDisruption.asp?l=eng`

and

`https://www.thebus.org/RiderAlerts.asp`

### Priority

Implement **Service Disruption** first.

It appears to contain information such as:

* date/time
* disruption title
* `Route(s)`
* affected route numbers
* description
* sometimes affected stop numbers
* sometimes alternative stop instructions

After the Service Disruption integration works reliably, inspect Rider Alerts.

Rider Alerts may include:

* upcoming route changes
* relocated stops
* service adjustments
* long-term rider notices
* route-specific changes

Do not build an overly complicated crawler.

If Rider Alerts require substantially more fragile parsing, it is acceptable to implement the live Service Disruption feed first and leave Rider Alerts as a clearly documented second phase.

---

# 1. Create a normalized alert model

Inspect `types/transit.ts` first.

If an alert-related type already exists, extend or reuse it.

Otherwise create an appropriate shared type similar to:

```ts
export interface TransitAlert {
  id: string;
  title: string;
  description: string;

  affectedRoutes: string[];
  affectedStops?: string[];

  startTime?: string;
  endTime?: string;

  type:
    | "service-disruption"
    | "detour"
    | "stop-closure"
    | "service-change"
    | "roadwork"
    | "other";

  severity: "info" | "warning" | "critical";

  source: "thebus-live" | "holohele-demo";

  sourceUrl?: string;

  isLive: boolean;
}
```

Adapt this to the existing type conventions.

Do not create duplicate types if suitable shared types already exist.

---

# 2. Build the TheBus parser on the Bun server

Create a server-side module such as:

`server/service-alerts.ts`

or another location appropriate to the existing architecture.

Its responsibilities should be:

1. fetch the official TheBus Service Disruption page,
2. parse current entries,
3. normalize them,
4. extract affected route IDs,
5. extract affected stop IDs when reasonably possible,
6. return clean Holo Hele `TransitAlert` objects.

Do not allow malformed HTML or one badly formatted alert to crash the entire endpoint.

Individual parsing failures should be skipped or logged safely.

---

# 3. Route matching must be exact

This is extremely important.

Route:

`1`

and route:

`1L`

are different routes.

Do NOT use logic such as:

```ts
routeString.includes("1")
```

because that could incorrectly match:

* 1
* 1L
* 11
* 13
* 101

Normalize route values and compare exact route identifiers.

Support alphanumeric routes such as:

* `1`
* `1L`
* `A`
* `C`
* `40`
* `88A`
* `W`

If an alert genuinely affects all routes, represent that intentionally rather than creating hundreds of fake route matches.

For example, the model could support:

```ts
systemWide: true
```

if appropriate.

---

# 4. Stop extraction

When TheBus alert text contains explicit stop numbers such as:

`stop #437`

attempt to extract those numbers.

Store them as normalized string IDs.

For example:

```ts
affectedStops: ["437"]
```

Do not attempt to infer stop IDs from street names if the official alert does not provide a stop number.

We should prefer incomplete-but-trustworthy data over invented data.

---

# 5. Create a Bun API endpoint

Add an API endpoint consistent with the existing `server/index.ts` architecture.

Something like:

`GET /api/alerts`

or whatever naming matches the existing API.

It should return normalized alerts.

Include enough metadata for the frontend to distinguish:

* live TheBus data
* fallback/demo data
* fetch errors

Do not expose raw scraped HTML to React.

---

# 6. Caching

Do not fetch TheBus every time a component renders.

Cache the parsed Service Disruption response on the Bun server.

For this prototype, a cache duration around **5 minutes** is reasonable.

If there is already a caching convention in the Bun server, follow it.

The frontend may poll the Holo Hele API periodically, but the Bun server should avoid repeatedly hitting TheBus unnecessarily.

---

# 7. Graceful failure

TheBus website availability must never determine whether Holo Hele works.

If:

* the page is unavailable,
* the request times out,
* parsing fails,
* the HTML structure changes,

the app should remain usable.

Do not affect:

* GTFS loading
* HEA arrivals
* tracking
* schedules
* maps
* favorites

Service alerts should fail independently.

---

# 8. Preserve the current mock Route 1L alert

The current static Route 1L disruption in:

`lib/mock/service-alerts.ts`

is useful for demonstration purposes.

Do NOT delete it.

Instead, clearly separate:

### Live alerts

Fetched from TheBus.

### Demo alerts

Stored in `lib/mock/`.

The demo Route 1L disruption should remain available even if TheBus currently has no Route 1L disruption.

This is important for portfolio recording.

---

# 9. Add a deliberate demo mode

Create a clean developer/demo mechanism so I can reliably demonstrate notifications.

I need to be able to simulate at least:

### Scenario A

Route 1L disruption

Example:

**Route 1L service disruption**

A service change is affecting Route 1L. Check the alert before traveling.

### Scenario B

Route 1L skips Stop 437

Example:

**Route 1L is temporarily skipping this stop.**

Route 1L riders should use the nearby alternative stop.

### Scenario C

System-wide disruption

Example:

**TheBus service disruption**

Multiple routes are currently affected. Check your trip before traveling.

Do not put permanent debug buttons prominently in the user-facing UI.

Possible implementations include:

* development-only query parameter
* development-only utility
* hidden test control in Settings
* dev-only route
* environment flag

Choose whatever fits the existing architecture best.

Explain how I can trigger each scenario.

---

# 10. Connect alerts to the existing Rider Alerts UI

The app already has an `/alerts` experience.

Do not create a completely separate competing Alerts UI.

Update the existing alert experience so it can accept normalized `TransitAlert` data.

Preserve its current design wherever possible.

Follow `DESIGN.md`.

Do not redesign unrelated screens.

---

# 11. Surface alerts contextually

The app already shows the mock Route 1L disruption in Favorites and on the bus page.

Extend this pattern to normalized alerts.

If a live alert affects a route displayed in the UI, show a restrained alert indicator.

For example:

`⚠ Service alert`

or reuse the existing alert treatment.

Potential contexts:

* favorite bus
* bus detail
* stop detail if the stop is explicitly affected
* route detail

Do not add alert banners everywhere.

Only surface alerts where they are relevant.

---

# 12. Favorite-route notification behavior

The app already stores favorite buses/routes locally.

Reuse that system.

Do not create a separate list of “notification routes.”

A rider should primarily receive notifications for service disruptions affecting a saved route.

Example:

Favorite:

`1L`

New alert:

`affectedRoutes: ["1L"]`

Result:

The notification system may notify the rider.

If the alert affects Route `1`, it should NOT notify a rider who only saved `1L`.

---

# 13. Notification preference

Add a user preference for service notifications.

Use copy approximately like:

**Service alerts**

Get notified about major delays, detours, closures, and service changes affecting your saved routes.

Use the existing Settings design.

Persist the preference using the project's existing local persistence conventions.

Do not add an account system.

---

# 14. Contextual permission request

Do not ask for OS notification permission immediately when Holo Hele launches.

Only request notification permission after the rider expresses intent.

For example:

when they enable:

**Service alerts**

then request permission.

If there is a natural opportunity after favoriting a route, a lightweight contextual prompt is also acceptable.

Example:

**Get updates for Route 1L?**

Get notified about major delays, detours, and service changes.

Actions:

**Turn on alerts**

**Not now**

Follow existing dialog/sheet patterns if available.

Do not invent a visually unrelated component.

---

# 15. Tauri native notifications

The project already includes Tauri 2.

Inspect `src-tauri/` and the current Tauri dependencies.

If appropriate, install and configure the official Tauri 2 notification plugin:

`@tauri-apps/plugin-notification`

Use the official plugin rather than an unofficial notification package.

Implement:

* permission checking
* permission requesting
* notification sending
* permission-denied handling
* unsupported-environment handling

Create a small notification abstraction instead of calling Tauri APIs directly from many components.

For example:

`lib/notifications.ts`

or an equivalent location.

The rest of Holo Hele should call something conceptually like:

```ts
sendServiceAlertNotification(alert)
```

and not care whether it is running in Tauri or a browser.

---

# 16. Browser fallback

The project also runs as a responsive web app.

If the app is not running inside Tauri, check whether the browser Notifications API is supported.

If supported and permission has been granted, use it as a fallback.

If unsupported, fail gracefully.

Do not block the alert system just because OS notifications are unavailable.

In-app alerts should always remain usable.

---

# 17. Be accurate about what this implementation is

This prototype does NOT need true production remote push notifications yet.

The expected behavior is:

While the Holo Hele application process is running:

1. alerts are refreshed,
2. newly discovered alerts are compared against the rider's saved routes,
3. relevant new alerts can trigger a local/native notification.

Do not claim that this system can reliably receive new TheBus alerts when the application is completely terminated.

True closed-app push delivery would require additional infrastructure that does not currently exist.

Document that limitation clearly.

---

# 18. Alert polling

Use TanStack Query if appropriate.

The frontend should periodically retrieve normalized alerts from the Holo Hele Bun API.

A refresh interval around:

**5 minutes**

is fine for this prototype.

Do not poll every few seconds.

Alerts are not the same as real-time vehicle positions.

Continue using the existing faster refresh intervals for arrivals/tracking separately.

---

# 19. Do not repeatedly notify the same rider

A rider must not receive the same notification every 5 minutes.

Persist a small set of notification fingerprints or alert IDs locally.

When alerts refresh:

New alert
↓
check whether relevant to saved routes
↓
check notification preference
↓
check whether already notified
↓
notify only if appropriate

Something like:

```ts
notifiedAlertIds: string[]
```

is sufficient for this prototype.

Use the existing persistence conventions if possible.

---

# 20. Stable alert IDs

The source page may not provide a clean unique ID.

If necessary, create a deterministic fingerprint using normalized fields such as:

* title
* affected routes
* affected stops
* date/time
* source URL
* part of description

Do not use a random ID generated on every fetch.

Otherwise duplicate-notification suppression will fail.

---

# 21. System-wide alerts

Support alerts that affect all or a very large portion of the system.

A system-wide alert may notify riders with service notifications enabled even if it is not tied to a single saved route.

Use this sparingly.

Example:

**TheBus service disruption**

Service is temporarily suspended or heavily disrupted across the system.

---

# 22. Notification copy

Keep notifications short.

Examples:

### Route disruption

**Route 1L service disruption**

Service changes may affect your trip. View the alert for details.

### Route-specific skipped stop

**Route 1L is temporarily skipping this stop.**

Route 1L is using an alternative stop.

### Detour

**Route 1L detour**

A detour is affecting your saved route.

Avoid pasting an entire TheBus alert into the notification.

The full details should remain inside Holo Hele.

---

# 23. Notification interactions

If reasonably supported by the current Tauri setup, clicking a notification should open or focus Holo Hele.

If deep linking directly to the alert detail is straightforward, implement it.

If it would require major architectural changes, do NOT expand the scope unnecessarily.

For this prototype:

notification appears successfully

is more important than sophisticated notification actions.

---

# 24. Test notification

Add a simple test method.

Preferably in Settings after Service Alerts are enabled:

**Send test notification**

Trigger:

**Notifications are on**

You'll receive updates when service changes affect your saved routes.

This control should make testing and portfolio recording easy.

---

# 25. Keep live and scheduled transit information trustworthy

Do NOT modify:

* GTFS arrival times
* HEA arrival estimates
* vehicle positions
* schedules

to make them appear disrupted for the demo.

Service alerts should exist as their own layer.

For example:

Arrival:

`8 min`

Alert:

`⚠ Route 1L detour`

Do not artificially change the arrival to:

`23 min`

unless the actual live transit source reports that estimate.

Preserve the existing Holo Hele rule that scheduled data, estimated data, and demo data must remain clearly distinct.

---

# 26. Rider Alerts source

After Service Disruption works, investigate:

`https://www.thebus.org/RiderAlerts.asp`

Determine how much structured information can safely be extracted.

If the page provides links to detailed notices, avoid fetching dozens of detail pages every few minutes.

Possible strategy:

1. retrieve the Rider Alerts index,
2. parse titles, dates, affected route hints, and links,
3. lazily retrieve full details when a rider opens one,
4. cache results.

But only implement this if it remains reasonably maintainable.

Do not sacrifice the reliable Service Disruption integration for a fragile all-purpose Rider Alerts scraper.

---

# 27. Security

Keep all external TheBus fetching server-side where possible.

Do not expose HEA credentials.

Do not introduce credentials into:

* React source
* `VITE_*` variables
* Git
* client bundles

This alert work should not interfere with existing HEA configuration.

---

# 28. Tests

Add focused tests where appropriate.

At minimum verify:

### Parser

* single route
* multiple routes
* alphanumeric routes
* `1` remains distinct from `1L`
* stop-number extraction
* missing route section
* malformed alert entry
* system-wide alert

### Notification matching

* favorite 1L + alert 1L → match
* favorite 1L + alert 1 → no match
* unrelated route → no notification
* already notified alert → no duplicate
* notifications disabled → no notification
* system-wide alert → appropriate notification

### Failure handling

* TheBus unavailable
* parser failure
* Tauri notification unavailable
* browser notification unavailable
* permission denied

If the Playwright Chromium dependency is still unavailable, do not make that block this feature.

Use unit/integration tests that can run in the current environment where practical.

---

# 29. Do not modify unrelated functionality

Do not refactor:

* trip planning
* tracking
* maps
* schedules
* onboarding
* search
* arrival rendering

unless a very small change is directly necessary for alerts.

Preserve the existing UX and design system.

Treat `DESIGN.md` as the visual source of truth.

---

# 30. Update PROJECT_STATE.md

After this implementation is finished, update `PROJECT_STATE.md`.

Only update affected sections, especially:

* Implemented features
* Data sources
* Live data vs mock data
* Alerts and disruptions
* Notifications
* Important files
* Persistence
* Demo functionality
* Known limitations
* Recent changes

Clearly distinguish:

### Live

Real TheBus service-disruption data.

### Demo

The existing Route 1L mock disruption and manually triggered demo scenarios.

### Notification capability

What actually works locally.

### Production limitation

What would still be required for true remote push notifications when the application is completely closed.

Do not rewrite unrelated sections.

---

# Before implementation

First inspect the repository and give me a concise implementation assessment.

Tell me:

1. where the existing mock Route 1L alert is consumed,
2. how the current `/alerts` page receives its data,
3. where favorite route IDs are stored,
4. how the Bun API routes are currently structured,
5. whether the Tauri app can use the official notification plugin without architectural changes,
6. which files you expect to create or modify,
7. whether you see any risks with parsing the current TheBus HTML.

Then proceed with implementation unless you discover a genuinely blocking issue.

Do not ask me to re-explain functionality already documented in `PROJECT_STATE.md`.

---

# After implementation

Give me a concise report containing:

### Live alert integration

* what real TheBus data is now being used
* which source page is being parsed
* refresh/cache behavior
* known parser limitations

### Notifications

* whether Tauri native notifications work
* whether browser notifications work
* when permission is requested
* what triggers a notification
* how duplicates are prevented

### Demo instructions

Tell me exactly how to demonstrate:

1. Route 1L service disruption
2. Route 1L skipping Stop 437
3. system-wide disruption
4. test notification

### Files changed

List the important files created or modified.

### Production limitations

Explain in simple terms what would still be required for notifications to arrive when Holo Hele is fully closed.

### Verification

Tell me what tests/checks you successfully ran.

Do not claim something is working unless you actually verified it.

---

# Implementation status — 2026-08-16

## Completed

- [x] Added a normalized `TransitAlert` contract shared by the Bun API and client.
- [x] Added server-side parsing for the official TheBus Service Disruption page, including exact route matching, explicit stop matching, deterministic IDs, a five-minute memory cache, request timeout, and last-known-good fallback.
- [x] Added `GET /api/alerts` and the corresponding client query.
- [x] Connected live alerts to Rider Alerts, Favorites, bus detail, stop detail, and route detail without changing arrival, schedule, or tracking data.
- [x] Preserved the Route 1L demonstration and added clearly labeled Stop 437 and system-wide demo scenarios under `lib/mock/`.
- [x] Added opt-in service-alert notifications using the official Tauri notification plugin with a browser Notifications API fallback.
- [x] Added contextual permission handling, a quiet initial baseline, exact favorite-route matching, system-wide matching, and persisted duplicate suppression.
- [x] Added Settings controls for enabling alerts and sending a test notification, plus hidden development-only demo notification controls.
- [x] Added parser/cache, alert matching, preference, permission, duplicate, and notification tests.
- [x] Added parser-drift detection so alert-like source content that cannot be parsed is reported as unavailable or stale instead of as an empty feed.
- [x] Required exact route-plus-stop matching for bus alerts, clarified whole versus route-specific stop closures, added yellow detour/red closure states, and made View open a single-alert detail page.
- [x] Surfaced the Route 1L skipped-stop demo in Favorite Stops and Stop 437 detail without implying that the whole stop is closed.
- [x] Colored explicit closures/no-service notices red regardless of source category, kept detours yellow, aligned affected-section headings, and prioritized selected demos above live alerts.
- [x] Updated `DESIGN.md` and `PROJECT_STATE.md` for the current alert and notification architecture.

## Deliberately deferred or out of production scope

- [ ] Parse the broader mixed-content Rider Alerts index. The official Service Disruption page is the current live source; the index remains deferred because its mixed legacy markup is less reliable.
- [ ] Deliver alerts while Holo Hele is completely closed. This requires a production backend scheduler, registered device tokens, and Apple/Google push infrastructure rather than the current running-app local notification layer.
- [ ] Add notification-click deep linking. Local alert delivery does not depend on it, and it was not required for the current prototype.

## Verification completed

- [x] `bun run test:unit` — 22 tests and 44 expectations passed.
- [x] `bun run lint` passed.
- [x] `bun run build` passed, including TypeScript checking and the Vite production build.
- [x] `cargo check` passed for the Tauri shell and notification plugin integration.
- [x] The live local `/api/alerts` endpoint returned 16 normalized official alerts with stable IDs, live-source metadata, and working in-process cache behavior.
- [x] Playwright smoke-test discovery passed and listed all 7 current scenarios.

## Still requires manual environment verification

- [ ] Verify a real browser notification after granting permission in a supported external browser.
- [ ] Verify a native operating-system toast from an installed Tauri build. The Rust/plugin integration compiles, but an installed-app notification was not manually exercised in this environment.
- [ ] Run the full Playwright smoke suite after its Chromium browser is installed.
