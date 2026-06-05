import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useToast } from "../../hooks/usetoast";
import { ToastContainer } from "../../hooks/toasrContainer";
import MapView from "../../components/map/MapView";
import { Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import { mapService } from "../../services/mapService";
import { userIcon, restaurantIcon } from "../../components/map/mapIcons";
// import { useAppDispatch, useAppSelector } from "../../stores/store";

// Premium driver icon matching the mapIcons style
const driverIcon =
  typeof window !== "undefined"
    ? L.divIcon({
        className: "custom-driver-marker",
        html: `
    <div style="
      background-color: #10B981;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
      border: 2px solid white;
      font-size: 16px;
    ">
      🚴
    </div>
  `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
      })
    : null;

// Safe coordinates parsing helper
function parseCoordinates(lat: unknown, lon: unknown): [number, number] | null {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return [latitude, longitude];
}
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  Star,
  Package,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Map as MapIcon,
  BarChart3,
  Zap,
  TrendingUp,
  Activity,
  AlertCircle,
  Percent,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { PERMISSIONS } from "../../constants/permissions";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { useDriverSocket } from "../../hooks/useDriverSocket";
import {
  loadDriverDashboard,
  fetchAvailableOrdersThunk,
  fetchActiveOrdersThunk,
  fetchEarningsThunk,
  respondOrderThunk,
  optimizeRouteThunk,
  updateLocationThunk,
  setDriverStatus,
  fetchOrderHistoryThunk,
  clearHistory,
  upsertAvailableOrder,
} from "../../features/driverSlice";
import * as driverService from "../../services/driverService";
import type { DeliveryStatus, EarningsPeriod, Order } from "../../types/driver";
import React from "react";
import { Wallet, Building2, User as UserIcon, FileText, Clock3 } from "lucide-react";

// ── Biểu đồ thu nhập theo ngày (fallback khi chưa có data từ API) ─────────────
const SAMPLE_CHART: { day: string; earnings: number }[] = [
  { day: "T2", earnings: 84 },
  { day: "T3", earnings: 112 },
  { day: "T4", earnings: 98 },
  { day: "T5", earnings: 145 },
  { day: "T6", earnings: 178 },
  { day: "T7", earnings: 210 },
  { day: "CN", earnings: 164 },
];

const SECTION_LABELS: Record<string, string> = {
  overview: "driver_dashboard.nav.home",
  deliveries: "driver_dashboard.nav.deliveries",
  earnings: "driver_dashboard.nav.earnings",
  heatmap: "driver_dashboard.nav.heatmap",
  performance: "driver_dashboard.nav.performance",
  settings: "driver_dashboard.nav.settings",
  history: "driver_dashboard.nav.history",
};

const STATUS_CFG = {
  online: {
    ring: "ring-emerald-400/40",
    text: "text-emerald-600",
    label: "driver_dashboard.online",
    dot: "bg-emerald-400",
    blob: "#10b981",
    btn: "bg-emerald-500 hover:bg-emerald-400 text-white",
  },
  busy: {
    ring: "ring-amber-400/40",
    text: "text-amber-600",
    label: "driver_dashboard.busy",
    dot: "bg-amber-400",
    blob: "#f59e0b",
    btn: "bg-amber-500 hover:bg-amber-400 text-white",
  },
  offline: {
    ring: "ring-neutral-300/40",
    text: "text-neutral-500",
    label: "driver_dashboard.offline",
    dot: "bg-neutral-400",
    blob: "#6b7280",
    btn: "bg-neutral-700 hover:bg-neutral-600 text-neutral-200",
  },
} as const;

import {
  SectionDivider,
  StatCard,
  AvailableOrderCard,
  ActiveOrderCard,
  EmptyState,
  EarningPeriodFilter,
  HistorySection,
} from "../../components/driver/DriverComponents";

export default function DriverDashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const currentSection = useMemo(() => {
    const path = location.pathname
      .replace("/driver-dashboard", "")
      .replace(/^\//, "");
    return path || "overview";
  }, [location.pathname]);

  const {
    profile,
    status,
    availableOrders,
    activeOrders,
    historyLoading,
    historyHasMore,
    heatmap,
    route,
    earnings,
    locationCoords,
    loading,
    error,
    orderHistory,
  } = useAppSelector((s) => s.driver);
  // eslint-disable-next-line no-console
  console.log("[FRONTEND DEBUG] activeOrders state length:", activeOrders?.length, "list:", activeOrders, "profileId:", profile?.id);
  const token = useAppSelector(
    (s) => s.auth.token ?? localStorage.getItem("token") ?? "",
  );

  const { toasts, toast: notify, dismiss } = useToast();
  // ── NEW state ─────────────────────────────────────────────────────────────────
  const [earningPeriod, setEarningPeriod] = useState<EarningsPeriod>("week");
  // ── Wallet modal state ─────────────────────────────────────────────────────
  type WalletModalType = "deposit" | "withdraw";
  const [walletModal, setWalletModal] = useState<{ type: WalletModalType; isOpen: boolean }>({
    type: "deposit",
    isOpen: false,
  });
  // Deposit: chỉ cần step 1 (nhập số tiền) rồi mở VNPay
  const [walletAmount, setWalletAmount] = useState("");
  // Withdraw bank info
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankOwner, setBankOwner] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const historySkipRef = useRef(0);


  const navItems = [
    {
      icon: "🏠",
      label: t("driver_dashboard.nav.home"),
      path: "/driver-dashboard",
      permission: PERMISSIONS.DRIVER_PROFILE.READ,
    },
    {
      icon: "📦",
      label: t("driver_dashboard.nav.deliveries"),
      path: "/driver-dashboard/deliveries",
      permission: PERMISSIONS.ORDER.READ,
    },
    {
      icon: "💰",
      label: t("driver_dashboard.nav.earnings"),
      path: "/driver-dashboard/earnings",
      permission: PERMISSIONS.DRIVER_PROFILE.READ,
    },
    {
      icon: "🗺️",
      label: t("driver_dashboard.nav.heatmap"),
      path: "/driver-dashboard/heatmap",
      permission: PERMISSIONS.ORDER.READ,
    },
    {
      icon: "📊",
      label: t("driver_dashboard.nav.performance"),
      path: "/driver-dashboard/performance",
      permission: PERMISSIONS.DRIVER_PROFILE.READ,
    },
    {
      icon: "⚙️",
      label: t("driver_dashboard.nav.settings"),
      path: "/driver-dashboard/settings",
      permission: PERMISSIONS.DRIVER_PROFILE.UPDATE,
    },
    {
      icon: "📋",
      label: "Lịch sử",
      path: "/driver-dashboard/history",
      permission: PERMISSIONS.ORDER.READ,
    },
  ];

  // ── Socket callbacks ─────────────────────────────────────────────────────────
  const handleNewOrder = useCallback(
    (order: Order) => {
      notify.info(t("driver_dashboard.new_order_received"));

      const socketOrder = order as Partial<Order> & {
        expiresIn?: number;
        assignmentExpiresAt?: string;
        expiresAt?: string;
        orderId?: string;
      };
      const id = socketOrder.id ?? socketOrder.orderId;
      if (!id) {
        console.warn("Driver new order payload missing id/orderId", socketOrder);
        return;
      }

      const updatedOrder: Order = {
        ...order,
        id,
        status: socketOrder.status ?? "ready",
        assignmentExpiresAt:
          socketOrder.assignmentExpiresAt ??
          socketOrder.expiresAt ??
          (socketOrder.expiresIn
            ? new Date(Date.now() + socketOrder.expiresIn).toISOString()
            : undefined),
      } as Order;

      dispatch(upsertAvailableOrder(updatedOrder));
    },
    [dispatch, t, notify],
  );

  const handleOrderCancelled = useCallback((data?: { orderId?: string; message?: string }) => {
    const shortId = data?.orderId ? `#${data.orderId.slice(-6).toUpperCase()}` : "";
    notify.warning(data?.message ?? `Đơn ${shortId} đã bị huỷ bởi nhà hàng`);
    dispatch(fetchAvailableOrdersThunk());
    dispatch(fetchActiveOrdersThunk());
    dispatch(loadDriverDashboard()); // sync lại walletBalance + currentStatus
  }, [dispatch, notify]);

  const handleOrderTaken = useCallback((data?: { orderId?: string }) => {
    if (!data?.orderId) return;
    dispatch(fetchAvailableOrdersThunk());
    dispatch(fetchActiveOrdersThunk());
  }, [dispatch]);

  const handleEarning = useCallback(
    (data: { amount: number; message: string }) => {
      notify.success(data.message || t("driver_dashboard.new_earning"));
      dispatch(fetchEarningsThunk("week"));
    },
    [dispatch, t, notify],
  );

  const handleStatusAck = useCallback(
    (data: { status: string }) => {
      dispatch(setDriverStatus(data.status as "online" | "offline" | "busy"));
    },
    [dispatch],
  );

  const handleError = useCallback((data: { message: string }) => {
    notify.error(data.message);
  }, [notify]);

  const handleOrderStatusChanged = useCallback(
    (data?: { orderId?: string; status?: string }) => {
      if (data?.status === "accepted") {
        // Khi nhà hàng vừa nhận đơn, đợi event driver:new_order để tránh race condition và mất offer.
        return;
      }

      dispatch(fetchAvailableOrdersThunk());
      dispatch(fetchActiveOrdersThunk());
      if (data?.status === "ready") {
        notify.info(t("driver_dashboard.new_order_received"));
      }
    },
    [dispatch, notify, t],
  );

  const {
    updateDriverStatus,
    updateOrderStatus,
    joinOrderRoom,
    startLocationTracking,
    stopLocationTracking,
  } = useDriverSocket({
    token,
    onNewOrder: handleNewOrder,
    onOrderCancelled: handleOrderCancelled,
    onOrderTaken: handleOrderTaken,
    onEarning: handleEarning,
    onStatusAck: handleStatusAck,
    onError: handleError,
    onOrderStatusChanged: handleOrderStatusChanged,
    onDriverAssigned: useCallback(() => {
      dispatch(fetchActiveOrdersThunk());
      dispatch(fetchAvailableOrdersThunk());
    }, [dispatch]),
  });

  // ── Maps & Route State ───────────────────────────────────────────────────────
  const [activeRouteCoords, setActiveRouteCoords] = useState<
    [number, number][]
  >([]);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  // Reverse geocode driver location to show human-readable address
  const driverCoords = useMemo(
    () => parseCoordinates(locationCoords?.latitude, locationCoords?.longitude),
    [locationCoords],
  );

  useEffect(() => {
    if (!driverCoords) return;

    let cancelled = false;

    mapService
      .reverseGeocode(driverCoords[0], driverCoords[1])
      .then((addr) => {
        if (!cancelled) {
          setCurrentAddress(addr);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [driverCoords]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (driverCoords) {
      return driverCoords;
    }
    if (activeOrders.length > 0) {
      const firstActive = activeOrders[0];
      const restCoords = parseCoordinates(
        firstActive.restaurant?.latitude,
        firstActive.restaurant?.longitude,
      );
      if (restCoords) return restCoords;
      const custCoords = parseCoordinates(
        firstActive.deliveryLatitude,
        firstActive.deliveryLongitude,
      );
      if (custCoords) return custCoords;
    }
    return [16.054404, 108.202167]; // Đà Nẵng fallback
  }, [driverCoords, activeOrders]);

  // Fetch active route coordinates dynamically
  const activeOrder = activeOrders[0];

  useEffect(() => {
    let active = true;
    if (!activeOrder || !driverCoords) {
      return;
    }

    const fetchRoute = async () => {
      try {
        const order = activeOrder;
        const restCoords = parseCoordinates(
          order.restaurant?.latitude,
          order.restaurant?.longitude,
        );
        const custCoords = parseCoordinates(
          order.deliveryLatitude,
          order.deliveryLongitude,
        );

        if (!driverCoords) return;

        if (order.status === "delivering") {
          // Route: Driver -> Customer
          if (custCoords) {
            const data = await mapService.getRoute(
              driverCoords[0],
              driverCoords[1],
              custCoords[0],
              custCoords[1],
            );
            if (active && data && data.coordinates) {
              setActiveRouteCoords(data.coordinates);
            }
          }
        } else {
          // Route: Driver -> Restaurant -> Customer
          if (restCoords && custCoords) {
            const [leg1, leg2] = await Promise.all([
              mapService.getRoute(
                driverCoords[0],
                driverCoords[1],
                restCoords[0],
                restCoords[1],
              ),
              mapService.getRoute(
                restCoords[0],
                restCoords[1],
                custCoords[0],
                custCoords[1],
              ),
            ]);
            if (active) {
              const fullCoords: [number, number][] = [];
              if (leg1 && leg1.coordinates)
                fullCoords.push(...leg1.coordinates);
              if (leg2 && leg2.coordinates)
                fullCoords.push(...leg2.coordinates);
              setActiveRouteCoords(fullCoords);
            }
          } else if (restCoords) {
            const leg = await mapService.getRoute(
              driverCoords[0],
              driverCoords[1],
              restCoords[0],
              restCoords[1],
            );
            if (active && leg && leg.coordinates) {
              setActiveRouteCoords(leg.coordinates);
            }
          } else if (custCoords) {
            const leg = await mapService.getRoute(
              driverCoords[0],
              driverCoords[1],
              custCoords[0],
              custCoords[1],
            );
            if (active && leg && leg.coordinates) {
              setActiveRouteCoords(leg.coordinates);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch active route:", err);
      }
    };

    fetchRoute();
    return () => {
      active = false;
    };
  }, [activeOrder, driverCoords]);

  const displayedRouteCoords =
    activeOrders.length === 0 || !driverCoords ? [] : activeRouteCoords;

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(loadDriverDashboard());
  }, [dispatch]);

  useEffect(() => {
    if (status === "online") startLocationTracking();
    else stopLocationTracking();
  }, [status, startLocationTracking, stopLocationTracking]);

  useEffect(() => {
    activeOrders.forEach((o) => joinOrderRoom(o.id));
  }, [activeOrders, joinOrderRoom]);

  // Load history khi vào tab
  useEffect(() => {
    if (currentSection !== "history") return;
    dispatch(clearHistory());
    historySkipRef.current = 0;
    dispatch(fetchOrderHistoryThunk({ skip: 0, take: 20 }));
  }, [currentSection, dispatch]);
  //   useEffect(() => {
  //   if (profile) setProfileForm({ vehicleInfo: profile.vehicleInfo ?? "", licensePlate: profile.licensePlate ?? "", avatarUrl: profile.profile?.avatarUrl ?? "" });
  // }, [profile]);

  // Load earnings khi đổi period
  useEffect(() => {
    if (currentSection === "earnings" || currentSection === "performance")
      dispatch(fetchEarningsThunk(earningPeriod));
  }, [earningPeriod, currentSection, dispatch]);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(loadDriverDashboard());
  }, [dispatch]);

  useEffect(() => {
    if (status === "online") startLocationTracking();
    else stopLocationTracking();
  }, [status, startLocationTracking, stopLocationTracking]);

  useEffect(() => {
    activeOrders.forEach((o) => joinOrderRoom(o.id));
  }, [activeOrders, joinOrderRoom]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
      if ("message" in error && typeof error.message === "string") {
        return error.message;
      }
    }
    if (error instanceof Error) return error.message;
    return fallback;
  }

  async function refreshOrders() {
    try {
      await Promise.all([
        dispatch(fetchAvailableOrdersThunk()).unwrap(),
        dispatch(fetchActiveOrdersThunk()).unwrap(),
      ]);
    } catch (e) {
      console.error(e);
    }
  }

  function toggleStatus() {
    if (status === "busy") {
      notify.warning(t("driver_dashboard.busy_status_warning"));
      return;
    }
    updateDriverStatus(status === "online" ? "offline" : "online");
    notify.info(t("driver_dashboard.status_update_requested"));
  }

  async function handleAccept(orderId: string) {
    if (!orderId) {
      notify.error("Không xác định được mã đơn hàng.");
      return;
    }

    const order = availableOrders.find((o) => o.id === orderId);
    console.log("[handleAccept] Order state before accept:", {
      orderId,
      status: order?.status,
      assignmentExpiresAt: order?.assignmentExpiresAt,
      driverId: order?.driverId,
      currentDriverId: order?.currentDriverId,
    });

    try {
      await dispatch(
        respondOrderThunk({ orderId, action: "accepted" }),
      ).unwrap();
      joinOrderRoom(orderId);
      await refreshOrders();
      dispatch(loadDriverDashboard());
      notify.success("Đã nhận đơn hàng thành công!");
    } catch (error) {
      const message = getErrorMessage(error, t("driver_dashboard.order_accept_failed"));
      console.error("[handleAccept] Error:", { orderId, message, error });
      notify.error(message);
      await refreshOrders();
    }
  }

  async function handleReject(orderId: string) {
    if (!orderId) {
      notify.error("Không xác định được mã đơn hàng.");
      return;
    }

    try {
      await dispatch(
        respondOrderThunk({ orderId, action: "rejected" }),
      ).unwrap();
      await refreshOrders();

      notify.info("Đã từ chối đơn hàng.");
    } catch (error) {
      const message = getErrorMessage(error, t("driver_dashboard.order_reject_failed"));
      notify.error(message);
    }
  }

  async function handleExpire(orderId: string) {
    if (!orderId) {
      notify.error("Không xác định được mã đơn hàng.");
      return;
    }

    try {
      await dispatch(
        respondOrderThunk({ orderId, action: "rejected" }),
      ).unwrap();

      await refreshOrders();

      dispatch(loadDriverDashboard());

      notify.info("Đơn hàng đã hết thời gian nhận!");
    } catch (error) {
      const message = getErrorMessage(error, "Order expired handling failed");
      notify.error(message);
    }
  }

  function handleUpdateDelivery(orderId: string, newStatus: string) {
    updateOrderStatus(orderId, newStatus as DeliveryStatus);
    refreshOrders();
    if (newStatus === "completed") {
      dispatch(loadDriverDashboard());
      notify.success("Đơn hàng hoàn thành!");
    }
  }

  async function handleOptimizeRoute() {
    const ids = activeOrders.map((o) => o.id);
    if (!ids.length) {
      notify.warning(t("driver_dashboard.no_active_orders_to_optimize"));
      return;
    }
    try {
      await dispatch(optimizeRouteThunk(ids)).unwrap();

      notify.success("Tuyến đường đã được tối ưu!");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("driver_dashboard.route_optimize_failed");
      notify.error(message);
    }
  }

  async function handleUpdateLocation() {
    if (!navigator.geolocation) {
      notify.error(t("driver_dashboard.geolocation_not_supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          await dispatch(updateLocationThunk({ latitude, longitude })).unwrap();

          notify.success("Đã cập nhật vị trí!");
        } catch (error) {
          const message = error instanceof Error ? error.message : t("driver_dashboard.location_update_failed");
          notify.error(message);
        }
      },
      () => notify.error(t("driver_dashboard.location_permission_denied")),
    );
  }

  // ── Mở modal ví ────────────────────────────────────────────────────────────────
  function openWalletModal(type: "deposit" | "withdraw") {
    setWalletModal({ type, isOpen: true });
    setWalletAmount("");
    setWalletNote("");
    setBankName("");
    setBankAccount("");
    setBankOwner("");
  }

  function closeWalletModal() {
    setWalletModal((m) => ({ ...m, isOpen: false }));
  }

  // Nạp tiền qua VNPay — mở trang thanh toán
  async function handleDepositSubmit() {
    const amount = Number(walletAmount);
    if (!amount || amount <= 0) { notify.error("Số tiền không hợp lệ"); return; }
    setIsWalletLoading(true);
    try {
      const res = await driverService.requestDeposit(amount);
      if (res.success && res.data?.paymentUrl) {
        closeWalletModal();
        // Mở VNPay trong tab hiện tại — VNPay sẽ redirect về trang này sau khi thanh toán
        window.location.href = res.data.paymentUrl;
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Tạo yêu cầu thất bại");
    } finally {
      setIsWalletLoading(false);
    }
  }

  // Rút tiền
  async function handleWithdrawSubmit() {
    const amount = Number(walletAmount);
    if (!amount || amount <= 0) { notify.error("Số tiền không hợp lệ"); return; }
    if (!bankName.trim()) { notify.error("Vui lòng nhập tên ngân hàng"); return; }
    if (!bankAccount.trim()) { notify.error("Vui lòng nhập số tài khoản"); return; }
    if (!bankOwner.trim()) { notify.error("Vui lòng nhập tên chủ tài khoản"); return; }
    setIsWalletLoading(true);
    try {
      const res = await driverService.requestWithdraw(amount, bankName, bankAccount, bankOwner, walletNote || undefined);
      if (res.success) {
        notify.success(res.data?.message ?? `Yêu cầu rút ${amount.toLocaleString("vi-VN")}đ đã gửi!`);
        closeWalletModal();
        dispatch(loadDriverDashboard());
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Giao dịch thất bại");
    } finally {
      setIsWalletLoading(false);
    }
  }

  // ── Phát hiện VNPay redirect về sau khi thanh toán ví ──────────────────────
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const walletStatus = params.get("walletStatus");
    const amount = params.get("amount");

    if (walletStatus === "success") {
      notify.success(
        `🎉 Nạp tiền thành công! ${amount ? Number(amount).toLocaleString("vi-VN") + "đ" : ""} đã được cộng vào ví.`
      );
      dispatch(loadDriverDashboard()); // Refresh dashboard data to update wallet balance and codDebt
      // Xóa query params khỏi URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (walletStatus === "failed") {
      notify.error("Thanh toán VNPay thất bại hoặc bị hủy. Vui lòng thử lại.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────────

  const totalPending = availableOrders.length;
  const totalActive = activeOrders.length;
  const statusCfg =
    STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.offline;
  const sectionTitle = t(
    SECTION_LABELS[currentSection] ?? "driver_dashboard.driver_dashboard",
  );
  const firstName = profile?.profile?.fullName?.split(" ").at(-1) ?? "";
  // console.log(profile);
  return (
    <DashboardLayout
      navItems={navItems}
      role="driver"
      userName={profile?.profile?.fullName ?? "Tài xế"}
      userAvatar={profile?.profile?.fullName?.slice(0, 2).toUpperCase() ?? "TX"}
    >
      <div className="flex flex-col gap-5 pb-6">
        {/* ── Notifications ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-medium text-sky-700">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            {t("driver_dashboard.loading_dashboard")}
          </div>
        )}
        {/* ── ToastContainer (fixed top-right, outside flow) ─────────────── */}
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        {/* Redux error banner (nếu có) */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}

        {/* ── Hero header ────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl bg-neutral-950 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-orange-500 opacity-[0.15] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 left-1/4 w-36 h-36 rounded-full bg-amber-400 opacity-10 blur-2xl pointer-events-none" />
          <div className="relative z-10 px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-orange-400 mb-1">
                {sectionTitle}
              </p>
              <h1 className="text-2xl font-black text-white leading-tight">
                {firstName ? (
                  <>
                    Xin chào,{" "}
                    <span className="text-orange-400">{profile?.profile.fullName}</span> 👋
                  </>
                ) : (
                  t("driver_dashboard.welcome_driver")
                )}
              </h1>
              {profile?.profile?.phone && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {profile.profile?.phone}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleStatus}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ring-2 ${statusCfg.ring} ${statusCfg.btn}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${status !== "offline" ? "bg-white animate-pulse" : "bg-neutral-400"}`}
                />
                {t(statusCfg.label)}
              </button>
              <button
                onClick={handleUpdateLocation}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t("driver_dashboard.update_location")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("driver_dashboard.available_orders")}
            value={totalPending}
            sub={t("driver_dashboard.pending_orders")}
            accent="orange"
            icon={Package}
          />
          <StatCard
            label={t("driver_dashboard.active_orders")}
            value={totalActive}
            sub={t("driver_dashboard.on_the_way")}
            accent="sky"
            icon={Navigation}
          />
          {/* Location card — custom to handle long address strings */}
          <div className="bg-white border border-neutral-100 border-l-4 border-l-violet-500 rounded-xl p-4 flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-neutral-400 truncate">
                {t("driver_dashboard.current_location")}
              </p>
              {driverCoords ? (
                <>
                  <p
                    className={`mt-1.5 font-black text-neutral-900 leading-snug truncate ${currentAddress ? "text-sm" : "text-3xl"}`}
                  >
                    {currentAddress ??
                      `${driverCoords[0].toFixed(4)}°`}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-400 font-mono truncate">
                    {driverCoords[0].toFixed(5)},{" "}
                    {driverCoords[1].toFixed(5)}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1.5 text-3xl font-black text-neutral-900 leading-none">
                    —
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-400 truncate">
                    {t("driver_dashboard.live_tracking")}
                  </p>
                </>
              )}
            </div>
            <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <StatCard
            label={t("driver_dashboard.weekly_earnings")}
            value={
              earnings && earnings.totalEarned != null
                ? `${earnings.totalEarned.toLocaleString("vi-VN")}đ`
                : "—"
            }
            sub={`${earnings?.completedOrders ?? 0} ${t("driver_dashboard.completed_orders")}`}
            accent="emerald"
            icon={DollarSign}
          />
        </div>

        {/* ── Main content + sidebar ──────────────────────────────────────────── */}
        <div className="grid gap-5 xl:grid-cols-[1fr_272px]">
          <div className="space-y-5">
            {/* ━━ OVERVIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {currentSection === "overview" && (
              <>
                {/* Active Route Map */}
                {activeOrders.length > 0 && (
                  <div className="bg-white border border-neutral-100 rounded-2xl p-5 mb-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-emerald-500 animate-pulse" />
                          {t(
                            "driver_dashboard.active_route_map",
                            "Bản đồ lộ trình đang giao",
                          )}
                        </h2>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {t(
                            "driver_dashboard.route_desc",
                            "Theo dõi lộ trình giao hàng từ vị trí của bạn",
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeRouteCoords.length > 0 && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-mono font-bold">
                            GPS LIVE
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="relative rounded-xl overflow-hidden border border-neutral-100"
                      style={{ height: 320 }}
                    >
                      <MapView
                        center={mapCenter}
                        zoom={14}
                        className="h-full w-full"
                      >
                        {driverCoords && (
                          <Marker
                            position={driverCoords}
                            icon={driverIcon || undefined}
                          >
                            <Popup>
                              <div className="text-xs font-bold text-emerald-600">
                                Bạn (Tài xế)
                              </div>
                            </Popup>
                          </Marker>
                        )}
                        {activeOrders.map((order, index) => {
                          const restCoords = parseCoordinates(
                            order.restaurant?.latitude,
                            order.restaurant?.longitude,
                          );
                          const custCoords = parseCoordinates(
                            order.deliveryLatitude,
                            order.deliveryLongitude,
                          );
                          return (
                            <React.Fragment key={order.id || index}>
                              {restCoords && (
                                <Marker
                                  position={restCoords}
                                  icon={restaurantIcon}
                                >
                                  <Popup>
                                    <div className="text-xs">
                                      <p className="font-bold text-orange-600">
                                        {t(
                                          "driver_dashboard.restaurant",
                                          "Nhà hàng",
                                        )}
                                        : {order.restaurant.name}
                                      </p>
                                      <p className="text-[10px] text-neutral-500">
                                        {order.restaurant.address}
                                      </p>
                                    </div>
                                  </Popup>
                                </Marker>
                              )}
                              {custCoords && (
                                <Marker position={custCoords} icon={userIcon}>
                                  <Popup>
                                    <div className="text-xs">
                                      <p className="font-bold text-sky-600">
                                        {t(
                                          "driver_dashboard.customer",
                                          "Khách hàng",
                                        )}
                                        :{" "}
                                        {order.customer?.fullName ||
                                          "Người nhận"}
                                      </p>
                                      <p className="text-[10px] text-neutral-500">
                                        {order.deliveryAddress}
                                      </p>
                                    </div>
                                  </Popup>
                                </Marker>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {displayedRouteCoords.length > 0 && (
                          <Polyline
                            positions={displayedRouteCoords}
                            color="#10B981"
                            weight={4}
                            opacity={0.8}
                            dashArray="5, 8"
                          />
                        )}
                      </MapView>
                    </div>
                    {/* Active deliveries list directly on Overview */}
                    <div className="mt-5 space-y-3 border-t border-neutral-100 pt-5">
                      <SectionDivider>
                        {t("driver_dashboard.active_deliveries")}
                      </SectionDivider>
                      {activeOrders.map((o, idx) => {
                        const orderRef = o as Order & { orderId?: string };
                        const orderKey = orderRef.id ?? orderRef.orderId ?? String(idx);
                        const orderId = orderRef.id ?? orderRef.orderId ?? "";
                        return (
                          <ActiveOrderCard
                            key={orderKey}
                            order={o}
                            t={t}
                            onUpdate={(s) => handleUpdateDelivery(orderId, s)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  {/* Đơn chờ nhận */}
                  <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-neutral-900">
                          {t("driver_dashboard.quick_actions")}
                        </h2>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {t("driver_dashboard.manage_orders_and_route")}
                        </p>
                      </div>
                      <button
                        onClick={refreshOrders}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-50 hover:bg-orange-50 border border-neutral-200 hover:border-orange-200 px-2.5 py-1.5 text-[10px] font-bold text-neutral-600 hover:text-orange-600 transition-all"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {t("driver_dashboard.refresh")}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {availableOrders.length > 0 ? (
                        availableOrders
                          .slice(0, 3)
                          .map((o) => (
                            <AvailableOrderCard
                              key={o.id}
                              order={o}
                              t={t}
                              onAccept={() => handleAccept(o.id)}
                              onReject={() => handleReject(o.id)}
                              onExpire={() => handleExpire(o.id)}
                            />
                          ))
                      ) : (
                        <EmptyState
                          icon={Package}
                          text={t("driver_dashboard.no_pending_orders")}
                        />
                      )}
                    </div>
                  </div>

                  {/* Tối ưu lộ trình */}
                  <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-neutral-900">
                          {t("driver_dashboard.route_optimization")}
                        </h2>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {t("driver_dashboard.optimize_multiple_deliveries")}
                        </p>
                      </div>
                      <button
                        onClick={handleOptimizeRoute}
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        {t("driver_dashboard.optimize")}
                      </button>
                    </div>
                    {route.length > 0 ? (
                      <div className="space-y-2">
                        {route.map((item, idx) => (
                          <div
                            key={item.orderId}
                            className="flex items-center gap-2 rounded-lg border border-neutral-100 hover:border-sky-200 bg-neutral-50 hover:bg-sky-50/50 p-2.5 transition-all"
                          >
                            <div className="w-5 h-5 shrink-0 rounded-md bg-sky-600 text-white text-[9px] font-black flex items-center justify-center">
                              {item.sequence}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-neutral-800 truncate">
                                {item.restaurant.name}
                              </p>
                              <p className="text-[9px] text-neutral-400 truncate">
                                {item.customer?.address}
                              </p>
                            </div>
                            {idx < route.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-neutral-300 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={MapIcon}
                        text={t("driver_dashboard.no_route_yet")}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ━━ DELIVERIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {currentSection === "deliveries" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                  <SectionDivider>
                    {t("driver_dashboard.pending_orders")}
                  </SectionDivider>
                  <div className="space-y-3">
                    {availableOrders.length > 0 ? (
                      availableOrders.map((o, idx) => {
                        const orderRef = o as Order & { orderId?: string };
                        const orderKey = orderRef.id ?? orderRef.orderId ?? String(idx);
                        const orderId = orderRef.id ?? orderRef.orderId ?? "";
                        return (
                          <AvailableOrderCard
                            key={orderKey}
                            order={o}
                            t={t}
                            onAccept={() => handleAccept(orderId)}
                            onReject={() => handleReject(orderId)}
                            onExpire={() => handleExpire(orderId)}
                          />
                        );
                      })
                    ) : (
                      <EmptyState
                        icon={Package}
                        text={t("driver_dashboard.no_pending_orders")}
                      />
                    )}
                  </div>
                </div>
                <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                  <SectionDivider>
                    {t("driver_dashboard.active_deliveries")}
                  </SectionDivider>
                  <div className="space-y-3">
                    {activeOrders.length > 0 ? (
                      activeOrders.map((o, idx) => {
                        const orderRef = o as Order & { orderId?: string };
                        const orderKey = orderRef.id ?? orderRef.orderId ?? String(idx);
                        const orderId = orderRef.id ?? orderRef.orderId ?? "";
                        return (
                          <ActiveOrderCard
                            key={orderKey}
                            order={o}
                            t={t}
                            onUpdate={(s) => handleUpdateDelivery(orderId, s)}
                          />
                        );
                      })
                    ) : (
                      <EmptyState
                        icon={Navigation}
                        text={t("driver_dashboard.no_active_deliveries")}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ━━ HEATMAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {currentSection === "heatmap" && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <MapIcon className="w-4 h-4 text-red-500" />
                      <h2 className="text-sm font-bold text-neutral-900">
                        {t("driver_dashboard.demand_heatmap")}
                      </h2>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      {t("driver_dashboard.heatmap_description")}
                    </p>
                  </div>
                  <button
                    onClick={refreshOrders}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t("driver_dashboard.refresh")}
                  </button>
                </div>
                <div className="grid gap-4 lg:grid-cols-[0.55fr_1.45fr]">
                  {/* Zone list */}
                  <div className="space-y-2">
                    {heatmap.length > 0 ? (
                      heatmap.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-neutral-100 hover:border-red-200 p-3 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-neutral-800">
                                {item.name ?? `Zone ${idx + 1}`}
                              </p>
                              {item.address && (
                                <p className="text-[9px] text-neutral-400 truncate">
                                  {item.address}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black">
                              {Math.round(item.weight * 10)}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-1">
                            <div
                              className="bg-linear-to-r from-red-500 to-orange-400 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, item.weight * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={MapIcon}
                        text={t("driver_dashboard.no_heatmap_data")}
                      />
                    )}
                  </div>
                  {/* Visual map */}
                  <div
                    className="relative rounded-xl overflow-hidden border border-neutral-100"
                    style={{ minHeight: 320 }}
                  >
                    <MapView
                      center={mapCenter}
                      zoom={13}
                      className="h-full w-full"
                    >
                      {driverCoords && (
                        <Marker
                          position={driverCoords}
                          icon={driverIcon || undefined}
                        >
                          <Popup>
                            <div className="text-xs font-bold text-emerald-600">
                              Bạn (Tài xế)
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      {heatmap.map((item, idx) => {
                        const coords = parseCoordinates(
                          item.latitude,
                          item.longitude,
                        );
                        if (!coords) return null;

                        const radius = 200 + item.weight * 400;
                        const color =
                          item.weight > 0.7
                            ? "#ef4444"
                            : item.weight > 0.4
                              ? "#f97316"
                              : "#fbbf24";

                        return (
                          <Circle
                            key={idx}
                            center={coords}
                            radius={radius}
                            pathOptions={{
                              fillColor: color,
                              fillOpacity: Math.min(
                                0.6,
                                0.15 + item.weight * 0.45,
                              ),
                              color: color,
                              weight: 1,
                            }}
                          >
                            <Popup>
                              <div className="text-xs">
                                <p className="font-bold text-neutral-800">
                                  {item.name || `Khu vực ${idx + 1}`}
                                </p>
                                {item.address && (
                                  <p className="text-[10px] text-neutral-500">
                                    {item.address}
                                  </p>
                                )}
                                <p className="text-[10px] font-semibold text-red-600 mt-1">
                                  Nhu cầu: {Math.round(item.weight * 10)}/10
                                </p>
                              </div>
                            </Popup>
                          </Circle>
                        );
                      })}
                    </MapView>
                  </div>
                </div>
              </div>
            )}

            {/* ━━ EARNINGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {currentSection === "earnings" && (
              <div className="space-y-4">
                <EarningPeriodFilter
                  period={earningPeriod}
                  onChange={setEarningPeriod}
                />
                {/* ── 4 stat cards ── */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {/* Tổng thu */}
                  <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-5">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-emerald-400 opacity-10 blur-2xl" />
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-emerald-400">
                      {t("driver_dashboard.total_earned")}
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {earnings && earnings.totalEarned != null
                        ? `${earnings.totalEarned.toLocaleString("vi-VN")}đ`
                        : "—"}
                    </p>
                  </div>

                  {/* Hoa hồng bị trừ */}
                  <div className="relative overflow-hidden rounded-2xl bg-rose-950 p-5">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-rose-400 opacity-10 blur-2xl" />
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-rose-400">
                      Hoa hồng ({profile?.commissionRate ?? 0}%)
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {earnings &&
                      earnings.totalEarned != null &&
                      profile?.commissionRate != null
                        ? `-${Math.round(
                            earnings.totalEarned *
                              (Number(profile.commissionRate) / 100),
                          ).toLocaleString("vi-VN")}đ`
                        : "—"}
                    </p>
                  </div>

                  {/* Thu thực nhận */}
                  <div className="relative overflow-hidden rounded-2xl bg-sky-950 p-5">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-sky-400 opacity-10 blur-2xl" />
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-sky-400">
                      Thực nhận
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {earnings &&
                      earnings.totalEarned != null &&
                      profile?.commissionRate != null
                        ? `${Math.round(
                            earnings.totalEarned *
                              (1 - Number(profile.commissionRate) / 100),
                          ).toLocaleString("vi-VN")}đ`
                        : earnings && earnings.totalEarned != null
                          ? `${earnings.totalEarned.toLocaleString("vi-VN")}đ`
                          : "—"}
                    </p>
                  </div>

                  {/* Số dư ví & Công nợ */}
                  <div className="relative overflow-hidden rounded-2xl bg-violet-950 p-5">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-violet-400 opacity-10 blur-2xl" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-violet-400">
                          {t("driver_dashboard.wallet_balance")}
                        </p>
                        <p className="mt-2 text-3xl font-black text-white">
                          {profile
                            ? `${Number(profile.walletBalance).toLocaleString("vi-VN")}đ`
                            : "—"}
                        </p>
                      </div>
                      {(profile?.codDebt ?? 0) > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-red-400">
                            Công nợ COD
                          </p>
                          <p className="mt-2 text-lg font-black text-red-400">
                            -{Number(profile!.codDebt).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2 relative z-10">
                      <button
                        onClick={() => openWalletModal("deposit")}
                        className="flex-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1.5 text-xs font-bold transition-all"
                      >
                        Nạp tiền
                      </button>
                      <button
                        onClick={() => openWalletModal("withdraw")}
                        className="flex-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 py-1.5 text-xs font-bold transition-all"
                      >
                        Rút tiền
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Công thức hoa hồng ── */}
                {profile?.commissionRate != null &&
                  earnings &&
                  earnings.totalEarned != null && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                      <Percent className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Tổng thu{" "}
                        <strong className="font-semibold">
                          {earnings.totalEarned.toLocaleString("vi-VN")}đ
                        </strong>{" "}
                        × {profile.commissionRate}% hoa hồng ={" "}
                        <strong className="font-semibold">
                          {Math.round(
                            earnings.totalEarned *
                              (Number(profile.commissionRate) / 100),
                          ).toLocaleString("vi-VN")}
                          đ
                        </strong>{" "}
                        → Thực nhận{" "}
                        <strong className="font-semibold text-emerald-700">
                          {Math.round(
                            earnings.totalEarned *
                              (1 - Number(profile.commissionRate) / 100),
                          ).toLocaleString("vi-VN")}
                          đ
                        </strong>
                      </span>
                    </div>
                  )}

                {/* ── Giao dịch gần đây ── */}
                <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                  <SectionDivider>
                    {t("driver_dashboard.recent_transactions")}
                  </SectionDivider>
                  <div className="space-y-1">
                    {(earnings?.transactions.length ?? 0) > 0 ? (
                      earnings!.transactions.slice(0, 8).map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3 rounded-lg hover:bg-neutral-50 px-2 py-2 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                              <DollarSign className="w-3 h-3 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-neutral-800 truncate">
                                {tx.description}
                              </p>
                              <p className="text-[9px] text-neutral-400">
                                {new Date(tx.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs font-black text-emerald-600 shrink-0">
                            +{Number(tx.amount).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={DollarSign}
                        text={t("driver_dashboard.no_transactions_yet")}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ━━ PERFORMANCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {currentSection === "performance" && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-sm font-bold text-neutral-900">
                        {t("driver_dashboard.performance")}
                      </h2>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {t("driver_dashboard.performance_description")}
                    </p>
                  </div>
                  <button
                    onClick={handleOptimizeRoute}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-[10px] font-bold text-white transition-colors"
                  >
                    <TrendingUp className="w-3 h-3" />
                    {t("driver_dashboard.optimize")}
                  </button>
                </div>

                {/* Chart */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 mb-5">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={SAMPLE_CHART} barCategoryGap="30%">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E0E7FF"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{
                          fontSize: 10,
                          fill: "#6366F1",
                          fontWeight: 600,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#6366F1" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}k`}
                      />
                      <Tooltip
                        formatter={(v) => [
                          v ? `${v}k đ` : "—",
                          t("driver_dashboard.nav.earnings"),
                        ]}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #E0E7FF",
                          background: "#fff",
                          fontSize: 11,
                        }}
                        cursor={{ fill: "rgba(99,102,241,0.05)" }}
                      />
                      <Bar
                        dataKey="earnings"
                        fill="#10B981"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Route list */}
                <SectionDivider>
                  {t("driver_dashboard.next_route")} ({route.length})
                </SectionDivider>
                {route.length > 0 ? (
                  <div className="space-y-2">
                    {route.slice(0, 5).map((item, idx) => (
                      <div
                        key={item.orderId}
                        className="flex items-center gap-2 rounded-lg border border-neutral-100 hover:border-sky-200 bg-neutral-50 hover:bg-sky-50/50 p-2.5 transition-all"
                      >
                        <div className="w-5 h-5 shrink-0 rounded-md bg-sky-600 text-white text-[9px] font-black flex items-center justify-center">
                          {item.sequence}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-neutral-800 truncate">
                            {item.restaurant.name}
                          </p>
                          <p className="text-[9px] text-neutral-400 truncate">
                            {item.customer?.address}
                          </p>
                        </div>
                        {idx < Math.min(route.length - 1, 4) && (
                          <ArrowRight className="w-3 h-3 text-neutral-300 shrink-0" />
                        )}
                      </div>
                    ))}
                    {route.length > 5 && (
                      <p className="text-[9px] text-center text-neutral-400 py-1">
                        +{route.length - 5} more
                      </p>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={Navigation}
                    text={t("driver_dashboard.no_route_yet")}
                  />
                )}
              </div>
            )}

            {/* ━━ SETTINGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {currentSection === "history" && (
              <HistorySection
                orders={orderHistory}
                loading={historyLoading}
                hasMore={historyHasMore}
                onLoadMore={() => {
                  historySkipRef.current += 20;
                  dispatch(
                    fetchOrderHistoryThunk({
                      skip: historySkipRef.current,
                      take: 20,
                    }),
                  );
                }}
              />
            )}
            {currentSection === "settings" && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                <SectionDivider>Driver Profile</SectionDivider>
                <div className="grid gap-3 sm:grid-cols-2 mb-3">
                  {[
                    {
                      label: t("driver_dashboard.full_name"),
                      value: profile?.profile?.fullName,
                    },
                    {
                      label: t("driver_dashboard.phone"),
                      value: profile?.profile?.phone,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-neutral-100 bg-neutral-50 p-4"
                    >
                      <p className="text-[9px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                        {label}
                      </p>
                      <p className="text-sm font-bold text-neutral-900">
                        {value ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                      Vehicle
                    </p>
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {profile?.vehicleInfo ?? profile?.licensePlate ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                    <p className="text-[9px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                      {t("driver_dashboard.current_status")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${statusCfg.dot} ${status !== "offline" ? "animate-pulse" : ""}`}
                      />
                      <p
                        className={`text-sm font-bold capitalize ${statusCfg.text}`}
                      >
                        {t(statusCfg.label)}
                      </p>
                    </div>
                  </div>
                  {/* Rating & stats */}
                  {profile && (
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                      <p className="text-[9px] font-bold tracking-widest uppercase text-neutral-400 mb-2">
                        Stats
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          {
                            label: "Rating",
                            value: `${Number(profile.rating ?? 0).toFixed(1)}★`,
                          },
                          {
                            label: "Balance",
                            value: `${Number(profile.walletBalance ?? 0).toLocaleString("vi-VN")}đ`,
                          },
                          {
                            label: "Rate",
                            value: `${profile.commissionRate ?? 0}%`,
                          },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[9px] text-neutral-400">
                              {label}
                            </p>
                            <p className="text-xs font-bold text-neutral-800">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────────────── */}
          <aside className="space-y-4">
            {/* Status card */}
            <div className="relative rounded-2xl bg-neutral-950 overflow-hidden p-5">
              <div
                className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 blur-2xl"
                style={{ background: statusCfg.blob }}
              />
              <p className="text-[8px] font-bold tracking-[0.25em] uppercase text-neutral-500 mb-1">
                {t("driver_dashboard.current_status")}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`w-2 h-2 rounded-full ${statusCfg.dot} ${status !== "offline" ? "animate-pulse" : ""}`}
                />
                <p className="text-xl font-black text-white">
                  {t(statusCfg.label)}
                </p>
              </div>
              <p className="text-xs text-neutral-400">
                {status === "online" ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {t("driver_dashboard.ready_for_orders")}
                  </span>
                ) : status === "busy" ? (
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-amber-400 animate-pulse" />
                    {t("driver_dashboard.delivering_orders")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {t("driver_dashboard.offline_status_help")}
                  </span>
                )}
              </p>
            </div>

            {/* Location card */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin className="w-3.5 h-3.5 text-violet-600" />
                <h3 className="text-xs font-bold text-neutral-900">
                  {t("driver_dashboard.my_location")}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-2.5">
                  <p className="text-[8px] uppercase tracking-widest text-neutral-400 font-bold">
                    Coordinates
                  </p>
                  <p className="text-[10px] font-mono text-neutral-700 mt-0.5">
                    {driverCoords
                      ? `${driverCoords[0].toFixed(4)}, ${driverCoords[1].toFixed(4)}`
                      : t("driver_dashboard.no_location_record")}
                  </p>
                </div>
                <div className="rounded-lg border border-sky-100 bg-sky-50 p-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-sky-600 font-bold">
                      Active
                    </p>
                    <p className="text-lg font-black text-sky-900 leading-tight">
                      {activeOrders.length}
                    </p>
                  </div>
                  <Navigation className="w-6 h-6 text-sky-300" />
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-4 divide-y divide-neutral-100">
              {[
                {
                  icon: Star,
                  color: "text-amber-500",
                  label: "Rating",
                  value:
                    earnings?.rating != null
                      ? `${Number(earnings.rating).toFixed(1)}★`
                      : "—",
                  vc: "text-amber-600",
                },
                {
                  icon: CheckCircle,
                  color: "text-emerald-500",
                  label: "Hoàn thành",
                  value: earnings?.completedOrders ?? 0,
                  vc: "text-emerald-600",
                },
                {
                  icon: Percent,
                  color: "text-violet-500",
                  label: "Hoa hồng",
                  value:
                    earnings?.commissionRate != null
                      ? `${earnings.commissionRate}%`
                      : "—",
                  vc: "text-violet-600",
                },
                {
                  icon: Activity,
                  color: "text-orange-500",
                  label: "Đơn chờ",
                  value: totalPending,
                  vc: "text-orange-600",
                },
              ].map(({ icon: Icon, color, label, value, vc }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 px-1"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs text-neutral-600 font-medium">
                      {label}
                    </span>
                  </div>
                  <span className={`text-xs font-black ${vc}`}>{value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* ══ Wallet Modal ══════════════════════════════════════════════════════════ */}
      {walletModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* ── DEPOSIT MODAL ── */}
            {walletModal.type === "deposit" && (
              <>
                {/* Header */}
                <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-500 px-6 pt-6 pb-8">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
                  <button onClick={closeWalletModal} className="absolute top-4 right-4 text-white/70 hover:text-white text-lg leading-none">✕</button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-emerald-200">Ví tài xế</p>
                      <h3 className="text-lg font-black text-white">Nạp tiền vào ví</h3>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                    <span className="text-[10px] text-emerald-100">⚡ Tự động qua VNPay — tiền vào ví ngay sau khi thanh toán</span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Số tiền nạp (VNĐ)</label>
                    <input
                      type="number"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder="Tối thiểu 10.000đ"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    {/* Quick amounts */}
                    <div className="flex gap-2 mt-2">
                      {[50000, 100000, 200000, 500000].map((v) => (
                        <button key={v} onClick={() => setWalletAmount(String(v))}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${walletAmount === String(v) ? "bg-emerald-500 text-white border-emerald-500" : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-emerald-300"}`}>
                          {v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VNPay info box */}
                  <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                        <span className="text-white text-[10px] font-black">VNP</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Thanh toán qua VNPay</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">Hỗ trợ quét QR ngân hàng, ATM, tài khoản VNPay. Tiền cộng vào ví <strong>ngay lập tức</strong> sau khi thanh toán thành công.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={closeWalletModal} className="flex-1 py-3 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all">Hủy</button>
                    <button onClick={handleDepositSubmit} disabled={isWalletLoading || !walletAmount || Number(walletAmount) <= 0}
                      className="flex-1 py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-2">
                      {isWalletLoading ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tạo link...</>
                      ) : (
                        <>⚡ Thanh toán qua VNPay</>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}


            {/* ── WITHDRAW MODAL ── */}
            {walletModal.type === "withdraw" && (
              <>
                {/* Header */}
                <div className="relative bg-gradient-to-br from-violet-700 to-violet-500 px-6 pt-6 pb-8">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
                  <button onClick={closeWalletModal} className="absolute top-4 right-4 text-white/70 hover:text-white text-lg leading-none">✕</button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-violet-200">Ví tài xế</p>
                      <h3 className="text-lg font-black text-white">Rút tiền từ ví</h3>
                    </div>
                  </div>
                  {profile && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                      <span className="text-[9px] font-bold text-violet-200 uppercase tracking-wider">Số dư khả dụng:</span>
                      <span className="text-sm font-black text-white">{Number(profile.walletBalance).toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Số tiền rút (VNĐ)</label>
                    <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder="Tối thiểu 50.000đ"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                    {/* Quick amounts */}
                    <div className="flex gap-2 mt-2">
                      {[100000, 200000, 500000, 1000000].map((v) => (
                        <button key={v} onClick={() => setWalletAmount(String(v))}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${walletAmount === String(v) ? "bg-violet-500 text-white border-violet-500" : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-violet-300"}`}>
                          {v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Thông tin tài khoản nhận tiền
                    </p>
                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                      placeholder="Tên ngân hàng (VD: MB Bank, Vietcombank...)"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                    <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Số tài khoản"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-mono" />
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input type="text" value={bankOwner} onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
                        placeholder="TÊN CHỦ TÀI KHOẢN (viết hoa)"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-mono uppercase" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      <FileText className="inline w-3 h-3 mr-1" />Ghi chú (tùy chọn)
                    </label>
                    <input type="text" value={walletNote} onChange={(e) => setWalletNote(e.target.value)}
                      placeholder="Lý do rút tiền..."
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                    <Clock3 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700">Yêu cầu sẽ được admin xử lý trong <strong>1–24 giờ</strong>. Số dư sẽ bị giữ sau khi duyệt.</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={closeWalletModal} className="flex-1 py-3 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all">Hủy</button>
                    <button onClick={handleWithdrawSubmit}
                      disabled={isWalletLoading || !walletAmount || Number(walletAmount) <= 0 || !bankName || !bankAccount || !bankOwner}
                      className="flex-1 py-3 text-xs font-bold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all">
                      {isWalletLoading ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
