import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MapPin, Navigation, Clock, Phone, CheckCircle, Star, Package, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Can } from "../../components/auth/Can";
import { useAuthStore } from "../../stores/authStore";
import { orderService } from "../../services/orderService";
import { toast } from "sonner";
import type { Order } from "../../types/order";

const demandZones = [
  { zone: "Downtown Financial", demandKey: "very_high", color: "#FF4500" },
  { zone: "University District", demandKey: "high", color: "#F59E0B" },
  { zone: "Midtown East", demandKey: "medium", color: "#10B981" },
];

export default function DriverDashboard() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [skippedOrderIds, setSkippedOrderIds] = useState<string[]>([]);
  
  // Online/Offline State loaded from LocalStorage
  const [online, setOnline] = useState<boolean>(() => {
    const saved = localStorage.getItem("driver_online");
    return saved !== null ? saved === "true" : true;
  });

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to fetch driver orders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for updates every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Handle Online toggle
  const handleToggleOnline = () => {
    const nextOnline = !online;
    setOnline(nextOnline);
    localStorage.setItem("driver_online", String(nextOnline));
    toast.success(nextOnline ? "Bạn đã trực tuyến và sẵn sàng nhận đơn!" : "Bạn đã ngoại tuyến.");
  };

  // Handle Accept Order
  const handleAccept = async (orderId: string) => {
    try {
      setAcceptingOrderId(orderId);
      await orderService.updateOrderStatus(orderId, { status: "delivering", note: "Driver accepted order" });
      toast.success("Đã nhận đơn hàng! Hãy di chuyển tới nhà hàng để lấy hàng.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể nhận đơn hàng. Có thể đơn hàng đã được nhận bởi tài xế khác.");
    } finally {
      setAcceptingOrderId(null);
    }
  };

  // Handle Skip Order (locally)
  const handleSkipOrder = (orderId: string) => {
    setSkippedOrderIds(prev => [...prev, orderId]);
    toast.info("Đã bỏ qua yêu cầu giao hàng này.");
  };

  // Handle Mark Delivered
  const handleComplete = async (orderId: string) => {
    try {
      setCompletingOrderId(orderId);
      await orderService.updateOrderStatus(orderId, { status: "completed", note: "Delivered successfully" });
      toast.success("Đơn hàng đã được giao thành công! Chúc mừng bạn.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hoàn thành đơn hàng");
    } finally {
      setCompletingOrderId(null);
    }
  };

  // Helper: check if a date string represents today
  const isToday = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Helper: Format Money
  const formatMoney = (amount: number) => {
    if (amount >= 1000) {
      return `${amount.toLocaleString("vi-VN")}đ`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Filter orders
  const completedDeliveries = orders.filter(
    (o) => o.status === "completed" && o.driverId === currentUser?.id
  );

  const activeDelivery = orders.find(
    (o) => o.status === "delivering" && o.driverId === currentUser?.id
  );

  // Available requests: status "ready" (prepared by restaurant) and no driver assigned yet
  const pendingOrders = orders.filter(
    (o) => o.status === "ready" && !o.driverId && !skippedOrderIds.includes(o.id)
  );
  const pendingOrder = pendingOrders[0];

  // Dynamic statistics calculations
  const todayEarnings = completedDeliveries
    .filter((o) => isToday(o.createdAt))
    .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  const tripsToday = completedDeliveries.filter((o) => isToday(o.createdAt)).length;

  const averageRating = "4.97★"; // Mock or default average rating
  const onlineTime = "6.2h"; // Mock online duration for today

  const stats = [
    { label: t('driver_dashboard.today_earnings'), value: formatMoney(todayEarnings), icon: DollarSign, color: "#10B981", change: todayEarnings > 0 ? "+Thực tế" : "+$0 vs avg" },
    { label: t('driver_dashboard.trips_today'), value: String(tripsToday), icon: Package, color: "#FF4500", change: `${tripsToday} chuyến hoàn thành` },
    { label: t('home.rating'), value: averageRating, icon: Star, color: "#F59E0B", change: "+0.02 tuần này" },
    { label: t('driver_dashboard.online_time'), value: onlineTime, icon: Clock, color: "#6366F1", change: "Hiệu suất 98%" },
  ];

  // Recharts: Calculate weekly earnings by grouping completed deliveries
  const getWeeklyEarningsData = () => {
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const chartData = daysOfWeek.map((day) => ({ day, earnings: 0 }));

    completedDeliveries.forEach((o) => {
      try {
        const date = new Date(o.createdAt);
        let dayIndex = date.getDay() - 1; // getDay: 0 = Sun, 1 = Mon ...
        if (dayIndex === -1) dayIndex = 6; // Sunday -> index 6
        if (dayIndex >= 0 && dayIndex < 7) {
          chartData[dayIndex].earnings += o.deliveryFee || 0;
        }
      } catch (e) {
        console.error(e);
      }
    });

    const hasEarnings = chartData.some((d) => d.earnings > 0);
    if (!hasEarnings) {
      // Fallback mock data if there are no real earnings yet
      return [
        { day: "Mon", earnings: 84 },
        { day: "Tue", earnings: 112 },
        { day: "Wed", earnings: 98 },
        { day: "Thu", earnings: 145 },
        { day: "Fri", earnings: 178 },
        { day: "Sat", earnings: 210 },
        { day: "Sun", earnings: 164 },
      ];
    }
    return chartData;
  };

  const weeklyEarningsData = getWeeklyEarningsData();

  // Navigation Setup
  const translatedNavItems = [
    { icon: "🏠", label: t('driver_dashboard.nav.home'), path: "/driver-dashboard" },
    { icon: "📦", label: t('driver_dashboard.nav.deliveries'), path: "/driver-dashboard/deliveries" },
    { icon: "💰", label: t('driver_dashboard.nav.earnings'), path: "/driver-dashboard/earnings" },
    { icon: "🗺️", label: t('driver_dashboard.nav.heatmap'), path: "/driver-dashboard/heatmap" },
    { icon: "📊", label: t('driver_dashboard.nav.performance'), path: "/driver-dashboard/performance" },
    { icon: "⚙️", label: t('driver_dashboard.nav.settings'), path: "/driver-dashboard/settings" },
  ];

  const navPermissions: Record<string, string> = {
    "/driver-dashboard": "driver:dashboard:view",
    "/driver-dashboard/deliveries": "delivery:view",
    "/driver-dashboard/earnings": "earning:view",
    "/driver-dashboard/heatmap": "delivery:heatmap:view",
    "/driver-dashboard/performance": "driver:performance:view",
    "/driver-dashboard/settings": "driver:settings:view",
  };

  const authorizedNavItems = translatedNavItems.map((item) => ({
    ...item,
    permission: navPermissions[item.path],
  }));

  // Initial Full Loading Screen
  if (loading && orders.length === 0) {
    return (
      <DashboardLayout navItems={authorizedNavItems} role="driver" userName={currentUser?.fullName || "Driver"} userAvatar="DR">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Đang tải dữ liệu tài xế...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Delivery History List
  const deliveryHistory = completedDeliveries.slice(0, 5).map((o) => ({
    id: `#${o.id.slice(0, 8).toUpperCase()}`,
    from: o.restaurant?.name || "Restaurant",
    to: o.deliveryAddress || "Customer Address",
    time: "25 min",
    earnings: formatMoney(o.deliveryFee || 0),
    rating: 5,
    status: "completed" as const,
  }));

  return (
    <DashboardLayout navItems={authorizedNavItems} role="driver" userName={currentUser?.fullName || "Driver"} userAvatar="DR">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('driver_dashboard.driver_dashboard')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {t('driver_dashboard.good_afternoon').replace('{{name}}', currentUser?.firstName || "Tài xế")}
          </p>
        </div>
        {/* Online/Offline Toggle */}
        <div
          onClick={handleToggleOnline}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer transition-all duration-300 select-none ${online ? "shadow-lg" : "bg-gray-100"}`}
          style={online ? { background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 8px 24px rgba(16,185,129,0.35)" } : {}}
        >
          <div className={`w-5 h-5 rounded-full border-2 ${online ? "border-white bg-white" : "border-gray-400 bg-gray-400"}`} />
          <span className={`font-bold text-base ${online ? "text-white" : "text-gray-500"}`}>
            {online ? t('driver_dashboard.online') : t('driver_dashboard.offline')}
          </span>
        </div>
      </div>

      {/* Pending delivery request */}
      {pendingOrder && online && !activeDelivery && (
        <div
          className="rounded-3xl p-6 mb-6 border-2 text-white overflow-hidden relative animate-in slide-in-from-top duration-300"
          style={{ background: "linear-gradient(135deg, #0F172A, #1E1040)", borderColor: "#10B981" }}
        >
          <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-green-500/10 blur-2xl" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
                <span className="text-green-400 text-sm font-bold">{t('driver_dashboard.new_delivery_request')}</span>
              </div>
              <h2 className="text-xl font-black text-white">
                {pendingOrder.restaurant?.name || "Restaurant"} → {pendingOrder.deliveryAddress || "Customer Address"}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white">{formatMoney(pendingOrder.deliveryFee || 0)}</p>
              <p className="text-gray-400 text-sm">{t('driver_dashboard.est_earnings')}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              ["2.4 km", t('driver_dashboard.distance'), MapPin],
              ["22 min", t('driver_dashboard.est_time'), Clock],
              ["4.9★", t('driver_dashboard.rest_rating'), Star],
            ].map(([val, label, Icon]: any) => (
              <div key={label} className="bg-white/10 rounded-2xl p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1 text-gray-300" />
                <p className="text-base font-bold text-white">{val}</p>
                <p className="text-gray-400 text-xs">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Can permission="delivery:approve">
              <button
                onClick={() => handleAccept(pendingOrder.id)}
                disabled={acceptingOrderId === pendingOrder.id}
                className="flex-1 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}
              >
                {acceptingOrderId === pendingOrder.id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang nhận đơn...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" /> {t('driver_dashboard.accept_delivery')}
                  </>
                )}
              </button>
            </Can>
            <button
              onClick={() => handleSkipOrder(pendingOrder.id)}
              className="flex-1 py-3.5 rounded-2xl text-gray-300 font-bold border border-white/20 hover:bg-white/10 transition-all"
            >
              {t('driver_dashboard.skip')}
            </button>
          </div>
        </div>
      )}

      {/* Active delivery */}
      {activeDelivery && (
        <div className="rounded-3xl p-5 mb-6 border border-green-200 animate-in fade-in duration-300" style={{ background: "#F0FDF4" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 text-sm font-bold">{t('driver_dashboard.active_delivery')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">
                {activeDelivery.restaurant?.name || "Restaurant"} → {activeDelivery.deliveryAddress || "Customer Address"}
              </p>
              <p className="text-sm text-gray-500">
                Order #{activeDelivery.id.slice(0, 8).toUpperCase()} · {activeDelivery.orderItems?.length || 0} {t('driver_dashboard.items')} · {formatMoney(activeDelivery.finalAmount)}
              </p>
            </div>
            <button className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Navigation className="w-5 h-5 text-green-500 animate-bounce" />
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href={`tel:${activeDelivery.customer?.phoneNumber || activeDelivery.customerPhone || ""}`}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-green-600 bg-white border border-green-200 flex items-center justify-center gap-2 hover:bg-green-50/50 transition-colors"
            >
              <Phone className="w-4 h-4" /> {t('driver_dashboard.call_customer')}
            </a>
            <Can permission="delivery:edit">
              <button
                onClick={() => handleComplete(activeDelivery.id)}
                disabled={completingOrderId === activeDelivery.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-60"
                style={{ background: "#10B981" }}
              >
                {completingOrderId === activeDelivery.id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang hoàn thành...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> {t('driver_dashboard.mark_delivered')}
                  </>
                )}
              </button>
            </Can>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{k.label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-1">{k.value}</p>
            <p className="text-xs text-gray-400">{k.change}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">{t('driver_dashboard.weekly_earnings')}</h2>
            <p className="text-sm font-bold" style={{ color: "#10B981" }}>
              {t('driver_dashboard.this_week_earnings')}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyEarningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: any) => [`$${v}`, t('driver_dashboard.nav.earnings')]} contentStyle={{ borderRadius: 12, border: "1px solid #F3F4F6" }} />
              <Bar dataKey="earnings" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Demand Heatmap */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">{t('driver_dashboard.demand_zones')}</h2>
          <div className="relative h-40 rounded-2xl overflow-hidden mb-3" style={{ background: "linear-gradient(135deg, #E8F4FD, #D1EBF6)" }}>
            {/* Heatmap dots */}
            {[
              { x: "20%", y: "30%", size: 40, color: "#FF4500", opacity: 0.6 },
              { x: "60%", y: "50%", size: 60, color: "#FF4500", opacity: 0.8 },
              { x: "75%", y: "25%", size: 35, color: "#F59E0B", opacity: 0.5 },
              { x: "35%", y: "65%", size: 45, color: "#FF4500", opacity: 0.7 },
              { x: "50%", y: "80%", size: 30, color: "#F59E0B", opacity: 0.4 },
            ].map((dot, i) => (
              <div
                key={i}
                className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: dot.x, top: dot.y,
                  width: dot.size, height: dot.size,
                  background: dot.color,
                  opacity: dot.opacity,
                  filter: "blur(8px)",
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 shadow-sm">
                <p className="text-xs font-bold text-gray-700">{t('driver_dashboard.high_demand_nearby')}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {demandZones.map((z) => (
              <div key={z.zone} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{z.zone}</span>
                <span className="font-semibold" style={{ color: z.color }}>
                  {t(`driver_dashboard.demand_levels.${z.demandKey}`) || z.demandKey}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery History */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{t('driver_dashboard.deliveries')}</h2>
            <span className="text-xs text-gray-400">Hiển thị tối đa 5 chuyến gần nhất</span>
          </div>
          <div className="divide-y divide-gray-50">
            {deliveryHistory.length > 0 ? (
              deliveryHistory.map((d) => (
                <div key={d.id} className="flex items-center gap-5 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-gray-500">{d.id}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{d.from}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {d.to}
                    </p>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-sm font-semibold text-gray-800">{d.time}</p>
                    <p className="text-xs text-gray-400">{t('driver_dashboard.duration')}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[...Array(d.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">{d.earnings}</p>
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full font-semibold">
                      ✓ {d.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                Bạn chưa hoàn thành chuyến giao hàng nào. Hãy nhận đơn để có thu nhập!
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
