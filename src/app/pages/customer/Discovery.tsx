import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Star, Clock, MapPin, Heart, Brain } from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { IMGS } from "../../data/mock";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRestaurants } from "../../features/restaurantSlice";

const categoryIcons: Record<string, string> = {
  Burger: "🍔",
  Pizza: "🍕",
  Chicken: "🍗",
  Drinks: "🥤",
  Coffee: "☕",
  Sushi: "🍣",
  Ramen: "🍜",
  Dessert: "🍰",
  BBQ: "🔥",
  "Fast Food": "🍟",
};

const restaurantImages = [IMGS.burger, IMGS.pizza, IMGS.chicken, IMGS.coffee, IMGS.sushi, IMGS.ramen, IMGS.dessert, IMGS.restaurant];

const getRestaurantImage = (index: number) => restaurantImages[index % restaurantImages.length];

export default function Discovery() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const { t } = useTranslation();
  const { restaurants, loading } = useAppSelector((state) => state.restaurants);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const apiCategories = useMemo(() => {
    const categoryNames = (restaurants ?? []).flatMap((restaurant) => restaurant.categories.map((category) => category.name));
    return Array.from(new Set(categoryNames));
  }, [restaurants]);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return (restaurants ?? []).filter((restaurant) => {
      const matchesSearch =
        restaurant.name.toLowerCase().includes(keyword) ||
        restaurant.categories.some((category) => category.name.toLowerCase().includes(keyword));
      const matchesCategory =
        activeCategory === "All" ||
        activeCategory === t('common.all') ||
        restaurant.categories.some((category) => category.name === activeCategory);

      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, restaurants, search, t]);

  const translatedFilters = [
    "All",
    t('discovery.open_now'),
    t('discovery.free_delivery'),
    t('discovery.under_30_min'),
    t('discovery.top_rated'),
    t('discovery.new'),
  ];

  const translatedSortOptions = [
    t('discovery.relevance'),
    t('home.rating'),
    t('discovery.distance'),
    t('discovery.delivery_time'),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex gap-3 items-center">
              {/* Search */}
              <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('discovery.search_placeholder')}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {/* Location */}
              <div className="hidden md:flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-[#FF4500]" />
                <span>123 Main St</span>
              </div>
              {/* Filter button */}
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <SlidersHorizontal className="w-4 h-4" /> {t('discovery.filters')}
              </button>
            </div>
          </div>
          {/* Categories */}
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[t('common.all'), ...apiCategories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeCategory === cat ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  style={activeCategory === cat ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
                >
                  {categoryIcons[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* AI Recommendation Banner */}
          <div
            className="rounded-3xl p-6 mb-8 flex items-center justify-between overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E1040)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <p className="text-white font-bold">{t('discovery.ai_picks')}</p>
                <p className="text-gray-400 text-sm">{t('discovery.ai_picks_desc')}</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              {[IMGS.burger, IMGS.sushi, IMGS.ramen].map((img, i) => (
                <img key={i} src={img} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
              ))}
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium rounded-xl transition-colors">
                {t('discovery.view_picks')}
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {translatedFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${activeFilter === f ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {f === t('discovery.open_now') && "🟢 "}{f === t('discovery.free_delivery') && "🆓 "}{f === t('discovery.top_rated') && "⭐ "}{f}
                </button>
              ))}
            </div>
            <select className="hidden md:block px-4 py-2 rounded-xl text-sm bg-white border border-gray-200 text-gray-600 outline-none cursor-pointer">
              {translatedSortOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <p className="text-sm text-gray-500 mb-5">
            {loading ? t('common.loading') : `${filtered.length} ${t('discovery.restaurants_near')}`}
          </p>

          {/* Restaurant grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((r, index) => (
              <div
                key={r.id}
                onClick={() => navigate(`/restaurant/${r.id}`)}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={getRestaurantImage(index)} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {r.isActive && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      Open
                    </span>
                  )}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{r.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.categories.slice(0, 3).map((category) => (
                      <span key={category.id} className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{category.name}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-800">{r.rating ?? "New"}</span>
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="w-3.5 h-3.5" /> 20-30 min
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.address}</span>
                    <span className="text-green-500 font-semibold">{t('restaurant.free_delivery_promo')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
