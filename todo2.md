Create a new file in the root of this project called:

`PROJECT_STATE.md`

The purpose of this file is to maintain a concise, accurate snapshot of the current state of my **Holo Hele / DaBus redesign prototype** so I can share it with ChatGPT or another developer without needing to explain the entire codebase every time.

First, inspect the existing repository before writing the file.

Do not guess. Only document functionality, architecture, data sources, files, and limitations that actually exist in the current project.

Use this structure:

```md
# Holo Hele — Project State

Last updated: [current date]

## Project overview

Briefly explain what Holo Hele is and what this prototype currently demonstrates.

Keep this to 2–4 sentences.

## Tech stack

List the main technologies currently being used.

For example:

- Framework:
- Language:
- Runtime:
- Styling:
- Maps:
- State management:
- Routing:
- APIs:
- Other important libraries:

Only include technologies actually present in the project.

## Current app structure

Briefly explain the major parts of the application and how they relate to each other.

Include important directories or architectural patterns if useful.

Do not list every file.

## Implemented features

List the major user-facing features that currently work.

Examples may include, if they actually exist:

- unified transit search
- nearby stops
- stop details
- real-time arrivals
- route details
- route schedules
- trip planning
- favorites
- service alerts
- settings
- multilingual support
- onboarding
- map interactions
- notifications

For each feature, add a short note describing its current level of functionality.

Example:

- **Real-time arrivals** — Fetches live arrival data from the HEA API and displays upcoming buses for a selected stop.

Be specific about whether something is fully functional, partially implemented, or purely demonstrational.

## User flows

List the main flows currently supported by the prototype.

For example:

### Familiar trip
Search/favorite stop → view arrivals → check bus location.

### Unfamiliar trip
Search destination → select trip → view route/stop information.

### Disrupted trip
Receive/view service alert → understand affected route → find alternative information.

Only include flows currently implemented or meaningfully represented.

## Data sources

Document every external data source currently used.

For each source, include:

- source name
- what data it provides
- whether the data is live
- where it is used
- any important limitations

Example:

### TheBus HEA API

Provides:
- arrivals
- vehicle locations
- route information

Status: Live

Used in:
- stop detail
- route screens

Limitations:
- Does not currently provide service-disruption alerts.

## Live data vs mock data

Clearly separate functionality that uses real data from functionality that uses mocked, static, generated, or fallback data.

### Live

- ...

### Mock / prototype

- ...

### Hybrid

- ...

This section is especially important.

## Favorites

Explain how favorites currently work.

Include:

- what can be favorited
- where favorites are stored
- whether they persist
- which screens use them
- whether other functionality depends on them

## Alerts and disruptions

Explain the current alert/service disruption implementation.

Include:

- alert data source
- how routes are matched to alerts
- where alerts appear
- whether alerts are live or mocked
- notification behavior, if implemented
- known limitations

If alerts are not implemented yet, explicitly say so.

## Notifications

Document the current notification implementation.

Include:

- native notification support, if any
- browser notification support, if any
- permission handling
- what events trigger notifications
- whether notifications work when the app is closed
- demo/test notification functionality

If notifications are not implemented yet, say so.

## Important UX decisions

Document major design/behavior decisions reflected in the current build.

Examples may include, if applicable:

- automatic arrival refreshing instead of a persistent manual refresh control
- unified search instead of separate search modes
- clear differentiation between stop, route, and destination results
- route `1` and `1L` treated as separate routes
- local Hawaiʻi visual language
- service disruptions surfaced contextually
- favorites optimized for frequently checked trips

Focus on decisions that would be useful context for someone reviewing or extending the project.

## Important files

List only the most important files someone would need to inspect to understand or modify the app.

Use this format:

- `path/to/file.ts` — purpose
- `path/to/component.tsx` — purpose

Avoid listing generic generated files or every component.

## Persistence

Explain what data currently persists between sessions.

Examples:

- favorites
- settings
- onboarding completion
- notification preferences
- cached alerts

Also state how it is persisted, such as:

- localStorage
- IndexedDB
- Tauri store
- database
- in-memory only

## Demo functionality

Document any functionality that exists specifically for portfolio/demo purposes.

Examples:

- simulated service disruption
- mock bus movement
- test notification
- debug route
- fake fallback data

Explain how to trigger each demo if applicable.

## Known limitations

List the major current technical or UX limitations.

Examples:

- only works while app is open
- service alerts are mocked
- no production push-notification backend
- some routes use incomplete data
- deep links are not implemented
- parser depends on TheBus HTML structure

Keep this practical and concise.

## Current bugs / issues

List only known unresolved bugs or behavior that is currently broken.

If there are no known bugs, write:

`No major known issues at this time.`

## Next priorities

List the most logical next pieces of work based on the current repository.

Do not invent an entire roadmap.

Keep this to approximately 3–6 items.

## Recent changes

Create a short changelog.

Use this structure:

### YYYY-MM-DD

- Added ...
- Updated ...
- Fixed ...
- Removed ...

For the first version of this file, summarize the most recent meaningful implementation work you can infer from the repository or git history.

If git history is available, use it to improve accuracy.

## Notes for future developers / AI

Add any important implementation details that someone could easily misunderstand when modifying this project.

For example:

- Route IDs must use exact matching because `1` and `1L` are different routes.
- Do not replace live API data with mocks unless a fallback is required.
- Preserve the existing design system and reuse existing components.
- Avoid redesigning unrelated screens when implementing new functionality.
```

## Writing guidelines

Keep `PROJECT_STATE.md` concise enough that someone can read it quickly.

Target approximately **1,000–2,000 words maximum**, unless the project genuinely requires more detail.

Prioritize:

* current behavior
* current architecture
* current data sources
* important UX decisions
* live vs mock functionality
* limitations
* files that matter

Avoid:

* explaining obvious code
* listing every dependency
* listing every component
* documenting abandoned experiments
* vague statements such as "the app has many features"
* claiming something works unless you verified it in the repository

## Important

This file should describe the **current state**, not the intended final state.

If something is planned but not implemented, place it under `Next priorities` rather than describing it as existing functionality.

After creating the file, give me a short summary of:

1. what you documented
2. anything you could not confidently determine from the repository
3. any inconsistencies you found between the code and what the app appears to support

From now on, whenever you complete a meaningful feature or architectural change in this project, update `PROJECT_STATE.md` before finishing the task.

For future updates, only change the sections affected by the work and add a new entry under `Recent changes`.

Do not rewrite the entire file unnecessarily.
