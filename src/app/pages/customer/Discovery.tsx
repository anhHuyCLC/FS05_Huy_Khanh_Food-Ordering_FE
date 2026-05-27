import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, MapPin, Brain, ChevronDown,
  RotateCcw, Gift, ArrowRight, Bell, ShoppingCart,
} from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { IMGS } from "../../data/mock";
import { quickCategories, resolveSlugToKeywords } from "../../data/categories";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRestaurants } from "../../features/restaurantSlice";
import { calculateDistance } from "../../utils/geo";
import { Loader2 } from "lucide-react";
import { orderService } from "../../services/orderService";
import { mapService } from "../../services/mapService";
import { useCartStore } from "../../stores/cartStore";
import type { Promotion, Order } from "../../types/order";
import { QuickCategoryBar } from "../../components/layout/QuickCategoryBar";
import { RestaurantCard } from "../../components/layout/RestaurantCard";

export default function Discovery() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items } = useCartStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-driven state (sync on mount) ────────────────────────────────────
  const categoryParam = searchParams.get("category") ?? "all";
  const qParam = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(qParam);
  const [activeCategory, setActiveCategory] = useState(categoryParam); // slug or "all"
  const [activeFilter, setActiveFilter] = useState("All");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(Infinity);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("Relevance");
  const [scrolled, setScrolled] = useState(false);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const { t } = useTranslation();
  const { restaurants, loading } = useAppSelector((state) => state.restaurants);

  // ── Sync URL params → local state on navigation ──────────────────────────
  useEffect(() => {
    const slug = searchParams.get("category") ?? "all";
    const q = searchParams.get("q") ?? "";
    // Validate slug — graceful fallback to "all"
    const isValid = slug === "all" || quickCategories.some((c) => c.slug === slug);
    setActiveCategory(isValid ? slug : "all");
    setSearch(q);
    // Reset pagination on new navigation
    setShowAllRestaurants(false);
  }, [searchParams]);

  // ── Handle category pill click (in-page, updates URL) ───────────────────
  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    setShowAllRestaurants(false);
    const params: Record<string, string> = {};
    if (slug && slug !== "all") params.category = slug;
    if (search.trim()) params.q = search.trim();
    setSearchParams(params);
  };

  // ── Handle search submit (updates URL) ───────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (activeCategory && activeCategory !== "all") params.category = activeCategory;
    if (search.trim()) params.q = search.trim();
    setSearchParams(params);
  };

  // ── Scroll listener ────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  useEffect(() => {
    orderService.getPromotions().then((data) => setPromotions(data || [])).catch((err) => console.error("Promotions:", err));
  }, []);

  useEffect(() => {
    orderService.getMyOrders().then((data) => setRecentOrders(data || [])).catch((err) => console.error("Orders:", err));
  }, []);

  const cartItemsCount = useMemo(() => items.reduce((acc, item) => acc + item.qty, 0), [items]);

  const handleLocate = () => {
    if (!navigator.geolocation) { alert("Trình duyệt không hỗ trợ định vị"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        try {
          const addr = await mapService.reverseGeocode(lat, lng);
          setUserAddress(addr);
        } catch {
          setUserAddress(`Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      () => { alert("Không thể lấy vị trí"); setIsLocating(false); }
    );
  };

  // ── Filtering (keyword-based for slugs, name-based for legacy) ───────────
  const filtered = useMemo(() => {
    let baseResult = restaurants;

    // Text search
    if (search.trim()) {
      const keyword = search.toLowerCase();
      baseResult = baseResult.filter(
        (r) =>
          r.name.toLowerCase().includes(keyword) ||
          r.categories.some((c) => c.name.toLowerCase().includes(keyword)) ||
          r.menuItems?.some((m) => m.name.toLowerCase().includes(keyword))
      );
    }

    // Category filter via slug → keyword matching
    if (activeCategory && activeCategory !== "all") {
      const keywords = resolveSlugToKeywords(activeCategory);
      if (keywords.length > 0) {
        baseResult = baseResult.filter((r) =>
          r.categories.some((c) =>
            keywords.some((kw) => c.name.toLowerCase().includes(kw.toLowerCase()))
          )
        );
      }
    }

    // Rating filter
    if (minRating > 0) {
      baseResult = baseResult.filter((r) => Number(r.rating || 0) >= minRating);
    }

    // Status filters
    if (activeFilter === t("discovery.open_now")) {
      baseResult = baseResult.filter((r) => r.isActive);
    } else if (activeFilter === t("discovery.top_rated")) {
      baseResult = baseResult.filter((r) => Number(r.rating || 0) >= 4.5);
    } else if (activeFilter === t("discovery.under_30_min")) {
      baseResult = baseResult.filter((r) => {
        let dist = Infinity;
        if (userLocation && r.latitude && r.longitude) {
          dist = calculateDistance(userLocation.lat, userLocation.lng, Number(r.latitude), Number(r.longitude));
        }
        return dist < 4;
      });
    }

    // Attach distance
    const withDistance = baseResult.map((r) => {
      let dist = Infinity;
      if (userLocation && r.latitude && r.longitude) {
        dist = calculateDistance(userLocation.lat, userLocation.lng, Number(r.latitude), Number(r.longitude));
      }
      return { ...r, distance: dist };
    });

    // Max distance filter
    const result = withDistance.filter((r) => r.distance <= maxDistance);

    // Sort
    if (sortBy === "Distance") {
      result.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === "Rating") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return result;
  }, [activeCategory, restaurants, search, t, minRating, activeFilter, userLocation, maxDistance, sortBy]);

  const displayedRestaurants = useMemo(
    () => (showAllRestaurants ? filtered : filtered.slice(0, 8)),
    [filtered, showAllRestaurants]
  );

  // ── Recent orders ───────────────────────────────────────────────────────
  const recommendedItemImages = useMemo(() => {
    const images: string[] = [];
    for (const r of restaurants || []) {
      if (r.imageUrl) images.push(r.imageUrl);
      if (r.menuItems) for (const item of r.menuItems) { if (item.imageUrl) images.push(item.imageUrl); }
      if (images.length >= 3) break;
    }
    while (images.length < 3) images.push(IMGS.restaurant);
    return images.slice(0, 3);
  }, [restaurants]);

  const recentDisplayList = useMemo(() => {
    const uniques = new Map<string, NonNullable<Order["restaurant"]>>();
    for (const order of recentOrders || []) {
      if (order.restaurant && !uniques.has(order.restaurant.id)) {
        uniques.set(order.restaurant.id, order.restaurant);
      }
    }
    const list = Array.from(uniques.values());
    if (list.length > 0) return list.slice(0, 4);
    return (restaurants || []).slice(0, 3);
  }, [recentOrders, restaurants]);

  const sortOptions = [
    { label: t("discovery.relevance"), value: "Relevance" },
    { label: t("home.rating"), value: "Rating" },
    { label: t("discovery.distance"), value: "Distance" },
  ];

  const handleResetFilters = () => {
    setSearch("");
    setActiveFilter("All");
    setActiveCategory("all");
    setMinRating(0);
    setMaxDistance(Infinity);
    setSortBy("Relevance");
    setShowAllRestaurants(false);
    setSearchParams({});
  };

  // ── Active category display name ────────────────────────────────────────
  const activeCategoryName = useMemo(() => {
    if (!activeCategory || activeCategory === "all") return null;
    return quickCategories.find((c) => c.slug === activeCategory)?.name ?? activeCategory;
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      <div className="pt-16">

        {/* ══════════════════ 1. STICKY TOP BAR ══════════════════ */}
        <div
          className={`bg-white/97 backdrop-blur-md border-b border-gray-100 sticky top-16 z-40 transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">

            {/* Row 1: Address + Cart/Bell */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[70%] cursor-pointer group" onClick={handleLocate}>
                <div className="w-9 h-9 rounded-full bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-colors">
                  {isLocating ? <Loader2 className="w-4 h-4 text-[#FF4500] animate-spin" /> : <MapPin className="w-4 h-4 text-[#FF4500]" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Địa chỉ giao hàng</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 truncate mt-1 group-hover:text-[#FF4500] transition-colors">
                    {userLocation ? (userAddress || `Đã định vị (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`) : "Nhấp định vị vị trí của tôi"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button className="relative p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all active:scale-95">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                </button>
                <button onClick={() => navigate("/cart")} className="relative p-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-[#FF4500] transition-all active:scale-95">
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-sm">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Row 2: Search + Quick Filters */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              {/* Search Box */}
              <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 focus-within:bg-white transition-all">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bạn muốn ăn gì hôm nay?"
                  className="flex-1 bg-transparent text-sm font-semibold outline-none text-gray-800 placeholder-gray-400"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex items-center shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-orange-300 focus:ring-2 focus:ring-orange-50 transition-all"
                  >
                    {sortOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 pointer-events-none" />
                </div>

                <div className="relative flex items-center shrink-0">
                  <select
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-orange-300 focus:ring-2 focus:ring-orange-50 transition-all"
                  >
                    <option value={Infinity}>Khoảng cách</option>
                    <option value={2}>&lt; 2 km</option>
                    <option value={5}>&lt; 5 km</option>
                    <option value={10}>&lt; 10 km</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 pointer-events-none" />
                </div>

                <div className="relative flex items-center shrink-0">
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-orange-300 focus:ring-2 focus:ring-orange-50 transition-all"
                  >
                    <option value={0}>Đánh giá</option>
                    <option value={4}>Từ 4.0 ⭐</option>
                    <option value={4.5}>Từ 4.5 ⭐</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveFilter(activeFilter === t("discovery.open_now") ? "All" : t("discovery.open_now"))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${activeFilter === t("discovery.open_now") ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"}`}
                >
                  🟢 Mở cửa
                </button>
              </div>
            </form>

            {/* Row 3: Quick Category Pills (URL-driven) */}
            <QuickCategoryBar activeSlug={activeCategory} onSelect={handleCategorySelect} />

          </div>
        </div>

        {/* ══════════════════ MAIN CONTENT ══════════════════ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-9">

          {/* ── Promo Banner ── */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#FF4500]" />
              Khuyến mãi &amp; Vouchers dành cho bạn
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {promotions.length === 0 ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] bg-gray-200 animate-pulse" />
                ))
              ) : (
                promotions.map((promo) => {
                  const isVoucher = promo.code.includes("10") || promo.code.includes("50") || promo.fixedDiscount;
                  const isFreeship = promo.promotionType === "shipping" || promo.code.includes("SHIP");
                  if (isVoucher) {
                    return (
                      <div key={promo.id} className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] p-5 text-white relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 shadow-md pointer-events-none select-none">
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
                        <div className="h-full flex flex-col justify-between relative z-10">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase">Voucher</span>
                              <span className="text-[10px] font-bold text-red-100">Đơn tối thiểu {Number(promo.minOrderValue).toLocaleString()}đ</span>
                            </div>
                            <h3 className="text-2xl font-black mt-1.5">{promo.code}</h3>
                            <p className="text-xs text-red-50/90 mt-1 line-clamp-1">{promo.description || "Giảm ngay hóa đơn đồ ăn"}</p>
                          </div>
                          <span className="px-3.5 py-1.5 bg-white text-red-600 text-xs font-black rounded-xl inline-block shadow-sm">Sao Chép Mã</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={promo.id} className={`snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] p-5 text-white relative overflow-hidden bg-gradient-to-br ${isFreeship ? "from-orange-500 to-red-600" : "from-green-500 to-teal-600"} shadow-md pointer-events-none select-none`}>
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
                      <div className="h-full flex flex-col justify-between relative z-10">
                        <div>
                          <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase">{isFreeship ? "Freeship" : "Ưu đãi"}</span>
                          <h3 className="text-xl font-black mt-2">{promo.code}</h3>
                          <p className="text-xs text-orange-50/90 mt-1 line-clamp-2">{promo.description || "Khuyến mãi hấp dẫn"}</p>
                        </div>
                        <span className="px-3.5 py-1.5 bg-white text-gray-800 text-xs font-black rounded-lg inline-block shadow-sm">Xem Cửa Hàng</span>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Hot Combo static card */}
              <div className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] p-5 text-white relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 shadow-md pointer-events-none select-none">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute right-4 top-4 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Hot Combo</div>
                <div className="h-full flex flex-col justify-between relative z-10">
                  <div>
                    <h3 className="text-xl font-black">Combo Gà Giòn Độc Quyền</h3>
                    <p className="text-xs text-amber-50/90 mt-1">2 Gà Giòn + Pepsi mát lạnh chỉ 59K</p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-white text-amber-600 text-xs font-black rounded-lg inline-flex items-center gap-1 shadow-sm">
                    Đặt Ngay <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Personalized / AI Section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Recent orders */}
            <div className="space-y-3.5">
              <h2 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                Đặt lại món gần đây
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {recentDisplayList.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/restaurant/${r.id}`)}
                    className="flex-shrink-0 w-64 bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-orange-200"
                  >
                    <img src={r.imageUrl || IMGS.restaurant} alt={r.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 truncate">{r.name}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{r.address || "Đà Nẵng"}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-black text-[#FF4500] bg-orange-50 px-2 py-0.5 rounded-lg">Đặt lại</span>
                        <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-0.5">⭐ {r.rating || "New"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Picks */}
            <div className="space-y-3.5">
              <h2 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" />
                Dành cho bạn
              </h2>
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg h-[90px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
                    <Brain className="w-5 h-5 text-indigo-300 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-black text-sm flex items-center gap-1.5 truncate">
                      {t("discovery.ai_picks")}
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">AI</span>
                    </h4>
                    <p className="text-indigo-200/60 text-xs mt-0.5 truncate">{t("discovery.ai_picks_desc")}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3.5 relative z-10 shrink-0">
                  <div className="flex -space-x-3">
                    {recommendedItemImages.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-slate-900 shadow-md" />
                    ))}
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] uppercase tracking-wider">
                    {t("discovery.view_picks")}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ══════════════════ 5. RESTAURANT LIST ══════════════════ */}
          <div className="space-y-4">

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-black text-gray-800">
                {activeCategoryName
                  ? `Cửa hàng · ${activeCategoryName}`
                  : "Tất cả cửa hàng"}
              </h2>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {loading ? t("common.loading") : `${filtered.length} ${t("discovery.restaurants_near")}`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse flex flex-col">
                    <div className="aspect-video bg-gray-200" />
                    <div className="p-5 space-y-4">
                      <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                      <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
                      <div className="border-t border-gray-50 pt-3 flex justify-between">
                        <div className="h-4 bg-gray-200 rounded-lg w-20" />
                        <div className="h-4 bg-gray-200 rounded-lg w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto">
                <span className="text-6xl">🍲</span>
                <h3 className="font-black text-gray-800 mt-4 text-base">Không tìm thấy nhà hàng nào</h3>
                <p className="text-gray-400 text-xs mt-1.5 font-medium">
                  {activeCategoryName
                    ? `Chưa có nhà hàng nào cho danh mục "${activeCategoryName}".`
                    : "Hãy thử xóa bớt bộ lọc hoặc tìm kiếm bằng từ khóa khác."}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-orange-500/20 uppercase tracking-wider"
                >
                  Xem tất cả cửa hàng
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {displayedRestaurants.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>

                {filtered.length > 8 && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setShowAllRestaurants(!showAllRestaurants)}
                      className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-black text-xs rounded-2xl border border-gray-200 hover:border-gray-300 shadow-sm transition-all hover:scale-[1.01] active:scale-95 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      {showAllRestaurants ? "Thu gọn danh sách" : `Xem tất cả cửa hàng (${filtered.length})`}
                      <ArrowRight className={`w-3.5 h-3.5 text-[#FF4500] transition-transform ${showAllRestaurants ? "-rotate-90" : ""}`} />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
