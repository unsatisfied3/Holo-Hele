import { useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import type { RouteScheduleResponse } from "@/types/transit";

function createEndpointIcon(label: "A" | "B") {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;width:24px;height:24px;align-items:center;justify-content:center;border:2px solid #0055a5;border-radius:999px;background:#fff;box-shadow:0 0 0 3px #fff;color:#0055a5;font:700 12px Inter,system-ui,sans-serif">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const startIcon = createEndpointIcon("A");
const endIcon = createEndpointIcon("B");

const intermediateStopIcon = L.divIcon({
  className: "route-map__intermediate-stop",
  html: '<div style="width:8px;height:8px;border:1.5px solid #0055a5;border-radius:999px;background:#fff"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const INTERMEDIATE_STOP_MIN_ZOOM = 11;

function FitRoute({ path }: { path: RouteScheduleResponse["path"] }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(L.latLngBounds(path), {
      paddingTopLeft: [28, 28],
      paddingBottomRight: [28, 28],
    });
  }, [map, path]);

  return null;
}

function IntermediateStopMarkers({
  stops,
}: {
  stops: RouteScheduleResponse["stops"];
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  if (zoom < INTERMEDIATE_STOP_MIN_ZOOM) return null;

  return stops.slice(1, -1).map((stop) => (
    <Marker
      key={stop.id}
      position={[stop.lat, stop.lng]}
      icon={intermediateStopIcon}
      title={stop.name}
    />
  ));
}

export function RouteOverviewMap({ route }: { route: RouteScheduleResponse }) {
  const firstStop = route.stops[0];
  const lastStop = route.stops.at(-1);

  if (!firstStop || !lastStop) return null;

  return (
    <MapContainer
      center={[firstStop.lat, firstStop.lng]}
      zoom={11}
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
      aria-label={`Map of route ${route.route} from ${route.origin} to ${route.destination}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitRoute path={route.path} />
      <Polyline
        positions={route.path}
        pathOptions={{ color: "#0055a5", weight: 4 }}
      />
      <IntermediateStopMarkers stops={route.stops} />
      <Marker
        position={[firstStop.lat, firstStop.lng]}
        icon={startIcon}
        title={firstStop.name}
        zIndexOffset={1000}
      />
      <Marker
        position={[lastStop.lat, lastStop.lng]}
        icon={endIcon}
        title={lastStop.name}
        zIndexOffset={1000}
      />
    </MapContainer>
  );
}
