"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MapView } from "@/components/map/MapView";
import { NearbyStopsSheet } from "@/components/transit/NearbyStopsSheet";
import { SearchOverlay } from "@/components/transit/SearchOverlay";
import { cn } from "@/lib/utils";
import type { NearbyStopsResponse } from "@/types/transit";

const DEFAULT_CENTER: [number, number] = [21.3047, -157.8567];

export function HomeScreen() {
  const [data, setData] = useState<NearbyStopsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [sheetExpanded, setSheetExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      const fetchNearby = async (lat: number, lng: number) => {
        const response = await fetch(`/api/nearby?lat=${lat}&lng=${lng}`);
        const json = (await response.json()) as NearbyStopsResponse & { error?: string };

        if (!response.ok) {
          throw new Error(json.error ?? "Unable to load nearby stops.");
        }

        return json;
      };

      const finish = async (lat: number, lng: number, location?: [number, number]) => {
        try {
          const json = await fetchNearby(lat, lng);
          if (cancelled) return;

          setData(json);
          setCenter([lat, lng]);
          if (location) setUserLocation(location);

          if (json.error) {
            setError(json.error);
          }
        } catch (fetchError) {
          if (!cancelled) {
            setData(null);
            setError(
              fetchError instanceof Error
                ? fetchError.message
                : "Unable to load nearby stops. Check your connection and try again.",
            );
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      if (!navigator.geolocation) {
        await finish(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          void finish(
            position.coords.latitude,
            position.coords.longitude,
            [position.coords.latitude, position.coords.longitude],
          );
        },
        () => {
          void finish(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
        },
        { maximumAge: 60_000, timeout: 10_000 },
      );
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const stops = data?.stops ?? [];

  return (
    <AppShell>
      <div
        className={cn("home-screen", !sheetExpanded && "home-screen--sheet-collapsed")}
      >
        <div className="home-screen__map" aria-hidden={false}>
          <MapView center={center} stops={stops} userLocation={userLocation} />
        </div>

        <SearchOverlay />

        <NearbyStopsSheet
          stops={stops}
          loading={loading}
          error={error}
          fetchedAt={data?.fetchedAt}
          expanded={sheetExpanded}
          onExpandedChange={setSheetExpanded}
        />
      </div>
    </AppShell>
  );
}
