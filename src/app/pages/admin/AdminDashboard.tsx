import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { adminOrders, revenueData } from "../../data/mock";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Store, Bike, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, Search, Filter, Shield, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Can } from "../../components/auth/Can";

const kpis = [
  { label: "Total Revenue", value: "$124,840", change: "+18.2%", up: true, icon: TrendingUp, color: "#FF4500", sub: "This month" },
  { label: "Active Orders", value: "284", change: "+24", up: true, icon: ShoppingBag, color: "#10B981", sub: "Right now" },
  { label: "Restaurants", value: "512", change: "+12", up: true, icon: Store, color: "#6366F1", sub: "3 pending approval" },
  { label: "Drivers Online", value: "148", change: "-8%", up: false, icon: Bike, color: "#F59E0B", sub: "of 380 total" },
];

const pendingRestaurants = [
  { name: "The Spice Garden", cuisine: "Indian", owner: "Raj Patel", city: "New York", applied: "2h ago" },
  { name: "Le Petit Bistro", cuisine: "French", owner: "Claire Dupont", city: "Boston", applied: "5h ago" },
  { name: "Dragon Palace", cuisine: "Chinese", owner: "Wei Zhang", city: "NYC", applied: "1d ago" },
];

const fraudAlerts = [
  { id: "#F-142", type: "Fake Order", detail: "10 orders from same IP in 5 min", risk: "High", time: "12 min ago" },
  { id: "#F-141", type: "Rating Abuse", detail: "Restaurant mass-rating manipulation", risk: "Medium", time: "3h ago" },
];

const pieData = [
  { name: "Burgers", value: 28, color: "#FF4500" },
  { name: "Pizza", value: 22, color: "#6366F1" },
  { name: "Asian", value: 18, color: "#F59E0B" },
  { name: "Healthy", value: 14, color: "#10B981" },
  { name: "Other", value: 18, color: "#E5E7EB" },
];

const statusColors: Record<string, { color: string; bg: string }> = {
  delivered: { color: "#10B981", bg: "#F0FDF4" },
  on_way: { color: "#6366F1", bg: "#EEF2FF" },
  preparing: { color: "#F59E0B", bg: "#FFFBEB" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2" },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("All");
  const { t } = useTranslation();

  const translatedKpis = [
    { ...kpis[0], label: t('admin.total_revenue'), sub: t('admin.this_month') },
    { ...kpis[1], label: t('admin.active_orders'), sub: t('admin.right_now') },
    { ...kpis[2], label: t('admin.restaurants'), sub: `3 ${t('admin.pending_approval')}` },
    { ...kpis[3], label: t('admin.drivers_online'), sub: t('admin.of_total') },
  ];


  const translatedNavItems = [
    { icon: "📊", label: t('admin.nav.dashboard'), path: "/admin" },
    { icon: "👥", label: t('admin.nav.users'), path: "/admin/users" },
    { icon: "🍴", label: t('admin.nav.restaurants'), path: "/admin/restaurants", badge: 3 },
    { icon: "🚴", label: t('admin.nav.drivers'), path: "/admin/drivers" },
    { icon: "🛒", label: t('admin.nav.orders'), path: "/admin/orders" },
    { icon: "💰", label: t('admin.nav.revenue'), path: "/admin/revenue" },
    { icon: "🔍", label: t('admin.nav.fraud_detection'), path: "/admin/fraud", badge: 2 },
    { icon: "📢", label: t('admin.nav.community'), path: "/admin/community" },
    { icon: "⚙️", label: t('admin.nav.settings'), path: "/admin/settings" },
  ];
  const navPermissions: Record<string, string> = {
    "/admin": "admin:dashboard:view",
    "/admin/users": "user:view",
    "/admin/restaurants": "restaurant:view",
    "/admin/drivers": "driver:view",
    "/admin/orders": "order:view",
    "/admin/revenue": "revenue:view",
    "/admin/fraud": "fraud:view",
    "/admin/community": "community:view",
    "/admin/settings": "admin:settings:view",
  };
  const authorizedNavItems = translatedNavItems.map((item) => ({
    ...item,
    permission: navPermissions[item.path],
  }));

  return (
    <DashboardLayout navItems={authorizedNavItems} role="admin" userName="Admin User" userAvatar="AU">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('admin.admin_panel')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">May 11, 2026 · {t('admin.platform_overview')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-600">{t('admin.system_normal')}</span>
          </div>
          <button className="p-2.5 rounded-xl bg-red-50 border border-red-200 relative">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">2</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {translatedKpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
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
                <button key={p} className={`px-3 py-1 rounded-lg text-xs font-medium ${p === "7M" ? "text-white" : "text-gray-400 hover:bg-gray-50"}`} style={p === "7M" ? { background: "#6366F1" } : {}}>
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
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tab === tItem ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
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
                {adminOrders.map((order) => {
                  const sc = statusColors[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-bold text-gray-700">{order.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.customer}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.restaurant}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.driver}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{order.amount}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>
                          {t(`admin.status_${order.status}`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#FF4500]">3</span>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingRestaurants.map((r) => (
                <div key={r.name} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.cuisine} · {r.city} · {r.applied}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Can permission="restaurant:approve">
                      <button className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1" style={{ background: "#10B981" }}>
                        <CheckCircle className="w-3 h-3" /> {t('admin.approve')}
                      </button>
                    </Can>
                    <Can permission="restaurant:delete">
                      <button className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 flex items-center justify-center gap-1 hover:bg-red-50">
                        <XCircle className="w-3 h-3" /> {t('admin.reject')}
                      </button>
                    </Can>
                    <button className="py-1.5 px-2.5 rounded-xl text-xs text-gray-400 border border-gray-200 hover:bg-gray-50">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <h2 className="font-bold text-gray-900 text-sm">{t('admin.fraud_alerts')}</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-500">2 {t('admin.alerts')}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {fraudAlerts.map((alert) => (
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
                    <Can permission="fraud:approve">
                      <button className="text-xs font-semibold text-red-500 hover:underline">{t('admin.investigate')}</button>
                    </Can>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Management quick table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">{t('admin.users')}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <Search className="w-4 h-4 text-gray-400" />
              <input placeholder={t('admin.search_users')} className="bg-transparent text-sm outline-none text-gray-600 w-36" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
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
              {[
                { name: "Sarah Chen", email: "sarah@email.com", role: "Customer", orders: 84, joined: "Mar 2024", status: "active" },
                { name: "Raj Patel", email: "raj@food.com", role: "Restaurant", orders: 0, joined: "Jan 2025", status: "active" },
                { name: "Alex Kowalski", email: "alex@ride.com", role: "Driver", orders: 1342, joined: "Jun 2024", status: "active" },
                { name: "Marcus Lee", email: "marcus@email.com", role: "Customer", orders: 12, joined: "Feb 2026", status: "suspended" },
                { name: "Emily Park", email: "emily@email.com", role: "Customer", orders: 47, joined: "Nov 2024", status: "active" },
              ].map((user) => (
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
                      <Can permission="user:edit">
                        <button className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 border border-red-100 hover:bg-red-50 transition-colors">
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
    </DashboardLayout>
  );
}
