Ask codex to come up with an implementation plan for this:

I want to add **service-disruption alerts and notification functionality** to my Holo Hele / DaBus redesign.

Please first inspect the existing codebase, architecture, current data models, favorites functionality, settings, routing, and UI components before making changes.

**Do not redesign unrelated parts of the app. Preserve the existing visual system, spacing, typography, components, interactions, and current functionality. Reuse existing components wherever possible.**

## Goal

I want Holo Hele to:

1. Pull real service disruption information from TheBus when possible.
2. Match disruptions to relevant bus routes.
3. Show those disruptions naturally within the existing app.
4. Let riders opt into notifications for routes they care about.
5. Send a real local/native notification if our current environment supports it.
6. Still work reliably as a portfolio prototype if the live data source fails.

For this prototype, I do **not** need a production-scale remote push-notification backend yet.

---

# 1. Official TheBus data sources

Use these official pages as the live service-alert sources:

Current / active service disruptions:

https://www.thebus.org/Updates/ServiceDisruption.asp?l=eng

Broader rider alerts, including planned changes, roadwork, route changes, relocated stops, etc.:

https://www.thebus.org/RiderAlerts.asp

The existing HEA API appears to provide arrivals, vehicles, and route geometry but not a dedicated alerts endpoint, so do not assume service alerts are available through the existing API.

### Preferred approach

Create a separate service layer such as:

`serviceAlerts.ts`

or whatever architecture best matches the existing project.

Fetch and normalize the TheBus information into an internal format similar to:

```ts
interface TransitAlert {
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
    | "roadwork"
    | "service-change"
    | "other";
  severity?: "info" | "warning" | "critical";
  source: "thebus";
  sourceUrl: string;
}
```

Adapt this model if a similar model already exists in the project.

---

# 2. Fetching the data

First determine whether the frontend can fetch these pages directly.

If browser CORS restrictions prevent that, **do not hack around CORS in the frontend**.

If this is a Tauri application, prefer fetching/parsing the data through the Tauri/native/backend side or another architecture-appropriate proxy/service.

Do not repeatedly scrape the website on every component render.

Cache results and only refresh periodically while the app is open. Something around **5–10 minutes** is fine for this prototype.

Also provide a manual refresh method that can be called if needed.

Be respectful of the source website and avoid unnecessary repeated requests.

---

# 3. Parse active Service Disruptions

The Service Disruption page currently follows a pattern similar to:

* date/time
* alert title
* `Route(s)` followed by affected routes
* description

Parse these entries into `TransitAlert` objects.

Be careful when matching route IDs.

For example:

* Route `1`
* Route `1L`

must be treated as separate routes.

Do not use loose substring matching where `1` accidentally matches `1L`, `11`, etc.

Normalize capitalization and whitespace where necessary.

If an alert includes essentially every bus route, treat it as a **system-wide disruption**.

---

# 4. Rider Alerts

Also integrate the Rider Alerts page as a secondary source.

These alerts can include:

* planned service changes
* route modifications
* detours
* roadwork
* relocated stops
* stop closures
* major events affecting service

For the initial implementation, it is okay to:

1. parse the Rider Alerts list,
2. capture the alert title and URL,
3. fetch individual alert details only when necessary.

Do not make dozens of requests every time the app launches.

If detailed parsing of Rider Alerts makes this implementation excessively fragile, prioritize the **Service Disruption page first** and structure the service so Rider Alerts can be expanded later.

---

# 5. Graceful fallback / demo mode

This is a portfolio prototype, so it should never break because TheBus changes its site or is temporarily unavailable.

Create a small set of realistic mock alerts as fallback data.

For example:

```ts
{
  title: "Route 1L service disruption",
  affectedRoutes: ["1L"],
  description:
    "Route 1L is experiencing a temporary service disruption. Allow additional travel time.",
  type: "service-disruption",
  severity: "warning"
}
```

However:

**Always attempt real data first.**

Use mock data only if:

* fetching fails,
* parsing fails,
* there is no network connection,
* or I intentionally enable demo mode.

Keep the live-data adapter and mock-data adapter separate.

---

# 6. Notification settings

Add notification preferences using the existing app's design system.

I primarily want notifications for **service disruptions affecting routes the rider cares about**.

If the app already has Favorites, connect notifications to favorites rather than creating an entirely separate route-management system.

A rider should be able to enable:

**Service alerts**

with supporting copy similar to:

> Get notified about major delays, cancellations, detours, and service changes.

If appropriate, allow this to apply to:

* Favorite routes
* Favorite stops/routes

Use whatever structure makes the most sense with the existing favorites implementation.

Persist notification preferences locally.

---

# 7. Contextual notification permission

Do NOT immediately request operating-system notification permission when the app launches.

Instead, request it contextually.

For example, when someone favorites Route 1L, we could optionally show:

**Get updates for Route 1L?**

Get notified about major delays, cancellations, and service changes.

Buttons:

* **Turn on alerts**
* **Not now**

