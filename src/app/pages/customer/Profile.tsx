import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Clock, CheckCircle} from "lucide-react";
import { IMGS } from "../../data/mock";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRestaurants } from "../../features/restaurantSlice";

const orderHistory = [
  { id: "#ORD-7710", restaurant: "Burger Republic", date: "May 10, 2026", total: "$34.90", status: "delivered", img: IMGS.burger },
  { id: "#ORD-7695", restaurant: "Sushi Zen", date: "May 7, 2026", total: "$52.00", status: "delivered", img: IMGS.sushi },
  { id: "#ORD-7680", restaurant: "Pizza Palazzo", date: "May 4, 2026", total: "$28.50", status: "delivered", img: IMGS.pizza },
  { id: "#ORD-7654", restaurant: "Pho House", date: "Apr 30, 2026", total: "$22.75", status: "delivered", img: IMGS.pho },
];

const badges = [
  { icon: "🔥", name: "Food Fiend", desc: "Ordered 50+ times", earned: true },
  { icon: "⭐", name: "Star Reviewer", desc: "Left 20+ reviews", earned: true },
  { icon: "🤝", name: "Group Master", desc: "Used group order 10x", earned: true },
  { icon: "🏆", name: "Leaderboard", desc: "Top 100 reviewer", earned: false },
  { icon: "💎", name: "VIP Member", desc: "Spent $1000+", earned: false },
  { icon: "🚀", name: "Speed Order", desc: "Ordered in < 60s", earned: false },
];

const restaurantImages = [IMGS.burger, IMGS.pizza, IMGS.chicken, IMGS.coffee, IMGS.sushi, IMGS.ramen, IMGS.dessert, IMGS.restaurant];

const getRestaurantImage = (index: number) => restaurantImages[index % restaurantImages.length];

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("Orders");
  const { t } = useTranslation();
  const { restaurants } = useAppSelector((state) => state.restaurants);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const translatedTabs = [
    t('profile.orders'),
    t('profile.addresses'),
    t('profile.favorites'),
    t('profile.rewards'),
    t('profile.settings'),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/explore")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">{t('profile.my_profile')}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile card */}
        <div
          className="rounded-3xl p-6 mb-6 text-white overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #0F172A, #1E1040)" }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#FF4500]/20 blur-2xl" />
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                SC
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-gray-900 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sarah Chen</h2>
              <p className="text-gray-400 text-sm">sarah.chen@email.com</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                  {t('profile.gold_member')}
                </span>
                <span className="text-xs text-gray-400">{t('profile.since')} 2024</span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-3xl font-black text-white">2,840</p>
              <p className="text-gray-400 text-sm">{t('profile.savour_points')}</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            {[["84", t('profile.orders')], ["4.9★", t('profile.avg_rating')], ["12", t('profile.badges')]].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-white">{val}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {translatedTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab ? "text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
              style={activeTab === tab ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === t('profile.orders') && (
          <div className="space-y-3">
            {orderHistory.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 hover:border-orange-200 transition-all cursor-pointer">
                <img src={order.img} alt={order.restaurant} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{order.restaurant}</p>
                  <p className="text-sm text-gray-400">{order.id} · {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{order.total}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">✓ {order.status}</span>
                </div>
                <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#FF4500] bg-orange-50 hover:bg-orange-100 transition-colors">
                  {t('profile.reorder')}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === t('profile.addresses') && (
          <div className="space-y-3">
            {[
              { icon: "🏠", label: t('checkout.home'), addr: "123 Main Street, Apt 4B, New York, NY 10001", default: true },
              { icon: "🏢", label: t('checkout.office'), addr: "456 Business Ave, Suite 201, New York, NY 10002", default: false },
            ].map((a, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex items-start gap-4 border border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-lg shrink-0">{a.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{a.label}</p>
                    {a.default && <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-[#FF4500] font-medium">{t('profile.default')}</span>}
                  </div>
                  <p className="text-sm text-gray-400">{a.addr}</p>
                </div>
                <button className="text-sm text-[#FF4500] font-medium hover:underline">{t('profile.edit')}</button>
              </div>
            ))}
            <button className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-[#FF4500] hover:border-orange-300 hover:bg-orange-50 transition-all">
              {t('profile.add_address')}
            </button>
          </div>
        )}

        {activeTab === t('profile.favorites') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restaurants.slice(0, 4).map((r, index) => (
              <div key={r.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/restaurant/${r.id}`)}>
                <img src={getRestaurantImage(index)} alt={r.name} className="w-full h-32 object-cover" />
                <div className="p-4">
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{r.rating ?? "New"}</span>
                    <span><Clock className="w-3.5 h-3.5 inline mr-1" />20-30 min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === t('profile.rewards') && (
          <div>
            {/* Progress */}
            <div className="bg-white rounded-3xl p-6 mb-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{t('profile.gold_to_platinum')}</p>
                  <p className="text-sm text-gray-400">{t('profile.points_progress')}</p>
                </div>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "56.8%", background: "linear-gradient(90deg, #FF4500, #FF6B35)" }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{t('profile.points_to_unlock')}</p>
            </div>
            {/* Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((b) => (
                <div key={b.name} className={`bg-white rounded-2xl p-4 text-center border transition-all ${b.earned ? "border-orange-200 shadow-sm" : "border-gray-100 opacity-50"}`}>
                  <div className={`text-4xl mb-2 ${b.earned ? "" : "grayscale"}`}>{b.icon}</div>
                  <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.desc}</p>
                  {b.earned && <span className="inline-flex items-center gap-1 text-xs text-green-500 mt-2"><CheckCircle className="w-3 h-3" /> {t('profile.earned')}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === t('profile.settings') && (
          <div className="space-y-3">
            {[
              { icon: "👤", label: t('profile.settings_tabs.personal_info'), sub: t('profile.settings_desc.personal_info') },
              { icon: "🔔", label: t('profile.settings_tabs.notifications'), sub: t('profile.settings_desc.notifications') },
              { icon: "🔒", label: t('profile.settings_tabs.security'), sub: t('profile.settings_desc.security') },
              { icon: "💳", label: t('profile.settings_tabs.payments'), sub: t('profile.settings_desc.payments') },
              { icon: "🎁", label: t('profile.settings_tabs.referral'), sub: t('profile.settings_desc.referral') },
              { icon: "⚠️", label: t('profile.settings_tabs.delete_account'), sub: t('profile.settings_desc.delete_account'), danger: true },
            ].map((item: any) => (
              <button key={item.label} className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 hover:border-gray-200 transition-all text-left">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold ${item.danger ? "text-red-500" : "text-gray-900"}`}>{item.label}</p>
                  <p className="text-sm text-gray-400">{item.sub}</p>
                </div>
                <span className="text-gray-300">›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
