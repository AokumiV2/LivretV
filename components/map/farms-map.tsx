"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import Link from "next/link";
import { Farm } from "@/lib/types";
import { divIcon } from "leaflet";

const farmPinIcon = divIcon({
  className: "farm-pin-wrap",
  html: "<span class='farm-pin-dot'></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export function FarmsMap({ farms }: { farms: Farm[] }) {
  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-line">
      <MapContainer center={[50.6, 8]} zoom={4} className="h-full w-full">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {farms.map((farm) => (
          <Marker key={farm.id} position={[farm.lat, farm.lng]} icon={farmPinIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{farm.name}</p>
                <p>{farm.city}, {farm.country}</p>
                <Link href={`/app/farms/${farm.id}`}>Voir details</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
