import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, Tag, Users, Share2, CheckCircle, LogIn, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCartStore } from "../../stores/cartStore";
import { useAuthStore } from "../../stores/authStore";

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQty, getTotal, getItemCount, restaurantId, restaurantName } = useCartStore();
  const user = useAuthStore((state) => state.user);
  
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleUpdateQty = useCallback(async (id: string, delta: number, itemRestaurantId?: string) => {
    if (loadingItemId) return;
    setLoadingItemId(id);
    try {
      await updateQty(id, delta, itemRestaurantId);
    } finally {
      setLoadingItemId(null);
    }
  }, [loadingItemId, updateQty]);

  const subtotal = getTotal();
  const itemCount = getItemCount();
  const discount = promoApplied ? subtotal * 0.2 : 0;
  const delivery = itemCount > 0 ? 15000 : 0; // 15,000 VND
  const platformFee = itemCount > 0 ? 5000 : 0; // 5,000 VND
  const total = subtotal - discount + delivery + platformFee;

  // Chưa đăng nhập → hiển thị màn hình yêu cầu đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-sm border border-gray-100 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #FFF5F0, #FFE8DC)" }}
          >
            <LogIn className="w-10 h-10 text-[#FF4500]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{t('cart.your_cart')}</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Bạn cần đăng nhập để xem giỏ hàng và đặt món.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mb-3 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
          >
            Đăng nhập ngay
          </button>
          <button
            onClick={() => navigate("/explore")}
            className="w-full py-3.5 rounded-2xl text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Tiếp tục xem thực đơn
          </button>
        </div>
      </div>
    );
  }

  // Group items by restaurant
  const itemsByRestaurant = items.reduce((acc, item) => {
    const rId = item.restaurantId || restaurantId || 'unknown';
    const rName = item.restaurantName || restaurantName || 'Restaurant';
    if (!acc[rId]) {
      acc[rId] = { restaurantName: rName, items: [] };
    }
    acc[rId].items.push(item);
    return acc;
  }, {} as Record<string, { restaurantName: string, items: typeof items }>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">{t('cart.your_cart')}</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#FF4500" }}>
            {itemCount} {t('cart.items')}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Group order banner */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{t('cart.group_order')}</p>
              <p className="text-xs text-gray-400">{t('cart.share_cart')}</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-purple-500 bg-purple-50 hover:bg-purple-100 transition-colors">
              <Share2 className="w-4 h-4" /> {t('cart.share')}
            </button>
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 text-center text-gray-500 text-sm">
                {t('cart.empty') || "Your cart is empty"}
              </div>
            </div>
          ) : (
            Object.entries(itemsByRestaurant).map(([rId, group]) => (
              <div key={rId} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <p className="font-bold text-gray-900">{group.restaurantName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('cart.estimated_delivery')}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-5">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-400 truncate">{item.desc}</p>
                        <p className="font-bold text-gray-900 mt-1">{(item.price * item.qty).toLocaleString()}đ</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => handleUpdateQty(item.id, -1, item.restaurantId)} disabled={loadingItemId === item.id} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-400 transition-colors disabled:opacity-50">
                          {loadingItemId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="w-5 text-center font-bold text-gray-900">{item.qty}</span>
                        <button onClick={() => handleUpdateQty(item.id, 1, item.restaurantId)} disabled={loadingItemId === item.id} className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "#FF4500" }}>
                          {loadingItemId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Add more — one button per restaurant */}
          {Object.entries(itemsByRestaurant).map(([rId, group]) => (
            <button
              key={rId}
              onClick={() => navigate(`/restaurant/${rId}`)}
              className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 text-sm font-semibold text-[#FF4500] hover:border-orange-300 hover:bg-orange-50 transition-all"
            >
              {t('cart.add_more')} {group.restaurantName}
            </button>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <h2 className="font-bold text-gray-900 mb-5">{t('cart.order_summary')}</h2>

            {/* Promo */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <Tag className="w-4 h-4 text-gray-400" />
                <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder={t('cart.promo_code')} className="bg-transparent text-sm outline-none flex-1 text-gray-600" />
              </div>
              <button onClick={() => { if (promo) setPromoApplied(true); }} className="px-3 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "#FF4500" }}>
                {t('cart.apply')}
              </button>
            </div>
            {promoApplied && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-600 text-sm mb-4">
                <CheckCircle className="w-4 h-4" /> {t('cart.discount_applied')}
              </div>
            )}

            {/* Breakdown */}
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('cart.subtotal')} ({itemCount} {t('cart.items')})</span>
                <span>{subtotal.toLocaleString()}đ</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-sm text-green-500">
                  <span>{t('cart.discount')}</span><span>-{discount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('cart.delivery_fee')}</span><span>{delivery.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('cart.platform_fee')}</span><span>{platformFee.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 text-lg pt-2.5 border-t border-gray-100">
                <span>{t('cart.total')}</span><span>{total.toLocaleString()}đ</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 24px rgba(255,69,0,0.3)" }}
            >
              {t('cart.proceed_checkout')}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">{t('cart.secure_payment')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
