# Codex Prompt — Search by Destination / Directions Flow

Please polish and complete the existing **Search by Destination** flow using my Figma **Flow 5: Directions** as the visual and interaction reference.

Figma:
https://www.figma.com/design/mGPyMGgYdjGsSZ9MPo0tSe/TheBus_V1

Relevant frames:

* Search Results — `34:3906`
* Plan Trip / Suggested Routes — `34:4015`
* Directions — `34:4151`
* Live Direction 1 — `34:4245`
* Live Direction 2 — `34:4285`

First inspect the existing search, journey, directions, and guidance implementation. **Do not rebuild this flow from scratch if equivalent components/routes already exist.**

The intended demo flow is:

**Search → select a Place → Plan Trip → select route → Directions → Start → Live guidance**

### 1. Search

Keep the existing unified search for **Buses, Stops, and Places**.

Match the Figma search-result structure:

* Group results under Buses, Stops, and Places.
* Place results show a location icon, place name, and address.
* Selecting a **Place** should begin destination-based trip planning.
* Selecting a Bus or Stop should continue using their existing flows.

Use **Ala Moana Center** as the primary demo destination.

### 2. Plan Trip

Match Figma frame `34:4015`.

Show:

* Current Location as origin
* selected place as destination
* swap control
* Depart now
* Filter by
* Recommended Route
* Other Routes

Route cards should clearly communicate:

* total travel time
* walking segments
* bus route(s)
* live estimated arrival when available in the mock scenario
* scheduled time when the scenario is scheduled rather than live

Selecting a route opens its Directions screen.

Do not build real trip routing, departure-time planning, or filtering in this pass. Keep these based on the existing mock journey system.

### 3. Directions

Match Figma frame `34:4151`.

The screen should have:

* map occupying the upper portion
* selected route drawn on the map
* current-location marker
* relevant bus/route marker where appropriate
* route-summary sheet over the map
* detailed step-by-step itinerary below
* Start CTA

Use the existing Leaflet/map implementation rather than turning the Figma map into a static image.

The itinerary should be generated from one coherent mock journey and show the progression clearly:

**Current location → walk to stop → board bus → ride stops → get off → walk to destination**

Do **not** hard-code the exact stop/place names from the Figma because some of the Figma screens contain old placeholder journey content. Use the existing journey fixture as the data source and keep destination, stops, route numbers, timestamps, and travel durations internally consistent across every screen.

Change the page title from **“Direction” → “Directions.”**

### 4. Live Guidance

Clicking **Start** should enter the simulated live-guidance flow.

Use frames `34:4245` and `34:4285` as the UI reference.

Walking state:

* map remains dominant
* current position is visible
* route/progress is visible
* guidance card tells the rider what they are doing now
* example structure: **“Walk 2 min to [stop]”**
* show distance and walking instructions

Transit state:

* update the guidance card once the rider is on the bus
* example structure: **“Get off in 10 stops”**
* keep the relevant stop/route information visible
* move/update the simulated current-position marker so the transition is visually obvious

This is a **controlled portfolio simulation**, so use deterministic mock progression rather than attempting real navigation, GPS turn-by-turn routing, or background tracking.

The live-guidance state should be easy to demo manually without waiting for real time.

### 5. Important implementation rules

Use the Figma for:

* hierarchy
* layout
* spacing
* component structure
* interaction model

But use the current Holo Hele design tokens/components and responsive patterns rather than copying absolute Figma positioning.

Reuse existing journey/search/map components whenever possible.

Keep all simulated trip data under the existing mock-data architecture. Do not mix mock journey information into real GTFS, HEA, arrivals, or service-alert data.

Do not break:

* search by Bus
* search by Stop
* route pages
* stop pages
* favorites
* live arrival tracking
* service disruptions

Do not create a new saved-trip/favorite data model just because the Figma Directions screen contains a Favorite button. Preserve existing behavior if one already exists; otherwise leave that outside the scope of this pass.

### Before implementing

Briefly tell me:

1. which existing files/routes/components currently power this flow,
2. how much of Flow 5 is already implemented,
3. what you intend to reuse,
4. what you need to change.

Then implement the flow and test the complete path:

**Search “Ala” → Ala Moana Center → Plan Trip → choose route → Directions → Start → walking guidance → transit guidance.**
