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

export type DirectionsMapPhase = "preview" | "walking" | "transit";

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
}: {
  journey: JourneyOption;
  phase: DirectionsMapPhase;
  compact: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const positions = phase === "walking"
      ? [...journey.path.walkStart, journey.boardStop.coordinate]
      : [
          ...journey.path.walkStart,
          ...journey.path.transit,
          ...journey.path.walkEnd,
          ...(phase === "preview" && journey.dataSource === "live"
            ? journey.path.approach ?? []
            : []),
        ];

    map.fitBounds(positions, {
      paddingTopLeft: compact ? [24, 24] : [44, 72],
      paddingBottomRight: compact
        ? [24, 24]
        : [44, phase === "preview" ? 150 : 190],
      maxZoom: compact ? 14 : phase === "walking" ? 17 : 15,
    });
  }, [compact, journey, map, phase]);

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

export function DirectionsMap({
  journey,
  phase = "preview",
  showControls = true,
  compact = false,
}: {
  journey: JourneyOption;
  phase?: DirectionsMapPhase;
  showControls?: boolean;
  compact?: boolean;
}) {
  const transitSplit = journey.simulation.transitPathIndex;
  const completedTransit = journey.path.transit.slice(0, transitSplit + 1);
  const remainingTransit = journey.path.transit.slice(transitSplit);
  const activePosition: JourneyCoordinate = phase === "transit"
    ? transitSplit === 0 && journey.path.approach?.length
      ? journey.boardStop.coordinate
      : journey.simulation.transitPosition
    : phase === "walking"
      ? journey.simulation.walkingPosition
      : journey.origin.coordinate;
  const transitDirectionIndex = Math.min(
    phase === "transit" ? transitSplit : 0,
    Math.max(journey.path.transit.length - 2, 0),
  );
  const directionStart = phase === "transit"
    ? activePosition
    : journey.path.transit[transitDirectionIndex] ?? journey.boardStop.coordinate;
  const directionEnd =
    journey.path.transit[transitDirectionIndex + 1] ?? journey.alightStop.coordinate;
  const directionPosition = phase === "transit"
    ? activePosition
    : journey.boardStop.coordinate;

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
      <FitJourney journey={journey} phase={phase} compact={compact} />

      <Polyline
        positions={journey.path.walkStart}
        pathOptions={{ color: "#5b6470", weight: 4, dashArray: "6 7" }}
      />
      {phase !== "transit" && journey.dataSource === "live" && journey.path.approach?.length ? (
        <Polyline
          positions={journey.path.approach}
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
        positions={journey.path.walkEnd}
        pathOptions={{ color: "#5b6470", weight: 4, dashArray: "6 7" }}
      />

      <Marker position={journey.boardStop.coordinate} icon={stopIcon} title={journey.boardStop.name} />
      <Marker position={journey.alightStop.coordinate} icon={stopIcon} title={journey.alightStop.name} />
      <Marker position={journey.destination.coordinate} icon={destinationIcon} title={journey.destination.name} />
      <Marker position={activePosition} icon={locationIcon} title="Current trip position" />
      {phase === "preview" && journey.dataSource !== "scheduled" ? (
        <Marker
          position={journey.simulation.transitPosition}
          icon={busIcon(journey.etaMinutes != null ? `${journey.etaMinutes} min` : "Preview")}
          title={`Route ${journey.route} vehicle position`}
        />
      ) : null}
      <Marker
        position={directionPosition}
        icon={directionIcon(directionRotation(directionStart, directionEnd))}
        interactive={false}
        keyboard={false}
        title={`Route ${journey.route} direction`}
      />

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
