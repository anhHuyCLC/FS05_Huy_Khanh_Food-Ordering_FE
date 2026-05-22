import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Resolve Leaflet marker icon asset paths broken by bundlers
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Premium DIV Icons matching rich UI theme
export const restaurantIcon = L.divIcon({
  className: "custom-restaurant-marker",
  html: `
    <div style="
      background-color: #FF4500;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(255, 69, 0, 0.45);
      border: 2px solid white;
      font-size: 16px;
      transform: rotate(45deg);
    ">
      <div style="transform: rotate(-45deg);">🍔</div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

export const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `
    <div style="
      background-color: #1E90FF;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(30, 144, 255, 0.45);
      border: 2px solid white;
      font-size: 16px;
    ">
      📍
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Sub-component to programmatically pan/zoom map view
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom(), {
      animate: true,
      duration: 0.8,
    });
  }, [center, zoom, map]);
  return null;
}

// Sub-component to handle map click events
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapView({
  center,
  zoom = 14,
  children,
  onMapClick,
  className = "h-80 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100",
  style,
}: MapViewProps) {
  return (
    <div className={`relative ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeMapView center={center} zoom={zoom} />
        <MapClickHandler onMapClick={onMapClick} />
        {children}
      </MapContainer>
    </div>
  );
}
