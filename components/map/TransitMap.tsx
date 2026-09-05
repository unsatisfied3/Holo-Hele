import { useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { MapControls } from "@/components/map/MapControls";
import {
  createBusStopMarkerHtml,
  createCompactBusStopMarkerHtml,
  createTransitCenterMarkerHtml,
  createUserLocationMarkerHtml,
} from "@/lib/figma-icons";
import type { StopLocation } from "@/types/transit";
import { useI18n } from "@/lib/i18n";

interface TransitMapProps {
  center: [number, number];
  stops: StopLocation[];
  selectedStopId?: string;
  userLocation?: [number, number];
  onStopSelect?: (stop: StopLocation) => void;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

const userIcon = L.divIcon({
  className: "home-user-location-marker",
  html: createUserLocationMarkerHtml(),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const stopIcon = L.divIcon({
  className: "map-stop-marker",
  html: createBusStopMarkerHtml(),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const selectedStopIcon = L.divIcon({
  className: "map-stop-marker map-stop-marker--selected",
  html: createBusStopMarkerHtml(true),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const compactStopIcon = L.divIcon({
  className: "map-stop-marker map-stop-marker--compact",
  html: createCompactBusStopMarkerHtml(),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const transitCenterIcon = L.divIcon({
  className: "map-stop-marker map-stop-marker--transit-center",
  html: createTransitCenterMarkerHtml(),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// One representative public stop ID for each verified TheBus transit center.
// Multi-platform centers intentionally get one anchor to keep wide zooms calm.
const OFFICIAL_TRANSIT_CENTER_STOP_IDS = new Set([
  "428", // Ala Moana Center
  "2288", // Alapaʻi Transit Center
  "4202", // Ewa Beach Transit Center
  "4430", // Hawaiʻi Kai Transit Center / Park & Ride
  "4523", // Kalihi Transit Center
  "4416", // Kapolei Transit Center
  "4419", // Mililani Transit Center
  "4525", // Wahiawā Transit Center
  "4406", // Waiʻanae Transit Center
  "4421", // Waipahu Transit Center
]);

function StopMarkers({
  stops,
  selectedStopId,
  onStopSelect,
}: {
  stops: StopLocation[];
  selectedStopId?: string;
  onStopSelect?: (stop: StopLocation) => void;
}) {
  const { t } = useI18n();
  const [, setViewportRevision] = useState(0);
  const map = useMapEvents({
    moveend: () => setViewportRevision((revision) => revision + 1),
    zoomend: () => setViewportRevision((revision) => revision + 1),
    resize: () => setViewportRevision((revision) => revision + 1),
  });
  const zoom = map.getZoom();

  const visibleStops = (() => {
    const bounds = map.getBounds().pad(0.08);
    const inView = stops.filter((stop) => bounds.contains([stop.lat, stop.lng]));
    if (zoom >= 16) return inView;

    const cellSize =
      zoom >= 15 ? 24 : zoom >= 14 ? 28 : zoom >= 13 ? 34 : 42;
    const occupiedCells = new Set<string>();
    const selected = inView.find((stop) => stop.id === selectedStopId);
    const transitCenters = inView.filter(
      (stop) =>
        stop.id !== selectedStopId &&
        OFFICIAL_TRANSIT_CENTER_STOP_IDS.has(stop.id),
    );
    const regularStops = inView.filter(
      (stop) =>
        stop.id !== selectedStopId &&
        !OFFICIAL_TRANSIT_CENTER_STOP_IDS.has(stop.id),
    );
    const orderedStops = selected
      ? [selected, ...transitCenters, ...regularStops]
      : [...transitCenters, ...regularStops];

    return orderedStops.filter((stop) => {
      const point = map.latLngToContainerPoint([stop.lat, stop.lng]);
      const cell = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
      if (occupiedCells.has(cell)) return false;
      occupiedCells.add(cell);
      return true;
    });
  })();

  const useCompactMarkers = zoom < 16;

  return visibleStops.map((stop) => {
    const isSelected = stop.id === selectedStopId;
    const isTransitCenter = OFFICIAL_TRANSIT_CENTER_STOP_IDS.has(stop.id);
    const icon = isSelected
      ? selectedStopIcon
      : useCompactMarkers
        ? isTransitCenter
          ? transitCenterIcon
          : compactStopIcon
        : stopIcon;
    return (
      <Marker
        key={stop.id}
        position={[stop.lat, stop.lng]}
        title={t("{name}, stop {id}", { name: stop.name, id: stop.id })}
        alt={t("Bus stop {name}", { name: stop.name })}
        icon={icon}
        zIndexOffset={isSelected ? 1000 : isTransitCenter ? 500 : 0}
        eventHandlers={{ click: () => onStopSelect?.(stop) }}
      />
    );
  });
}

export function TransitMap({
  center,
  stops,
  selectedStopId,
  userLocation,
  onStopSelect,
}: TransitMapProps) {
  const { t } = useI18n();
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
      <RecenterMap center={center} />
      <MapControls center={center} userLocation={userLocation} />

      {userLocation ? (
        <Marker
          position={userLocation}
          icon={userIcon}
          title={t("Your location")}
          alt={t("Your location")}
          zIndexOffset={3000}
        >
          <Popup>{t("You are here")}</Popup>
        </Marker>
      ) : null}

      <StopMarkers
        stops={stops}
        selectedStopId={selectedStopId}
        onStopSelect={onStopSelect}
      />
    </MapContainer>
  );
}
