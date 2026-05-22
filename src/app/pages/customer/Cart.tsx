import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, Users, Share2, LogIn, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCartStore, type CartItem } from "../../stores/cartStore";
import { useAuthStore } from "../../stores/authStore";
import { cartService } from "../../services/cartService";

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQty, getTotal, getItemCount, restaurantId, restaurantName } = useCartStore();
  const user = useAuthStore((state) => state.user);
  
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [selectedOptionsState, setSelectedOptionsState] = useState<Record<string, any>>({});
  const [isSavingOptions, setIsSavingOptions] = useState(false);
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

  const handleSaveOptions = async () => {
    if (!selectedItem) return;
    for (const group of selectedItem.optionGroups || []) {
      if (group.isRequired) {
        const val = selectedOptionsState[group.name];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          alert(`Vui lòng chọn ${group.name}`);
          return;
        }
      }
    }
    setIsSavingOptions(true);
    try {
      if (selectedItem.cartId && selectedItem.cartItemId) {
        await cartService.updateCartItem(selectedItem.cartId, selectedItem.cartItemId, {
          selectedOptions: selectedOptionsState
        });
        await useCartStore.getState().fetchCarts();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save options:", err);
      alert("Không thể lưu tùy chỉnh món ăn");
    } finally {
      setIsSavingOptions(false);
    }
  };

  const subtotal = getTotal();
  const itemCount = getItemCount();

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

  const total = subtotal;

  // Group items by restaurant
  const itemsByRestaurant = items.reduce((acc, item) => {
    const rId = item.restaurantId || restaurantId || 'unknown';
    const rName = item.restaurantName || restaurantName || 'Restaurant';
    if (!acc[rId]) {
      acc[rId] = {
        restaurantName: rName,
        items: [],
      };
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
                    <div key={item.cartItemId || item.id} className="flex items-center gap-4 p-5">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {Object.entries(item.selectedOptions).map(([groupName, val]: [string, any]) => {
                              if (!val) return null;
                              const displayVal = Array.isArray(val)
                                ? val.map((c: any) => c.name).join(", ")
                                : val.name;
                              return (
                                <div key={groupName}>
                                  <span className="font-medium text-gray-600">{groupName}:</span> {displayVal}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <p className="text-sm text-gray-400 truncate mt-1">{item.desc}</p>
                        
                        {item.optionGroups && item.optionGroups.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setSelectedOptionsState(item.selectedOptions || {});
                              setIsModalOpen(true);
                            }}
                            className="mt-2 text-xs font-bold text-[#FF4500] hover:underline flex items-center gap-1"
                          >
                            Tùy chỉnh
                          </button>
                        )}
                        <p className="font-bold text-gray-900 mt-1">{(item.price * item.qty).toLocaleString()}đ</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => handleUpdateQty(item.cartItemId ?? item.id, -1, item.restaurantId)} disabled={loadingItemId === (item.cartItemId ?? item.id)} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-400 transition-colors disabled:opacity-50">
                          {loadingItemId === (item.cartItemId ?? item.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="w-5 text-center font-bold text-gray-900">{item.qty}</span>
                        <button onClick={() => handleUpdateQty(item.cartItemId ?? item.id, 1, item.restaurantId)} disabled={loadingItemId === (item.cartItemId ?? item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "#FF4500" }}>
                          {loadingItemId === (item.cartItemId ?? item.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
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

            {/* Breakdown */}
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>{t('cart.subtotal')} ({itemCount} {t('cart.items')})</span>
                <span>{subtotal.toLocaleString()}đ</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                * Phí giao hàng và mã giảm giá sẽ được áp dụng ở màn hình thanh toán tiếp theo.
              </p>
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

      {/* Customize Modal */}
      {isModalOpen && selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-4 p-5 border-b border-gray-100">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-14 h-14 rounded-2xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base truncate">{selectedItem.name}</h3>
                <p className="text-sm text-[#FF4500] font-semibold">{selectedItem.price.toLocaleString()}đ</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {selectedItem.optionGroups?.map((group: any) => {
                const isSingle = group.maxChoices === 1;
                const currentVal = selectedOptionsState[group.name];

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
                      {group.choices?.map((choice: any) => {
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
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                isChecked ? "border-[#FF4500] bg-[#FF4500]" : "border-gray-300"
                              }`}>
                                {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <input
                                type={isSingle ? "radio" : "checkbox"}
                                name={group.name}
                                checked={isChecked}
                                onChange={() => {
                                  if (isSingle) {
                                    setSelectedOptionsState(prev => ({ ...prev, [group.name]: choice }));
                                  } else {
                                    const currentList = Array.isArray(currentVal) ? currentVal : [];
                                    const exists = currentList.some((c: any) => c.id === choice.id);
                                    const canAdd = !exists && currentList.length < group.maxChoices;
                                    const newList = exists
                                      ? currentList.filter((c: any) => c.id !== choice.id)
                                      : canAdd ? [...currentList, choice] : currentList;
                                    setSelectedOptionsState(prev => ({ ...prev, [group.name]: newList }));
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

            {/* Save Button */}
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 border border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                {t('cart.cancel') || "Hủy"}
              </button>
              <button
                onClick={handleSaveOptions}
                disabled={isSavingOptions}
                className="flex-1 py-3.5 text-white rounded-2xl text-sm font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {isSavingOptions && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('cart.save') || "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
