import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, MapPin, Brain, ChevronDown,
  RotateCcw, Gift, ArrowRight,
  Copy, Check, Star, Crown, Zap,
} from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { IMGS } from "../../data/mock";
import { quickCategories, resolveSlugToKeywords } from "../../data/categories";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRestaurants } from "../../features/restaurantSlice";
import { selectSelectedAddress } from "../../features/mapSelectors";
import { detectCurrentLocation } from "../../features/mapThunk";
import { calculateDistance } from "../../utils/geo";
import { Loader2 } from "lucide-react";
import { orderService } from "../../services/orderService";
import { useCartStore } from "../../stores/cartStore";
import { useAuthStore } from "../../stores/authStore";
import type { Promotion, Order } from "../../types/order";
import { QuickCategoryBar } from "../../components/layout/QuickCategoryBar";
import { RestaurantCard } from "../../components/layout/RestaurantCard";
import { restaurantService } from "../../services/restaurantService";
import type { Restaurant } from "../../types/restaurant";
import { X } from "lucide-react";

// ── Rank config ─────────────────────────────────────────────────────────────
const RANK_CONFIG = [
  {
    level: "Newbie",
    label: "Newbie",
    emoji: "🌱",
    minPoints: 0,
    color: "from-gray-400 to-gray-500",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    vouchers: [
      { code: "WELCOME10", desc: "Giảm 10% cho đơn đầu tiên", minOrder: 50000 },
    ],
  },
  {
    level: "Bronze",
    label: "Đồng",
    emoji: "🥉",
    minPoints: 100,
    color: "from-amber-600 to-amber-700",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    vouchers: [
      { code: "BRONZE15", desc: "Giảm 15% tối đa 30K", minOrder: 80000 },
      { code: "BSHIP", desc: "Freeship cho mọi đơn hàng", minOrder: 50000 },
    ],
  },
  {
    level: "Silver",
    label: "Bạc",
    emoji: "🥈",
    minPoints: 300,
    color: "from-slate-400 to-slate-500",
    textColor: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    vouchers: [
      { code: "SILVER20", desc: "Giảm 20% tối đa 50K", minOrder: 100000 },
      { code: "SSHIP", desc: "Freeship mỗi ngày", minOrder: 0 },
      { code: "SILVEX5", desc: "Tặng 5x điểm thưởng", minOrder: 120000 },
    ],
  },
  {
    level: "Gold",
    label: "Vàng",
    emoji: "🥇",
    minPoints: 1000,
    color: "from-yellow-400 to-amber-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    vouchers: [
      { code: "GOLD25", desc: "Giảm 25% không giới hạn", minOrder: 150000 },
      { code: "GSHIP", desc: "Freeship không giới hạn", minOrder: 0 },
      { code: "GOLDX10", desc: "Tặng 10x điểm thưởng", minOrder: 200000 },
      { code: "GOLDSUR", desc: "Quà bí ẩn mỗi tuần", minOrder: 0 },
    ],
  },
  {
    level: "Platinum",
    label: "Bạch Kim",
    emoji: "💎",
    minPoints: 2500,
    color: "from-cyan-400 to-indigo-500",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    vouchers: [
      { code: "PLAT30", desc: "Giảm 30% không giới hạn", minOrder: 200000 },
      { code: "PLATSHIP", desc: "Freeship vĩnh viễn", minOrder: 0 },
      { code: "PLATX20", desc: "Tặng 20x điểm thưởng", minOrder: 0 },
      { code: "PLATPRI", desc: "Ưu tiên hỗ trợ 24/7", minOrder: 0 },
      { code: "PLATBD", desc: "Voucher sinh nhật 50%", minOrder: 0 },
    ],
  },
];

