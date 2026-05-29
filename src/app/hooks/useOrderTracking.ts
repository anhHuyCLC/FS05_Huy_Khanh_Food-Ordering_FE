// hooks/useOrderTracking.ts
// Dành cho KHÁCH HÀNG — theo dõi vị trí tài xế và trạng thái đơn real-time

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type TrackingState = {
  driverLat: number | null;
  driverLng: number | null;
  status: string | null;
  lastUpdated: string | null;
  driverAssigned: boolean;
};

export function useOrderTracking(orderId: string, token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [tracking, setTracking] = useState<TrackingState>({
    driverLat: null,
    driverLng: null,
    status: null,
    lastUpdated: null,
    driverAssigned: false,
  });

  useEffect(() => {
    if (!orderId || !token) return;

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:8000", {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Join room theo dõi đơn này
      socket.emit("join_order_tracking", { orderId });
    });

    // Vị trí tài xế cập nhật
    socket.on("tracking:location", (data: { lat: number; lng: number; timestamp: string }) => {
      setTracking((prev) => ({
        ...prev,
        driverLat: data.lat,
        driverLng: data.lng,
        lastUpdated: data.timestamp,
      }));
    });

    // Trạng thái đơn cập nhật
    socket.on("tracking:status", (data: { status: string; timestamp: string }) => {
      setTracking((prev) => ({
        ...prev,
        status: data.status,
        lastUpdated: data.timestamp,
      }));
    });

    // Tài xế mới được gán
    socket.on("tracking:driver_assigned", () => {
      setTracking((prev) => ({ ...prev, driverAssigned: true }));
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, token]);

  return tracking;
}
