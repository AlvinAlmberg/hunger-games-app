"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { missionIcon } from "./missionIcon";

const DEFAULT_CENTER: [number, number] = [59.334591, 18.06324]; // Stockholm — bara en startpunkt om ingen plats finns än

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// MapContainers `center`-prop styr bara startvyn — utan detta skulle "använd
// min position" flytta markören men inte panorera kartan dit.
function Recenter({ position }: { position: [number, number] }) {
  const map = useMap();
  map.flyTo(position, map.getZoom());
  return null;
}

export default function MissionLocationPickerInner({
  initialLat,
  initialLng,
  onChange,
}: {
  initialLat: number | null;
  initialLng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<[number, number]>(
    initialLat != null && initialLng != null ? [initialLat, initialLng] : DEFAULT_CENTER
  );
  const [shouldRecenter, setShouldRecenter] = useState(false);

  function pick(lat: number, lng: number, recenter = false) {
    setPosition([lat, lng]);
    setShouldRecenter(recenter);
    onChange(lat, lng);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      pick(pos.coords.latitude, pos.coords.longitude, true);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={useMyLocation}
        className="w-fit rounded bg-neutral-700 px-3 py-1 text-xs"
      >
        📍 Använd min nuvarande position
      </button>
      <p className="text-xs text-neutral-500">Eller klicka direkt på kartan för att placera nålen.</p>
      <MapContainer
        center={position}
        zoom={16}
        style={{ height: 260, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={missionIcon} />
        <ClickHandler onPick={(lat, lng) => pick(lat, lng, false)} />
        {shouldRecenter && <Recenter position={position} />}
      </MapContainer>
    </div>
  );
}
