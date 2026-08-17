import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { MapView } from "@/components/map/MapView";
import { NearbyStopsSheet } from "@/components/transit/NearbyStopsSheet";
import { SearchOverlay } from "@/components/transit/SearchOverlay";
import { SelectedStopSheet } from "@/components/transit/SelectedStopSheet";
import { fetchNearbyStops } from "@/lib/api/transit";
import { getLocationPreference } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import type { NearbyStopResult } from "@/types/transit";

const DEFAULT_CENTER: [number, number] = [21.3047, -157.8567];

export function HomeScreen() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [selectedStop, setSelectedStop] = useState<NearbyStopResult | null>(null);

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

  const data = nearbyQuery.data;
  const stops = data?.stops ?? [];
  const error =
    data?.error ??
    (nearbyQuery.error instanceof Error
      ? nearbyQuery.error.message
      : nearbyQuery.isError
        ? "Unable to load nearby stops. Check your connection and try again."
        : null);

  return (
    <AppShell hideBottomNav={Boolean(selectedStop)}>
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
            stops={stops}
            selectedStopId={selectedStop?.stop.id}
            userLocation={userLocation}
            onStopSelect={setSelectedStop}
          />
        </div>

        <SearchOverlay />

        {selectedStop ? (
          <SelectedStopSheet
            stopResult={selectedStop}
            onClose={() => setSelectedStop(null)}
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
