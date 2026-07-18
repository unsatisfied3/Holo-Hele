# Holo Hele Development Instructions

## Project Overview

Holo Hele is a mobile-first public transit application for Oʻahu.

Its purpose is to help riders quickly understand nearby stops, bus routes, arrival times, service alerts, and saved transit information.

The experience should feel:

- Calm
- Clear
- Trustworthy
- Fast
- Easy to use outdoors and while moving

Follow the visual and interaction guidance in `DESIGN.md`.

---

## Working Relationship

Treat the user as the product designer and product owner.

The user may be less experienced with development, so explain technical decisions in clear language without unnecessary jargon.

Do not make major product, design, or architectural decisions without explaining them first.

When a request is ambiguous, ask a focused question rather than making a large assumption.

For significant changes, briefly explain:

1. What you plan to build
2. Which files you expect to change
3. Any important trade-offs

Small and obvious fixes may be completed directly.

---

## Scope and Simplicity

Prefer the simplest solution that satisfies the current requirement.

Do not over-engineer the project.

Do not add features that were not requested.

Do not create unnecessary abstractions, utilities, components, folders, or configuration files.

Reuse existing components and patterns before creating new ones.

Do not install a new package unless it provides a clear benefit that cannot reasonably be achieved with the existing project.

---

## Product and UX Decisions

Prioritize clarity over visual complexity.

Preserve the intent of the approved Figma designs and user research.

Do not change the information hierarchy simply to make implementation easier.

Do not invent product requirements.

When a technical limitation affects the intended experience, explain the limitation and propose the closest practical alternative.

The most important transit information should be easy to scan within a few seconds.

Arrival information, route identification, stop names, service status, and data freshness should be visually clear.

---

## Design Implementation

Always consult `DESIGN.md` before creating or substantially changing interface elements.

Do not introduce a separate visual style that conflicts with `DESIGN.md`.

Use a mobile-first approach.

Interfaces must also adapt appropriately to tablet and desktop sizes.

Use consistent:

- Typography
- Spacing
- Border radii
- Shadows
- Colors
- Icons
- Interaction patterns

Use design tokens or shared variables instead of repeatedly hard-coding visual values.

Build reusable components when the same pattern appears more than once.

Do not redesign approved screens without discussing the change first.

---

## Interface States

Interactive features should account for relevant states, including:

- Loading
- Empty
- Error
- Offline
- Success
- Disabled
- Selected
- Hover
- Focus

Do not leave users with a blank screen when data is unavailable.

Error messages should explain what happened and what the user can do next.

---

## Transit Data

Never fabricate live transit information.

Clearly distinguish between:

- Live arrival information
- Scheduled arrival information
- Estimated or unavailable information

Display when live information was last updated when relevant.

Handle missing, delayed, incomplete, and failed API responses gracefully.

Do not expose raw technical errors to users.

Use mock data during early development, but keep it clearly separated from production data sources.

Do not hard-code mock arrival information in a way that could accidentally appear as real data in production.

---

## Maps and Location

Do not assume location permission has been granted.

Provide a useful fallback when location access is denied, unavailable, or still loading.

Avoid making the map the only way to access important transit information.

Stops, arrivals, and routes should remain understandable through accessible text-based interfaces.

Do not expose precise user location unnecessarily.

---

## Accessibility

Use semantic HTML whenever possible.

All interactive elements must be keyboard accessible.

Provide visible focus states.

Use appropriate labels for icons, controls, inputs, and navigation.

Do not rely on color alone to communicate meaning.

Maintain sufficient color contrast.

Use touch targets that are comfortable on mobile devices.

Support text resizing without breaking the layout.

Respect reduced-motion preferences.

Images that communicate information must have meaningful alternative text.

Decorative images should not be announced by screen readers.

---

## Code Quality

Use TypeScript where supported by the project.

Avoid using `any` unless there is a documented reason.

Use clear and descriptive names for variables, functions, components, and files.

Keep components focused on one responsibility.

Prefer readable code over clever code.

Remove unused code and imports created by your changes.

Do not modify unrelated files.

Do not silently rewrite large sections of working code.

Add comments only when they explain reasoning that is not obvious from the code itself.

---

## File Organization

Follow the existing project structure.

Before creating a new folder or architectural pattern, check whether an appropriate location already exists.

Keep reusable interface components separate from page-specific components when helpful.

Keep transit data logic separate from presentation components.

Do not place secrets, API keys, or private credentials directly in source files.

Use environment variables for sensitive configuration.

---

## Validation

After making changes, use the available project commands to check the work.

When applicable:

- Run linting
- Run type checking
- Run relevant tests
- Confirm the application builds
- Check the affected screen at mobile width
- Check keyboard navigation
- Check loading, empty, and error states

Do not claim that something was tested if it was not.

---

## Completing a Task

At the end of a task, provide a brief summary containing:

1. What changed
2. The main files changed
3. How the user can review or test it
4. Anything unfinished or uncertain
5. Any new package, environment variable, or setup step introduced

Keep the summary concise and understandable to a designer who is learning development.