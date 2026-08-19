import { lazy, Suspense } from "react";
import type { StopLocation } from "@/types/transit";

const TransitMap = lazy(() =>
  import("@/components/map/TransitMap").then((module) => ({
    default: module.TransitMap,
  })),
);

function MapLoading() {
  return (
      <div className="flex h-full w-full items-center justify-center bg-canvas-soft text-sm font-medium text-body">
        Loading map…
      </div>
  );
}

interface MapViewProps {
  center: [number, number];
  stops: StopLocation[];
  selectedStopId?: string;
  userLocation?: [number, number];
  onStopSelect?: (stop: StopLocation) => void;
}

export function MapView(props: MapViewProps) {
  return (
    <Suspense fallback={<MapLoading />}>
      <TransitMap {...props} />
    </Suspense>
  );
}
