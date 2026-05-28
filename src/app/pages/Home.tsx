import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin, Star, Zap, Brain, CreditCard, Gift, Users, Heart, Trophy,
  ChevronRight, Play, ArrowRight, CheckCircle, Smartphone,
  Search, Bell, ShoppingCart, Navigation, Loader2,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { testimonials, faqItems, IMGS } from "../data/mock";
import { useAppDispatch, useAppSelector } from "../stores/store";
import { fetchRestaurants} from "../features/restaurantSlice";
import AddressAutocomplete from "../components/map/AddressAutocomplete";
import MapView from "../components/map/MapView";
import RestaurantMarkers from "../components/map/RestaurantMarkers";
import UserMarker from "../components/map/UserMarker";
import { reverseGeocodeCoords } from "../features/mapThunk";
import { selectSelectedAddress } from "../features/mapSelectors";

import { getDeliveryTimeText } from "../utils/geo";
import type{ Restaurant } from "../types/restaurant";

import { calculateDistance } from "../utils/geo";
import { orderService } from "../services/orderService";
import { mapService } from "../services/mapService";
import { useCartStore } from "../stores/cartStore";
import type { Promotion } from "../types/order";


// New shared components
import { HeroBanner } from "../components/layout/HeroBanner";
import { QuickCategoryBar } from "../components/layout/QuickCategoryBar";
import { RestaurantRow } from "../components/layout/RestaurantRow";

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

