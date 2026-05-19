import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MapPin, Navigation, Clock, Phone, CheckCircle, Star,  Package, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Can } from "../../components/auth/Can";

const earningsData = [
  { day: "Mon", earnings: 84 },
  { day: "Tue", earnings: 112 },
  { day: "Wed", earnings: 98 },
  { day: "Thu", earnings: 145 },
  { day: "Fri", earnings: 178 },
  { day: "Sat", earnings: 210 },
  { day: "Sun", earnings: 164 },
];

const deliveryHistory = [
  { id: "#7710", from: "Burger Republic", to: "123 Main St", time: "28 min", earnings: "$8.50", rating: 5, status: "completed" },
  { id: "#7698", from: "Sushi Zen", to: "456 Park Ave", time: "22 min", earnings: "$7.20", rating: 5, status: "completed" },
  { id: "#7685", from: "Pizza Palazzo", to: "789 Oak Blvd", time: "35 min", earnings: "$9.80", rating: 4, status: "completed" },
];

export default function DriverDashboard() {
  const [online, setOnline] = useState(true);
  const [pendingOrder, setPendingOrder] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState<boolean>(false);
  const { t } = useTranslation();

  const translatedStats = [
    { label: t('driver_dashboard.today_earnings'), value: "$164", icon: DollarSign, color: "#10B981", change: "+$28 vs avg" },
    { label: t('driver_dashboard.trips_today'), value: "18", icon: Package, color: "#FF4500", change: `8 ${t('driver_dashboard.remaining')}` },
    { label: t('home.rating'), value: "4.97★", icon: Star, color: "#F59E0B", change: "+0.02 this week" },
    { label: t('driver_dashboard.online_time'), value: "6.2h", icon: Clock, color: "#6366F1", change: `89% ${t('driver_dashboard.acceptance')}` },
  ];

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

  const acceptOrder = () => { setPendingOrder(false); setActiveDelivery(true); };
  const declineOrder = () => setPendingOrder(false);

  return (
    <DashboardLayout navItems={authorizedNavItems} role="driver" userName="Alex Kowalski" userAvatar="AK">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('driver_dashboard.driver_dashboard')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Monday, May 11 · {t('driver_dashboard.good_afternoon').replace('{{name}}', 'Alex')}</p>
        </div>
        {/* Online/Offline Toggle */}
        <div
          onClick={() => setOnline(!online)}
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
      {pendingOrder && online && (
        <div
          className="rounded-3xl p-6 mb-6 border-2 text-white overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #0F172A, #1E1040)", borderColor: "#10B981" }}
        >
          <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-green-500/10 blur-2xl" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
                <span className="text-green-400 text-sm font-bold">{t('driver_dashboard.new_delivery_request')}</span>
              </div>
              <h2 className="text-xl font-black text-white">Burger Republic → 123 Main St</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white">$8.50</p>
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
                onClick={acceptOrder}
                className="flex-1 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}
              >
                <CheckCircle className="w-5 h-5" /> {t('driver_dashboard.accept_delivery')}
              </button>
            </Can>
            <button
              onClick={declineOrder}
              className="flex-1 py-3.5 rounded-2xl text-gray-300 font-bold border border-white/20 hover:bg-white/10 transition-all"
            >
              {t('driver_dashboard.skip')}
            </button>
          </div>
        </div>
      )}

      {/* Active delivery */}
      {activeDelivery && (
        <div className="rounded-3xl p-5 mb-6 border border-green-200" style={{ background: "#F0FDF4" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 text-sm font-bold">{t('driver_dashboard.active_delivery')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Burger Republic → 123 Main St</p>
              <p className="text-sm text-gray-500">Order #7721 · 2 {t('driver_dashboard.items')} · $34.90</p>
            </div>
            <button className="p-2.5 rounded-xl bg-white border border-gray-200">
              <Navigation className="w-5 h-5 text-green-500" />
            </button>
          </div>
          <div className="flex gap-3 mt-3">
            <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-green-600 bg-white border border-green-200 flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" /> {t('driver_dashboard.call_customer')}
            </button>
            <Can permission="delivery:edit">
              <button
                onClick={() => setActiveDelivery(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: "#10B981" }}
              >
                <CheckCircle className="w-4 h-4" /> {t('driver_dashboard.mark_delivered')}
              </button>
            </Can>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {translatedStats.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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
            <p className="text-sm font-bold" style={{ color: "#10B981" }}>{t('driver_dashboard.this_week_earnings')}</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={earningsData}>
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
              <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-1.5">
                <p className="text-xs font-bold text-gray-700">{t('driver_dashboard.high_demand_nearby')}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { zone: "Downtown Financial", demand: t('driver_dashboard.demand_levels.very_high'), color: "#FF4500" },
              { zone: "University District", demand: t('driver_dashboard.demand_levels.high'), color: "#F59E0B" },
              { zone: "Midtown East", demand: t('driver_dashboard.demand_levels.medium'), color: "#10B981" },
            ].map((z) => (
              <div key={z.zone} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{z.zone}</span>
                <span className="font-semibold" style={{ color: z.color }}>{z.demand}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery History */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">{t('driver_dashboard.deliveries')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {deliveryHistory.map((d) => (
              <div key={d.id} className="flex items-center gap-5 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-gray-500">{d.id}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{d.from}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{d.to}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">{d.time}</p>
                  <p className="text-xs text-gray-400">{t('driver_dashboard.duration')}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(d.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{d.earnings}</p>
                  <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">✓ {d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
