"use client";

import { useMap } from "react-leaflet";
import { FigmaIcon } from "@/components/icons/FigmaIcon";

interface MapControlsProps {
  center: [number, number];
  userLocation?: [number, number];
  position?: "sheet" | "fixed";
  className?: string;
}

export function MapControls({
  center,
  userLocation,
  position = "sheet",
  className = "",
}: MapControlsProps) {
  const map = useMap();

  function zoomBy(delta: number) {
    map.setZoom(map.getZoom() + delta);
  }

  function recenter() {
    const target = userLocation ?? center;
    map.setView(target, map.getZoom(), { animate: true });
  }

  const positionClass =
    position === "fixed"
      ? `absolute right-4 ${className || "bottom-4"}`
      : `home-screen__map-controls absolute right-4 ${className}`.trim();

  return (
    <div className="pointer-events-none absolute inset-0 z-[400]">
      <div className={`${positionClass} pointer-events-auto flex flex-col gap-3`}>
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-canvas">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomBy(1)}
            className="flex h-10 w-12 items-center justify-center border-b border-hairline transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <FigmaIcon name="zoomIn" size={24} className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomBy(-1)}
            className="flex h-10 w-12 items-center justify-center transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <FigmaIcon name="zoomOut" size={24} className="h-6 w-6" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Recenter map"
          onClick={recenter}
          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-hairline bg-canvas transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="myLocation" size={24} className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
