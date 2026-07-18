"use client";

import dynamic from "next/dynamic";
import type { NearbyStopResult } from "@/types/transit";

const TransitMap = dynamic(
  () =>
    import("@/components/map/TransitMap").then((mod) => mod.TransitMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-canvas-soft text-sm font-medium text-body">
        Loading map…
      </div>
    ),
  },
);

interface MapViewProps {
  center: [number, number];
  stops: NearbyStopResult[];
  userLocation?: [number, number];
}

export function MapView(props: MapViewProps) {
  return <TransitMap {...props} />;
}
