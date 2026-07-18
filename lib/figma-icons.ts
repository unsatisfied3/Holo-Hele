export const FIGMA_ICONS = {
  busStopSign: "/icons/figma/bus-stop-sign.svg",
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
  help: "/icons/figma/help.svg",
  myLocation: "/icons/figma/my-location.svg",
  zoomIn: "/icons/figma/zoom-in.svg",
  zoomOut: "/icons/figma/zoom-out.svg",
  arrowBack: "/icons/figma/arrow-back.svg",
  refresh: "/icons/figma/refresh.svg",
  schedule: "/icons/figma/schedule.svg",
  place: "/icons/figma/place.svg",
  favorite: "/icons/figma/favorite.svg",
} as const;

export type FigmaIconName = keyof typeof FIGMA_ICONS;

export function createBusStopMarkerHtml(): string {
  return `<div style="width:36px;height:36px;border-radius:999px;background:#000;display:flex;align-items:center;justify-content:center;border:2px solid #fff"><img src="/icons/figma/map-marker-bus.svg" width="20" height="20" alt="" aria-hidden="true" style="filter:brightness(0) invert(1)" /></div>`;
}

export function createBusVehicleMarkerHtml(): string {
  return `<div style="width:40px;height:40px;border-radius:999px;background:#000;display:flex;align-items:center;justify-content:center;border:2px solid #1a7f37"><img src="/icons/figma/map-marker-bus.svg" width="22" height="22" alt="" aria-hidden="true" style="filter:brightness(0) invert(1)" /></div>`;
}

export function createBusTrackingMarkerHtml(minutesLabel: string): string {
  return `<div style="position:relative;width:52px;height:58px;font-family:Inter,system-ui,sans-serif">
    <div style="position:absolute;left:6px;top:0;width:40px;height:40px;border-radius:999px;background:#000;border:2px solid #fff;display:flex;align-items:center;justify-content:center">
      <img src="/icons/figma/map-marker-bus.svg" width="22" height="22" alt="" aria-hidden="true" style="filter:brightness(0) invert(1)" />
    </div>
    <div style="position:absolute;top:44px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff;border:1px solid #e4e4e7;border-radius:4px;padding:2px 6px;font-size:12px;font-weight:600;line-height:1;color:#000">${minutesLabel}</div>
  </div>`;
}

export function createTrackingStopDotHtml(): string {
  return `<div style="width:11px;height:11px;border-radius:999px;background:#000;border:2px solid #fff"></div>`;
}

export function createTrackingIntermediateStopDotHtml(): string {
  return `<div style="width:12px;height:12px;border-radius:999px;background:#000;border:2px solid #fff"></div>`;
}

export function createTrackingDestinationStopDotHtml(): string {
  return `<div style="width:18px;height:18px;border-radius:999px;background:#000;border:2px solid #fff"></div>`;
}
