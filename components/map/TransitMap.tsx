"use client";

import { useEffect } from "react";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapControls } from "@/components/map/MapControls";
import { createBusStopMarkerHtml } from "@/lib/figma-icons";
import type { NearbyStopResult } from "@/types/transit";

interface TransitMapProps {
  center: [number, number];
  stops: NearbyStopResult[];
  userLocation?: [number, number];
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:999px;background:#000;border:3px solid #fff"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const stopIcon = L.divIcon({
  className: "",
  html: createBusStopMarkerHtml(),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export function TransitMap({ center, stops, userLocation }: TransitMapProps) {
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
        <Marker position={userLocation} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      ) : null}

      {stops.map(({ stop }) => (
        <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={stopIcon}>
          <Popup>
            <strong>{stop.name}</strong>
            <br />
            Stop {stop.id}
            <br />
            <Link href={`/stops/${stop.id}`}>View stop</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
