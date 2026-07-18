"use client";

import { useEffect, useState } from "react";
import { TrackingHeader } from "@/components/tracking/TrackingHeader";
import { TrackingMap } from "@/components/tracking/TrackingMap";
import { TrackingSummary } from "@/components/tracking/TrackingSummary";
import type { StopLocation, TrackingResponse } from "@/types/transit";

interface TrackingScreenProps {
  stop: StopLocation;
  arrivalId: string;
}

const LIVE_REFRESH_MS = 15_000;

async function loadTracking(
  stopId: string,
  arrivalId: string,
): Promise<{ data: TrackingResponse | null; error: string | null }> {
  const response = await fetch(
    `/api/tracking?stop=${encodeURIComponent(stopId)}&arrival=${encodeURIComponent(arrivalId)}`,
    { cache: "no-store" },
  );
  const json = (await response.json()) as TrackingResponse & { error?: string };

  if (!response.ok) {
    return {
      data: null,
      error: json.error ?? "Unable to load bus tracking.",
    };
  }

  return {
    data: json,
    error: json.error ?? null,
  };
}

export function TrackingScreen({ stop, arrivalId }: TrackingScreenProps) {
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(showLoading: boolean) {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const result = await loadTracking(stop.id, arrivalId);
        if (cancelled) return;

        if (!result.data) {
          setData(null);
          setError(result.error);
          return;
        }

        setData(result.data);
        setError(result.error);
      } catch {
        if (!cancelled) {
          setData(null);
          setError("Unable to load bus tracking. Check your connection and try again.");
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    void load(true);

    return () => {
      cancelled = true;
    };
  }, [stop.id, arrivalId]);

  useEffect(() => {
    if (data?.dataSource !== "live" || error) return;

    let cancelled = false;

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const result = await loadTracking(stop.id, arrivalId);
          if (cancelled || !result.data) return;
          setData(result.data);
          setError(result.error);
        } catch {
          if (!cancelled) {
            setError("Unable to load bus tracking. Check your connection and try again.");
          }
        }
      })();
    }, LIVE_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [data?.dataSource, error, stop.id, arrivalId]);

  return (
    <div className="app-shell relative h-dvh overflow-hidden bg-canvas">
      {loading ? (
        <div className="flex h-full items-center justify-center px-4">
          <p className="text-sm text-body">Loading bus location…</p>
        </div>
      ) : error && !data ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-body">{error}</p>
        </div>
      ) : data ? (
        <>
          <div className="absolute inset-0">
            <TrackingMap
              stop={stop}
              arrival={data.arrival}
              vehicleLocation={data.vehicleLocation}
              stopsAway={data.stopsAway}
            />
          </div>

          <TrackingHeader stopId={stop.id} />

          {!data.vehicleLocation && data.arrival.estimated ? (
            <p className="absolute inset-x-4 top-[calc(max(env(safe-area-inset-top),0.75rem)+3.5rem)] z-[500] rounded-[var(--radius-xs)] border border-hairline bg-canvas px-3 py-2 text-xs text-body">
              Vehicle location is temporarily unavailable.
            </p>
          ) : null}

          <TrackingSummary
            stop={stop}
            arrival={data.arrival}
            stopsAway={data.stopsAway}
          />
        </>
      ) : null}
    </div>
  );
}
