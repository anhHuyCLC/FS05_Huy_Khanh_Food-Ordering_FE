import { useEffect } from "react";
import { Polyline, useMap } from "react-leaflet";
import L from "leaflet";

interface DeliveryRouteProps {
  coordinates: [number, number][] | null;
}

export default function DeliveryRoute({ coordinates }: DeliveryRouteProps) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 1) {
      try {
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1.0,
        });
      } catch (err) {
        console.error("Failed to fit bounds of route:", err);
      }
    }
  }, [coordinates, map]);

  if (!coordinates || coordinates.length < 2) return null;

  return (
    <Polyline
      positions={coordinates}
      pathOptions={{
        color: "#FF4500",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
        dashArray: "2, 8", // dotted delivery line for a modern, sleek look
      }}
    />
  );
}
