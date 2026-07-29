"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { missionIcon } from "./missionIcon";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Väntar",
  ACTIVE: "Pågår",
  COMPLETED: "Klart",
  FAILED: "Misslyckat",
};

export default function MissionsMapViewInner({ missions }: { missions: Mission[] }) {
  const located = missions.filter(
    (m): m is Mission & { latitude: number; longitude: number } =>
      m.latitude != null && m.longitude != null
  );

  if (located.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded border border-neutral-800 text-sm text-neutral-500">
        Inga uppdrag med plats utsatt än.
      </div>
    );
  }

  const center: [number, number] = [
    located.reduce((sum, m) => sum + m.latitude, 0) / located.length,
    located.reduce((sum, m) => sum + m.longitude, 0) / located.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height: 260, width: "100%", borderRadius: 8 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((m) => (
        <Marker key={m.id} position={[m.latitude, m.longitude]} icon={missionIcon}>
          <Popup>
            <strong>{m.title}</strong>
            <br />
            {STATUS_LABELS[m.status] ?? m.status}
            <br />
            <span style={{ fontSize: 12, color: "#666" }}>Frizon under uppdraget</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
