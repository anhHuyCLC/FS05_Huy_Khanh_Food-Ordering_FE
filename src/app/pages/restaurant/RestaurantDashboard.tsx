import { useState, useEffect } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { orderService } from "../../services/orderService";
import type { Order } from "../../types/order";
import { toast } from "sonner";
import { revenueData, topDishes, menuCategories } from "../../data/mock";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingBag, Star, Users, Plus, Edit, Eye,  CheckCircle, XCircle, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Can } from "../../components/auth/Can";
import { PERMISSIONS } from "../../constants/permissions";

const kpis = [
  { label: "Today's Revenue", value: "$1,284", change: "+12.5%", up: true, icon: TrendingUp, color: "#FF4500" },
  { label: "Orders Today", value: "47", change: "+8%", up: true, icon: ShoppingBag, color: "#10B981" },
  { label: "Avg. Order Value", value: "$27.32", change: "-2%", up: false, icon: Users, color: "#6366F1" },
  { label: "Rating", value: "4.8 ★", change: "+0.1", up: true, icon: Star, color: "#F59E0B" },
];

// const liveOrders = [
//   { id: "#7721", customer: "Emily P.", items: "2x Burger, Fries", total: "$34.90", status: "new", time: "1 min ago" },
//   { id: "#7720", customer: "James W.", items: "1x Pizza", total: "$18.99", status: "preparing", time: "8 min ago" },
//   { id: "#7719", customer: "Priya S.", items: "3x Sushi", total: "$52.00", status: "ready", time: "15 min ago" },
//   { id: "#7718", customer: "Lucas B.", items: "1x Salad", total: "$12.99", status: "preparing", time: "20 min ago" },
//   { id: "#7717", customer: "Sophie C.", items: "2x Coffee", total: "$9.98", status: "new", time: "22 min ago" },
// ];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "New Order", color: "#6366F1", bg: "#EEF2FF" },
  accepted: { label: "Accepted", color: "#F59E0B", bg: "#FFFBEB" },
  preparing: { label: "Preparing", color: "#F59E0B", bg: "#FFFBEB" },
  ready: { label: "Ready", color: "#10B981", bg: "#F0FDF4" },
  delivering: { label: "Delivering", color: "#10B981", bg: "#F0FDF4" },
  completed: { label: "Completed", color: "#10B981", bg: "#F0FDF4" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
};

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { t } = useTranslation();
  const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001"; // Dummy test ID

  const fetchOrders = () => {
    orderService.getRestaurantOrders(RESTAURANT_ID)
      .then(data => setOrders(data))
      .catch(err => console.error("Failed to fetch restaurant orders", err));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatMoney = (amount: number | string | undefined | null) => {
    const numericAmount = Number(amount || 0);
    if (t('common.currency') === "VND") {
      if (numericAmount > 0 && numericAmount < 1000) {
        return `${(numericAmount * 25000).toLocaleString("vi-VN")}đ`;
      }
      return `${numericAmount.toLocaleString("vi-VN")}đ`;
    }
    return `$${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const translatedKpis = [
    { ...kpis[0], label: t('restaurant_dashboard.today_revenue'), value: t('restaurant_dashboard.today_revenue_val') },
    { ...kpis[1], label: t('restaurant_dashboard.orders_today') },
    { ...kpis[2], label: t('restaurant_dashboard.avg_order_value'), value: t('restaurant_dashboard.avg_order_val') },
    { ...kpis[3], label: t('home.rating') },
  ];

  const translatedNavItems = [
    { icon: "📊", label: t('restaurant_dashboard.nav.dashboard'), path: "/restaurant-dashboard" },
    { icon: "🛒", label: t('restaurant_dashboard.nav.orders'), path: "/restaurant-dashboard/orders", badge: 5 },
    { icon: "🍔", label: t('restaurant_dashboard.nav.menu'), path: "/restaurant-dashboard/menu" },
    { icon: "💰", label: t('restaurant_dashboard.nav.pricing'), path: "/restaurant-dashboard/pricing" },
    { icon: "🎯", label: t('restaurant_dashboard.nav.promotions'), path: "/restaurant-dashboard/promotions" },
    { icon: "📈", label: t('restaurant_dashboard.nav.analytics'), path: "/restaurant-dashboard/analytics" },
    { icon: "⭐", label: t('restaurant_dashboard.nav.reviews'), path: "/restaurant-dashboard/reviews" },
    { icon: "⚙️", label: t('restaurant_dashboard.nav.settings'), path: "/restaurant-dashboard/settings" },
  ];
  const navPermissions: Record<string, string> = {
    "/restaurant-dashboard": PERMISSIONS.RESTAURANT_PROFILE.READ,
    "/restaurant-dashboard/orders": PERMISSIONS.ORDER.READ,
    "/restaurant-dashboard/menu": PERMISSIONS.MENU.READ,
    "/restaurant-dashboard/pricing": PERMISSIONS.MENU.READ,
    "/restaurant-dashboard/promotions": PERMISSIONS.MENU.READ,
    "/restaurant-dashboard/analytics": PERMISSIONS.RESTAURANT_PROFILE.READ,
    "/restaurant-dashboard/reviews": PERMISSIONS.RESTAURANT_PROFILE.READ,
    "/restaurant-dashboard/settings": PERMISSIONS.RESTAURANT_PROFILE.UPDATE,
  };
  const authorizedNavItems = translatedNavItems.map((item) => ({
    ...item,
    permission: navPermissions[item.path],
  }));

  const acceptOrder = async (id: string) => {
    try {
      await orderService.updateOrderStatus(id, { status: "preparing", note: t('restaurant_dashboard.accepted_note') || "Accepted by restaurant" });
      toast.success(t('restaurant_dashboard.order_accepted_toast') || "Order accepted!");
      fetchOrders();
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || t('restaurant_dashboard.order_accept_failed_toast') || "Failed to accept order");
    }
  };

  return (
    <DashboardLayout navItems={authorizedNavItems} role="restaurant" userName="Burger Republic" userAvatar="BR">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('restaurant_dashboard.restaurant_dashboard')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString(t('common.language') === "Tiếng Việt" ? "vi-VN" : "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {t('restaurant_dashboard.live_data')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-green-600">{t('restaurant_dashboard.restaurant_open')}</span>
          </div>
          <Can permission={PERMISSIONS.MENU.CREATE}>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
              <Plus className="w-4 h-4" /> {t('restaurant_dashboard.add_item')}
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {translatedKpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{k.label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-1">{k.value}</p>
            <span className={`text-xs font-semibold ${k.up ? "text-green-500" : "text-red-500"}`}>
              {k.change} {t('restaurant_dashboard.vs_yesterday')}
            </span>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">{t('restaurant_dashboard.revenue_overview')}</h2>
            <select className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 outline-none text-gray-600">
              <option>{t('restaurant_dashboard.last_7_months')}</option>
              <option>{t('restaurant_dashboard.last_30_days')}</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4500" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF4500" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => t('common.currency') === "VND" ? `${((v * 25000)/1000000).toFixed(0)} trđ` : `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatMoney(v as number), t('restaurant_dashboard.nav.revenue')]} contentStyle={{ borderRadius: 12, border: "1px solid #F3F4F6" }} />
              <Area type="monotone" dataKey="revenue" stroke="#FF4500" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Dishes */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">{t('restaurant_dashboard.top_dishes')}</h2>
          <div className="space-y-3">
            {topDishes.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-lg font-black text-gray-300 w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.sold} {t('restaurant_dashboard.sold')} · {formatMoney(d.revenue)}</p>
                </div>
                <span className="text-xs font-bold text-green-500">{d.trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Orders + Menu */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Live Orders */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">{t('restaurant_dashboard.live_orders')}</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-500">{orders.filter((o) => o.status === "pending").length} {t('restaurant_dashboard.new_order')}</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.map((order) => {
              const cfg = statusConfig[order.status] || { label: "Unknown", color: "#9ca3af", bg: "#f3f4f6" };
              return (
                <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="text-center w-14">
                    <p className="text-xs font-bold text-gray-700">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{t('common.just_now')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{order.customer?.fullName || order.customer?.name || t('auth.customer')}</p>
                    <p className="text-xs text-gray-400 truncate">{order.orderItems?.length || 0} {t('restaurant_dashboard.items')}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">{formatMoney(order.finalAmount)}</p>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                    {t(`restaurant_dashboard.status_${order.status}`) || cfg.label}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    {order.status === "pending" && (
                      <>
                        <Can permission={PERMISSIONS.ORDER.UPDATE}>
                          <button onClick={() => acceptOrder(order.id)} className="w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </Can>
                        <Can permission={PERMISSIONS.ORDER.DELETE}>
                          <button className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </Can>
                      </>
                    )}
                    {(order.status === "accepted" || order.status === "preparing") && (
                      <button className="px-3 py-1 rounded-xl text-xs font-semibold text-white" style={{ background: "#F59E0B" }}>
                        {t('tracking.preparing')}
                      </button>
                    )}
                    {(order.status === "ready" || order.status === "completed" || order.status === "delivering") && (
                      <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                        <CheckCircle className="w-3 h-3" /> {t('common.done')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Menu Quick Edit */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">{t('restaurant_dashboard.menu_items')}</h2>
            <Can permission={PERMISSIONS.MENU.READ}>
              <button className="text-xs text-[#FF4500] font-semibold hover:underline">{t('restaurant_dashboard.manage_all')}</button>
            </Can>
          </div>
          <div className="divide-y divide-gray-50">
            {menuCategories.flatMap((c) => c.items).slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50/50 transition-colors">
                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{formatMoney(item.price)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <Can permission={PERMISSIONS.MENU.UPDATE}>
                    <button className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </Can>
                </div>
              </div>
            ))}
          </div>

          {/* Flash Sale Banner */}
          <div className="m-3 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #FFF5F0, #FFE8DC)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#FF4500]" />
              <p className="text-sm font-bold text-gray-800">{t('restaurant_dashboard.flash_sale_active')}</p>
            </div>
            <p className="text-xs text-gray-500 mb-3">{t('restaurant_dashboard.flash_sale_desc')}</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="h-full rounded-full" style={{ width: "68%", background: "#FF4500" }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('restaurant_dashboard.flash_sale_status')}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
