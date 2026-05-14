import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin, Star, Clock, Zap, Brain, CreditCard, Gift, Users,  Heart, Trophy,
  ChevronRight, Play, ArrowRight, CheckCircle, TrendingUp, Shield, Smartphone
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { restaurants, categories, testimonials, faqItems, IMGS } from "../data/mock";

const features = [
  { icon: <MapPin className="w-6 h-6" />, title: "Real-Time Tracking", desc: "Watch your order move from kitchen to doorstep on a live map.", large: true, color: "#FF4500" },
  { icon: <Brain className="w-6 h-6" />, title: "AI Recommendations", desc: "Smart picks based on your taste, mood, and time of day.", color: "#6366F1" },
  { icon: <CreditCard className="w-6 h-6" />, title: "Flexible Payments", desc: "Cash, card, Apple Pay, Google Pay, or crypto — your choice.", color: "#10B981" },
  { icon: <Gift className="w-6 h-6" />, title: "Promos & Vouchers", desc: "Exclusive flash sales and personalized coupons every day.", color: "#F59E0B" },
  { icon: <Users className="w-6 h-6" />, title: "Group Ordering", desc: "Share a cart. Everyone picks their own. One smooth delivery.", color: "#EC4899" },
  { icon: <Zap className="w-6 h-6" />, title: "Lightning Fast", desc: "Guaranteed 30-min delivery or your next order is free.", color: "#FF4500" },
  { icon: <Heart className="w-6 h-6" />, title: "Food Community", desc: "Share reviews, follow food creators, discover hidden gems.", color: "#EF4444" },
  { icon: <Trophy className="w-6 h-6" />, title: "Rewards & Gamification", desc: "Earn points, unlock badges, climb the leaderboard.", large: true, color: "#6366F1" },
];

const steps = [
  { num: "01", icon: "🔍", title: "Discover", desc: "Browse 500+ restaurants. Use AI recommendations or search by cuisine, rating, or distance." },
  { num: "02", icon: "🛒", title: "Order", desc: "Customize your meal, apply vouchers, split with friends, and checkout in seconds." },
  { num: "03", icon: "🚀", title: "Track & Enjoy", desc: "Watch your driver live on the map. Rate your experience and earn rewards." },
];

const partnerStats = [
  { label: "Avg. Monthly Revenue", value: "$12,400", icon: TrendingUp },
  { label: "Onboarding Time", value: "< 24hrs", icon: Zap },
  { label: "Platform Commission", value: "15%", icon: Shield },
];

