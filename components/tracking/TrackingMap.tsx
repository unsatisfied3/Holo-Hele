"use client";

import dynamic from "next/dynamic";
import type { StopLocation, TheBusArrival, VehicleLocation } from "@/types/transit";

const TrackingMapInner = dynamic(
  () =>
    import("@/components/tracking/TrackingMapInner").then(
      (mod) => mod.TrackingMapInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-canvas-soft text-sm font-medium text-body">
        Loading map…
      </div>
    ),
  },
);

interface TrackingMapProps {
  stop: StopLocation;
  arrival: TheBusArrival;
  vehicleLocation: VehicleLocation | null;
  stopsAway: number | null;
}

export function TrackingMap({
  stop,
  arrival,
  vehicleLocation,
  stopsAway,
}: TrackingMapProps) {
  return (
    <TrackingMapInner
      stop={stop}
      arrival={arrival}
      vehicleLocation={vehicleLocation}
      stopsAway={stopsAway}
    />
  );
}
