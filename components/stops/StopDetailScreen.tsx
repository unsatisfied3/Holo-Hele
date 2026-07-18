"use client";

import { useEffect, useState } from "react";
import { FigmaIcon } from "@/components/icons/FigmaIcon";
import { LineTags } from "@/components/stops/LineTags";
import { StopArrivalItem } from "@/components/stops/StopArrivalItem";
import { StopDetailHeader } from "@/components/stops/StopDetailHeader";
import type { StopArrivalsResponse, StopLocation } from "@/types/transit";

interface StopDetailScreenProps {
  stop: StopLocation;
}

const LIVE_REFRESH_MS = 30_000;

function formatRefreshTime(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

async function loadStopArrivalsResponse(stopId: string): Promise<{
  data: StopArrivalsResponse | null;
  error: string | null;
}> {
  const response = await fetch(`/api/arrivals?stop=${stopId}`, { cache: "no-store" });
  const json = (await response.json()) as StopArrivalsResponse & { error?: string };

  if (!response.ok) {
    return {
      data: null,
      error: json.error ?? "Unable to load arrivals for this stop.",
    };
  }

  return {
    data: json,
    error: json.error ?? null,
  };
}

export function StopDetailScreen({ stop }: StopDetailScreenProps) {
  const [data, setData] = useState<StopArrivalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load(showLoading: boolean) {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const result = await loadStopArrivalsResponse(stop.id);
        if (cancelled) return;

        setData(result.data);
        setError(result.error);
      } catch {
        if (!cancelled) {
          setData(null);
          setError("Unable to load arrivals. Check your connection and try again.");
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    void load(true);

    return () => {
      cancelled = true;
    };
  }, [stop.id]);

  useEffect(() => {
    if (data?.dataSource !== "live" || error) return;

    let cancelled = false;

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const result = await loadStopArrivalsResponse(stop.id);
          if (cancelled) return;
          setData(result.data);
          setError(result.error);
        } catch {
          if (!cancelled) {
            setError("Unable to load arrivals. Check your connection and try again.");
          }
        }
      })();
    }, LIVE_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [data?.dataSource, error, stop.id]);

  useEffect(() => {
    if (!data?.fetchedAt || error) return;

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [data?.fetchedAt, error]);

  const refreshLabel =
    data?.fetchedAt && tick >= 0 ? formatRefreshTime(data.fetchedAt) : "just now";

  const lines = data?.lines ?? [...new Set((data?.arrivals ?? []).map((arrival) => arrival.route))];

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-canvas-soft">
      <StopDetailHeader stop={stop} />

      <div className="stop-detail__scroll min-h-0 flex-1 overflow-y-auto bg-canvas-soft">
        <div className="stop-detail__refresh-bar sticky top-0 z-10 flex items-center gap-1 bg-canvas-soft px-4 py-1.5 text-xs">
          <FigmaIcon name="refresh" size={14} className="h-3.5 w-3.5 text-body" />
          <span className="text-body">
            Last refresh: <strong className="font-bold text-ink">{refreshLabel}</strong>
          </span>
        </div>

        {loading ? (
          <p className="bg-canvas py-8 text-center text-sm text-body">Loading arrivals…</p>
        ) : error ? (
          <p className="bg-canvas px-4 py-8 text-center text-sm text-body">{error}</p>
        ) : (data?.arrivals.length ?? 0) === 0 ? (
          <p className="bg-canvas px-4 py-8 text-center text-sm text-body">
            No upcoming arrivals for this stop.
          </p>
        ) : (
          <>
            <LineTags lines={lines} />
            <ul className="divide-y divide-hairline bg-canvas">
              {(data?.arrivals ?? []).map((arrival) => (
                <li key={arrival.id}>
                  <StopArrivalItem stopId={stop.id} arrival={arrival} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
