import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import {
  Store, Bike, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, Search,
  Filter, Shield, Activity, DollarSign, Plus,
  Percent, Sliders, MessageSquare,
  Edit
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Can } from "../../components/auth/Can";
import { PERMISSIONS } from "../../constants/permissions";
import {
  adminService, type PendingRestaurant, type PendingDriver, type FraudAlert,
  type CategoryPieItem, type AdminUser, type AdminOrderItem, type SystemKPIs,
  type ActiveRestaurant, type ActiveDriver, type Announcement, type PayoutItem,
  type AdminRole
} from "../../services/adminService";
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
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [kpis, setKpis] = useState<SystemKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<CategoryPieItem[]>([]);
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [pendingRestaurants, setPendingRestaurants] = useState<PendingRestaurant[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activeRestaurants, setActiveRestaurants] = useState<ActiveRestaurant[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [tab, setTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalTab, setApprovalTab] = useState<"restaurants" | "drivers">("restaurants");

  // Dynamic Sub-section states
  const [restaurantSectionTab, setRestaurantSectionTab] = useState<"pending" | "active">("pending");
  const [driverSectionTab, setDriverSectionTab] = useState<"pending" | "active">("pending");
  const [orderSectionTab, setOrderSectionTab] = useState<string>("All");

  // Settings configs states
  const [commissionRate, setCommissionRate] = useState(15);
  const [autoAssign, setAutoAssign] = useState(true);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(15000);
  const [systemAlertsEnabled, setSystemAlertsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Community announcements state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Roles state
  const [roles, setRoles] = useState<AdminRole[]>([]);

  // Add User state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRoleIds, setNewRoleIds] = useState<string[]>([]);
  const [addingUser, setAddingUser] = useState(false);

  // Edit User state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [savingUser, setSavingUser] = useState(false);

  // Fetch all admin data from BE APIs
  const fetchData = useCallback(async () => {
    try {
      const [
        kpiRes, revRes, pieRes, orderRes, restRes, driverRes, fraudRes, userRes,
        activeRestRes, activeDriverRes, announceRes, settingsRes, payoutRes,
        rolesRes
      ] = await Promise.all([
        adminService.getKPIs(),
        adminService.getRevenueData(),
        adminService.getCategoryPieData(),
        adminService.getOrders(),
        adminService.getPendingRestaurants(),
        adminService.getPendingDrivers(),
        adminService.getFraudAlerts(),
        adminService.getUsers(),
        adminService.getActiveRestaurants(),
        adminService.getActiveDrivers(),
        adminService.getAnnouncements(),
        adminService.getSettings(),
        adminService.getPayouts(),
        adminService.getRoles(),
      ]);

      setKpis(kpiRes);
      setRevenueData(revRes);
      setPieData(pieRes);
      setOrders(orderRes);
      setPendingRestaurants(restRes);
      setPendingDrivers(driverRes);
      setFraudAlerts(fraudRes);
      setUsers(userRes);
      setActiveRestaurants(activeRestRes);
      setActiveDrivers(activeDriverRes);
      setAnnouncements(announceRes);
      setPayouts(payoutRes || []);
      setRoles(rolesRes || []);

      setCommissionRate(settingsRes.commissionRate);
      setAutoAssign(settingsRes.autoAssign);
      setBaseDeliveryFee(settingsRes.baseDeliveryFee);
      setSystemAlertsEnabled(settingsRes.systemAlertsEnabled);
      setMaintenanceMode(settingsRes.maintenanceMode);
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

  useEffect(() => {
    if (location.pathname === "/admin/drivers") {
      setApprovalTab("drivers");
    } else if (location.pathname === "/admin/restaurants") {
      setApprovalTab("restaurants");
    }
  }, [location.pathname]);

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

  const handleApproveDriver = async (id: string) => {
    try {
      await adminService.approveDriver(id);
      toast.success("Phê duyệt tài xế thành công!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể duyệt tài xế.");
    }
  };

  const handleRejectDriver = async (id: string) => {
    try {
      await adminService.rejectDriver(id);
      toast.success("Đã từ chối đơn ứng tuyển của tài xế.");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể từ chối tài xế.");
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

  // User CRUD Actions
  const handleAddUserClick = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewRoleIds([]);
    setIsAddModalOpen(true);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setAddingUser(true);
    try {
      await adminService.createUser({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        roleIds: newRoleIds,
      });
      toast.success("Thêm người dùng mới thành công!");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể tạo tài khoản người dùng.");
    } finally {
      setAddingUser(false);
    }
  };

  const handleEditUserClick = async (user: AdminUser) => {
    setEditingUserId(user.id);
    setEditFirstName("");
    setEditLastName("");
    setEditEmail(user.email);
    setEditStatus(user.status === "active" ? "ACTIVE" : "INACTIVE");
    setEditRoleIds([]);
    setIsEditModalOpen(true);

    try {
      const fullUser = await adminService.getUser(user.id);
      if (fullUser) {
        setEditFirstName(fullUser.firstName || "");
        setEditLastName(fullUser.lastName || "");
        setEditEmail(fullUser.email || user.email);
        setEditStatus(fullUser.status || "ACTIVE");
        setEditRoleIds((fullUser.roles || []).map((r: any) => r.roleId));
      }
    } catch (err) {
      console.error("Failed to load user details", err);
      const nameParts = user.name.split(" ");
      if (nameParts.length > 1) {
        setEditLastName(nameParts[0]);
        setEditFirstName(nameParts.slice(1).join(" "));
      } else {
        setEditFirstName(user.name);
      }
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setSavingUser(true);
    try {
      await adminService.updateUser(editingUserId, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        status: editStatus,
        roleIds: editRoleIds,
      });
      toast.success("Cập nhật thông tin người dùng thành công!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể cập nhật tài khoản người dùng.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUserClick = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản người dùng này không? Hành động này không thể hoàn tác.")) {
      return;
    }
    try {
      await adminService.deleteUser(userId);
      toast.success("Xóa người dùng thành công!");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa tài khoản người dùng.");
    }
  };

  // Format Helper
  const formatMoney = (amount: any) => {
    const numericAmount = Number(amount || 0);
    if (numericAmount >= 1000) {
      return `${numericAmount.toLocaleString("vi-VN")}đ`;
    }
    return `$${numericAmount.toFixed(2)}`;
  };

  // Sidebar navigation setup
  const translatedNavItems = [
    { icon: "📊", label: t('admin.nav.dashboard'), path: "/admin" },
    { icon: "👥", label: t('admin.nav.users'), path: "/admin/users" },
    { icon: "🍴", label: t('admin.nav.restaurants'), path: "/admin/restaurants", badge: pendingRestaurants.length || undefined },
    { icon: "🚴", label: t('admin.nav.drivers'), path: "/admin/drivers", badge: pendingDrivers.length || undefined },
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

  // KPI Items mapping for Overview
  const kpiItems = kpis ? [
    { label: t('admin.total_revenue'), value: formatMoney(kpis.totalRevenue), icon: TrendingUp, color: "#6366F1", sub: t('admin.this_month'), change: "+18.2%", up: true },
    { label: t('admin.active_orders'), value: String(kpis.activeOrders), icon: ShoppingBag, color: "#10B981", sub: t('admin.right_now'), change: "+24", up: true },
    { label: t('admin.restaurants'), value: String(kpis.totalRestaurants), icon: Store, color: "#FF4500", sub: `${kpis.pendingRestaurants} ${t('admin.pending_approval')}`, change: `+${kpis.pendingRestaurants} mới`, up: kpis.pendingRestaurants > 0 },
    { label: t('admin.drivers_online'), value: String(kpis.driversOnline), icon: Bike, color: "#F59E0B", sub: `của ${kpis.totalDrivers} tài xế`, change: "Hoạt động", up: true },
  ] : [];

  // Filter orders for Overview
  const filteredOrders = orders.filter((order) => {
    if (tab === t('admin.tabs.active') || tab === "Active") {
      return order.status === "on_way" || order.status === "preparing" || order.status === "pending" || order.status === "accepted" || order.status === "ready" || order.status === "delivering";
    }
    if (tab === t('admin.tabs.completed') || tab === "Completed") {
      return order.status === "delivered" || order.status === "completed";
    }
    return true;
  });

  // Search users for Overview / Users screen
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // SECTION RENDER METHODS

  // 1. Overview Section
  const renderOverview = () => {
    return (
      <>
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

        {/* Charts Row */}
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

        {/* Lists & Widget Grid */}
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

          {/* Pending Approvals + Fraud widgets */}
          <div className="lg:col-span-2 space-y-5">
            {/* Pending Approvals */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
                <div className="flex gap-2">
                  <button
                    onClick={() => setApprovalTab("restaurants")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${approvalTab === "restaurants" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    {t('admin.pending_restaurants')}
                    {pendingRestaurants.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${approvalTab === "restaurants" ? "bg-white text-orange-600" : "bg-orange-100 text-[#FF4500]"}`}>
                        {pendingRestaurants.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setApprovalTab("drivers")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${approvalTab === "drivers" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    {t('admin.pending_drivers')}
                    {pendingDrivers.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${approvalTab === "drivers" ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600"}`}>
                        {pendingDrivers.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {approvalTab === "restaurants" ? (
                  pendingRestaurants.length > 0 ? (
                    pendingRestaurants.slice(0, 3).map((r) => (
                      <div key={r.id} className="p-4 hover:bg-gray-50/20 transition-colors">
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
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-400">
                      Không có hồ sơ quán ăn cần phê duyệt.
                    </div>
                  )
                ) : (
                  pendingDrivers.length > 0 ? (
                    pendingDrivers.slice(0, 3).map((d) => (
                      <div key={d.id} className="p-4 hover:bg-gray-50/20 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-full">
                            <p className="text-sm font-semibold text-gray-800">{d.fullName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">📞 {d.phone}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              <span className="font-semibold text-gray-600">{t('admin.vehicle_info')}:</span> {d.vehicleInfo} ({t('admin.license_plate')}: {d.licensePlate})
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.UPDATE}>
                            <button onClick={() => handleApproveDriver(d.id)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1 hover:opacity-95 transition-opacity" style={{ background: "#10B981" }}>
                              <CheckCircle className="w-3 h-3" /> {t('admin.approve')}
                            </button>
                          </Can>
                          <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.DELETE}>
                            <button onClick={() => handleRejectDriver(d.id)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 flex items-center justify-center gap-1 hover:bg-red-50 transition-colors">
                              <XCircle className="w-3 h-3" /> {t('admin.reject')}
                            </button>
                          </Can>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-400">
                      {t('admin.no_pending_drivers')}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Fraud Alerts Box */}
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
                {fraudAlerts.slice(0, 2).map((alert) => (
                  <div key={alert.id} className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{alert.type}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${alert.risk === "High" ? "bg-red-100 text-red-500" : "bg-yellow-100 text-yellow-600"}`}>
                        {alert.risk}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{alert.detail}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{alert.time}</span>
                      <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.UPDATE}>
                        <button onClick={() => toast.info("Khởi động quy trình điều tra bảo mật tài khoản.")} className="text-xs font-semibold text-red-500 hover:underline">{t('admin.investigate')}</button>
                      </Can>
                    </div>
                  </div>
                ))}
                {fraudAlerts.length === 0 && (
                  <div className="p-6 text-center text-sm text-gray-400">
                    Hệ thống bảo mật an toàn. Không có cảnh báo.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick User Management preview */}
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
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  {[t('admin.table_headers.user'), t('admin.table_headers.email'), t('admin.table_headers.role'), t('admin.table_headers.orders'), t('admin.table_headers.status'), t('admin.table_headers.actions')].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.slice(0, 4).map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}>
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
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Can permission={PERMISSIONS.USER_MANAGEMENT.UPDATE}>
                          <button onClick={() => handleToggleUserStatus(user.email, user.status)} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 border border-red-100 hover:bg-red-50 transition-colors">
                            {user.status === "active" ? t('admin.suspend') : t('admin.restore')}
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // 2. Users Section
  const renderUsersSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tìm kiếm tài khoản, khóa hoặc mở khóa tài khoản người dùng trên toàn hệ thống.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Tổng tài khoản</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{users.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Khách hàng</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{users.filter(u => u.role === "Customer").length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Cửa hàng & Tài xế</p>
            <p className="text-3xl font-black text-green-600 mt-1">{users.filter(u => u.role === "Restaurant" || u.role === "Driver").length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Đã khóa</p>
            <p className="text-3xl font-black text-red-500 mt-1">{users.filter(u => u.status !== "active").length}</p>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-indigo-200 transition-colors w-full md:max-w-md">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('admin.search_users')}
              className="bg-transparent text-sm outline-none text-gray-600 w-full"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" /> {t('admin.filter_results')}
            </button>
            <Can permission={PERMISSIONS.USER_MANAGEMENT.CREATE}>
              <button
                onClick={handleAddUserClick}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-95 transition-opacity"
                style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
              >
                <Plus className="w-4 h-4" /> {t('admin.add_user')}
              </button>
            </Can>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.table_headers.user')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.table_headers.email')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.table_headers.role')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Số đơn hàng</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tham gia</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.email} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 bg-indigo-500" style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}>
                            {user.name[0]}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${user.role === "Driver" ? "bg-green-100 text-green-600" : user.role === "Restaurant" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{user.orders.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.joined}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                          {user.status === "active" ? t('admin.status_active') : t('admin.status_suspended')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 items-center">
                          <button onClick={() => toast.info(`Tài khoản: ${user.name} | Lịch sử đơn hàng: ${user.orders}`)} className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <Can permission={PERMISSIONS.USER_MANAGEMENT.UPDATE}>
                            <button
                              onClick={() => handleEditUserClick(user)}
                              className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-blue-500 hover:bg-blue-100 hover:border-blue-200 transition-colors"
                              title={t('common.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </Can>
                          <Can permission={PERMISSIONS.USER_MANAGEMENT.DELETE}>
                            <button
                              onClick={() => handleDeleteUserClick(user.id)}
                              className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                              title={t('common.delete')}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </Can>
                          <Can permission={PERMISSIONS.USER_MANAGEMENT.UPDATE}>
                            <button
                              onClick={() => handleToggleUserStatus(user.email, user.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${user.status === "active"
                                ? "text-red-500 border-red-100 hover:bg-red-50"
                                : "text-green-600 border-green-100 hover:bg-green-50"
                                }`}
                            >
                              {user.status === "active" ? t('admin.suspend') : t('admin.restore')}
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-sm text-gray-400">
                      Không tìm thấy tài khoản người dùng nào khớp với từ khóa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 3. Restaurants Section
  const renderRestaurantsSection = () => {

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Quản lý nhà hàng & đối tác</h1>
            <p className="text-gray-500 text-sm mt-0.5">Phê duyệt đối tác mới đăng ký kinh doanh và kiểm tra các quán ăn hiện hữu.</p>
          </div>
          <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm shrink-0 self-start md:self-auto">
            <button
              onClick={() => setRestaurantSectionTab("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${restaurantSectionTab === "pending" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
            >
              Yêu cầu chờ duyệt ({pendingRestaurants.length})
            </button>
            <button
              onClick={() => setRestaurantSectionTab("active")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${restaurantSectionTab === "active" ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
            >
              Đang hoạt động ({activeRestaurants.length})
            </button>
          </div>
        </div>

        {restaurantSectionTab === "pending" ? (
          pendingRestaurants.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRestaurants.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                        {r.cuisine}
                      </span>
                      <span className="text-xs text-gray-400">{r.applied}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">{r.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Chủ sở hữu: <span className="font-semibold">{r.owner}</span></p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">📍 {r.city}</p>
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50">
                    <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.UPDATE}>
                      <button
                        onClick={() => handleApproveRestaurant(r.id)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" /> Duyệt đơn
                      </button>
                    </Can>
                    <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.DELETE}>
                      <button
                        onClick={() => handleRejectRestaurant(r.id)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối
                      </button>
                    </Can>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 text-lg">Không có hồ sơ chờ duyệt</h3>
              <p className="text-gray-400 text-sm mt-1">Tất cả đơn xin gia nhập của nhà hàng đối tác đều đã được xử lý thành công.</p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Tên quán ăn</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Ẩm thực</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Chủ sở hữu</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Khu vực</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Đánh giá</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Tổng đơn hàng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeRestaurants.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800 text-sm">{res.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{res.cuisine}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{res.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">📍 {res.city}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-500 font-semibold">{res.rating}★</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{res.orders.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${res.status === "open" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                          {res.status === "open" ? "Mở cửa" : "Đóng cửa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => toast.success(`Đã gửi thông báo kiểm tra vận hành tới quán ${res.name}`)} className="text-xs font-bold text-indigo-600 hover:underline">Liên hệ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. Drivers Section
  const renderDriversSection = () => {

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Quản lý tài xế giao hàng</h1>
            <p className="text-gray-500 text-sm mt-0.5">Duyệt thông tin đăng ký hồ sơ tài xế, CCCD và phương tiện.</p>
          </div>
          <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm shrink-0 self-start md:self-auto">
            <button
              onClick={() => setDriverSectionTab("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${driverSectionTab === "pending" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
            >
              Hồ sơ chờ duyệt ({pendingDrivers.length})
            </button>
            <button
              onClick={() => setDriverSectionTab("active")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${driverSectionTab === "active" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
            >
              Tài xế đang hoạt động ({activeDrivers.length})
            </button>
          </div>
        </div>

        {driverSectionTab === "pending" ? (
          pendingDrivers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingDrivers.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-base">{d.fullName}</h3>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        Chờ duyệt
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600">
                      <p><span className="font-semibold text-gray-400">Số điện thoại:</span> {d.phone}</p>
                      <p><span className="font-semibold text-gray-400">Phương tiện:</span> {d.vehicleInfo}</p>
                      <p><span className="font-semibold text-gray-400">Biển kiểm soát:</span> {d.licensePlate}</p>
                      <p><span className="font-semibold text-gray-400">Bằng lái xe:</span> {d.driverLicenseNumber}</p>
                      <p><span className="font-semibold text-gray-400">Số CCCD/CMND:</span> {d.nationalIdNumber}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-50">
                    <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.UPDATE}>
                      <button
                        onClick={() => handleApproveDriver(d.id)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" /> Phê duyệt
                      </button>
                    </Can>
                    <Can permission={PERMISSIONS.ADMIN_MANAGEMENT.DELETE}>
                      <button
                        onClick={() => handleRejectDriver(d.id)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối
                      </button>
                    </Can>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Bike className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 text-lg">Không có hồ sơ chờ duyệt</h3>
              <p className="text-gray-400 text-sm mt-1">Tất cả các đăng ký làm đối tác giao hàng đều đã được xử lý xong.</p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Họ và tên</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Điện thoại</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Thông tin xe</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Biển số</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Đánh giá</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800 text-sm">{driver.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{driver.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.vehicle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{driver.plate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-500 font-semibold">{driver.rating}★</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${driver.status === "online"
                          ? "bg-green-100 text-green-600"
                          : driver.status === "busy"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-gray-100 text-gray-400"
                          }`}>
                          {driver.status === "online" ? "Đang chờ đơn" : driver.status === "busy" ? "Đang đi giao" : "Ngoại tuyến"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => toast.info(`Liên hệ tài xế ${driver.name}: ${driver.phone}`)} className="text-xs font-bold text-blue-600 hover:underline">Liên hệ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5. Orders Section
  const renderOrdersSection = () => {
    const ordersStats = {
      total: orders.length,
      active: orders.filter(o => o.status !== "delivered" && o.status !== "completed" && o.status !== "cancelled").length,
      completed: orders.filter(o => o.status === "delivered" || o.status === "completed").length,
      cancelled: orders.filter(o => o.status === "cancelled").length
    };

    const statusTabs = ["All", "Active", "Completed", "Cancelled"];

    const sectionFilteredOrders = orders.filter((order) => {
      if (orderSectionTab === "Active") {
        return order.status !== "delivered" && order.status !== "completed" && order.status !== "cancelled";
      }
      if (orderSectionTab === "Completed") {
        return order.status === "delivered" || order.status === "completed";
      }
      if (orderSectionTab === "Cancelled") {
        return order.status === "cancelled";
      }
      return true;
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý đơn hàng toàn quốc</h1>
          <p className="text-gray-500 text-sm mt-0.5">Theo dõi chi tiết các giao dịch mua hàng trên hệ thống thời gian thực.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Tổng số đơn</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{ordersStats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Đang giao/chuẩn bị</p>
            <p className="text-3xl font-black text-indigo-600 mt-1">{ordersStats.active}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Đã giao thành công</p>
            <p className="text-3xl font-black text-green-600 mt-1">{ordersStats.completed}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Đã hủy</p>
            <p className="text-3xl font-black text-red-500 mt-1">{ordersStats.cancelled}</p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
          {statusTabs.map((st) => (
            <button
              key={st}
              onClick={() => setOrderSectionTab(st)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${orderSectionTab === st ? "bg-[#6366F1] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {st === "All" ? "Tất cả" : st === "Active" ? "Đang xử lý" : st === "Completed" ? "Hoàn thành" : "Đã hủy"}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.table_headers.order_id')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.table_headers.customer')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.table_headers.restaurant')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.table_headers.driver')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Trị giá</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sectionFilteredOrders.length > 0 ? (
                  sectionFilteredOrders.map((order) => {
                    const sc = statusColors[order.status] || { color: "#9ca3af", bg: "#f3f4f6" };
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-700">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.restaurant}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.driver || "Chưa nhận"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{order.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold" style={{ background: sc.bg, color: sc.color }}>
                            {t(`admin.status_${order.status}`) || order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => toast.info(`Đơn ${order.id} từ ${order.restaurant} giao cho ${order.customer}. Tổng giá trị ${order.amount}.`)}
                            className="text-xs font-bold text-[#6366F1] hover:underline"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-sm text-gray-400">
                      Không tìm thấy đơn hàng nào ở bộ lọc này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 6. Revenue Section
  const renderRevenueSection = () => {
    // Generate some comparison bar chart data
    const barChartData = revenueData.map((item) => ({
      name: item.month,
      GMV: item.revenue,
      Revenue: Math.round(item.revenue * (commissionRate / 100)),
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Phân tích doanh thu & tài chính</h1>
          <p className="text-gray-500 text-sm mt-0.5">Dữ liệu doanh số nền tảng, phí dịch vụ đối tác và chi tiết tài chính.</p>
        </div>

        {/* Financial KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Tổng GMV giao dịch</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{formatMoney(kpis?.totalRevenue || 0)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6366F1] shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Thu nhập dịch vụ (15%)</p>
              <p className="text-2xl font-black text-green-600 mt-1">{formatMoney((kpis?.totalRevenue || 0) * 0.15)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Giá trị đơn trung bình</p>
              <p className="text-2xl font-black text-gray-900 mt-1">$22.50</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Tăng trưởng</p>
              <p className="text-2xl font-black text-blue-600 mt-1">+18.2%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Charts block */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Area Chart */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Biểu đồ doanh thu hàng tháng</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F9FAFB" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" fill="#EEF2FF" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume comparison bar chart */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Tỷ lệ tăng trưởng GMV & Lợi nhuận</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F9FAFB" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="GMV" fill="#818CF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Chi tiết giao dịch gần đây</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Mã GD</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Loại giao dịch</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Ngày tạo</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Số tiền</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.length > 0 ? (
                  payouts.map((pay) => (
                    <tr key={pay.id} className="hover:bg-gray-50/20">
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-700">{pay.id}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600 font-semibold">{pay.type}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-400">{pay.date}</td>
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-800">{pay.amount}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">
                          {pay.status === "completed" ? "Thành công" : pay.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-sm text-gray-400">
                      Không có giao dịch nào gần đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 7. Fraud Section
  const renderFraudSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Giám sát bảo mật & Phòng chống gian lận</h1>
          <p className="text-gray-500 text-sm mt-0.5">Trí tuệ nhân tạo (AI) quét hệ thống thời gian thực để ngăn chặn hành vi phi pháp.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Cảnh báo chưa xử lý</p>
            <p className="text-3xl font-black text-red-500 mt-1">{fraudAlerts.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Rủi ro cao (High)</p>
            <p className="text-3xl font-black text-red-600 mt-1">
              {fraudAlerts.filter(a => a.risk === "High").length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Rủi ro trung bình (Medium)</p>
            <p className="text-3xl font-black text-amber-500 mt-1">
              {fraudAlerts.filter(a => a.risk === "Medium").length}
            </p>
          </div>
        </div>

        {/* Detailed Fraud List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" /> Nhật ký cảnh báo bảo mật
            </h3>
            <span className="text-xs text-gray-400">Hệ thống cập nhật tự động</span>
          </div>

          <div className="divide-y divide-gray-100">
            {fraudAlerts.length > 0 ? (
              fraudAlerts.map((alert) => (
                <div key={alert.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-red-50/5 transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${alert.risk === "High" ? "bg-red-100 text-red-600 border border-red-200" : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        }`}>
                        {alert.risk === "High" ? "Mức độ: Cao" : "Mức độ: Trung bình"}
                      </span>
                      <span className="text-xs text-gray-400">Mã sự kiện: {alert.id}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-base">{alert.type}</h4>
                    <p className="text-sm text-gray-600">{alert.detail}</p>
                    <p className="text-xs text-gray-400 pt-1">Thời gian phát hiện: {alert.time}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => toast.success(`Đã đánh dấu sự kiện ${alert.id} an toàn. Khóa cảnh báo.`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={() => toast.success(`Khởi động thanh tra tài khoản liên quan đến sự kiện ${alert.id}.`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Thanh tra tài khoản
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400 text-sm">
                Không ghi nhận bất kỳ hoạt động đáng ngờ nào trong 24 giờ qua.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 8. Settings Section
  const renderSettingsSection = () => {
    const handleSaveSettings = async () => {
      try {
        await adminService.updateSettings({
          commissionRate,
          autoAssign,
          baseDeliveryFee,
          systemAlertsEnabled,
          maintenanceMode
        });
        toast.success("Lưu cấu hình hệ thống thành công!");
        fetchData();
      } catch (err) {
        toast.error("Không thể lưu cấu hình hệ thống.");
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Cấu hình tham số hệ thống</h1>
          <p className="text-gray-500 text-sm mt-0.5">Thay đổi biểu phí hoa hồng dịch vụ, cấu hình thanh toán và bảo trì.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* General configs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" /> Phí dịch vụ & Cước vận chuyển
            </h3>

            {/* Commission slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-600">Hoa hồng nền tảng từ đối tác</span>
                <span className="text-indigo-600 font-bold">{commissionRate}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-gray-400 block">Áp dụng trực tiếp vào tổng tiền thanh toán mỗi đơn hàng của đối tác liên kết.</span>
            </div>

            {/* Base pay */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 block">Cước vận chuyển cơ bản (tài xế)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={baseDeliveryFee}
                  onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 text-gray-800 font-bold"
                />
                <span className="px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-400 border border-gray-200 flex items-center justify-center">VNĐ / km</span>
              </div>
              <span className="text-[10px] text-gray-400 block">Cước phí giao hàng ban đầu tối thiểu cho tài xế trong phạm vi 2km.</span>
            </div>
          </div>

          {/* Operation switches */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" /> Thiết lập vận hành AI
            </h3>

            <div className="space-y-4">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Tự động điều phối tài xế</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-0.5">Sử dụng thuật toán AI tự động tìm tài xế gần quán ăn nhất trong vòng 30 giây.</p>
                </div>
                <button
                  onClick={() => setAutoAssign(!autoAssign)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${autoAssign ? "bg-green-500 justify-end" : "bg-gray-200 justify-start"}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Bật quét bảo mật tài khoản</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-0.5">Tự động phát cảnh báo gian lận khi phát hiện lượng truy cập đáng ngờ.</p>
                </div>
                <button
                  onClick={() => setSystemAlertsEnabled(!systemAlertsEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${systemAlertsEnabled ? "bg-green-500 justify-end" : "bg-gray-200 justify-start"}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Chế độ bảo trì hệ thống</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-0.5">Tạm dừng dịch vụ mua hàng để cập nhật phiên bản ứng dụng.</p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${maintenanceMode ? "bg-red-500 justify-end" : "bg-gray-200 justify-start"}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save button block */}
        <div className="flex justify-end gap-3 bg-white p-4 border border-gray-100 rounded-2xl shadow-sm">
          <button onClick={() => fetchData()} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">Hủy thay đổi</button>
          <button onClick={handleSaveSettings} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">Lưu cấu hình</button>
        </div>
      </div>
    );
  };

  // 9. Community Section
  const renderCommunitySection = () => {
    const handlePublishAnnouncement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!announcementTitle.trim() || !announcementText.trim()) {
        toast.warning("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
        return;
      }

      try {
        await adminService.createAnnouncement(announcementTitle, announcementText);
        setAnnouncementTitle("");
        setAnnouncementText("");
        toast.success("Đăng tải bản tin thông báo toàn hệ thống thành công!");
        fetchData();
      } catch (err) {
        toast.error("Không thể đăng tải thông báo.");
      }
    };

    const handleDeleteAnnouncement = async (id: number) => {
      try {
        await adminService.deleteAnnouncement(id);
        toast.success("Đã xóa bản tin thông báo.");
        fetchData();
      } catch (err) {
        toast.error("Không thể xóa thông báo.");
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Bản tin thông báo & Cộng đồng</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gửi các bản tin hoặc thông báo bảo trì, chính sách mới tới toàn bộ tài khoản đối tác và người dùng.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Creator Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
            <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-indigo-500" /> Tạo thông báo mới
            </h3>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 block">Tiêu đề thông báo</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề..."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 text-gray-800 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 block">Nội dung thông báo</label>
                <textarea
                  rows={4}
                  placeholder="Nhập nội dung thông tin chi tiết phát hành..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 text-gray-800"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Đăng thông báo
              </button>
            </form>
          </div>

          {/* List announcements */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">Bản tin đang đăng phát</h3>

            <div className="space-y-4">
              {announcements.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{post.author}</span>
                      <span className="text-xs text-gray-400">📍 {post.time}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">{post.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{post.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(post.id)}
                    className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 self-start"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Switch rendering logic based on URL pathname
  const renderContent = () => {
    switch (location.pathname) {
      case "/admin/users":
        return renderUsersSection();
      case "/admin/restaurants":
        return renderRestaurantsSection();
      case "/admin/drivers":
        return renderDriversSection();
      case "/admin/orders":
        return renderOrdersSection();
      case "/admin/revenue":
        return renderRevenueSection();
      case "/admin/fraud":
        return renderFraudSection();
      case "/admin/settings":
        return renderSettingsSection();
      case "/admin/community":
        return renderCommunitySection();
      case "/admin":
      default:
        return renderOverview();
    }
  };

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
      {renderContent()}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform scale-100 transition-all">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">{t('admin.add_user_title')}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.last_name')}</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-indigo-500 outline-none font-semibold text-gray-800"
                    placeholder="Nguyễn"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.first_name')}</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-indigo-500 outline-none font-semibold text-gray-800"
                    placeholder="Văn A"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-indigo-500 outline-none font-semibold text-gray-800"
                  placeholder="nguyenvana@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">{t('admin.roles')}</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-gray-50 bg-gray-50/50 rounded-2xl">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-xl cursor-pointer text-sm font-semibold text-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={newRoleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRoleIds([...newRoleIds, role.id]);
                          } else {
                            setNewRoleIds(newRoleIds.filter(id => id !== role.id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300"
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-2xl transition-colors flex items-center gap-2"
                >
                  {addingUser ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('admin.processing')}
                    </>
                  ) : (
                    <>{t('admin.add_new')}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform scale-100 transition-all">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">{t('admin.edit_user_title')}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.last_name')}</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-indigo-500 outline-none font-semibold text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.first_name')}</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-indigo-500 outline-none font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-indigo-500 outline-none font-semibold text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.status')}</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-indigo-500 outline-none font-bold text-gray-700"
                >
                  <option value="ACTIVE">{t('admin.status_active')}</option>
                  <option value="INACTIVE">{t('admin.status_inactive')}</option>
                  <option value="PENDING">{t('admin.status_pending')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">{t('admin.roles')}</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-gray-50 bg-gray-50/50 rounded-2xl">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-xl cursor-pointer text-sm font-semibold text-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={editRoleIds.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditRoleIds([...editRoleIds, role.id]);
                          } else {
                            setEditRoleIds(editRoleIds.filter(id => id !== role.id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300"
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-2xl transition-colors flex items-center gap-2"
                >
                  {savingUser ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>Lưu thay đổi</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
