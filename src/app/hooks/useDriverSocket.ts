// hooks/useDriverSocket.ts
// WebSocket client cho tài xế — kết nối đến DriverChannel

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Order } from "../types/driver";

interface DriverConnectedData {
  driverProfileId: string;
  status: string;
}

type DriverSocketOptions = {
 onOrderStatusChanged?: (data: { orderId: string; status: string }) => void;
  onDriverAssigned?:     (data: { orderId: string }) => void;
  token: string;
  onConnected?: (data: DriverConnectedData) => void;
  onNewOrder?: (order: Order) => void;
  onOrderCancelled?: (data: { orderId: string }) => void;
  onEarning?: (data: { amount: number; message: string }) => void;
  onStatusAck?: (data: { status: string }) => void;
  onOrderStatusAck?: (data: { orderId: string; status: string }) => void;
  onError?: (data: { message: string }) => void;
};

export function useDriverSocket(options: DriverSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
useEffect(() => {
  optionsRef.current = options;
});

  const emit = useCallback((event: string, data?: unknown) => {
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
  if (!options.token) return;

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

  socket.on("connect_error", (err) => {
    console.error("[DriverSocket] Connect error:", err.message);
  });

  socket.on("driver:connected", (data: DriverConnectedData) => {
    console.log("[DriverSocket] Authenticated:", data.driverProfileId);
    optionsRef.current.onConnected?.(data);
  });

  socket.on("driver:new_order",      (order: Order) => optionsRef.current.onNewOrder?.(order));
  socket.on("driver:order_cancelled",(data: { orderId: string })  => optionsRef.current.onOrderCancelled?.(data));
  socket.on("driver:earning",        (data: { amount: number; message: string })  => optionsRef.current.onEarning?.(data));
  socket.on("driver:status_ack",     (data: { status: string })  => optionsRef.current.onStatusAck?.(data));
  socket.on("driver:order_status_ack",(data: { orderId: string; status: string }) => optionsRef.current.onOrderStatusAck?.(data));
  // MỚI: nhà hàng update trạng thái → tài xế biết ngay
    socket.on("order:status_changed",    (d) => optionsRef.current.onOrderStatusChanged?.(d));
    // MỚI: khi tài xế được assign đơn từ server
    socket.on("tracking:driver_assigned",(d) => optionsRef.current.onDriverAssigned?.(d));
  socket.on("driver:error",          (data: { message: string })  => {
    console.error("[DriverSocket] Error:", data.message);
    optionsRef.current.onError?.(data);
  });

  socket.on("disconnect", (reason) => {
    console.log("[DriverSocket] Disconnected:", reason);
    stopLocationTracking();
  });

  return () => {
    stopLocationTracking();
    socket.disconnect();
  };
}, [options.token]); // chỉ reconnect khi token thay đổi

  return {
    updateDriverStatus,
    updateOrderStatus,
    joinOrderRoom,
    startLocationTracking,
    stopLocationTracking,
  };
}
