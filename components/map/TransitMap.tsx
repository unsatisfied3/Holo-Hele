import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapControls } from "@/components/map/MapControls";
import {
  createBusStopMarkerHtml,
  createUserLocationMarkerHtml,
} from "@/lib/figma-icons";
import type { NearbyStopResult } from "@/types/transit";

interface TransitMapProps {
  center: [number, number];
  stops: NearbyStopResult[];
  selectedStopId?: string;
  userLocation?: [number, number];
  onStopSelect?: (stop: NearbyStopResult) => void;
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
  iconSize: [52, 52],
  iconAnchor: [26, 26],
});

export function TransitMap({
  center,
  stops,
  selectedStopId,
  userLocation,
  onStopSelect,
}: TransitMapProps) {
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
          title="Your location"
          alt="Your location"
          zIndexOffset={3000}
        >
          <Popup>You are here</Popup>
        </Marker>
      ) : null}

      {stops.map((stopResult) => (
        <Marker
          key={stopResult.stop.id}
          position={[stopResult.stop.lat, stopResult.stop.lng]}
          title={`${stopResult.stop.name}, stop ${stopResult.stop.id}`}
          alt={`Bus stop ${stopResult.stop.name}`}
          icon={stopResult.stop.id === selectedStopId ? selectedStopIcon : stopIcon}
          zIndexOffset={stopResult.stop.id === selectedStopId ? 1000 : 0}
          eventHandlers={{ click: () => onStopSelect?.(stopResult) }}
        />
      ))}
    </MapContainer>
  );
}
