export const FIGMA_ICONS = {
  busStopSign: "/icons/figma/bus-stop-sign.svg",
  nearbyBusStopSign: "/icons/figma/nearby-bus-stop-sign.svg",
  busRoute: "/icons/figma/bus-route.svg",
  liveSignal: "/icons/figma/live-signal.svg",
  search: "/icons/figma/search.svg",
  home: "/icons/figma/home.svg",
  work: "/icons/figma/work.svg",
  other: "/icons/figma/other.svg",
  mapMarkerBus: "/icons/figma/map-marker-bus.svg",
  chevronDown: "/icons/figma/chevron-down.svg",
  mapNav: "/icons/figma/map-nav.svg",
  favorites: "/icons/figma/favorites.svg",
  myLocation: "/icons/figma/my-location.svg",
  zoomIn: "/icons/figma/zoom-in.svg",
  zoomOut: "/icons/figma/zoom-out.svg",
  walking: "/icons/figma/walking.svg",
  swap: "/icons/figma/swap.svg",
  chevronSmall: "/icons/figma/chevron-small.svg",
  chevronRight: "/icons/figma/chevron-right.svg",
  close: "/icons/figma/close.svg",
  arrowBack: "/icons/figma/arrow-back.svg",
  refresh: "/icons/figma/refresh.svg",
  schedule: "/icons/figma/schedule.svg",
  place: "/icons/figma/place.svg",
  placeFilled: "/icons/figma/place-filled.svg",
  favorite: "/icons/figma/favorite.svg",
} as const;

export type FigmaIconName = keyof typeof FIGMA_ICONS;

export function createBusStopMarkerHtml(selected = false): string {
  const shadow = selected
    ? "box-shadow:0 0 12px rgba(0,65,141,.8);"
    : "";
  return `<div style="width:36px;height:36px;border-radius:999px;background:var(--canvas);display:flex;align-items:center;justify-content:center;border:3px solid var(--brand-blue);${shadow}"><span aria-hidden="true" style="display:block;width:20px;height:20px;background:var(--brand-blue);-webkit-mask:url('/icons/figma/map-marker-bus.svg') center/contain no-repeat;mask:url('/icons/figma/map-marker-bus.svg') center/contain no-repeat"></span></div>`;
}

export function createCompactBusStopMarkerHtml(): string {
  return `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center"><div style="width:14px;height:14px;border-radius:999px;background:var(--canvas);border:3px solid var(--brand-blue)"></div></div>`;
}

export function createTransitCenterMarkerHtml(): string {
  return `<div style="width:28px;height:28px;border-radius:999px;background:var(--canvas);display:flex;align-items:center;justify-content:center;border:2px solid var(--brand-blue)"><span aria-hidden="true" style="display:block;width:15px;height:15px;background:var(--brand-blue);-webkit-mask:url('/icons/figma/map-marker-bus.svg') center/contain no-repeat;mask:url('/icons/figma/map-marker-bus.svg') center/contain no-repeat"></span></div>`;
}

export function createBusVehicleMarkerHtml(): string {
  return `<div style="width:40px;height:40px;border-radius:999px;background:#000;display:flex;align-items:center;justify-content:center;border:2px solid #1a7f37"><img src="/icons/figma/map-marker-bus.svg" width="22" height="22" alt="" aria-hidden="true" style="filter:brightness(0) invert(1)" /></div>`;
}

export function createBusTrackingMarkerHtml(minutesLabel: string): string {
  return `<div style="position:relative;width:58px;height:52px;font-family:Inter,system-ui,sans-serif">
    <div style="position:absolute;left:0;top:4px;width:44px;height:44px;border-radius:999px;background:#fff;border:1px solid #cbcbcb;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.18)">
      <span aria-hidden="true" style="display:block;width:24px;height:24px;background:#0055a5;-webkit-mask:url('/icons/figma/map-marker-bus.svg') center/contain no-repeat;mask:url('/icons/figma/map-marker-bus.svg') center/contain no-repeat"></span>
    </div>
    <div style="position:absolute;right:0;top:2px;white-space:nowrap;background:#0055a5;border-radius:999px;padding:3px 6px;font-size:11px;font-weight:600;line-height:1;color:#fff">${minutesLabel}</div>
  </div>`;
}

export function createTrackingStopDotHtml(): string {
  return `<div style="width:11px;height:11px;border-radius:999px;background:#000;border:2px solid #fff"></div>`;
}

export function createTrackingIntermediateStopDotHtml(): string {
  return `<div style="width:12px;height:12px;border-radius:999px;background:#fff;border:4px solid #0055a5"></div>`;
}

export function createTrackingDestinationStopDotHtml(): string {
  return `<div style="width:18px;height:18px;border-radius:999px;background:#fff;border:4px solid #0055a5"></div>`;
}

export function createUserLocationMarkerHtml(): string {
  return `<div style="width:28px;height:28px;border-radius:999px;background:rgba(22,131,237,.24);display:flex;align-items:center;justify-content:center">
    <div style="width:16px;height:16px;border-radius:999px;background:#1683ed;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,85,165,.2)"></div>
  </div>`;
}

export function createTrackingDirectionArrowHtml(rotationDegrees: number): string {
  const rotation = Number.isFinite(rotationDegrees) ? rotationDegrees.toFixed(1) : "0";
  const offsetAngle = ((rotationDegrees + 90) * Math.PI) / 180;
  const offsetX = (Math.cos(offsetAngle) * 18).toFixed(1);
  const offsetY = (Math.sin(offsetAngle) * 18).toFixed(1);
  return `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;transform:translate(${offsetX}px,${offsetY}px);pointer-events:none">
    <div style="width:24px;height:24px;transform:rotate(${rotation}deg)">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12h16M13 6l6 6-6 6" stroke="#0055a5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </div>`;
}
