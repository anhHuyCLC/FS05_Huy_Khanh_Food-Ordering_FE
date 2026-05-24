import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Store, Bike, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, Search, Filter, Shield, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Can } from "../../components/auth/Can";
import { PERMISSIONS } from "../../constants/permissions";
import { adminService, type PendingRestaurant, type FraudAlert, type CategoryPieItem, type AdminUser, type AdminOrderItem, type SystemKPIs } from "../../services/adminService";
import { toast } from "sonner";
import { useAuthStore } from "../../stores/authStore";

const statusColors: Record<string, { color: string; bg: string }> = {
  delivered: { color: "#10B981", bg: "#F0FDF4" },
  on_way: { color: "#6366F1", bg: "#EEF2FF" },
  preparing: { color: "#F59E0B", bg: "#FFFBEB" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2" },
  completed: { color: "#10B981", bg: "#F0FDF4" },
  pending: { color: "#6366F1", bg: "#EEF2FF" },
  accepted: { color: "#F59E0B", bg: "#FFFBEB" },
  ready: { color: "#10B981", bg: "#F0FDF4" },
  delivering: { color: "#10B981", bg: "#F0FDF4" },
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [kpis, setKpis] = useState<SystemKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<CategoryPieItem[]>([]);
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [pendingRestaurants, setPendingRestaurants] = useState<PendingRestaurant[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [tab, setTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all admin data from BE APIs
  const fetchData = useCallback(async () => {
    try {
      const [kpiRes, revRes, pieRes, orderRes, restRes, fraudRes, userRes] = await Promise.all([
        adminService.getKPIs(),
        adminService.getRevenueData(),
        adminService.getCategoryPieData(),
        adminService.getOrders(),
        adminService.getPendingRestaurants(),
        adminService.getFraudAlerts(),
        adminService.getUsers(),
      ]);

      setKpis(kpiRes);
      setRevenueData(revRes);
      setPieData(pieRes);
      setOrders(orderRes);
      setPendingRestaurants(restRes);
      setFraudAlerts(fraudRes);
      setUsers(userRes);
    } catch (e) {
      console.error("Failed to load admin dashboard data", e);
      toast.error("Không thể kết nối đến API hệ thống quản trị.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleApproveRestaurant = async (id: string) => {
    try {
      await adminService.approveRestaurant(id);
      toast.success("Phê duyệt nhà hàng thành công!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể duyệt nhà hàng.");
    }
  };

  const handleRejectRestaurant = async (id: string) => {
    try {
      await adminService.rejectRestaurant(id);
      toast.success("Đã từ chối đơn ứng tuyển của nhà hàng.");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể từ chối nhà hàng.");
    }
  };

  const handleToggleUserStatus = async (email: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await adminService.updateUserStatus(email, nextStatus);
      toast.success(`Đã ${nextStatus === "suspended" ? "tạm khóa" : "mở khóa"} người dùng thành công!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể cập nhật trạng thái người dùng.");
    }
  };

  // Format Helper
  const formatMoney = (amount: number) => {
    if (amount >= 1000) {
      return `${amount.toLocaleString("vi-VN")}đ`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Nav Items
  const translatedNavItems = [
    { icon: "📊", label: t('admin.nav.dashboard'), path: "/admin" },
    { icon: "👥", label: t('admin.nav.users'), path: "/admin/users" },
    { icon: "🍴", label: t('admin.nav.restaurants'), path: "/admin/restaurants", badge: pendingRestaurants.length || undefined },
    { icon: "🚴", label: t('admin.nav.drivers'), path: "/admin/drivers" },
    { icon: "🛒", label: t('admin.nav.orders'), path: "/admin/orders" },
    { icon: "💰", label: t('admin.nav.revenue'), path: "/admin/revenue" },
    { icon: "🔍", label: t('admin.nav.fraud_detection'), path: "/admin/fraud", badge: fraudAlerts.length || undefined },
    { icon: "📢", label: t('admin.nav.community'), path: "/admin/community" },
    { icon: "⚙️", label: t('admin.nav.settings'), path: "/admin/settings" },
  ];

  const navPermissions: Record<string, string> = {
    "/admin": PERMISSIONS.ADMIN_MANAGEMENT.READ,
    "/admin/users": PERMISSIONS.USER_MANAGEMENT.READ,
    "/admin/restaurants": PERMISSIONS.ADMIN_MANAGEMENT.READ,
    "/admin/drivers": PERMISSIONS.ADMIN_MANAGEMENT.READ,
    "/admin/orders": PERMISSIONS.ADMIN_MANAGEMENT.READ,
    "/admin/revenue": PERMISSIONS.ADMIN_MANAGEMENT.READ,
    "/admin/fraud": PERMISSIONS.ADMIN_MANAGEMENT.READ,
    "/admin/community": PERMISSIONS.CHAT.READ,
    "/admin/settings": PERMISSIONS.ADMIN_MANAGEMENT.UPDATE,
  };

  const authorizedNavItems = translatedNavItems.map((item) => ({
    ...item,
    permission: navPermissions[item.path],
  }));

  // KPI Items mapping
  const kpiItems = kpis ? [
    { label: t('admin.total_revenue'), value: formatMoney(kpis.totalRevenue), icon: TrendingUp, color: "#6366F1", sub: t('admin.this_month'), change: "+18.2%", up: true },
    { label: t('admin.active_orders'), value: String(kpis.activeOrders), icon: ShoppingBag, color: "#10B981", sub: t('admin.right_now'), change: "+24", up: true },
    { label: t('admin.restaurants'), value: String(kpis.totalRestaurants), icon: Store, color: "#FF4500", sub: `${kpis.pendingRestaurants} ${t('admin.pending_approval')}`, change: `+${kpis.pendingRestaurants} mới`, up: kpis.pendingRestaurants > 0 },
    { label: t('admin.drivers_online'), value: String(kpis.driversOnline), icon: Bike, color: "#F59E0B", sub: `của ${kpis.totalDrivers} tài xế`, change: "Hoạt động", up: true },
  ] : [];

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (tab === t('admin.tabs.active') || tab === "Active") {
      return order.status === "on_way" || order.status === "preparing" || order.status === "pending" || order.status === "accepted" || order.status === "ready" || order.status === "delivering";
    }
    if (tab === t('admin.tabs.completed') || tab === "Completed") {
      return order.status === "delivered" || order.status === "completed";
    }
    return true;
  });

  // Search users
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // Full Initial Screen Loader
  if (loading && !kpis) {
    return (
      <DashboardLayout navItems={authorizedNavItems} role="admin" userName={currentUser?.fullName || "Admin"} userAvatar="AU">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Đang tải dữ liệu Dashboard Admin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={authorizedNavItems} role="admin" userName={currentUser?.fullName || "Admin"} userAvatar="AU">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('admin.admin_panel')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {t('admin.platform_overview')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200">
            <Activity className="w-4 h-4 text-purple-500 animate-pulse" />
            <span className="text-sm font-semibold text-purple-600">{t('admin.system_normal')}</span>
          </div>
          {fraudAlerts.length > 0 && (
            <button className="p-2.5 rounded-xl bg-red-50 border border-red-200 relative animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {fraudAlerts.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiItems.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">{k.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon className="w-5 h-5" style={{ color: k.color }} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-1">{k.value}</p>
            <span className={`text-xs font-semibold ${k.up ? "text-green-500" : "text-red-400"}`}>
              {k.change} {t('admin.vs_last_month')}
            </span>
          </div>
        ))}
      </div>

      {/* Main grid row 1 */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">{t('admin.platform_revenue')}</h2>
              <p className="text-xs text-gray-400">{t('admin.total_gmv')}</p>
            </div>
            <div className="flex gap-2">
              {["7M", "12M", "1Y"].map((p) => (
                <button key={p} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${p === "7M" ? "text-white" : "text-gray-400 hover:bg-gray-50"}`} style={p === "7M" ? { background: "#6366F1" } : {}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, t('admin.nav.revenue')]} contentStyle={{ borderRadius: 12, border: "1px solid #F3F4F6" }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} fill="url(#adminGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">{t('admin.orders_by_category')}</h2>
          <div className="flex items-center justify-center mb-4">
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color || "#6366F1"} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid row 2 */}
      <div className="grid lg:grid-cols-5 gap-5 mb-5">
        {/* Recent Orders Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">{t('admin.recent_orders')}</h2>
            <div className="flex gap-2">
              {[t('admin.tabs.all'), t('admin.tabs.active'), t('admin.tabs.completed')].map((tItem) => (
                <button
                  key={tItem}
                  onClick={() => setTab(tItem)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${tab === tItem ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  style={tab === tItem ? { background: "#6366F1" } : {}}
                >
                  {tItem}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  {[t('admin.table_headers.order_id'), t('admin.table_headers.customer'), t('admin.table_headers.restaurant'), t('admin.table_headers.driver'), t('admin.table_headers.amount'), t('admin.table_headers.status')].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const sc = statusColors[order.status] || { color: "#9ca3af", bg: "#f3f4f6" };
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-gray-700">{order.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.customer}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.restaurant}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.driver || "Chưa nhận"}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{order.amount}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>
                            {t(`admin.status_${order.status}`) || order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-sm text-gray-400">
                      Không tìm thấy đơn hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Pending restaurants + Fraud */}
        <div className="lg:col-span-2 space-y-5">
          {/* Pending Restaurant Approvals */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 text-sm">{t('admin.pending_restaurants')}</h2>
              {pendingRestaurants.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#FF4500]">
                  {pendingRestaurants.length}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {pendingRestaurants.length > 0 ? (
                pendingRestaurants.map((r) => (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.cuisine} · {r.city} · {r.applied}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.UPDATE}>
                        <button onClick={() => handleApproveRestaurant(r.id)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1 hover:opacity-95 transition-opacity" style={{ background: "#10B981" }}>
                          <CheckCircle className="w-3 h-3" /> {t('admin.approve')}
                        </button>
                      </Can>
                      <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.DELETE}>
                        <button onClick={() => handleRejectRestaurant(r.id)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 flex items-center justify-center gap-1 hover:bg-red-50 transition-colors">
                          <XCircle className="w-3 h-3" /> {t('admin.reject')}
                        </button>
                      </Can>
                      <button className="py-1.5 px-2.5 rounded-xl text-xs text-gray-400 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  Không có hồ sơ quán ăn cần phê duyệt.
                </div>
              )}
            </div>
          </div>

          {/* Fraud Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <h2 className="font-bold text-gray-900 text-sm">{t('admin.fraud_alerts')}</h2>
              </div>
              {fraudAlerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-500">
                  {fraudAlerts.length} {t('admin.alerts')}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {fraudAlerts.length > 0 ? (
                fraudAlerts.map((alert) => (
                  <div key={alert.id} className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{alert.type}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${alert.risk === "High" ? "bg-red-100 text-red-500" : "bg-yellow-100 text-yellow-600"}`}>
                        {alert.risk}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{alert.detail}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{alert.id} · {alert.time}</span>
                      <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.UPDATE}>
                        <button className="text-xs font-semibold text-red-500 hover:underline">{t('admin.investigate')}</button>
                      </Can>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  Hệ thống bảo mật an toàn. Không có cảnh báo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Management quick table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">{t('admin.users')}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-indigo-200 transition-colors">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.search_users')}
                className="bg-transparent text-sm outline-none text-gray-600 w-36"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" /> {t('admin.filter')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                {[t('admin.table_headers.user'), t('admin.table_headers.email'), t('admin.table_headers.role'), t('admin.table_headers.orders'), t('admin.table_headers.joined'), t('admin.table_headers.status'), t('admin.table_headers.actions')].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}>
                          {user.name[0]}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${user.role === "Driver" ? "bg-green-100 text-green-600" : user.role === "Restaurant" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{user.orders.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{user.joined}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <Can permission={PERMISSIONS.USER_MANAGEMENT.UPDATE}>
                          <button onClick={() => handleToggleUserStatus(user.email, user.status)} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 border border-red-100 hover:bg-red-50 transition-colors">
                            {user.status === "active" ? t('admin.suspend') : t('admin.restore')}
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-sm text-gray-400">
                    Không tìm thấy tài khoản người dùng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