const collections = [
  { icon: "🏷️", label: "Giảm tới 50%", gradient: "from-red-500 to-rose-600", slug: "all" },
  { icon: "🧋", label: "Trà sữa hot", gradient: "from-purple-500 to-violet-600", slug: "milk-tea" },
  { icon: "🍕", label: "Pizza deal", gradient: "from-orange-500 to-amber-500", slug: "pizza-burger" },
  { icon: "🌙", label: "Ăn khuya", gradient: "from-slate-700 to-slate-900", slug: "all" },
  { icon: "🥗", label: "Healthy picks", gradient: "from-emerald-500 to-teal-600", slug: "healthy" },
  { icon: "⭐", label: "Best seller", gradient: "from-yellow-400 to-orange-500", slug: "all" },
];

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const searchRef = useRef<HTMLDivElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Legacy map state (for restaurant map section)
  const [distanceFilter, setDistanceFilter] = useState<number>(999);
  const [activeCategory, setActiveCategory] = useState("All");

  // ── Redux ──────────────────────────────────────────────────────────────────
  const { restaurants } = useAppSelector((state) => state.restaurants);
  const selectedAddress = useAppSelector(selectSelectedAddress);
  const cartCount = useCartStore((state) => state.getItemCount());

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  useEffect(() => {
    orderService.getPromotions().then((data) => setPromotions(data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Geolocation ───────────────────────────────────────────────────────────
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        try {
          const addr = await mapService.reverseGeocode(lat, lng);
          setUserAddress(addr);
        } catch {
          setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false)
    );
  };

  // ── Distance helper ────────────────────────────────────────────────────────
  const withDistance = useMemo(() => {
    return (restaurants ?? []).map((r) => {
      let dist: number = Infinity;
      if (userLocation && r.latitude && r.longitude) {
        dist = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          Number(r.latitude),
          Number(r.longitude)
        );
      }
      return { ...r, distance: dist };
    });
  }, [restaurants, userLocation]);

  // ── Section derivations ───────────────────────────────────────────────────
  const nearbyRestaurants = useMemo(
    () => [...withDistance].filter((r) => r.distance !== Infinity).sort((a, b) => a.distance - b.distance),
    [withDistance]
  );

  const topRated = useMemo(
    () => [...withDistance].filter((r) => Number(r.rating || 0) >= 4.5).sort((a, b) => Number(b.rating) - Number(a.rating)),
    [withDistance]
  );

  const fastDelivery = useMemo(
    () =>
      [...withDistance]
        .filter((r) => r.distance !== Infinity)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8),
    [withDistance]
  );

  const trending = useMemo(
    () => [...withDistance].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)),
    [withDistance]
  );

  const freeDelivery = useMemo(
    () => [...withDistance].filter((r) => r.isActive),
    [withDistance]
  );

  // ── Legacy (map section) ──────────────────────────────────────────────────
  const getRestaurantCoords = (r: Restaurant): [number, number] => {
    const lat = r.latitude ? parseFloat(r.latitude) : null;
    const lng = r.longitude ? parseFloat(r.longitude) : null;
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) return [lat, lng];
    const input = `${r.id}-${r.name || ""}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) hash = input.charCodeAt(i) + ((hash << 5) - hash);
    return [16.054404 + ((hash % 100) / 1000), 108.202167 + (((hash >> 2) % 100) / 1000)];
  };

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const apiCategories = useMemo(() => {
    const names = restaurants.flatMap((r) => r.categories.map((c) => c.name));
    return Array.from(new Set(names));
  }, [restaurants]);

  const visibleRestaurants = useMemo(() => {
    let filtered = restaurants;
    if (activeCategory !== "All" && activeCategory !== t("common.all")) {
      filtered = filtered.filter((r) => r.categories.some((c) => c.name === activeCategory));
    }
    if (selectedAddress && distanceFilter !== 999) {
      filtered = filtered.filter((r) => {
        const coords = getRestaurantCoords(r);
        return calculateHaversineDistance(selectedAddress.lat, selectedAddress.lng, coords[0], coords[1]) <= distanceFilter;
      });
    }
    return filtered;
  }, [activeCategory, restaurants, t, selectedAddress, distanceFilter]);

  const featureKeys = ["tracking", "ai", "payments", "promos", "group", "fast", "community", "rewards"];
  const featuresWithTranslations = features.map((f, i) => ({
    ...f,
    title: t(`home.features.${featureKeys[i]}.title`),
    desc: t(`home.features.${featureKeys[i]}.desc`),
  }));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    else navigate("/explore");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent />

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Dark gradient (unchanged from original)
      ═══════════════════════════════════════════════════════════════ */}
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
              {t("home.live_cities")}
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] mb-6" style={{ letterSpacing: "-0.02em" }}>
              {t("home.hero_title")}
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">{t("home.hero_subtitle")}</p>

            <div className="mb-6 max-w-lg">
              <AddressAutocomplete placeholder={t("home.search_placeholder")} />
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/explore")}
                className="flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-semibold text-base transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 32px rgba(255,69,0,0.4)" }}
              >
                {t("home.order_food")} <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/restaurant-dashboard")}
                className="flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-semibold text-base border border-white/20 hover:bg-white/10 transition-all"
              >
                <Play className="w-4 h-4" /> {t("home.become_partner")}
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex gap-6 mt-10">
              {[
                [t("home.restaurants_count"), t("home.restaurants_label")],
                [t("home.orders_count"), t("home.orders_label")],
                [t("home.rating_value"), t("home.rating_label")],
              ].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-black text-white">{val}</p>
                  <p className="text-gray-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute inset-8 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img src={IMGS.burger} alt="Delicious food" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-4 -right-4 bg-white rounded-2xl p-4 shadow-2xl w-40">
                <p className="text-xs text-gray-400 mb-1">{t("home.est_delivery")}</p>
                <p className="text-3xl font-black text-gray-900">23<span className="text-base font-normal text-gray-500"> {t("home.min_unit")}</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-500 font-medium">{t("home.driver_en_route")}</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t("home.order_delivered")}</p>
                    <p className="text-xs text-gray-400">{t("home.burger_here")}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
              <div className="absolute top-1/2 -left-8 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white rounded-2xl p-3 shadow-xl">
                <p className="text-xs font-medium opacity-80">{t("home.flash_sale")}</p>
                <p className="text-xl font-black">{t("home.discount_30_off")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SHOPEEFOOD-STYLE STICKY TOP BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div
        ref={searchRef}
        className={`bg-white/97 backdrop-blur-md border-b border-gray-100 sticky top-16 z-40 transition-shadow duration-300 ${scrolled ? "shadow-lg" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">

          {/* Row 1: Location + Cart + Notification */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={handleLocate}
            >
              <div className="w-8 h-8 rounded-full bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-colors">
                {isLocating
                  ? <Loader2 className="w-4 h-4 text-[#FF4500] animate-spin" />
                  : <MapPin className="w-4 h-4 text-[#FF4500]" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Giao đến</p>
                <p className="text-xs font-bold text-gray-800 truncate max-w-[200px] mt-0.5 group-hover:text-[#FF4500] transition-colors">
                  {userLocation
                    ? (userAddress || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`)
                    : "Nhấn để định vị"}
                </p>
              </div>
              <Navigation className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF4500] transition-colors" />
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all active:scale-95">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 rounded-2xl bg-orange-50 hover:bg-orange-100 text-[#FF4500] transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Search bar */}
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 focus-within:bg-white transition-all">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bạn muốn ăn gì hôm nay?"
                className="flex-1 bg-transparent text-sm font-semibold outline-none text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="submit"
                  className="shrink-0 px-3 py-1 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xs font-black rounded-xl"
                >
                  Tìm
                </button>
              )}
            </div>
          </form>

          {/* Row 3: Quick category pills */}
          <QuickCategoryBar />

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT — ShopeeFood-style sections
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">

        {/* A. Hero Banner Slider */}
        <HeroBanner promotions={promotions} />

        {/* B. Collections (Bộ sưu tập) */}
        <div className="space-y-3.5">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span className="text-xl">🗂️</span>
            Bộ sưu tập
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {collections.map((col) => (
              <button
                key={col.label}
                onClick={() => navigate(col.slug === "all" ? "/explore" : `/explore?category=${col.slug}`)}
                className={`group flex-shrink-0 flex flex-col items-center justify-center gap-2 w-28 h-24 rounded-2xl bg-gradient-to-br ${col.gradient} text-white shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all`}
              >
                <span className="text-2xl">{col.icon}</span>
                <span className="text-xs font-bold text-center px-2 leading-tight">{col.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* C. Nearby Restaurants */}
        <RestaurantRow
          title="Gần bạn"
          icon="📍"
          restaurants={nearbyRestaurants.length > 0 ? nearbyRestaurants : withDistance}
          viewAllHref="/explore"
        />

        {/* D. Top Rated */}
        <RestaurantRow
          title="Đánh giá cao"
          icon="⭐"
          restaurants={topRated.length > 0 ? topRated : trending}
          viewAllHref="/explore"
        />

        {/* E. Fast Delivery */}
        <RestaurantRow
          title="Giao nhanh"
          icon="⚡"
          restaurants={fastDelivery.length > 0 ? fastDelivery : withDistance}
          viewAllHref="/explore"
        />

        {/* F. Trending */}
        <RestaurantRow
          title="Đang hot 🔥"
          icon="🔥"
          restaurants={trending}
          viewAllHref="/explore"
        />

        {/* G. Free Delivery */}
        <RestaurantRow
          title="Freeship"
          icon="🚚"
          restaurants={freeDelivery.length > 0 ? freeDelivery : withDistance}
          viewAllHref="/explore"
        />

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAP SECTION (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                {t("home.restaurant_map_title", "Bản đồ nhà hàng")}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedAddress
                  ? `${t("home.showing_restaurants_near", "Đang hiển thị nhà hàng gần:")} ${selectedAddress.address}`
                  : t("home.select_location_map", "Chọn vị trí giao hàng để xem khoảng cách")}
              </p>
            </div>
            {selectedAddress && (
              <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm self-start">
                <span className="text-xs font-semibold text-gray-500 px-3">{t("home.radius", "Bán kính:")}</span>
                {[
                  { label: t("home.radius_all", "Tất cả"), value: 999 },
                  { label: "2 km", value: 2 },
                  { label: "5 km", value: 5 },
                  { label: "10 km", value: 10 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDistanceFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${distanceFilter === opt.value ? "text-white bg-[#FF4500]" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category pills for map */}
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide mb-4">
            {[t("common.all"), ...apiCategories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                style={activeCategory === cat ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          <MapView
            center={selectedAddress ? [selectedAddress.lat, selectedAddress.lng] : [16.054404, 108.202167]}
            zoom={selectedAddress ? 15 : 13}
            onMapClick={(lat, lng) => dispatch(reverseGeocodeCoords({ lat, lng }))}
            className="h-96 w-full rounded-3xl overflow-hidden shadow-md border border-gray-200"
          >
            <UserMarker position={selectedAddress} addressName={selectedAddress?.address} />
            <RestaurantMarkers
              restaurants={visibleRestaurants}
              onSelectRestaurant={(rest) => navigate(`/restaurant/${rest.id}`)}
            />
          </MapView>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOD SHOWCASE (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #FFF5F0 0%, #FFFFFF 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t("home.todays_top_picks")}</h2>
            <p className="text-gray-500">{t("home.curated_by_ai")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: t("home.trending_now"), img: IMGS.ramen, name: "Tonkotsu Ramen", rest: "Ramen House", price: "$14.99", badge: t("home.trending") },
              { label: t("home.ai_pick"), img: IMGS.pizza, name: "Margherita Pizza", rest: "Pizza Palazzo", price: "$18.99", badge: t("home.ai_recommended") },
              { label: `⚡ ${t("home.flash_sale")}`, img: IMGS.sushi, name: "Sashimi Deluxe", rest: "Sushi Zen", price: "~~$32.00~~ $22.40", badge: t("home.discount_30_off") },
            ].map((item) => (
              <div key={item.name} className="relative group cursor-pointer" onClick={() => navigate("/explore")}>
                <div className="relative h-56 rounded-3xl overflow-hidden mb-4">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/20 backdrop-blur-md border border-white/30">{item.badge}</span>
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

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES BENTO (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t("home.everything_need")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t("home.platform_built")}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuresWithTranslations.map((f, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-3xl p-6 border border-gray-100 hover:shadow-lg transition-all group ${f.large ? "col-span-2" : ""}`}
                style={{ background: `${f.color}08` }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white" style={{ background: `${f.color}20`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: f.color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: "#0F172A" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-3">{t("home.how_savour_works")}</h2>
            <p className="text-gray-400">{t("home.how_savour_works_subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="text-7xl mb-6">{step.icon}</div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: "rgba(255,69,0,0.2)", color: "#FF6B35" }}>
                  {t("home.step")} {step.num}
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
              {t("home.start_ordering")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PARTNER SECTIONS (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
          <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative h-52 overflow-hidden">
              <img src={IMGS.restaurant} alt="Restaurant" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <span className="text-sm font-medium text-orange-300">{t("home.for_restaurant_owners")}</span>
                <h3 className="text-2xl font-black text-white">{t("home.grow_business")}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: t("home.partner_revenue"), value: t("home.partner_avg") },
                  { label: t("home.partner_onboarding"), value: t("home.partner_time") },
                  { label: t("home.partner_commission"), value: t("home.partner_fee") },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-black" style={{ color: "#FF4500" }}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2 mb-6">
                {[t("home.restaurant_benefits_zero_cost"), t("home.restaurant_benefits_analytics"), t("home.restaurant_benefits_flash_sales"), t("home.restaurant_benefits_ai_combo")].map((item) => (
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
                {t("home.partner_with_savour")}
              </button>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="relative h-52 overflow-hidden">
              <img src={IMGS.driver} alt="Driver" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <span className="text-sm font-medium text-green-300">{t("home.for_delivery_drivers")}</span>
                <h3 className="text-2xl font-black text-white">{t("home.earn_on_schedule")}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: t("home.driver_earnings"), value: t("home.driver_avg") },
                  { label: t("home.driver_cities"), value: t("home.driver_cities_count") },
                  { label: t("home.driver_rating"), value: t("home.driver_app_rating") },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-black text-[#10B981]">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2 mb-6">
                {[t("home.driver_benefits_own_boss"), t("home.driver_benefits_heatmaps"), t("home.driver_benefits_instant_payout"), t("home.driver_benefits_route_opt")].map((item) => (
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
                {t("home.become_driver")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          COMMUNITY PREVIEW (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #FFF5F0, #FFF0E8)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-[#FF4500] text-sm font-medium mb-6">
                {t("home.social_food_community")}
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-5" dangerouslySetInnerHTML={{ __html: t("home.share_meals") }} />
              <p className="text-gray-500 leading-relaxed mb-8">{t("home.join_food_lovers")}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/community")}
                  className="px-6 py-3 rounded-2xl text-white font-semibold transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                >
                  {t("home.explore_community")}
                </button>
                <button className="px-6 py-3 rounded-2xl text-gray-700 font-semibold border border-gray-200 hover:bg-gray-50 transition-all">
                  {t("home.learn_more")}
                </button>
              </div>
            </div>
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

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t("home.loved_by_millions")}</h2>
            <p className="text-gray-500">{t("home.join_growing_community")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-3xl p-7 hover:shadow-lg transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
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

      {/* ═══════════════════════════════════════════════════════════════
          FAQ (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900 mb-3">{t("home.faq_title")}</h2>
            <p className="text-gray-500">{t("home.faq_subtitle")}</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button className="w-full flex items-center justify-between p-6 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
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

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA (preserved)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black text-white mb-5">{t("home.ready_to_get_started")}</h2>
          <p className="text-orange-100 text-lg mb-10">{t("home.join_happy_customers")}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => navigate("/explore")} className="px-8 py-4 bg-white rounded-2xl text-[#FF4500] font-bold text-base hover:shadow-xl transition-all hover:scale-105">
              {t("home.order_food_now")}
            </button>
            <button onClick={() => navigate("/register")} className="px-8 py-4 bg-white/20 rounded-2xl text-white font-semibold text-base border border-white/30 hover:bg-white/30 transition-all">
              {t("home.create_account")}
            </button>
          </div>
          <div className="flex gap-6 justify-center mt-10">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-100" />
              <span className="text-orange-100 text-sm">{t("home.available_on")}</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