const driverStats = [
  { label: "Avg. Hourly Earnings", value: "$22/hr", icon: TrendingUp },
  { label: "Active Cities", value: "45+", icon: MapPin },
  { label: "Driver App Rating", value: "4.9 ★", icon: Star },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [address, setAddress] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const featureKeys = ["tracking", "ai", "payments", "promos", "group", "fast", "community", "rewards"];
  const featuresWithTranslations = features.map((f, i) => ({
    ...f,
    title: t(`home.features.${featureKeys[i]}.title`),
    desc: t(`home.features.${featureKeys[i]}.desc`),
  }));

  const stepsWithTranslations = steps.map((s) => ({
    ...s,
    title: t(`home.how_it_works.${s.num}.title`),
    desc: t(`home.how_it_works.${s.num}.desc`),
  }));

  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent />

      {/* ===== HERO ===== */}
      <section
        className="relative min-h-screen overflow-hidden flex items-center"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1040 50%, #0F172A 100%)" }}
      >
        {/* Glow effects */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "#FF4500" }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#6366F1" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium mb-7">
              {t('home.live_cities')}
            </div>
            <h1
              className="text-5xl lg:text-7xl font-black text-white leading-[1.05] mb-6"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t('home.hero_title')}
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              {t('home.hero_subtitle')}
            </p>

            {/* Search bar */}
            <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 mb-6 max-w-lg">
              <div className="flex items-center gap-2 flex-1 px-3">
                <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('home.search_placeholder')}
                  className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
                />
              </div>
              <button
                onClick={() => navigate("/explore")}
                className="px-5 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 shrink-0"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {t('home.find_food')}
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/explore")}
                className="flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-semibold text-base transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 32px rgba(255,69,0,0.4)" }}
              >
                {t('home.order_food')} <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/restaurant-dashboard")}
                className="flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-semibold text-base border border-white/20 hover:bg-white/10 transition-all"
              >
                <Play className="w-4 h-4" /> {t('home.become_partner')}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex gap-6 mt-10">
              {[
                [t('home.restaurants_count'), t('home.restaurants_label')],
                [t('home.orders_count'), t('home.orders_label')],
                [t('home.rating_value'), t('home.rating_label')]
              ].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-black text-white">{val}</p>
                  <p className="text-gray-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero image + floating cards */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Main food image */}
              <div className="absolute inset-8 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img src={IMGS.burger} alt="Delicious food" className="w-full h-full object-cover" />
              </div>

              {/* Floating card: Delivery time */}
              <div className="absolute top-4 -right-4 bg-white rounded-2xl p-4 shadow-2xl w-40">
                <p className="text-xs text-gray-400 mb-1">{t('home.est_delivery')}</p>
                <p className="text-3xl font-black text-gray-900">23<span className="text-base font-normal text-gray-500"> {t('home.min_unit')}</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-500 font-medium">{t('home.driver_en_route')}</span>
                </div>
              </div>

              {/* Floating card: Rating */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t('home.order_delivered')}</p>
                    <p className="text-xs text-gray-400">{t('home.burger_here')}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Floating card: Promo */}
              <div className="absolute top-1/2 -left-8 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white rounded-2xl p-3 shadow-xl">
                <p className="text-xs font-medium opacity-80">{t('home.flash_sale')}</p>
                <p className="text-xl font-black">{t('home.discount_30_off')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[t('common.all'), ...categories.map((c) => c.label)].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeCategory === cat ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
              >
                {categories.find((c) => c.label === cat)?.icon && (
                  <span>{categories.find((c) => c.label === cat)?.icon}</span>
                )}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POPULAR RESTAURANTS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">{t('home.popular_restaurants')}</h2>
              <p className="text-gray-500">{t('home.top_rated_spots')}</p>
            </div>
            <button
              onClick={() => navigate("/explore")}
              className="flex items-center gap-2 text-[#FF4500] font-semibold hover:gap-3 transition-all text-sm"
            >
              {t('common.view_all')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {restaurants.slice(0, 8).map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/restaurant/${r.id}`)}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {r.promo && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {r.promo}
                    </div>
                  )}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{r.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.tags.map((t) => (
                      <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-gray-700">{r.rating}</span>
                      <span className="text-gray-400">({r.reviews})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {r.deliveryTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                    <span>{r.distance}</span>
                    <span className={r.deliveryFee === "Free" ? "text-green-500 font-medium" : ""}>{r.deliveryFee} delivery</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOD SHOWCASE (trending, AI, flash) ===== */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #FFF5F0 0%, #FFFFFF 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t('home.todays_top_picks')}</h2>
            <p className="text-gray-500">{t('home.curated_by_ai')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: t('home.trending_now'), img: IMGS.ramen, name: "Tonkotsu Ramen", rest: "Ramen House", price: "$14.99", badge: t('home.trending') },
              { label: t('home.ai_pick'), img: IMGS.pizza, name: "Margherita Pizza", rest: "Pizza Palazzo", price: "$18.99", badge: t('home.ai_recommended') },
              { label: `⚡ ${t('home.flash_sale')}`, img: IMGS.sushi, name: "Sashimi Deluxe", rest: "Sushi Zen", price: "~~$32.00~~ $22.40", badge: t('home.discount_30_off') },
            ].map((item) => (
              <div key={item.name} className="relative group cursor-pointer" onClick={() => navigate("/explore")}>
                <div className="relative h-56 rounded-3xl overflow-hidden mb-4">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/20 backdrop-blur-md border border-white/30">
                    {item.badge}
                  </span>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold text-lg">{item.name}</p>
                    <p className="text-white/70 text-sm">{item.rest}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="font-bold text-gray-900">{item.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES BENTO ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t('home.everything_need')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('home.platform_built')}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuresWithTranslations.map((f, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-all group ${
                  f.large ? "col-span-2" : ""
                }`}
                style={{ background: `${f.color}08` }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white" style={{ background: `${f.color}20`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                <div
                  className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ background: f.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24" style={{ background: "#0F172A" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-3">{t('home.how_savour_works')}</h2>
            <p className="text-gray-400">{t('home.how_savour_works_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="text-7xl mb-6">{step.icon}</div>
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4"
                  style={{ background: "rgba(255,69,0,0.2)", color: "#FF6B35" }}
                >
                  {t('home.step')} {step.num}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-4 text-gray-600 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/explore")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 32px rgba(255,69,0,0.3)" }}
            >
              {t('home.start_ordering')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== PARTNER SECTIONS ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
          {/* Restaurant */}
          <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative h-52 overflow-hidden">
              <img src={IMGS.restaurant} alt="Restaurant" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <span className="text-sm font-medium text-orange-300">{t('home.for_restaurant_owners')}</span>
                <h3 className="text-2xl font-black text-white">{t('home.grow_business')}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: t('home.partner_revenue'), value: t('home.partner_avg') },
                  { label: t('home.partner_onboarding'), value: t('home.partner_time') },
                  { label: t('home.partner_commission'), value: t('home.partner_fee') },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-black" style={{ color: "#FF4500" }}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2 mb-6">
                {[t('home.restaurant_benefits_zero_cost'), t('home.restaurant_benefits_analytics'), t('home.restaurant_benefits_flash_sales'), t('home.restaurant_benefits_ai_combo')].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/restaurant-dashboard")}
                className="w-full py-3 rounded-2xl text-white font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {t('home.partner_with_savour')}
              </button>
            </div>
          </div>

          {/* Driver */}
          <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative h-52 overflow-hidden">
              <img src={IMGS.driver} alt="Driver" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <span className="text-sm font-medium text-green-300">{t('home.for_delivery_drivers')}</span>
                <h3 className="text-2xl font-black text-white">{t('home.earn_on_schedule')}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: t('home.driver_earnings'), value: t('home.driver_avg') },
                  { label: t('home.driver_cities'), value: t('home.driver_cities_count') },
                  { label: t('home.driver_rating'), value: t('home.driver_app_rating') },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-black text-[#10B981]">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2 mb-6">
                {[t('home.driver_benefits_own_boss'), t('home.driver_benefits_heatmaps'), t('home.driver_benefits_instant_payout'), t('home.driver_benefits_route_opt')].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/driver-dashboard")}
                className="w-full py-3 rounded-2xl text-white font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}
              >
                {t('home.become_driver')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY PREVIEW ===== */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #FFF5F0, #FFF0E8)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-[#FF4500] text-sm font-medium mb-6">
                {t('home.social_food_community')}
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-5" dangerouslySetInnerHTML={{ __html: t('home.share_meals') }}></h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                {t('home.join_food_lovers')}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/community")}
                  className="px-6 py-3 rounded-2xl text-white font-semibold transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                >
                  {t('home.explore_community')}
                </button>
                <button className="px-6 py-3 rounded-2xl text-gray-700 font-semibold border border-gray-200 hover:bg-gray-50 transition-all">
                  {t('home.learn_more')}
                </button>
              </div>
            </div>
            {/* Community preview cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { img: IMGS.ramen, user: "@ramen_lover", likes: "12.4K", comment: "Best broth in the city! 🍜" },
                { img: IMGS.dessert, user: "@dessert.queen", likes: "8.9K", comment: "Must-try tiramisu ✨" },
                { img: IMGS.tacos, user: "@taco.time", likes: "6.2K", comment: "Street taco perfection 🌮" },
                { img: IMGS.coffee, user: "@coffee.art", likes: "15.1K", comment: "Morning ritual done right ☕" },
              ].map((post, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden aspect-square cursor-pointer group" onClick={() => navigate("/community")}>
                  <img src={post.img} alt={post.user} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-medium">{post.user}</p>
                    <p className="text-white/70 text-xs truncate">{post.comment}</p>
                    <p className="text-orange-300 text-xs font-bold mt-0.5">❤️ {post.likes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t('home.loved_by_millions')}</h2>
            <p className="text-gray-500">{t('home.join_growing_community')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-3xl p-7 hover:shadow-lg transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t('home.faq_title')}</h2>
            <p className="text-gray-500">{t('home.faq_subtitle')}</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-6 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black text-white mb-5">{t('home.ready_to_get_started')}</h2>
          <p className="text-orange-100 text-lg mb-10">{t('home.join_happy_customers')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/explore")}
              className="px-8 py-4 bg-white rounded-2xl text-[#FF4500] font-bold text-base hover:shadow-xl transition-all hover:scale-105"
            >
              {t('home.order_food_now')}
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-white/20 rounded-2xl text-white font-semibold text-base border border-white/30 hover:bg-white/30 transition-all"
            >
              {t('home.create_account')}
            </button>
          </div>
          <div className="flex gap-6 justify-center mt-10">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-100" />
              <span className="text-orange-100 text-sm">{t('home.available_on')}</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
