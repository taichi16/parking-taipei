"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { Parking } from "./page";
import "leaflet/dist/leaflet.css";

function color(p: Parking) {
  if (p.availableCar === 0 || p.availabilityCode === -13) return "#e1593f";
  if ((p.availableCar !== null && p.availableCar <= 10) || p.availabilityCode === -12) return "#f1a53a";
  if (p.availableCar !== null || p.availabilityCode === -11) return "#178c6a";
  return "#88908c";
}

function FlyTo({ parking }: { parking: Parking | null }) {
  const map = useMap();
  useEffect(() => {
    if (parking?.lat && parking?.lng) map.flyTo([parking.lat, parking.lng], 16);
  }, [parking, map]);
  return null;
}

export default function ParkingMap({ parks, selected, onSelect }: { parks: Parking[]; selected: Parking | null; onSelect: (p: Parking) => void }) {
  return (
    <MapContainer center={[25.0478, 121.5319]} zoom={12} scrollWheelZoom className="map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {parks.map((p) => (
        <CircleMarker key={p.id} center={[p.lat!, p.lng!]} radius={p.id === selected?.id ? 11 : 8} pathOptions={{ color: "#fff", weight: 2, fillColor: color(p), fillOpacity: 1 }} eventHandlers={{ click: () => onSelect(p) }}>
          <Popup><strong>{p.name}</strong><br />汽車空位：{p.availableCar ?? "依現場資訊"}</Popup>
        </CircleMarker>
      ))}
      <FlyTo parking={selected} />
    </MapContainer>
  );
}
