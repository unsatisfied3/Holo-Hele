"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { Link } from "@tanstack/react-router";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  createBusTrackingMarkerHtml,
  createTrackingDirectionArrowHtml,
  createTrackingDestinationStopDotHtml,
  createTrackingIntermediateStopDotHtml,
  createUserLocationMarkerHtml,
} from "@/lib/figma-icons";
import {
  buildApproachPolyline,
  buildRouteDirectionIndicator,
  buildRoutePolyline,
} from "@/lib/tracking/route-visualization";
import type {
  StopLocation,
  TheBusArrival,
  TrackingRouteStop,
  VehicleLocation,
} from "@/types/transit";

interface TrackingMapInnerProps {
  stop: StopLocation;
  arrival: TheBusArrival;
  vehicleLocation: VehicleLocation | null;
  routeStops: TrackingRouteStop[];
  userLocation?: [number, number];
}

function FitTrackingBounds({
  stop,
  vehicleLocation,
  routeStops,
}: {
  stop: StopLocation;
  vehicleLocation: VehicleLocation | null;
  routeStops: TrackingRouteStop[];
}) {
  const map = useMap();

  useEffect(() => {
    const stopPoint: [number, number] = [stop.lat, stop.lng];

    if (!vehicleLocation) {
      map.setView(stopPoint, 15, { animate: true });
      return;
    }

    const leadInPoint: [number, number] = [
      vehicleLocation.lat - (stop.lat - vehicleLocation.lat) * 0.45,
      vehicleLocation.lng - (stop.lng - vehicleLocation.lng) * 0.45,
    ];

    const bounds = L.latLngBounds([
      stopPoint,
      [vehicleLocation.lat, vehicleLocation.lng],
      leadInPoint,
      ...routeStops.map(
        (routeStop) => [routeStop.lat, routeStop.lng] as [number, number],
      ),
    ]);

    map.fitBounds(bounds, {
      paddingTopLeft: [48, 88],
      paddingBottomRight: [48, 220],
      maxZoom: 16,
      animate: true,
    });
  }, [map, routeStops, stop, vehicleLocation]);

  return null;
}

function busEtaLabel(arrival: TheBusArrival): string {
  if (arrival.minutesUntil === 0) return "Now";
  if (arrival.minutesUntil != null) return `${arrival.minutesUntil} min`;
  return arrival.stopTime;
}

function DismissStopSelection({ onDismiss }: { onDismiss: () => void }) {
  useMapEvents({
    click: onDismiss,
  });
  return null;
}

export function TrackingMapInner({
  stop,
  arrival,
  vehicleLocation,
  routeStops,
  userLocation,
}: TrackingMapInnerProps) {
  const [selectedStop, setSelectedStop] = useState<{
    arrivalId: string;
    stopId: string;
  } | null>(null);
  const selectedStopId =
    selectedStop?.arrivalId === arrival.id ? selectedStop.stopId : null;
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
        iconSize: [58, 52],
        iconAnchor: [22, 26],
      }),
    [arrival],
  );

  const userLocationIcon = useMemo(
    () =>
      L.divIcon({
        className: "tracking-user-location-marker",
        html: createUserLocationMarkerHtml(),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [],
  );

  const routeLine =
    vehicleLocation != null
      ? buildRoutePolyline(vehicleLocation, stop, routeStops)
      : null;

  const approachLine =
    vehicleLocation != null
      ? buildApproachPolyline(vehicleLocation, stop, routeStops)
      : null;

  const directionIndicator =
    vehicleLocation != null
      ? buildRouteDirectionIndicator(vehicleLocation, stop, routeStops)
      : null;

  const directionIcon = useMemo(
    () =>
      directionIndicator
        ? L.divIcon({
            className: "tracking-direction-arrow",
            html: createTrackingDirectionArrowHtml(
              directionIndicator.rotationDegrees,
            ),
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })
        : null,
    [directionIndicator],
  );

  const visibleRouteStops =
    routeStops.length > 0
      ? routeStops
      : [
          {
            ...stop,
            sequence: 0,
            markerKind: "destination" as const,
          },
        ];
  const destinationIndex = visibleRouteStops.findIndex(
    (routeStop) => routeStop.markerKind === "destination",
  );
  const routeStopsForInitialView =
    destinationIndex >= 0
      ? visibleRouteStops.slice(
          0,
          Math.min(destinationIndex + 2, visibleRouteStops.length),
        )
      : visibleRouteStops;

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
        routeStops={routeStopsForInitialView}
      />
      <DismissStopSelection onDismiss={() => setSelectedStop(null)} />

      {routeLine ? (
        <Polyline
          positions={routeLine}
          pathOptions={{
            className: "tracking-route-line tracking-route-line--full",
            color: "#0055a5",
            weight: 4,
            opacity: 1,
          }}
        />
      ) : null}

      {approachLine ? (
        <Polyline
          positions={approachLine}
          pathOptions={{
            className: "tracking-route-line tracking-route-line--approach",
            color: "#78aef5",
            weight: 4,
            opacity: 1,
          }}
        />
      ) : null}

      {visibleRouteStops.map((routeStop) => (
        <Marker
          key={`${routeStop.id}-${routeStop.sequence}`}
          position={[routeStop.lat, routeStop.lng]}
          icon={
            routeStop.markerKind === "destination"
              ? destinationIcon
              : intermediateIcon
          }
          title={`${routeStop.name}, stop ${routeStop.id}`}
          zIndexOffset={routeStop.markerKind === "destination" ? 1200 : 200}
          eventHandlers={{
            click: (event) => {
              L.DomEvent.stopPropagation(event.originalEvent);
              setSelectedStop({
                arrivalId: arrival.id,
                stopId: routeStop.id,
              });
            },
          }}
        >
          {selectedStopId === routeStop.id ? (
            <Tooltip
              permanent
              interactive
              direction="left"
              offset={[-12, 0]}
              opacity={1}
              className="tracking-stop-tooltip"
            >
              <Link
                to="/stops/$id"
                params={{ id: routeStop.id }}
                className="tracking-stop-tooltip__link"
              >
                <span className="tracking-stop-tooltip__copy">
                  <strong>{routeStop.name}</strong>
                  <small>{routeStop.id}</small>
                </span>
                <span className="tracking-stop-tooltip__chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </Tooltip>
          ) : null}
        </Marker>
      ))}

      {directionIndicator && directionIcon ? (
        <Marker
          position={directionIndicator.position}
          icon={directionIcon}
          interactive={false}
          zIndexOffset={1800}
        />
      ) : null}

      {userLocation ? (
        <Marker
          position={userLocation}
          icon={userLocationIcon}
          title="Your location"
          alt="Your location"
          zIndexOffset={3000}
        >
          <Popup>You are here</Popup>
        </Marker>
      ) : null}

      {vehicleLocation ? (
        <Marker
          position={[vehicleLocation.lat, vehicleLocation.lng]}
          icon={vehicleIcon}
          zIndexOffset={2200}
        >
          <Popup>
            Route {arrival.route} · {arrival.headsign}
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
