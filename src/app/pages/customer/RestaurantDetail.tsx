import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, MapPin, Heart, Plus, Minus, ShoppingCart, Flame } from "lucide-react";
import { menuCategories, restaurants } from "../../data/mock";
import { useTranslation } from "react-i18next";

export default function RestaurantDetail() {
  const navigate = useNavigate();
  const restaurant = restaurants[0];
  const [activeTab, setActiveTab] = useState("Popular");
  const [cart, setCart] = useState<Record<string, number>>({});
  const { t } = useTranslation();

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuCategories.flatMap((c) => c.items).find((i) => i.id === id);
    return sum + (item?.price || 0) * qty;
  }, 0);

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const addItem = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id: string) => setCart((c) => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
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

      <div className="max-w-6xl mx-auto px-6 -mt-10 pb-28">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Restaurant info card */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 mb-1">{restaurant.name}</h1>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {restaurant.tags.map((t) => (
                      <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <strong className="text-gray-800">{restaurant.rating}</strong> ({restaurant.reviews} {t('restaurant.rating_count')})
                    </span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{restaurant.deliveryTime}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{restaurant.distance}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {restaurant.promo && (
                    <span className="px-3 py-1.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {restaurant.promo}
                    </span>
                  )}
                  <span className={`text-sm ${restaurant.deliveryFee === "Free" ? "text-green-500 font-semibold" : "text-gray-500"}`}>
                    {restaurant.deliveryFee === "Free" ? t('restaurant.free_delivery_promo') : `${restaurant.deliveryFee} ${t('restaurant.delivery_fee')}`}
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
              {menuCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveTab(cat.name)}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                    activeTab === cat.name ? "text-white" : "bg-white text-gray-600 border border-gray-200"
                  }`}
                  style={activeTab === cat.name ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu items */}
            {menuCategories.map((cat) => (
              <div key={cat.name} className={cat.name !== activeTab ? "hidden" : ""}>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 border border-gray-100 hover:border-orange-200 transition-all group">
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.desc}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{item.rating}</span>
                              <span>{item.cal} {t('restaurant.kcal')}</span>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-gray-900 shrink-0">${item.price}</p>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          {cart[item.id] ? (
                            <div className="flex items-center gap-3">
                              <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-full border-2 border-[#FF4500] flex items-center justify-center text-[#FF4500] hover:bg-orange-50 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-gray-900 w-5 text-center">{cart[item.id]}</span>
                              <button onClick={() => addItem(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors" style={{ background: "#FF4500" }}>
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addItem(item.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                            >
                              <Plus className="w-4 h-4" /> {t('common.add')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {Object.entries(cart).map(([id, qty]) => {
                      const item = menuCategories.flatMap((c) => c.items).find((i) => i.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-700 flex-1 truncate">{item.name}</span>
                          <span className="text-xs text-gray-400">x{qty}</span>
                          <span className="text-sm font-semibold text-gray-900">${(item.price * qty).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{t('cart.subtotal')}</span><span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{t('cart.delivery_fee')}</span><span className="text-green-500">{t('discovery.free_delivery')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{t('cart.total')}</span><span>${total.toFixed(2)}</span>
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
            <span>${total.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
