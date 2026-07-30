"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { useEffect } from "react";
import type { Parking } from "./page";
import "leaflet/dist/leaflet.css";

function markerState(p: Parking) {
  if (p.availableCar === 0 || p.availabilityCode === -13) return "danger";
  if ((p.availableCar !== null && p.availableCar <= 10) || p.availabilityCode === -12) return "warn";
  if (p.availableCar !== null || p.availabilityCode === -11) return "good";
  return "muted";
}

function markerLabel(p: Parking) {
  if (p.availableCar !== null) return String(p.availableCar);
  if (p.availabilityCode === -11) return "足";
  if (p.availabilityCode === -12) return "少";
  if (p.availabilityCode === -13) return "滿";
  return "—";
}

function parkingIcon(p: Parking, selected: boolean) {
  const label = markerLabel(p);
  return divIcon({
    className: "parking-marker-host",
    html: `<div class="parking-pin ${markerState(p)}${selected ? " selected" : ""}" aria-label="剩餘車位 ${label}"><span class="${label.length >= 4 ? "compact" : ""}">${label}</span></div>`,
    iconSize: [54, 64],
    iconAnchor: [27, 62],
    popupAnchor: [0, -60],
  });
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
        <Marker key={p.id} position={[p.lat!, p.lng!]} icon={parkingIcon(p, p.id === selected?.id)} eventHandlers={{ click: () => onSelect(p) }}>
          <Popup>
            <strong>{p.name}</strong><br />
            剩餘汽車位：{markerLabel(p)}
          </Popup>
        </Marker>
      ))}
      <FlyTo parking={selected} />
    </MapContainer>
  );
}
