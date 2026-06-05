import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, Users, Share2, LogIn, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCartStore, type CartItem } from "../../stores/cartStore";
import { useAuthStore } from "../../stores/authStore";
import { cartService } from "../../services/cartService";
import type { OptionChoice, OptionGroup } from "../../types/restaurant";

export default function Cart() {
  const navigate = useNavigate();
  const { 
    items, 
    updateQty, 
    setQty, 
    getItemCount, 
    restaurantId, 
    restaurantName, 
    groupCartToken,
    toggleSelectItem,
    toggleSelectAll,
    clearSelectedItems
  } = useCartStore();
  const user = useAuthStore((state) => state.user);
  
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [selectedOptionsState, setSelectedOptionsState] = useState<Record<string, OptionChoice | OptionChoice[]>>({});
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { t } = useTranslation();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token && user) {
      const joinGroupCart = async () => {
        try {
          const res = await cartService.getCartByToken(token);
          if (res && res.id) {
            const groupCart = res;
            useCartStore.getState().setGroupCartSession(groupCart.id, token);
            await useCartStore.getState().fetchCarts();
            // Clear URL param without reloading
            navigate(window.location.pathname, { replace: true });
            toast.success(t("cart.join_group_success"));
          }
        } catch (err) {
          console.error("Failed to join group cart:", err);
          toast.error(t("cart.join_group_error"));
        }
      };
      joinGroupCart();
    }
  }, [user, navigate, t]);

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        console.warn("navigator.clipboard failed, trying fallback...", e);
      }
    }
    // Fallback using temporary textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed"; // Keep it out of view and prevent scrolling
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      console.error("Fallback copy to clipboard failed:", err);
      document.body.removeChild(textarea);
      return false;
    }
  };

  const handleShare = async () => {
    if (groupCartToken) {
      const shareLink = `${window.location.origin}${window.location.pathname}?token=${groupCartToken}`;
      const copied = await copyToClipboard(shareLink);
      if (copied) {
        toast.success(t("cart.copy_link_success"));
      } else {
        toast.error(t("cart.copy_link_error"));
      }
      return;
    }

    const currentGroupCartId = useCartStore.getState().groupCartId;
    let cartIdToShare = currentGroupCartId;

    if (!cartIdToShare) {
      const firstItem = items[0];
      if (!firstItem || !firstItem.cartId) {
        toast.warning(t("cart.empty_share_warning"));
        return;
      }
      cartIdToShare = firstItem.cartId;
    }

    setSharing(true);
    try {
      const res = await cartService.shareCart(cartIdToShare);
      if (res && res.sessionToken) {
        const token = res.sessionToken;
        useCartStore.getState().setGroupCartSession(cartIdToShare, token);
        const shareLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
        const copied = await copyToClipboard(shareLink);
        if (copied) {
          toast.success(t("cart.create_share_success"));
        } else {
          toast.success(t("cart.create_share_msg", { link: shareLink }));
        }
      }
    } catch (err) {
      console.error("Failed to share cart:", err);
      toast.error(t("cart.share_error"));
    } finally {
      setSharing(false);
    }
  };

  const handleUpdateQty = useCallback(async (id: string, delta: number, itemRestaurantId?: string) => {
    if (loadingItemId) return;
    setLoadingItemId(id);
    try {
      await updateQty(id, delta, itemRestaurantId);
    } finally {
      setLoadingItemId(null);
    }
  }, [loadingItemId, updateQty]);

  const handleSaveQty = async (item: CartItem) => {
    const itemId = item.cartItemId ?? item.id;
    const val = parseInt(editingValue, 10);
    setEditingItemId(null);

    if (isNaN(val) || val < 0) {
      return; // Revert, do nothing
    }

    if (val === 0) {
      setLoadingItemId(itemId);
      try {
        await useCartStore.getState().removeItem(itemId, item.restaurantId);
      } finally {
        setLoadingItemId(null);
      }
      return;
    }

    if (val !== item.qty) {
      setLoadingItemId(itemId);
      try {
        await setQty(itemId, val, item.restaurantId);
      } finally {
        setLoadingItemId(null);
      }
    }
  };

  const handleDeleteSelected = async (rId?: string) => {
    if (loadingItemId) return;
    setLoadingItemId("delete-selected");
    try {
      await clearSelectedItems(rId);
      toast.success(t("cart.delete_selected_success") || "Đã xóa các sản phẩm được chọn thành công!");
    } catch (err) {
      console.error(err);
      toast.error(t("cart.delete_selected_error") || "Không thể xóa các sản phẩm được chọn.");
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleSaveOptions = async () => {
    if (!selectedItem) return;
    for (const group of selectedItem.optionGroups || []) {
      if (group.isRequired) {
        const val = selectedOptionsState[group.name];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          toast.warning(t("restaurant.select_required", { name: group.name }));
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
      toast.error(t("cart.save_options_error"));
    } finally {
      setIsSavingOptions(false);
    }
  };

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
            {t("cart.login_required_desc")}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mb-3 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
          >
            {t("auth.login_now")}
          </button>
          <button
            onClick={() => navigate("/explore")}
            className="w-full py-3.5 rounded-2xl text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-all"
          >
            {t("cart.continue_browsing")}
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
      acc[rId] = {
        restaurantName: rName,
        items: [],
      };
    }
    acc[rId].items.push(item);
    return acc;
  }, {} as Record<string, { restaurantName: string, items: typeof items }>);

  // Selected state logic
  const selectedItems = items.filter((item) => item.selected);
  const selectedItemsByRestaurant = selectedItems.reduce((acc, item) => {
    const rId = item.restaurantId || 'unknown';
    if (!acc[rId]) {
      acc[rId] = [];
    }
    acc[rId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const selectedRestaurantKeys = Object.keys(selectedItemsByRestaurant);
  const isMultiRestaurantSelected = selectedRestaurantKeys.length > 1;
  const hasSelectedItems = selectedItems.length > 0;

  const handleProceedCheckout = () => {
    if (!hasSelectedItems) {
      toast.warning(t("cart.no_items_selected_toast") || "Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }
    if (isMultiRestaurantSelected) {
      toast.warning(t("cart.multi_restaurant_warning_toast") || "Bạn chỉ có thể đặt hàng từ một cửa hàng cùng lúc.");
      return;
    }
    const rId = selectedRestaurantKeys[0];
    if (rId && rId !== 'unknown') {
      navigate(`/checkout?restaurantId=${rId}`);
    } else {
      navigate("/checkout");
    }
  };

  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const selectedItemCount = selectedItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = selectedSubtotal;

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
          <div 
            onClick={handleShare}
            className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">
                {groupCartToken ? t("cart.group_order_active") : t('cart.group_order')}
              </p>
              <p className="text-xs text-gray-400">
                {groupCartToken ? t("cart.group_order_desc") : t('cart.share_cart')}
              </p>
            </div>
            <div className="flex gap-2">
              {groupCartToken && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    useCartStore.getState().setGroupCartSession(null, null);
                    await useCartStore.getState().fetchCarts();
                    toast.success(t("cart.leave_group_success"));
                  }}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  {t("cart.leave_group")}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                disabled={sharing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-purple-500 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                {groupCartToken ? "Copy Link" : t('cart.share')}
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 text-center text-gray-500 text-sm">
                {t('cart.empty') || "Your cart is empty"}
              </div>
            </div>
          ) : (
            Object.entries(itemsByRestaurant).map(([rId, group]) => (
              <div key={rId} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={group.items.every((item) => item.selected)}
                      onChange={(e) => toggleSelectAll(rId, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-gray-300 text-[#FF4500] focus:ring-[#FF4500] cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{group.restaurantName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t('cart.estimated_delivery')}</p>
                    </div>
                  </div>
                  {group.items.some((item) => item.selected) && (
                    <button
                      onClick={() => handleDeleteSelected(rId)}
                      disabled={loadingItemId === "delete-selected"}
                      className="text-xs font-bold text-red-500 hover:text-[#FF4500] flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('cart.delete_selected') || "Xóa đã chọn"}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => (
                    <div key={item.cartItemId || item.id} className="flex items-center gap-4 p-5">
                      <input
                        type="checkbox"
                        checked={!!item.selected}
                        onChange={() => toggleSelectItem(item.cartItemId ?? item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 text-[#FF4500] focus:ring-[#FF4500] cursor-pointer shrink-0"
                      />
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {Object.entries(item.selectedOptions).map(([groupName, val]) => {
                              if (!val) return null;
                              const displayVal = Array.isArray(val)
                                ? (val as OptionChoice[]).map((c: OptionChoice) => c.name).join(", ")
                                : (val as OptionChoice).name;
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
                            {t("cart.customize")}
                          </button>
                        )}
                        <p className="font-bold text-gray-900 mt-1">{(item.price * item.qty).toLocaleString()}đ</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => handleUpdateQty(item.cartItemId ?? item.id, -1, item.restaurantId)} disabled={loadingItemId === (item.cartItemId ?? item.id)} aria-label={item.qty === 1 ? "Xoá" : "Giảm"} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-400 transition-colors disabled:opacity-50">
                          {loadingItemId === (item.cartItemId ?? item.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        {editingItemId === (item.cartItemId ?? item.id) ? (
                          <input
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleSaveQty(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveQty(item);
                              if (e.key === "Escape") setEditingItemId(null);
                            }}
                            className="w-12 text-center font-bold text-gray-950 bg-gray-50 border border-gray-300 rounded-lg outline-none py-1 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-sans"
                            autoFocus
                            min="1"
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingItemId(item.cartItemId ?? item.id);
                              setEditingValue(String(item.qty));
                            }}
                            className="w-8 text-center font-bold text-gray-900 cursor-pointer hover:bg-gray-100 py-1 rounded transition-colors"
                            title={t("cart.click_to_edit_qty") || "Click to edit quantity"}
                          >
                            {item.qty}
                          </span>
                        )}
                        <button onClick={() => handleUpdateQty(item.cartItemId ?? item.id, 1, item.restaurantId)} disabled={loadingItemId === (item.cartItemId ?? item.id)} aria-label="Tăng" className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-50 brand-gradient-bg">
                          {loadingItemId === (item.cartItemId ?? item.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t("cart.subtotal_restaurant")}</span>
                    <p className="text-lg font-black text-gray-900">
                      {group.items.reduce((sum, item) => sum + (item.selected ? item.price * item.qty : 0), 0).toLocaleString()}đ
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const hasSel = group.items.some(item => item.selected);
                      if (!hasSel) {
                        group.items.forEach(item => {
                          if (!item.selected) {
                            toggleSelectItem(item.cartItemId ?? item.id);
                          }
                        });
                      }
                      navigate(`/checkout?restaurantId=${rId}`);
                    }}
                    className="px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm flex items-center gap-1.5 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                  >
                    {t("cart.checkout_restaurant")}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Add more — one button per restaurant */}
          {Object.entries(itemsByRestaurant).map(([rId, group]) => (
            <button
              key={rId}
              onClick={() => navigate(`/restaurant/${rId}`)}
              className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 text-sm font-semibold text-[#FF4500] hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer"
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
                <span>{t('cart.subtotal')} ({selectedItemCount} {t('cart.items')})</span>
                <span>{subtotal.toLocaleString()}đ</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                {t("cart.cart_notes")}
              </p>
            </div>

            {isMultiRestaurantSelected ? (
              <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                {t("cart.multi_restaurant_warning") || "Giỏ hàng của bạn chứa các món từ nhiều quán khác nhau. Vui lòng thanh toán riêng từng quán."}
              </div>
            ) : null}

            <button
              onClick={handleProceedCheckout}
              disabled={!hasSelectedItems || isMultiRestaurantSelected}
              className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all ${
                !hasSelectedItems || isMultiRestaurantSelected
                  ? "bg-gray-300 cursor-not-allowed opacity-60"
                  : "hover:opacity-90 hover:scale-[1.01]"
              }`}
              style={
                !hasSelectedItems || isMultiRestaurantSelected
                  ? {}
                  : { background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 24px rgba(255,69,0,0.3)" }
              }
            >
              {!hasSelectedItems 
                ? (t("cart.no_items_selected") || "Chọn sản phẩm") 
                : isMultiRestaurantSelected 
                  ? (t("cart.checkout_multi_restaurant") || "Thanh toán riêng") 
                  : t('cart.proceed_checkout')}
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
              {selectedItem.optionGroups?.map((group: OptionGroup) => {
                const isSingle = group.maxChoices === 1;
                const currentVal = selectedOptionsState[group.name];

                return (
                  <div key={group.id}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-gray-800 text-sm">{group.name}</p>
                      {group.isRequired ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "#FF4500" }}>
                          {t("restaurant.required")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">{t("restaurant.optional")}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.choices?.map((choice: OptionChoice) => {
                        const priceExtra = Number(choice.additionalPrice);
                        const isChecked = isSingle
                          ? (!Array.isArray(currentVal) && currentVal?.id === choice.id)
                          : (Array.isArray(currentVal) && currentVal.some((c: OptionChoice) => c.id === choice.id));

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
                                    const currentList = (Array.isArray(currentVal) ? currentVal : []) as OptionChoice[];
                                    const exists = currentList.some((c: OptionChoice) => c.id === choice.id);
                                    const canAdd = !exists && currentList.length < group.maxChoices;
                                    const newList = exists
                                      ? currentList.filter((c: OptionChoice) => c.id !== choice.id)
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
                      <p className="text-xs text-gray-400 mt-2">{t("restaurant.select_max", { max: group.maxChoices })}</p>
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveOptions}
                disabled={isSavingOptions}
                className="flex-1 py-3.5 text-white rounded-2xl text-sm font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {isSavingOptions && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('cart.save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