export default function Discovery() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [aiRecommendations, setAiRecommendations] = useState<Restaurant[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedRankLevel, setSelectedRankLevel] = useState<string | null>(null);

  // ── URL-driven state (sync on mount) ────────────────────────────────────
  const categoryParam = searchParams.get("category") ?? "all";
  const qParam = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(qParam);
  const [activeCategory, setActiveCategory] = useState(categoryParam); // slug or "all"
  const [activeFilter, setActiveFilter] = useState("All");
  const selectedAddress = useAppSelector(selectSelectedAddress);
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

  // Derived rank info
  const userPoints = user?.profile?.rewardPoints ?? 0;
  const userRank = useMemo(() => {
    const sorted = [...RANK_CONFIG].sort((a, b) => b.minPoints - a.minPoints);
    return sorted.find((r) => userPoints >= r.minPoints) ?? RANK_CONFIG[0];
  }, [userPoints]);
  const nextRank = useMemo(() => {
    const idx = RANK_CONFIG.findIndex((r) => r.level === userRank.level);
    return idx < RANK_CONFIG.length - 1 ? RANK_CONFIG[idx + 1] : null;
  }, [userRank]);
  const progressToNext = useMemo(() => {
    if (!nextRank) return 100;
    const range = nextRank.minPoints - userRank.minPoints;
    const earned = userPoints - userRank.minPoints;
    return Math.min(100, Math.round((earned / range) * 100));
  }, [userPoints, userRank, nextRank]);

  // Copy voucher code
  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }, []);

  // Rank detail modal – show vouchers for selected rank
  const selectedRankConfig = useMemo(
    () => RANK_CONFIG.find((r) => r.level === selectedRankLevel) ?? null,
    [selectedRankLevel]
  );

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

  useEffect(() => {
    restaurantService.getRecommendations()
      .then((data) => setAiRecommendations(data || []))
      .catch((err) => console.error("Recommendations:", err));
  }, []);
  const handleLocate = async () => {
    setIsLocating(true);
    try {
      await dispatch(detectCurrentLocation()).unwrap();
    } catch (error) {
      console.error("Failed to locate user:", error);
    } finally {
      setIsLocating(false);
    }
  };

  const comboItems = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      desc: string;
      price: number;
      img: string;
      restaurantId: string;
      restaurantName: string;
    }> = [];

    for (const r of restaurants || []) {
      if (r.menuItems) {
        for (const item of r.menuItems) {
          const isCombo = item.name.toLowerCase().includes("combo") ||
            (item.category && item.category.name.toLowerCase().includes("combo"));
          if (isCombo) {
            list.push({
              id: item.id,
              name: item.name,
              desc: item.description || "",
              price: Number(item.basePrice),
              img: item.imageUrl || IMGS.restaurant,
              restaurantId: r.id,
              restaurantName: r.name,
            });
          }
        }
      }
    }
    return list;
  }, [restaurants]);

  const handleOrderCombo = async (combo: {
    id: string;
    name: string;
    desc: string;
    price: number;
    img: string;
    restaurantId: string;
    restaurantName: string;
  }) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt hàng!");
      navigate("/login");
      return;
    }
    try {
      await useCartStore.getState().addItem(
        {
          id: combo.id,
          name: combo.name,
          price: combo.price,
          image: combo.img,
          desc: combo.desc,
          selectedOptions: {},
          optionGroups: [],
        },
        combo.restaurantId,
        combo.restaurantName
      );
      toast.success(`Đã thêm ${combo.name} vào giỏ hàng thành công!`);
      navigate("/cart");
    } catch (error) {
      console.error("Lỗi đặt combo:", error);
    }
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
          r.categories?.some((c) => c.name.toLowerCase().includes(keyword)) ||
          r.menuItems?.some((m) => m.name.toLowerCase().includes(keyword))
      );
    }

    // Category filter via slug → keyword matching
    if (activeCategory && activeCategory !== "all") {
      const keywords = resolveSlugToKeywords(activeCategory);
      if (keywords.length > 0) {
        baseResult = baseResult.filter((r) =>
          r.categories?.some((c) =>
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
        if (selectedAddress && r.latitude && r.longitude) {
          dist = calculateDistance(selectedAddress.lat, selectedAddress.lng, Number(r.latitude), Number(r.longitude));
        }
        return dist < 4;
      });
    }

    // Attach distance
    const withDistance = baseResult.map((r) => {
      let dist = Infinity;
      if (selectedAddress && r.latitude && r.longitude) {
        dist = calculateDistance(selectedAddress.lat, selectedAddress.lng, Number(r.latitude), Number(r.longitude));
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
  }, [activeCategory, restaurants, search, t, minRating, activeFilter, selectedAddress, maxDistance, sortBy]);

  const displayedRestaurants = useMemo(
    () => (showAllRestaurants ? filtered : filtered.slice(0, 8)),
    [filtered, showAllRestaurants]
  );

  // ── Recent orders ───────────────────────────────────────────────────────
  const recommendedItemImages = useMemo(() => {
    const images: string[] = [];
    const sourceList = aiRecommendations.length > 0 ? aiRecommendations : restaurants;
    for (const r of sourceList || []) {
      if (r.imageUrl) images.push(r.imageUrl);
      if (r.menuItems) {
        for (const item of r.menuItems) {
          if (item.imageUrl) images.push(item.imageUrl);
        }
      }
      if (images.length >= 3) break;
    }
    while (images.length < 3) images.push(IMGS.restaurant);
    return images.slice(0, 3);
  }, [restaurants, aiRecommendations]);

  const recentDisplayList = useMemo(() => {
    const uniques = new Map<string, {
      id: string;
      name: string;
      logo?: string;
      address?: string;
      rating?: string | number | null;
    }>();
    for (const order of recentOrders || []) {
      if (order.restaurant && !uniques.has(order.restaurant.id)) {
        uniques.set(order.restaurant.id, {
          id: order.restaurant.id,
          name: order.restaurant.name,
          logo: order.restaurant.logo,
          address: order.restaurant.address,
          rating: restaurants?.find((res) => res.id === order.restaurant?.id)?.rating || null,
        });
      }
    }
    const list = Array.from(uniques.values());
    if (list.length > 0) return list.slice(0, 4);
    return (restaurants || []).slice(0, 3).map((r) => ({
      id: r.id,
      name: r.name,
      logo: r.imageUrl || undefined,
      address: r.address,
      rating: r.rating,
    }));
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

            {/* Row 1: Address */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-full cursor-pointer group" onClick={handleLocate}>
                <div className="w-9 h-9 rounded-full bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-colors">
                  {isLocating ? <Loader2 className="w-4 h-4 text-[#FF4500] animate-spin" /> : <MapPin className="w-4 h-4 text-[#FF4500]" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Địa chỉ giao hàng</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 truncate mt-1 group-hover:text-[#FF4500] transition-colors">
                    {selectedAddress ? (selectedAddress.address || `Đã định vị (${selectedAddress.lat.toFixed(4)}, ${selectedAddress.lng.toFixed(4)})`) : "Nhấp định vị vị trí của tôi"}
                  </p>
                </div>
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
                      <div
                        key={promo.id}
                        onClick={() => handleCopyCode(promo.code)}
                        className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] p-5 text-white relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 shadow-md cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
                      >
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
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(promo.code); }}
                            className="px-3.5 py-1.5 bg-white text-red-600 text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-sm hover:bg-red-50 transition-colors w-fit"
                          >
                            {copiedCode === promo.code ? <><Check className="w-3 h-3" /> Đã sao chép!</> : <><Copy className="w-3 h-3" /> Sao Chép Mã</>}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={promo.id}
                      onClick={() => {
                        if (promo.restaurantId) {
                          navigate(`/restaurant/${promo.restaurantId}`);
                        } else {
                          handleCopyCode(promo.code);
                        }
                      }}
                      className={`snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] p-5 text-white relative overflow-hidden bg-gradient-to-br ${isFreeship ? "from-orange-500 to-red-600" : "from-green-500 to-teal-600"} shadow-md cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]`}
                    >
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
                      <div className="h-full flex flex-col justify-between relative z-10">
                        <div>
                          <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase">{isFreeship ? "Freeship" : "Ưu đãi"}</span>
                          <h3 className="text-xl font-black mt-2">{promo.code}</h3>
                          <p className="text-xs text-orange-50/90 mt-1 line-clamp-2">{promo.description || "Khuyến mãi hấp dẫn"}</p>
                        </div>
                        <button className="px-3.5 py-1.5 bg-white text-gray-800 text-xs font-black rounded-lg inline-flex items-center gap-1 shadow-sm hover:bg-gray-50 transition-colors w-fit">
                          Xem Cửa Hàng <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Dynamic Combo cards */}
              {comboItems.length === 0 ? (
                <div
                  onClick={() => setActiveCategory("combo")}
                  className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] p-5 text-white relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 shadow-md cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
                >
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
                  <div className="absolute right-4 top-4 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Hot Combo</div>
                  <div className="h-full flex flex-col justify-between relative z-10">
                    <div>
                      <h3 className="text-xl font-black">Combo Gà Giòn Độc Quyền</h3>
                      <p className="text-xs text-amber-50/90 mt-1">2 Gà Giòn + Pepsi mát lạnh chỉ 59K</p>
                    </div>
                    <button className="px-3.5 py-1.5 bg-white text-amber-600 text-xs font-black rounded-lg inline-flex items-center gap-1 shadow-sm hover:bg-amber-50 transition-colors w-fit">
                      Đặt Ngay <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                comboItems.map((combo) => (
                  <div
                    key={combo.id}
                    onClick={() => handleOrderCombo(combo)}
                    className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] h-44 rounded-[2rem] p-5 text-white relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 shadow-md cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  >
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute right-4 top-4 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Hot Combo</div>
                    <div className="h-full flex flex-col justify-between relative z-10">
                      <div>
                        <h3 className="text-xl font-black truncate">{combo.name}</h3>
                        <p className="text-xs text-amber-50/90 mt-1 line-clamp-2">{combo.desc}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold bg-white/25 px-2.5 py-1 rounded-xl">{combo.price.toLocaleString("vi-VN")}đ</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOrderCombo(combo); }}
                          className="px-3.5 py-1.5 bg-white text-amber-600 text-xs font-black rounded-lg inline-flex items-center gap-1 shadow-sm hover:bg-amber-50 transition-colors w-fit"
                        >
                          Đặt Ngay <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Member Rank & Exclusive Vouchers ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Hạng thành viên &amp; Ưu đãi độc quyền
              </h2>
              {user && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${userRank.bgColor} ${userRank.borderColor} border`}>
                  <span className="text-sm">{userRank.emoji}</span>
                  <span className={`text-xs font-black ${userRank.textColor}`}>{userRank.label}</span>
                  <span className={`text-[10px] font-bold ${userRank.textColor} opacity-70`}>· {userPoints} điểm</span>
                </div>
              )}
            </div>

            {/* Progress to next rank */}
            {user && nextRank && (
              <div className={`rounded-2xl p-4 ${userRank.bgColor} border ${userRank.borderColor} flex items-center gap-4`}>
                <div className="shrink-0 text-2xl">{userRank.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${userRank.textColor}`}>
                    Còn <span className="font-black">{nextRank.minPoints - userPoints} điểm</span> để lên hạng {nextRank.emoji} {nextRank.label}
                  </p>
                  <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${userRank.color} rounded-full transition-all duration-700`}
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-black ${userRank.textColor}`}>{progressToNext}%</span>
              </div>
            )}

            {/* Rank tier cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {RANK_CONFIG.map((rank) => {
                const isUnlocked = !user || userPoints >= rank.minPoints;
                const isCurrent = user && userRank.level === rank.level;
                return (
                  <div
                    key={rank.level}
                    onClick={() => setSelectedRankLevel(rank.level)}
                    className={`snap-start shrink-0 w-48 rounded-2xl p-4 border cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] ${isCurrent
                      ? `bg-gradient-to-br ${rank.color} text-white border-transparent shadow-lg`
                      : isUnlocked
                        ? `${rank.bgColor} ${rank.borderColor} hover:shadow-md`
                        : "bg-gray-50 border-gray-100 opacity-60"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{rank.emoji}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-white/25 rounded-full text-[9px] font-black uppercase tracking-widest">Hạng của bạn</span>
                      )}
                      {!isUnlocked && <span className="text-[10px] text-gray-400">🔒 {rank.minPoints}đ</span>}
                    </div>
                    <h4 className={`font-black text-sm ${isCurrent ? "text-white" : userRank.textColor}`}>{rank.label}</h4>
                    <p className={`text-[10px] mt-0.5 ${isCurrent ? "text-white/70" : "text-gray-400"}`}>
                      {rank.vouchers.length} ưu đãi độc quyền
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      <Zap className={`w-3 h-3 ${isCurrent ? "text-white/80" : "text-gray-400"}`} />
                      <span className={`text-[10px] font-bold ${isCurrent ? "text-white/80" : "text-gray-400"}`}>Từ {rank.minPoints.toLocaleString()} điểm</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* My rank vouchers – always show current rank vouchers */}
            {user && (
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Voucher độc quyền hạng {userRank.label} của bạn</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {userRank.vouchers.map((v) => (
                    <div
                      key={v.code}
                      className={`shrink-0 rounded-2xl border-2 border-dashed ${userRank.borderColor} ${userRank.bgColor} p-4 flex flex-col justify-between min-w-[180px] relative`}
                    >
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${userRank.textColor} opacity-70`}>Voucher độc quyền</span>
                        <h4 className={`font-black text-lg mt-1 ${userRank.textColor}`}>{v.code}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{v.desc}</p>
                        {v.minOrder > 0 && <p className="text-[9px] text-gray-400 mt-0.5">Đơn từ {v.minOrder.toLocaleString()}đ</p>}
                      </div>
                      <button
                        onClick={() => handleCopyCode(v.code)}
                        className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r ${userRank.color} text-white shadow-sm hover:opacity-90 transition-opacity w-fit`}
                      >
                        {copiedCode === v.code ? <><Check className="w-3 h-3" /> Đã sao chép!</> : <><Copy className="w-3 h-3" /> Sao chép</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    <img src={r.logo || IMGS.restaurant} alt={r.name} className="w-14 h-14 rounded-xl object-cover" />
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
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] uppercase tracking-wider"
                  >
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

      {/* ── Rank Detail Modal ── */}
      {selectedRankConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedRankLevel(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-6 bg-gradient-to-br ${selectedRankConfig.color} text-white relative overflow-hidden`}>
              <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedRankConfig.emoji}</span>
                  <div>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Hạng thành viên</p>
                    <h3 className="font-black text-2xl">{selectedRankConfig.label}</h3>
                    <p className="text-white/70 text-[11px] mt-0.5">Từ {selectedRankConfig.minPoints.toLocaleString()} điểm</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRankLevel(null)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {user && userRank.level === selectedRankConfig.level && (
                <div className="mt-3 flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5 w-fit relative z-10">
                  <Star className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-[11px] font-black text-white">Hạng hiện tại của bạn</span>
                </div>
              )}
            </div>

            {/* Vouchers list */}
            <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                {selectedRankConfig.vouchers.length} Voucher độc quyền
              </p>
              {selectedRankConfig.vouchers.map((v) => {
                const isUnlocked = !user || userPoints >= selectedRankConfig.minPoints;
                return (
                  <div
                    key={v.code}
                    className={`rounded-2xl border-2 border-dashed p-4 flex items-center gap-4 ${isUnlocked
                      ? `${selectedRankConfig.bgColor} ${selectedRankConfig.borderColor}`
                      : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-black text-base ${isUnlocked ? selectedRankConfig.textColor : "text-gray-400"}`}>
                          {v.code}
                        </h4>
                        {!isUnlocked && <span className="text-[10px] text-gray-400">🔒 Chưa mở khóa</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{v.desc}</p>
                      {v.minOrder > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Đơn từ {v.minOrder.toLocaleString()}đ</p>
                      )}
                    </div>
                    {isUnlocked && (
                      <button
                        onClick={() => handleCopyCode(v.code)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r ${selectedRankConfig.color} text-white shadow-sm hover:opacity-90 transition-opacity`}
                      >
                        {copiedCode === v.code ? <><Check className="w-3 h-3" /> Đã sao!</> : <><Copy className="w-3 h-3" /> Sao chép</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Picks Glassmorphism Modal ── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-lg">AI Picks</h3>
                  <p className="text-xs text-indigo-600 font-bold">Gợi ý dựa trên sở thích và đánh giá của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {aiRecommendations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="font-semibold text-sm">Chưa có gợi ý nào dành cho bạn.</p>
                  <p className="text-xs mt-1">AI sẽ cập nhật sau khi bạn đặt hàng hoặc đánh giá nhà hàng.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiRecommendations.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setShowAiModal(false);
                        navigate(`/restaurant/${r.id}`);
                      }}
                      className="group bg-white hover:bg-indigo-50/20 border border-gray-100 hover:border-indigo-100 rounded-2xl p-3 flex gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <img
                        src={r.imageUrl || IMGS.restaurant}
                        alt={r.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                            {r.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{r.address}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">⭐ {Number(r.rating || 0).toFixed(1)}</span>
                          <span className="text-[10px] font-black text-[#FF4500] hover:underline">Khám phá</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
