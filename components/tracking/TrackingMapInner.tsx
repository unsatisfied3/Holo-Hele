"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { MapControls } from "@/components/map/MapControls";
import {
  createBusTrackingMarkerHtml,
  createTrackingDestinationStopDotHtml,
  createTrackingIntermediateStopDotHtml,
} from "@/lib/figma-icons";
import {
  buildRoutePolyline,
  buildRouteStopMarkers,
} from "@/lib/tracking/route-visualization";
import type { StopLocation, TheBusArrival, VehicleLocation } from "@/types/transit";

interface TrackingMapInnerProps {
  stop: StopLocation;
  arrival: TheBusArrival;
  vehicleLocation: VehicleLocation | null;
  stopsAway: number | null;
}

function FitTrackingBounds({
  stop,
  vehicleLocation,
  stopsAway,
}: {
  stop: StopLocation;
  vehicleLocation: VehicleLocation | null;
  stopsAway: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    const stopPoint: [number, number] = [stop.lat, stop.lng];

    if (!vehicleLocation) {
      map.setView(stopPoint, 15, { animate: true });
      return;
    }

    const routeMarkers =
      stopsAway != null && stopsAway > 0
        ? buildRouteStopMarkers(vehicleLocation, stop, stopsAway)
        : [{ lat: stop.lat, lng: stop.lng, kind: "destination" as const }];

    const bounds = L.latLngBounds([
      stopPoint,
      [vehicleLocation.lat, vehicleLocation.lng],
      ...routeMarkers.map((marker) => [marker.lat, marker.lng] as [number, number]),
    ]);

    map.fitBounds(bounds, { padding: [72, 72], maxZoom: 16, animate: true });
  }, [map, stop, stopsAway, vehicleLocation]);

  return null;
}

function busEtaLabel(arrival: TheBusArrival): string {
  if (arrival.minutesUntil === 0) return "Now";
  if (arrival.minutesUntil != null) return `${arrival.minutesUntil} min`;
  return arrival.stopTime;
}

export function TrackingMapInner({
  stop,
  arrival,
  vehicleLocation,
  stopsAway,
}: TrackingMapInnerProps) {
  const center: [number, number] = vehicleLocation
    ? [
        (stop.lat + vehicleLocation.lat) / 2,
        (stop.lng + vehicleLocation.lng) / 2,
      ]
    : [stop.lat, stop.lng];

  const intermediateIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: createTrackingIntermediateStopDotHtml(),
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    [],
  );

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: createTrackingDestinationStopDotHtml(),
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    [],
  );

  const vehicleIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: createBusTrackingMarkerHtml(busEtaLabel(arrival)),
        iconSize: [52, 58],
        iconAnchor: [26, 20],
      }),
    [arrival],
  );

  const routeLine =
    vehicleLocation != null && stopsAway != null && stopsAway > 0
      ? buildRoutePolyline(vehicleLocation, stop, stopsAway)
      : vehicleLocation != null
        ? ([
            [vehicleLocation.lat, vehicleLocation.lng],
            [stop.lat, stop.lng],
          ] as [number, number][])
        : null;

  const routeMarkers =
    vehicleLocation != null && stopsAway != null && stopsAway > 0
      ? buildRouteStopMarkers(vehicleLocation, stop, stopsAway)
      : [{ lat: stop.lat, lng: stop.lng, kind: "destination" as const }];

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitTrackingBounds
        stop={stop}
        vehicleLocation={vehicleLocation}
        stopsAway={stopsAway}
      />
      <MapControls
        center={center}
        position="fixed"
        className="tracking-map__controls"
      />

      {routeLine ? (
        <Polyline
          positions={routeLine}
          pathOptions={{ color: "#5e5a65", weight: 4, opacity: 0.9 }}
        />
      ) : null}

      {routeMarkers.map((marker, index) => (
        <Marker
          key={`${marker.kind}-${index}`}
          position={[marker.lat, marker.lng]}
          icon={marker.kind === "destination" ? destinationIcon : intermediateIcon}
        >
          {marker.kind === "destination" ? (
            <Popup>
              <strong>{stop.name}</strong>
              <br />
              Stop {stop.id}
            </Popup>
          ) : null}
        </Marker>
      ))}

      {vehicleLocation ? (
        <Marker
          position={[vehicleLocation.lat, vehicleLocation.lng]}
          icon={vehicleIcon}
        >
          <Popup>
            Route {arrival.route} · {arrival.headsign}
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
