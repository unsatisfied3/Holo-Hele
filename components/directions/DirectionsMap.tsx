import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { MapControls } from "@/components/map/MapControls";
import {
  createBusTrackingMarkerHtml,
  createTrackingDirectionArrowHtml,
  createUserLocationMarkerHtml,
} from "@/lib/figma-icons";
import type { JourneyCoordinate, JourneyOption } from "@/types/transit";

export type DirectionsMapPhase =
  | "preview"
  | "walking"
  | "transit"
  | "final-walk";

const locationIcon = L.divIcon({
  className: "journey-user-marker",
  html: createUserLocationMarkerHtml(),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const stopIcon = L.divIcon({
  className: "journey-stop-marker",
  html: '<div style="width:18px;height:18px;border-radius:999px;background:#fff;border:4px solid #0055a5;box-shadow:0 1px 3px rgba(0,0,0,.18)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destinationIcon = L.divIcon({
  className: "journey-destination-marker",
  html: '<div style="width:24px;height:24px;border-radius:999px;background:#0055a5;border:4px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:#fff;font:700 11px Inter,sans-serif">B</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FitJourney({
  journey,
  phase,
  compact,
  riderLocation,
  vehicleLocation,
}: {
  journey: JourneyOption;
  phase: DirectionsMapPhase;
  compact: boolean;
  riderLocation?: JourneyCoordinate | null;
  vehicleLocation?: JourneyCoordinate | null;
}) {
  const map = useMap();

  useEffect(() => {
    const positions: JourneyCoordinate[] = phase === "walking"
      ? [...journey.path.walkStart, journey.boardStop.coordinate]
      : phase === "final-walk"
        ? [...journey.path.walkEnd, journey.destination.coordinate]
        : [
          ...journey.path.walkStart,
          ...journey.path.transit,
          ...journey.path.walkEnd,
          ...(phase === "preview" && journey.dataSource === "live"
            ? journey.path.approach ?? []
            : []),
        ];

    if (riderLocation) positions.push(riderLocation);
    if (vehicleLocation) positions.push(vehicleLocation);

    map.fitBounds(positions, {
      paddingTopLeft: compact ? [24, 24] : [44, 72],
      paddingBottomRight: compact
        ? [24, 24]
        : [44, phase === "preview" ? 150 : 190],
      maxZoom:
        compact ? 14 : phase === "walking" || phase === "final-walk" ? 17 : 15,
    });
  }, [compact, journey, map, phase, riderLocation, vehicleLocation]);

  return null;
}

function busIcon(label: string) {
  return L.divIcon({
    className: "journey-bus-marker",
    html: createBusTrackingMarkerHtml(label),
    iconSize: [58, 52],
    iconAnchor: [22, 26],
  });
}

function directionRotation(
  start: JourneyCoordinate,
  end: JourneyCoordinate,
) {
  const latitudeScale = Math.cos((((start[0] + end[0]) / 2) * Math.PI) / 180);
  const deltaX = (end[1] - start[1]) * latitudeScale;
  const deltaY = -(end[0] - start[0]);
  return (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
}

function directionIcon(rotationDegrees: number) {
  return L.divIcon({
    className: "journey-direction-arrow",
    html: createTrackingDirectionArrowHtml(rotationDegrees),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function nearestPathIndex(
  path: JourneyCoordinate[],
  coordinate: JourneyCoordinate,
) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  path.forEach(([lat, lng], index) => {
    const distance =
      (lat - coordinate[0]) ** 2 + (lng - coordinate[1]) ** 2;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function remainingPathFromPosition(
  path: JourneyCoordinate[],
  position: JourneyCoordinate,
  destination: JourneyCoordinate,
): JourneyCoordinate[] {
  if (path.length === 0) return [position, destination];

  const nearestIndex = nearestPathIndex(path, position);
  const remainingPath = path.slice(nearestIndex + 1);
  const lastCoordinate = remainingPath.at(-1);
  const reachesDestination =
    lastCoordinate?.[0] === destination[0] &&
    lastCoordinate?.[1] === destination[1];

  return [
    position,
    ...remainingPath,
    ...(reachesDestination ? [] : [destination]),
  ];
}

export function DirectionsMap({
  journey,
  phase = "preview",
  showControls = true,
  compact = false,
  riderLocation,
  vehicleLocation,
  vehicleLabel,
  showDirectionArrow = true,
}: {
  journey: JourneyOption;
  phase?: DirectionsMapPhase;
  showControls?: boolean;
  compact?: boolean;
  /** Undefined retains the itinerary preview marker; null intentionally hides it. */
  riderLocation?: JourneyCoordinate | null;
  vehicleLocation?: JourneyCoordinate | null;
  vehicleLabel?: string;
  showDirectionArrow?: boolean;
}) {
  const transitSplit = vehicleLocation
    ? nearestPathIndex(journey.path.transit, vehicleLocation)
    : journey.simulation.transitPathIndex;
  const completedTransit = journey.path.transit.slice(0, transitSplit + 1);
  const remainingTransit = journey.path.transit.slice(transitSplit);
  const fallbackActivePosition: JourneyCoordinate = phase === "transit"
    ? transitSplit === 0 && journey.path.approach?.length
      ? journey.boardStop.coordinate
      : journey.simulation.transitPosition
    : phase === "walking"
      ? journey.simulation.walkingPosition
      : phase === "final-walk"
        ? journey.alightStop.coordinate
      : journey.origin.coordinate;
  const activePosition = riderLocation === null
    ? undefined
    : riderLocation ?? fallbackActivePosition;
  const activeWalkingPath =
    phase === "walking" && activePosition
      ? remainingPathFromPosition(
          journey.path.walkStart,
          activePosition,
          journey.boardStop.coordinate,
        )
      : journey.path.walkStart;
  const activeFinalWalkingPath =
    phase === "final-walk" && activePosition
      ? remainingPathFromPosition(
          journey.path.walkEnd,
          activePosition,
          journey.destination.coordinate,
        )
      : journey.path.walkEnd;
  const guidancePosition = phase === "transit"
    ? vehicleLocation ?? activePosition ?? fallbackActivePosition
    : activePosition ?? fallbackActivePosition;
  const transitDirectionIndex = Math.min(
    phase === "transit" ? transitSplit : 0,
    Math.max(journey.path.transit.length - 2, 0),
  );
  const directionStart = phase === "transit"
    ? guidancePosition
    : journey.path.transit[transitDirectionIndex] ?? journey.boardStop.coordinate;
  const directionEnd =
    journey.path.transit[transitDirectionIndex + 1] ?? journey.alightStop.coordinate;
  const directionPosition = phase === "transit"
    ? guidancePosition
    : journey.boardStop.coordinate;
  const approachPath = journey.path.approach ?? [];
  const approachIndex = vehicleLocation && approachPath.length
    ? nearestPathIndex(approachPath, vehicleLocation)
    : 0;
  const remainingApproach = vehicleLocation && approachPath.length
    ? [vehicleLocation, ...approachPath.slice(approachIndex + 1)]
    : approachPath;

  return (
    <MapContainer
      center={journey.boardStop.coordinate}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitJourney
        journey={journey}
        phase={phase}
        compact={compact}
        riderLocation={riderLocation}
        vehicleLocation={vehicleLocation}
      />

      <Polyline
        positions={activeWalkingPath}
        pathOptions={{ color: "#5b6470", weight: 4, dashArray: "6 7" }}
      />
      {phase !== "transit" && vehicleLocation && remainingApproach.length > 1 ? (
        <Polyline
          positions={remainingApproach}
          pathOptions={{ color: "#78b7ef", weight: 5 }}
        />
      ) : null}
      {phase === "transit" ? (
        <>
          {completedTransit.length > 1 ? (
            <Polyline positions={completedTransit} pathOptions={{ color: "#78b7ef", weight: 5 }} />
          ) : null}
          <Polyline positions={remainingTransit} pathOptions={{ color: "#0055a5", weight: 5 }} />
        </>
      ) : (
        <Polyline positions={journey.path.transit} pathOptions={{ color: "#0055a5", weight: 5 }} />
      )}
      <Polyline
        positions={activeFinalWalkingPath}
        pathOptions={{ color: "#5b6470", weight: 4, dashArray: "6 7" }}
      />

      <Marker position={journey.boardStop.coordinate} icon={stopIcon} title={journey.boardStop.name} />
      <Marker position={journey.alightStop.coordinate} icon={stopIcon} title={journey.alightStop.name} />
      <Marker position={journey.destination.coordinate} icon={destinationIcon} title={journey.destination.name} />
      {activePosition ? (
        <Marker position={activePosition} icon={locationIcon} title="Your location" />
      ) : null}
      {vehicleLocation ? (
        <Marker
          position={vehicleLocation}
          icon={busIcon(vehicleLabel ?? "Bus")}
          title={`Live Route ${journey.route} bus location`}
        />
      ) : phase === "preview" && journey.dataSource !== "scheduled" ? (
        <Marker
          position={journey.simulation.transitPosition}
          icon={busIcon(journey.etaMinutes != null ? `${journey.etaMinutes} min` : "Preview")}
          title={`Route ${journey.route} vehicle position`}
        />
      ) : null}
      {showDirectionArrow ? (
        <Marker
          position={directionPosition}
          icon={directionIcon(directionRotation(directionStart, directionEnd))}
          interactive={false}
          keyboard={false}
          title={`Route ${journey.route} direction`}
        />
      ) : null}

      {showControls ? (
        <MapControls
          center={journey.boardStop.coordinate}
          userLocation={activePosition}
          position="fixed"
          className="top-24"
        />
      ) : null}
    </MapContainer>
  );
}