Only after the rider chooses **Turn on alerts** should the app request system notification permission.

Use the existing modal, sheet, dialog, or card patterns in the app rather than inventing a new visual style.

---

# 8. Native / local notifications

Inspect the environment.

### If this is Tauri v2

Use the official Tauri notification plugin if appropriate.

Implement:

1. check notification permission
2. request permission after user action
3. send notification
4. gracefully handle denial

### If this is a normal web app

Use the browser Notifications API if supported.

### If neither is practical

Create an in-app simulated notification system while keeping the notification service abstraction ready for native notifications later.

The app must not crash if notification APIs are unavailable.

---

# 9. Notification triggering

While the app is running, when service alerts refresh:

Compare the newly fetched alerts against previously seen alerts.

If a **new alert** affects one of the rider's favorited routes and notifications are enabled, trigger a notification.

Example:

**Route 1L service change**

Route 1L is temporarily detouring near Kapiʻolani Boulevard.

Another example:

**Route 1L stop closure**

Stop 437 is temporarily unavailable. View nearby stops for alternatives.

For a major system-wide disruption:

**TheBus service disruption**

Multiple routes are affected. Check your trip before heading out.

Do not repeatedly notify the rider about the same alert on every refresh.

Persist IDs or fingerprints for alerts that have already generated a notification.

A reasonable fingerprint could use some combination of:

* title
* affected routes
* start date/time
* description/source URL

---

# 10. Opening an alert

When possible, clicking/tapping an in-app notification or alert should lead to the corresponding alert detail inside Holo Hele.

The detail should show:

* alert title
* affected routes
* affected stops, if available
* description
* effective date/time
* alternative stop information if TheBus provides it
* source attribution

If we cannot deep-link a native OS notification cleanly in this prototype, that is okay.

Prioritize getting the notification itself working first.

---

# 11. Surface disruptions elsewhere in the UI

Do not limit this information to a separate Alerts page.

Reuse the normalized alert data so relevant disruptions can eventually appear beside:

* route results
* stop results
* favorite routes
* trip plans
* arrival information

For now, minimally integrate an alert indicator into the appropriate existing route/stop UI if that pattern already exists.

For example:

`1L  ⚠ Service alert`

Do not clutter every screen.

Only show an indicator when the alert actually affects that route or stop.

---

# 12. Demo controls

Because I need to demonstrate this feature in my UX case study, create a developer/demo method to reliably trigger it.

I should be able to simulate:

### Scenario A — favorite route disruption

Route: `1L`

Example notification:

**Route 1L service disruption**

A service change is affecting Route 1L. Tap to view details.

### Scenario B — stop closure

Route: `1L`

Stop: `437`

Example:

**Stop 437 temporarily closed**

Route 1L riders should use the nearby alternative stop.

### Scenario C — system-wide alert

Example:

**TheBus service disruption**

Multiple routes are currently affected. Check your trip before traveling.

This can be implemented through:

* a development-only control,
* a small debug utility,
* URL/query parameter,
* or another clean method.

Do **not** expose ugly debug controls in the normal production UI.

---

# 13. Test notification

In Settings, if notifications are enabled, add a simple:

**Send test notification**

option if it fits naturally.

When pressed, send:

**Notifications are on**

You'll receive updates when service changes affect your saved routes.

This will make it easier for me to verify and record the functionality.

---

# 14. Error handling

The app should continue functioning normally if:

* TheBus website is unavailable
* its HTML structure changes
* parsing fails
* notification permission is denied
* notifications are unsupported
* the device is offline

Log useful development errors without exposing technical error messages to riders.

Do not let alert fetching interfere with real-time arrival functionality.

---

# 15. Keep this extensible

Please structure the notification system so we can later add:

* bus approaching reminders
* "leave soon" notifications
* get-off reminders during navigation
* favorite stop arrival reminders

But **do not implement those additional features yet** unless the required infrastructure already makes them trivial.

This task should focus on **service disruptions and service alerts**.

---

# 16. Testing

Please test:

* parsing multiple affected routes
* `1` vs `1L` matching
* alerts affecting one favorite route
* alerts affecting no favorite routes
* system-wide alerts
* duplicate alert suppression
* permission allowed
* permission denied
* fetch failure
* parser failure
* fallback demo data
* no active disruptions

If feasible, keep a small local HTML fixture/sample for parser tests so our tests are not dependent on the live TheBus website.

---

# 17. Before changing code

First give me a concise implementation assessment based on the existing repository:

1. what framework/runtime this app currently uses
2. whether native notifications are possible
3. where the existing favorites and alerts logic live
4. how you plan to fetch TheBus data
5. which files you expect to modify/create

Then implement it.

After implementation, tell me:

1. what you changed
2. which parts use **real TheBus data**
3. which parts are **demo/mock functionality**
4. how to trigger a test notification
5. how to simulate a Route 1L disruption
6. what would still be required for true production push notifications when the app is completely closed
7. any limitations you discovered

Do not refactor unrelated parts of the application.
