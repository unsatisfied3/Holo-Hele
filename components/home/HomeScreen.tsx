import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { MapView } from "@/components/map/MapView";
import { NearbyStopsSheet } from "@/components/transit/NearbyStopsSheet";
import { SearchOverlay } from "@/components/transit/SearchOverlay";
import { SelectedStopSheet } from "@/components/transit/SelectedStopSheet";
import {
  fetchMapStops,
  fetchNearbyStops,
  fetchStopArrivals,
} from "@/lib/api/transit";
import { getLocationPreference } from "@/lib/onboarding";
import {
  haversineMeters,
  walkMinutesFromMeters,
} from "@/lib/thebus/stops";
import { cn } from "@/lib/utils";
import type { NearbyStopResult, StopLocation } from "@/types/transit";

const DEFAULT_CENTER: [number, number] = [21.3047, -157.8567];

export function HomeScreen() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [selectedStopLocation, setSelectedStopLocation] =
    useState<StopLocation | null>(null);

  useEffect(() => {
    if (!getLocationPreference() || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setCenter(location);
        setUserLocation(location);
      },
      () => setCenter(DEFAULT_CENTER),
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const nearbyQuery = useQuery({
    queryKey: ["nearby-stops", center[0], center[1]],
    queryFn: () => fetchNearbyStops(center[0], center[1]),
    staleTime: 30_000,
  });
  const mapStopsQuery = useQuery({
    queryKey: ["map-stops"],
    queryFn: fetchMapStops,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const data = nearbyQuery.data;
  const stops = data?.stops ?? [];
  const nearbySelectedStop = selectedStopLocation
    ? stops.find((stop) => stop.stop.id === selectedStopLocation.id)
    : undefined;
  const selectedStopQuery = useQuery({
    queryKey: ["stop-arrivals", selectedStopLocation?.id ?? ""],
    queryFn: () => fetchStopArrivals(selectedStopLocation!.id),
    enabled: Boolean(selectedStopLocation && !nearbySelectedStop),
    staleTime: 30_000,
  });
  const selectedStopDistance = selectedStopLocation
    ? haversineMeters(
        center[0],
        center[1],
        selectedStopLocation.lat,
        selectedStopLocation.lng,
      )
    : 0;
  const selectedStop: NearbyStopResult | null = selectedStopLocation
    ? nearbySelectedStop ?? {
        stop: selectedStopLocation,
        distanceMeters: selectedStopDistance,
        walkMinutes: walkMinutesFromMeters(selectedStopDistance),
        lines: selectedStopQuery.data?.lines ?? [],
        arrivals: selectedStopQuery.data?.arrivals ?? [],
        nextArrival: selectedStopQuery.data?.arrivals[0],
        dataUpdatedAt: selectedStopQuery.data?.fetchedAt,
        error:
          selectedStopQuery.error instanceof Error
            ? selectedStopQuery.error.message
            : undefined,
      }
    : null;
  const mapStops =
    mapStopsQuery.data?.stops ?? stops.map((stopResult) => stopResult.stop);
  const error =
    data?.error ??
    (nearbyQuery.error instanceof Error
      ? nearbyQuery.error.message
      : nearbyQuery.isError
        ? "Unable to load nearby stops. Check your connection and try again."
        : null);

  return (
    <AppShell hideBottomNav={Boolean(selectedStopLocation)}>
      <div
        className={cn(
          "home-screen",
          !sheetExpanded && "home-screen--sheet-collapsed",
          selectedStop && "home-screen--stop-selected",
        )}
      >
        <div className="home-screen__map" aria-hidden={false}>
          <MapView
            center={center}
            stops={mapStops}
            selectedStopId={selectedStopLocation?.id}
            userLocation={userLocation}
            onStopSelect={setSelectedStopLocation}
          />
        </div>

        <SearchOverlay />

        {selectedStop ? (
          <SelectedStopSheet
            stopResult={selectedStop}
            loading={Boolean(
              selectedStopLocation &&
                !nearbySelectedStop &&
                selectedStopQuery.isPending,
            )}
            onClose={() => setSelectedStopLocation(null)}
          />
        ) : (
          <NearbyStopsSheet
            stops={stops}
            loading={nearbyQuery.isPending}
            error={error}
            fetchedAt={data?.fetchedAt}
            expanded={sheetExpanded}
            onExpandedChange={setSheetExpanded}
          />
        )}
      </div>
    </AppShell>
  );
}
