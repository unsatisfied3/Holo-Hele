import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import { MapControls } from "@/components/map/MapControls";

const START: [number, number] = [21.3074, -157.8535];
const BOARD: [number, number] = [21.3047, -157.8567];
const DESTINATION: [number, number] = [21.3018, -157.8519];

const startIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:999px;background:#0055a5;border:3px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destinationIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:999px;background:#fff;border:4px solid #0055a5"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitDirections() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds([START, BOARD, DESTINATION], {
      paddingTopLeft: [48, 72],
      paddingBottomRight: [48, 120],
      maxZoom: 16,
    });
  }, [map]);

  return null;
}

export function DirectionsMap({ showControls = true }: { showControls?: boolean }) {
  return (
    <MapContainer
      center={BOARD}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitDirections />
      <Polyline
        positions={[START, BOARD]}
        pathOptions={{ color: "#0055a5", weight: 4, dashArray: "7 7" }}
      />
      <Polyline
        positions={[BOARD, DESTINATION]}
        pathOptions={{ color: "#0055a5", weight: 4 }}
      />
      <Marker position={START} icon={startIcon} />
      <Marker position={BOARD} icon={destinationIcon} />
      {showControls ? (
        <MapControls center={BOARD} position="fixed" className="top-24" />
      ) : null}
    </MapContainer>
  );
}
