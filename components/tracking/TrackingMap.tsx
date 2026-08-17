import { lazy, Suspense } from "react";
import type {
  StopLocation,
  TheBusArrival,
  TrackingRouteStop,
  VehicleLocation,
} from "@/types/transit";

const TrackingMapInner = lazy(() =>
  import("@/components/tracking/TrackingMapInner").then((module) => ({
    default: module.TrackingMapInner,
  })),
);

function MapLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas-soft text-sm font-medium text-body">
      Loading map…
    </div>
  );
}

interface TrackingMapProps {
  stop: StopLocation;
  arrival: TheBusArrival;
  vehicleLocation: VehicleLocation | null;
  routeStops: TrackingRouteStop[];
  userLocation?: [number, number];
}

export function TrackingMap({
  stop,
  arrival,
  vehicleLocation,
  routeStops,
  userLocation,
}: TrackingMapProps) {
  return (
    <Suspense fallback={<MapLoading />}>
      <TrackingMapInner
        stop={stop}
        arrival={arrival}
        vehicleLocation={vehicleLocation}
        routeStops={routeStops}
        userLocation={userLocation}
      />
    </Suspense>
  );
}
