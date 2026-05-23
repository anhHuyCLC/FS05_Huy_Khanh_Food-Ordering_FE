// hooks/useDriverSocket.ts
// WebSocket client cho tài xế — kết nối đến DriverChannel

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type DriverSocketOptions = {
  token: string;
  onConnected?: (data: any) => void;
  onNewOrder?: (order: any) => void;
  onOrderCancelled?: (data: { orderId: string }) => void;
  onEarning?: (data: { amount: number; message: string }) => void;
  onStatusAck?: (data: { status: string }) => void;
  onOrderStatusAck?: (data: { orderId: string; status: string }) => void;
  onError?: (data: { message: string }) => void;
};

export function useDriverSocket(options: DriverSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  // Bắt đầu theo dõi GPS và push lên server
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        emit("driver:location", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [emit]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const updateDriverStatus = useCallback(
    (status: "online" | "offline" | "busy") => {
      emit("driver:status", { status });
      if (status === "online") startLocationTracking();
      else if (status === "offline") stopLocationTracking();
    },
    [emit, startLocationTracking, stopLocationTracking]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: "picked_up" | "delivering" | "completed") => {
      emit("driver:order_status", { orderId, status });
    },
    [emit]
  );

  const joinOrderRoom = useCallback(
    (orderId: string) => {
      emit("driver:join_order", { orderId });
    },
    [emit]
  );

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:8000", {
      auth: { token: options.token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[DriverSocket] Connected:", socket.id);
    });

    socket.on("driver:connected", (data: any) => {
      console.log("[DriverSocket] Authenticated as driver:", data.driverProfileId);
      options.onConnected?.(data);
    });

    socket.on("driver:new_order", (order: any) => {
      options.onNewOrder?.(order);
    });

    socket.on("driver:order_cancelled", (data: any) => {
      options.onOrderCancelled?.(data);
    });

    socket.on("driver:earning", (data: any) => {
      options.onEarning?.(data);
    });

    socket.on("driver:status_ack", (data: any) => {
      options.onStatusAck?.(data);
    });

    socket.on("driver:order_status_ack", (data: any) => {
      options.onOrderStatusAck?.(data);
    });

    socket.on("driver:error", (data: any) => {
      options.onError?.(data);
      console.error("[DriverSocket] Error:", data.message);
    });

    socket.on("disconnect", () => {
      console.log("[DriverSocket] Disconnected");
      stopLocationTracking();
    });

    return () => {
      stopLocationTracking();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.token]);

  return {
    updateDriverStatus,
    updateOrderStatus,
    joinOrderRoom,
    startLocationTracking,
    stopLocationTracking,
  };
}
