import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, MapPin, Heart, Plus, Minus, ShoppingCart, Flame, LogIn, X, Loader2, ChevronRight } from "lucide-react";
import { IMGS } from "../../data/mock";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRestaurants } from "../../features/restaurantSlice";
import type { MenuItem, OptionGroup, OptionChoice } from "../../features/restaurantSlice";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";

const restaurantImages = [IMGS.burger, IMGS.pizza, IMGS.chicken, IMGS.coffee, IMGS.sushi, IMGS.ramen, IMGS.dessert, IMGS.restaurant];

export default function RestaurantDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("All");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { t } = useTranslation();
  const { restaurants, loading } = useAppSelector((state) => state.restaurants);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoggedIn = !!accessToken;

  // Customize modal state
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const restaurantIndex = useMemo(
    () => restaurants.findIndex((item) => item.id === id),
    [id, restaurants]
  );
  const restaurant = restaurantIndex >= 0 ? restaurants[restaurantIndex] : undefined;
  const restaurantImage = restaurantImages[Math.max(restaurantIndex, 0) % restaurantImages.length];

  const { items, addItem: addToCart, removeItem: removeFromCart, getTotal, getItemCount } = useCartStore();
  const total = getTotal();
  const itemCount = getItemCount();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const cart = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = (acc[item.id] || 0) + item.qty;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  // Open customize modal or add directly if no options
  const handleAddClick = useCallback((itemId: string) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const item = restaurant?.menuItems?.find((i) => i.id === itemId);
    if (!item) return;

    if (item.optionGroups && item.optionGroups.length > 0) {
      // Pre-select first choice of required single-select groups
      const preSelected: Record<string, any> = {};
      item.optionGroups.forEach((group) => {
        if (group.isRequired && group.maxChoices === 1 && group.choices?.length > 0) {
          preSelected[group.name] = group.choices[0];
        }
      });
      setSelectedOptions(preSelected);
      setCustomizeItem(item);
    } else {
      // No options, add directly
      addItemToCart(item, {});
    }
  }, [isLoggedIn, restaurant]);

  const addItemToCart = useCallback(async (item: MenuItem, opts: Record<string, any>) => {
    if (!restaurant) return;
    setLoadingItemId(item.id);
    try {
      await addToCart({
        id: item.id,
        name: item.name,
        price: Number(item.basePrice),
        image: item.imageUrl || "",
        desc: item.description || "",
        optionGroups: item.optionGroups,
      }, restaurant.id, restaurant.name, Object.keys(opts).length > 0 ? opts : undefined);
    } finally {
      setLoadingItemId(null);
    }
  }, [restaurant, addToCart]);

  const handleConfirmCustomize = useCallback(async () => {
    if (!customizeItem) return;
    // Validate required groups
    for (const group of customizeItem.optionGroups || []) {
      if (group.isRequired) {
        const val = selectedOptions[group.name];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          alert(`Vui lòng chọn ${group.name}`);
          return;
        }
      }
    }
    setIsAddingToCart(true);
    try {
      await addItemToCart(customizeItem, selectedOptions);
      setCustomizeItem(null);
      setSelectedOptions({});
    } finally {
      setIsAddingToCart(false);
    }
  }, [customizeItem, selectedOptions, addItemToCart]);

  const removeItem = useCallback(async (itemId: string) => {
    if (loadingItemId) return;
    setLoadingItemId(itemId);
    try {
      await removeFromCart(itemId, restaurant?.id);
    } finally {
      setLoadingItemId(null);
    }
  }, [loadingItemId, removeFromCart, restaurant?.id]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">{loading ? t('common.loading') : "Restaurant not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Login Required Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "linear-gradient(135deg, #FFF5F0, #FFE8DC)" }}
            >
              <LogIn className="w-8 h-8 text-[#FF4500]" />
            </div>
            <h2 className="text-xl font-black text-gray-900 text-center mb-2">Đăng nhập để tiếp tục</h2>
            <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
              Bạn cần đăng nhập để thêm món vào giỏ hàng và tiến hành đặt đơn.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mb-3 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={() => navigate("/register")}
              className="w-full py-3.5 rounded-2xl text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Tạo tài khoản mới
            </button>
            <p className="text-xs text-gray-400 text-center mt-4">
              Bạn có thể tiếp tục xem thực đơn mà không cần đăng nhập
            </p>
          </div>
        </div>
      )}

      {/* Customize Options Modal */}
      {customizeItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => { setCustomizeItem(null); setSelectedOptions({}); }}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-4 p-5 border-b border-gray-100">
              <img
                src={customizeItem.imageUrl}
                alt={customizeItem.name}
                className="w-14 h-14 rounded-2xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base truncate">{customizeItem.name}</h3>
                <p className="text-sm text-[#FF4500] font-semibold">{Number(customizeItem.basePrice).toLocaleString()}đ</p>
              </div>
              <button
                onClick={() => { setCustomizeItem(null); setSelectedOptions({}); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {customizeItem.optionGroups?.map((group: OptionGroup) => {
                const isSingle = group.maxChoices === 1;
                const currentVal = selectedOptions[group.name];

                return (
                  <div key={group.id}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-gray-800 text-sm">{group.name}</p>
                      {group.isRequired ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "#FF4500" }}>
                          Bắt buộc
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Tuỳ chọn</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.choices?.map((choice: OptionChoice) => {
                        const priceExtra = Number(choice.additionalPrice);
                        const isChecked = isSingle
                          ? currentVal?.id === choice.id
                          : (Array.isArray(currentVal) ? currentVal : []).some((c: any) => c.id === choice.id);

                        return (
                          <label
                            key={choice.id}
                            className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                              isChecked
                                ? "border-[#FF4500] bg-orange-50"
                                : "border-gray-100 hover:border-orange-200 hover:bg-orange-50/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isChecked ? "border-[#FF4500] bg-[#FF4500]" : "border-gray-300"
                              }`}>
                                {isChecked && (
                                  <div className={isSingle ? "w-2 h-2 rounded-full bg-white" : ""}>
                                    {!isSingle && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                        <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7-1-0.5z"/>
                                      </svg>
                                    )}
                                  </div>
                                )}
                              </div>
                              <input
                                type={isSingle ? "radio" : "checkbox"}
                                name={group.name}
                                checked={isChecked}
                                onChange={() => {
                                  if (isSingle) {
                                    setSelectedOptions(prev => ({ ...prev, [group.name]: choice }));
                                  } else {
                                    const currentList = Array.isArray(currentVal) ? currentVal : [];
                                    const exists = currentList.some((c: any) => c.id === choice.id);
                                    const canAdd = !exists && currentList.length < group.maxChoices;
                                    const newList = exists
                                      ? currentList.filter((c: any) => c.id !== choice.id)
                                      : canAdd ? [...currentList, choice] : currentList;
                                    setSelectedOptions(prev => ({ ...prev, [group.name]: newList }));
                                  }
                                }}
                                className="sr-only"
                              />
                              <span className="text-sm font-medium text-gray-700">{choice.name}</span>
                            </div>
                            {priceExtra > 0 && (
                              <span className="text-sm font-semibold text-gray-500">+{priceExtra.toLocaleString()}đ</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    {!isSingle && (
                      <p className="text-xs text-gray-400 mt-2">Chọn tối đa {group.maxChoices} lựa chọn</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add to Cart Button */}
            <div className="p-5 border-t border-gray-100">
              <button
                onClick={handleConfirmCustomize}
                disabled={isAddingToCart}
                className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 24px rgba(255,69,0,0.3)" }}
              >
                {isAddingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Thêm vào giỏ hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img src={restaurantImage} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          onClick={() => navigate("/explore")}
          className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
          <Heart className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-10 pb-28 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Restaurant info card */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-black text-gray-900 mb-1">{restaurant.name}</h1>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {restaurant.categories.map((category) => (
                      <span key={category.id} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{category.name}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <strong className="text-gray-800">{restaurant.rating ?? "New"}</strong> {t('restaurant.rating_count')}
                    </span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />20-30 min</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{restaurant.address}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {restaurant.isActive && (
                    <span className="px-3 py-1.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      Open
                    </span>
                  )}
                  <span className="text-sm text-green-500 font-semibold mt-1">
                    {t('restaurant.free_delivery_promo')}
                  </span>
                </div>
              </div>

              {/* Promo banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #FFF5F0, #FFE8DC)" }}>
                <Flame className="w-5 h-5 text-[#FF4500]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t('restaurant.buy_2_get')} free fries</p>
                  <p className="text-xs text-gray-500">{t('restaurant.use_code')} COMBO2 {t('restaurant.at_checkout')}</p>
                </div>
              </div>
            </div>

            {/* Menu tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
              <button
                onClick={() => setActiveTab("All")}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${activeTab === "All" ? "text-white" : "bg-white text-gray-600 border border-gray-200"}`}
                style={activeTab === "All" ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
              >
                {t('common.all')}
              </button>
              {restaurant.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.name)}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${activeTab === cat.name ? "text-white" : "bg-white text-gray-600 border border-gray-200"}`}
                  style={activeTab === cat.name ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu items */}
            <div className="space-y-3">
              {restaurant.menuItems
                ?.filter((item) => {
                  if (activeTab === "All") return true;
                  const activeCat = restaurant.categories.find((c) => c.name === activeTab);
                  return activeCat ? item.categoryId === activeCat.id : false;
                })
                .map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 border border-gray-100 hover:border-orange-200 transition-all group">
                    <img src={item.imageUrl} alt={item.name} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-500 mb-1 line-clamp-2">{item.description}</p>
                          {item.optionGroups && item.optionGroups.length > 0 && (
                            <p className="text-xs text-[#FF4500] font-medium flex items-center gap-0.5">
                              <ChevronRight className="w-3 h-3" /> {item.optionGroups.length} tuỳ chọn
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-gray-900 shrink-0">{Number(item.basePrice).toLocaleString()}đ</p>
                      </div>
                      <div className="flex items-center justify-end mt-2">
                        {cart[item.id] ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={loadingItemId === item.id}
                              className="w-8 h-8 rounded-full border-2 border-[#FF4500] flex items-center justify-center text-[#FF4500] hover:bg-orange-50 transition-colors disabled:opacity-50"
                            >
                              {loadingItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Minus className="w-3 h-3" />}
                            </button>
                            <span className="font-bold text-gray-900 w-5 text-center">{cart[item.id]}</span>
                            <button
                              onClick={() => handleAddClick(item.id)}
                              disabled={loadingItemId === item.id}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
                              style={{ background: "#FF4500" }}
                            >
                              {loadingItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddClick(item.id)}
                            disabled={loadingItemId === item.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                          >
                            {loadingItemId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {item.optionGroups && item.optionGroups.length > 0 ? "Chọn" : t('common.add')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Cart sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#FF4500]" /> {t('cart.your_cart')}
              </h2>
              {itemCount === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="text-gray-400 text-sm">{t('cart.empty')}</p>
                  <p className="text-gray-400 text-xs mt-1">{t('cart.add_items')}</p>
                  {!isLoggedIn && (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold mx-auto transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                    >
                      <LogIn className="w-4 h-4" /> Đăng nhập để đặt hàng
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 font-medium block truncate">{item.name}</span>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {Object.entries(item.selectedOptions).map(([k, v]: [string, any]) => {
                                const val = Array.isArray(v) ? v.map((c: any) => c.name).join(", ") : v?.name;
                                return val ? <span key={k} className="block">{k}: {val}</span> : null;
                              })}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">x{item.qty}</span>
                        <span className="text-sm font-semibold text-gray-900 shrink-0">{(item.price * item.qty).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{t('cart.subtotal')}</span><span>{total.toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{t('cart.delivery_fee')}</span><span className="text-green-500">{t('discovery.free_delivery')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{t('cart.total')}</span><span>{total.toLocaleString()}đ</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/checkout")}
                    className="w-full py-3.5 rounded-2xl text-white font-bold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                  >
                    {t('checkout.checkout')} ({itemCount} {t('cart.items')})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile cart bar */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <button
            onClick={() => navigate("/checkout")}
            className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-between px-6 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
          >
            <span className="bg-white/20 rounded-xl px-2 py-0.5 text-sm">{itemCount}</span>
            <span>{t('cart.your_cart')}</span>
            <span>{total.toLocaleString()}đ</span>
          </button>
        </div>
      )}
    </div>
  );
}
