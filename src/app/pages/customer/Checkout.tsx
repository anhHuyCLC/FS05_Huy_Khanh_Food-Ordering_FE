import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CreditCard, Wallet, DollarSign, Tag, Clock, CheckCircle, ChevronRight, Search, Navigation, Loader2, X, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { orderService } from "../../services/orderService";
import type { CreateOrderInput, Promotion } from "../../types/order";
import { useCartStore } from "../../stores/cartStore";
import { addressService } from "../../services/addressService";
import type { SavedAddress } from "../../types/address";
import { mapService,type AutocompleteSuggestion } from "../../services/mapService";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRouteInfo } from "../../features/mapThunk";
import { selectRoute } from "../../features/mapSelectors";
import MapView from "../../components/map/MapView";
import UserMarker from "../../components/map/UserMarker";
import RestaurantMarkers from "../../components/map/RestaurantMarkers";
import DeliveryRoute from "../../components/map/DeliveryRoute";
import { calculateDistance, getStableCoords, calculateDeliveryFee, getDeliveryTimeText } from "../../utils/geo";

const payMethods = [
  { id: "vnpay", icon: <Wallet className="w-5 h-5" />, label: "Cổng thanh toán VNPay", sub: "Thanh toán bằng thẻ ATM, thẻ quốc tế hoặc mã QR" },
  { id: "cash", icon: <DollarSign className="w-5 h-5" />, label: "Cash on Delivery", sub: "Pay when your food arrives" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, clearSelectedItems } = useCartStore();

  // Get restaurantId from URL parameter or fall back to first item
  const queryParams = new URLSearchParams(window.location.search);
  const queryRestaurantId = queryParams.get("restaurantId");

  const filteredItems = useMemo(() => {
    const selectedItems = items.filter((item) => item.selected);
    if (!queryRestaurantId) return selectedItems;
    return selectedItems.filter((item) => item.restaurantId === queryRestaurantId);
  }, [items, queryRestaurantId]);

  const restaurantId = queryRestaurantId || (filteredItems.length > 0 ? filteredItems[0].restaurantId : null);

  const [payMethod, setPayMethod] = useState("vnpay");
  // Food promotion state
  const [foodPromoCode, setFoodPromoCode] = useState("");
  const [foodPromoApplied, setFoodPromoApplied] = useState(false);
  const [foodDiscountAmount, setFoodDiscountAmount] = useState(0);

  // Shipping promotion state
  const [shippingPromoCode, setShippingPromoCode] = useState("");
  const [shippingPromoApplied, setShippingPromoApplied] = useState(false);
  const [shippingDiscountAmount, setShippingDiscountAmount] = useState(0);

  // Input code state
  const [typedPromoCode, setTypedPromoCode] = useState("");
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [note, setNote] = useState("");
  const [customerPhone] = useState("");
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      const t = setTimeout(() => {
        setIsLoadingPromotions(true);
        orderService.getPromotions(restaurantId)
          .then((data) => {
            setPromotions(data || []);
          })
          .catch((err) => {
            console.error("Failed to load promotions:", err);
          })
          .finally(() => {
            setIsLoadingPromotions(false);
          });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [restaurantId]);

  // Address states
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Modal inline state for quick adding address
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLatitude, setFormLatitude] = useState<number | null>(null);
  const [formLongitude, setFormLongitude] = useState<number | null>(null);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal map & autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSuggestions, setModalSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Debounced search for suggestions inside the modal
  useEffect(() => {
    if (!searchQuery.trim()) {
      const t = setTimeout(() => setModalSuggestions([]), 0);
      return () => clearTimeout(t);
    }
    if (searchQuery === formAddress) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingSuggestions(true);
        const data = await mapService.autocomplete(searchQuery);
        setModalSuggestions(data || []);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, formAddress]);

  const handleLocateInModal = () => {
    if (!navigator.geolocation) {
      toast.error(t("checkout.geo_not_supported"));
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          setIsReverseGeocoding(true);
          const address = await mapService.reverseGeocode(lat, lng);
          setFormAddress(address);
          setSearchQuery(address);
          setFormLatitude(lat);
          setFormLongitude(lng);
          toast.success(t("checkout.geo_success"));
        } catch {
          toast.error(t("checkout.geo_address_failed"));
        } finally {
          setIsReverseGeocoding(false);
          setIsLocatingUser(false);
        }
      },
      (err) => {
        toast.error(t("checkout.geo_error", { message: err.message }));
        setIsLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleModalMapClick = async (lat: number, lng: number) => {
    try {
      setIsReverseGeocoding(true);
      const address = await mapService.reverseGeocode(lat, lng);
      setFormAddress(address);
      setSearchQuery(address);
      setFormLatitude(lat);
      setFormLongitude(lng);
    } catch (err) {
      console.error(err);
      toast.error(t("checkout.geo_resolve_error"));
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const routeState = useAppSelector(selectRoute);

  // Resolve restaurant coords
  const restaurantCoords = useMemo(() => {
    if (filteredItems.length === 0 || !restaurantId) return null;
    const item = filteredItems[0];
    let lat = item.restaurantLatitude;
    let lon = item.restaurantLongitude;
    if (!lat || !lon) {
      const coords = getStableCoords(restaurantId, item.restaurantName || "Restaurant");
      lat = coords.latitude;
      lon = coords.longitude;
    }
    return { latitude: lat, longitude: lon };
  }, [filteredItems, restaurantId]);

  // Resolve delivery coords
  const selectedAddr = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId);
  }, [addresses, selectedAddressId]);

  const deliveryCoords = useMemo(() => {
    if (!selectedAddr) return null;
    if (selectedAddr.latitude !== null && selectedAddr.longitude !== null && selectedAddr.latitude !== undefined && selectedAddr.longitude !== undefined) {
      return { latitude: Number(selectedAddr.latitude), longitude: Number(selectedAddr.longitude) };
    }
    const coords = getStableCoords("delivery", selectedAddr.address);
    return { latitude: coords.latitude, longitude: coords.longitude };
  }, [selectedAddr]);

  // Trigger route fetch when coords change
  useEffect(() => {
    if (restaurantCoords && deliveryCoords) {
      dispatch(
        fetchRouteInfo({
          startLat: restaurantCoords.latitude,
          startLon: restaurantCoords.longitude,
          endLat: deliveryCoords.latitude,
          endLon: deliveryCoords.longitude,
        })
      );
    }
  }, [restaurantCoords, deliveryCoords, dispatch]);

  const fallbackDistance = useMemo(() => {
    if (!restaurantCoords || !deliveryCoords) return null;
    return calculateDistance(
      restaurantCoords.latitude,
      restaurantCoords.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    );
  }, [restaurantCoords, deliveryCoords]);

  const fetchAddresses = async () => {
    try {
      const data = await addressService.getMyAddresses();
      const dataArray = Array.isArray(data) ? data : [];
      setAddresses(dataArray);
      if (dataArray.length > 0) {
        // Find default or use the first one
        const defaultAddr = dataArray.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : dataArray[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAddresses();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleQuickAddAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formLabel.trim() || !formAddress.trim()) {
      toast.error(t("checkout.fill_info_required"));
      return;
    }
    try {
      setIsSaving(true);
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, {
          label: formLabel,
          address: formAddress,
          phone: formPhone,
          latitude: formLatitude,
          longitude: formLongitude,
          isDefault: formIsDefault,
        });
        toast.success(t("checkout.update_address_success"));
      } else {
        await addressService.createAddress({
          label: formLabel,
          address: formAddress,
          phone: formPhone,
          latitude: formLatitude,
          longitude: formLongitude,
          isDefault: formIsDefault,
        });
        toast.success(t("checkout.add_address_success"));
      }
      setIsModalOpen(false);

      // Refresh list and select the address
      const data = await addressService.getMyAddresses();
      const dataArray = Array.isArray(data) ? data : [];
      setAddresses(dataArray);
      if (editingAddress) {
        setSelectedAddressId(editingAddress.id);
      } else if (dataArray.length > 0) {
        const matched = dataArray.find((a) => a.address === formAddress && a.label === formLabel);
        if (matched) {
          setSelectedAddressId(matched.id);
        }
      }
    } catch {
      toast.error(t("checkout.save_address_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormLabel("");
    setFormAddress("");
    setFormPhone("");
    setSearchQuery("");
    setFormLatitude(null);
    setFormLongitude(null);
    setModalSuggestions([]);
    setIsDropdownOpen(false);
    setFormIsDefault(false);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setFormLabel(addr.label);
    setFormAddress(addr.address);
    setFormPhone(addr.phone || "");
    setSearchQuery(addr.address);
    setFormLatitude(addr.latitude);
    setFormLongitude(addr.longitude);
    setModalSuggestions([]);
    setIsDropdownOpen(false);
    setFormIsDefault(addr.isDefault);
    setIsModalOpen(true);
  };

  const deliveryFee = useMemo(() => {
    if (filteredItems.length === 0) return 0;

    const itemsByRestaurant = filteredItems.reduce((acc, item) => {
      const rId = item.restaurantId || restaurantId || 'unknown';
      const rName = item.restaurantName || 'Restaurant';
      if (!acc[rId]) {
        acc[rId] = {
          restaurantName: rName,
          restaurantLatitude: item.restaurantLatitude,
          restaurantLongitude: item.restaurantLongitude
        };
      }
      return acc;
    }, {} as Record<string, { restaurantName: string, restaurantLatitude?: number, restaurantLongitude?: number }>);

    const defaultFee = 15000;
    let calculatedTotalFee = 0;
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);

    Object.entries(itemsByRestaurant).forEach(([rId, group]) => {
      let restLat = group.restaurantLatitude;
      let restLon = group.restaurantLongitude;

      if (!restLat || !restLon) {
        const rCoords = getStableCoords(rId, group.restaurantName);
        restLat = rCoords.latitude;
        restLon = rCoords.longitude;
      }

      let delivLat = selectedAddr?.latitude ? Number(selectedAddr.latitude) : undefined;
      let delivLon = selectedAddr?.longitude ? Number(selectedAddr.longitude) : undefined;

      if (!delivLat || !delivLon) {
        if (selectedAddr) {
          const dCoords = getStableCoords("delivery", selectedAddr.address);
          delivLat = dCoords.latitude;
          delivLon = dCoords.longitude;
        } else {
          calculatedTotalFee += defaultFee;
          return;
        }
      }

      const distance = calculateDistance(restLat, restLon, delivLat, delivLon);
      calculatedTotalFee += calculateDeliveryFee(distance);
    });

    return calculatedTotalFee;
  }, [filteredItems, addresses, selectedAddressId, restaurantId]);

  const handlePlaceOrder = async () => {
    try {
      setIsLoading(true);
      if (filteredItems.length === 0 || !restaurantId) {
        toast.error("Cart is empty or restaurant is missing.");
        setIsLoading(false);
        return;
      }

      const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddr) {
        toast.error(t("checkout.select_address_error"));
        setIsLoading(false);
        return;
      }

      let delivLat = selectedAddr.latitude ? Number(selectedAddr.latitude) : undefined;
      let delivLon = selectedAddr.longitude ? Number(selectedAddr.longitude) : undefined;
      if (!delivLat || !delivLon) {
        const dCoords = getStableCoords("delivery", selectedAddr.address);
        delivLat = dCoords.latitude;
        delivLon = dCoords.longitude;
      }

      const payload: CreateOrderInput = {
        restaurantId: restaurantId,
        orderType: "standard_delivery",
        deliveryAddress: `${selectedAddr.label}: ${selectedAddr.address}`,
        deliveryLatitude: delivLat,
        deliveryLongitude: delivLon,
        customerPhone: selectedAddr.phone || customerPhone || undefined,
        note: note,
        promotionCode: foodPromoApplied ? foodPromoCode : undefined,
        shippingPromotionCode: shippingPromoApplied ? shippingPromoCode : undefined,
        paymentMethod: payMethod === "vnpay" ? "bank_transfer" : payMethod === "card" ? "e_wallet" : "cash",
        paymentProvider: payMethod === "vnpay" ? "vnpay" : undefined,
        items: filteredItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.qty,
          selectedOptions: item.selectedOptions,
          note: item.desc || undefined,
        })),
      };

      const order = await orderService.createOrder(payload);
      toast.success(t('checkout.place_order_success') || "Order placed successfully!");
      await clearSelectedItems(restaurantId);
      
      if (payMethod === "vnpay" && order.paymentUrl) {
        window.location.href = order.paymentUrl;
      } else {
        navigate(`/tracking?orderId=${order.id}`);
      }
    } catch {
      toast.error(t("checkout.place_order_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [filteredItems]);
  const delivery = routeState ? calculateDeliveryFee(routeState.distance / 1000) : deliveryFee;

  const handleApplyPromo = async (codeToApply: string) => {
    if (!codeToApply.trim() || !restaurantId) return;
    setIsCheckingPromo(true);
    try {
      // Validate code by passing both fields in query. The BE checkPromotion expects it.
      // To determine whether the code is food or shipping, we pass it appropriately.
      // We can also call checkPromotion by checking it against the backend.
      const res = await orderService.checkPromotion({
        promotionCode: codeToApply,
        restaurantId: restaurantId,
        totalAmount: subtotal,
        deliveryFee: delivery
      });

      // Backend returns details of checked promos in res
      const hasDiscount = res.success ? (res.discountAmount !== undefined) : (res.discountAmount !== undefined);
      const discountVal = res.success ? res.discountAmount : res.discountAmount;
      const typeVal = res.success ? res.promotionType : res.promotionType;

      if (hasDiscount) {
        if (typeVal === "shipping") {
          setShippingPromoCode(codeToApply);
          setShippingPromoApplied(true);
          setShippingDiscountAmount(discountVal);
        } else {
          setFoodPromoCode(codeToApply);
          setFoodPromoApplied(true);
          setFoodDiscountAmount(discountVal);
        }
        toast.success(t("checkout.apply_voucher_success"));
        setIsPromoModalOpen(false);
        setTypedPromoCode("");
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || t("checkout.apply_voucher_error");
      toast.error(msg);
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleRemoveFoodPromo = () => {
    setFoodPromoCode("");
    setFoodPromoApplied(false);
    setFoodDiscountAmount(0);
    toast.success(t("checkout.remove_voucher_success") || "Đã hủy áp dụng mã giảm giá đồ ăn!");
  };

  const handleRemoveShippingPromo = () => {
    setShippingPromoCode("");
    setShippingPromoApplied(false);
    setShippingDiscountAmount(0);
    toast.success(t("checkout.remove_voucher_success") || "Đã hủy áp dụng mã vận chuyển!");
  };

  const foodDiscount = foodPromoApplied ? foodDiscountAmount : 0;
  const shippingDiscount = shippingPromoApplied ? Math.min(shippingDiscountAmount, delivery) : 0;
  const total = Math.max(0, subtotal - foodDiscount - shippingDiscount + delivery);

  const translatedPayMethods = [
    { ...payMethods[0], label: t('checkout.vnpay', 'Cổng thanh toán VNPay'), sub: t('checkout.vnpay_sub', 'Thanh toán bằng thẻ ATM, thẻ quốc tế hoặc mã QR') },
    { ...payMethods[1], label: t('checkout.cash_on_delivery'), sub: t('checkout.pay_on_arrival') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">{t('checkout.checkout')}</h1>
          {/* Steps */}
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            {[t('checkout.steps_cart'), t('checkout.steps_delivery'), t('checkout.steps_payment'), t('checkout.steps_confirm')].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className={i < 3 ? "text-[#FF4500] font-medium" : ""}>{s}</span>
                {i < 3 && <ChevronRight className="w-3 h-3" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* Left: Delivery + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#FF4500]" /> {t('checkout.delivery_address')}
            </h2>
            <div className="space-y-3">
              {isLoadingAddresses ? (
                <div className="text-sm text-gray-400 py-2">{t("checkout.loading_addresses")}</div>
              ) : !Array.isArray(addresses) || addresses.length === 0 ? (
                <div className="text-sm text-gray-400 py-2">
                  {t("checkout.no_addresses_saved")}
                </div>
              ) : (
                addresses.map((a) => {
                  const isSelected = selectedAddressId === a.id;
                  return (
                    <label
                      key={a.id}
                      className="flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:border-orange-200"
                      style={isSelected ? { borderColor: "#FF4500", background: "#FFF5F0" } : { borderColor: "#E5E7EB" }}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="text-[#FF4500] mt-1 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-gray-800">{a.label}</span>
                          {a.isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#FF4500]">
                              {t("checkout.default_badge")}
                            </span>
                          )}
                        </div>
                        {a.phone && <div className="text-xs text-gray-600 mb-0.5 font-medium">{a.phone}</div>}
                        <span className="text-xs text-gray-500 break-words">{a.address}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditModal(a);
                        }}
                        className="p-2 rounded-xl text-gray-400 hover:text-[#FF4500] hover:bg-orange-50 transition-colors cursor-pointer shrink-0"
                        title={t("common.edit")}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </label>
                  );
                })
              )}
              <button
                onClick={openAddModal}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-[#FF4500] font-medium hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer"
              >
                {t('checkout.add_new_address')}
              </button>
            </div>
          </div>

          {/* Map Route */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm z-10 relative">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              📍 {t('checkout.route_map', 'Bản đồ giao hàng')}
            </h2>
            {restaurantCoords && deliveryCoords ? (
              <div className="h-64 rounded-2xl overflow-hidden relative">
                <MapView
                  center={[
                    (restaurantCoords.latitude + deliveryCoords.latitude) / 2,
                    (restaurantCoords.longitude + deliveryCoords.longitude) / 2,
                  ]}
                  zoom={13}
                  className="h-full w-full"
                >
                  <UserMarker
                    position={{
                      lat: deliveryCoords.latitude,
                      lng: deliveryCoords.longitude,
                    }}
                    addressName={selectedAddr?.address}
                  />
                  <RestaurantMarkers
                    restaurants={[
                      {
                        id: restaurantId || "restaurant",
                        name: filteredItems[0]?.restaurantName || "Restaurant",
                        address: filteredItems[0]?.restaurantAddress || "Restaurant Address",
                        latitude: restaurantCoords.latitude.toString(),
                        longitude: restaurantCoords.longitude.toString(),
                        description: t("checkout.pickup_point"),
                      },
                    ]}
                  />
                  <DeliveryRoute coordinates={routeState?.coordinates || null} />
                </MapView>
              </div>
            ) : (
              <div className="text-sm text-gray-400 py-6 text-center">
                {t("checkout.select_address_for_map")}
              </div>
            )}
          </div>

          {/* Estimated time */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-[#FF4500]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t('checkout.estimated_arrival')}</p>
                <p className="text-xl font-black" style={{ color: "#FF4500" }}>
                  {routeState
                    ? `${routeState.eta} ${t('checkout.minutes', 'phút')}`
                    : fallbackDistance !== null
                      ? getDeliveryTimeText(fallbackDistance)
                      : `25–35 ${t('checkout.minutes')}`}
                </p>
              </div>
            </div>
            {routeState ? (
              <div className="flex flex-row sm:flex-col justify-between sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t("checkout.distance")}</p>
                  <p className="text-sm font-bold text-gray-800">{(routeState.distance / 1000).toFixed(1)} km</p>
                </div>
              </div>
            ) : fallbackDistance !== null ? (
              <div className="flex flex-row sm:flex-col justify-between sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t("checkout.distance")}</p>
                  <p className="text-sm font-bold text-gray-800">{fallbackDistance.toFixed(1)} km</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Order Note */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">{t('checkout.order_note', 'Ghi chú đơn hàng')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("checkout.note_for_restaurant")}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('checkout.order_note_placeholder', 'Ví dụ: Ít cay, nhiều tương...')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF4500]" /> {t('checkout.payment_method')}
            </h2>
            <div className="space-y-3">
              {translatedPayMethods.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all"
                  style={payMethod === m.id ? { borderColor: "#FF4500", background: "#FFF5F0" } : { borderColor: "#E5E7EB" }}
                >
                  <input type="radio" name="pay" checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} className="text-[#FF4500]" />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payMethod === m.id ? "text-[#FF4500] bg-orange-100" : "text-gray-400 bg-gray-100"}`}>
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <h2 className="font-bold text-gray-900 mb-5">{t('cart.order_summary')}</h2>
            {/* Items */}
            <div className="space-y-3 mb-5">
              {filteredItems.map((item) => (
                <div key={item.cartItemId || item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">x{item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{(item.price * item.qty).toLocaleString()}đ</p>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="flex flex-col gap-2 mb-5">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 min-w-0">
                  <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={typedPromoCode}
                    onChange={(e) => setTypedPromoCode(e.target.value)}
                    placeholder={t('cart.promo_code')}
                    className="bg-transparent text-sm outline-none w-full text-gray-600 min-w-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyPromo(typedPromoCode)}
                  disabled={isCheckingPromo}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 shrink-0 whitespace-nowrap bg-orange-600 cursor-pointer"
                >
                  {isCheckingPromo ? "..." : t('cart.apply')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-[#FF4500]/30 hover:border-[#FF4500]/60 text-[#FF4500] font-semibold text-sm transition-all hover:bg-orange-50/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                🎟️ {t("checkout.select_voucher")}
              </button>
            </div>
            {foodPromoApplied && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 text-green-600 text-sm mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("checkout.applied_dish_discount", { amount: foodDiscount.toLocaleString() })}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFoodPromo}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-0 cursor-pointer shrink-0"
                >
                  Xóa
                </button>
              </div>
            )}
            {shippingPromoApplied && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-55 text-blue-600 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>{t("checkout.applied_delivery_discount", { amount: shippingDiscount.toLocaleString() })}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveShippingPromo}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-transparent border-0 cursor-pointer shrink-0"
                >
                  Xóa
                </button>
              </div>
            )}

            {/* Price breakdown */}
            <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('cart.subtotal')}</span><span>{subtotal.toLocaleString()}đ</span>
              </div>
              {foodPromoApplied && (
                <div className="flex justify-between text-sm text-green-500">
                  <span>{t("checkout.dish_discount")} ({foodPromoCode})</span>
                  <span>-{foodDiscount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('cart.delivery_fee')}</span><span>{delivery.toLocaleString()}đ</span>
              </div>
              {shippingPromoApplied && (
                <div className="flex justify-between text-sm text-green-500">
                  <span>{t("checkout.delivery_discount")} ({shippingPromoCode})</span>
                  <span>-{shippingDiscount.toLocaleString()}đ</span>
                </div>
              )}
              <div className="flex justify-between font-black text-gray-900 text-lg pt-2 border-t border-gray-100">
                <span>{t('cart.total')}</span><span>{total.toLocaleString()}đ</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 24px rgba(255,69,0,0.3)" }}
            >
              {isLoading ? "Processing..." : t('checkout.place_order')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">

            {/* Form Column */}
            <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingAddress ? t("checkout.edit_address") : t("checkout.add_new_address_title")}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{t("checkout.search_address_map_hint")}</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleQuickAddAddress(); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("checkout.address_label")}</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        { key: "home", label: t("checkout.label_home", "Nhà riêng") },
                        { key: "office", label: t("checkout.label_office", "Văn phòng") },
                        { key: "school", label: t("checkout.label_school", "Trường học") }
                      ].map((suggested) => (
                        <button
                          key={suggested.key}
                          type="button"
                          onClick={() => setFormLabel(suggested.label)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${formLabel === suggested.label
                              ? "bg-orange-50 text-[#FF4500] border-orange-200 font-bold"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                          {suggested.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      placeholder={t("checkout.address_label_placeholder")}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      required
                    />
                  </div>

                  {/* Autocomplete Search input */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {t("checkout.search_address_btn")}
                    </label>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-2 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                      <Search className="w-4 h-4 text-gray-400 ml-1 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder={t("checkout.search_address_placeholder")}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 py-1"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setModalSuggestions([]);
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 text-gray-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="w-px h-5 bg-gray-200 shrink-0" />

                      <button
                        type="button"
                        onClick={handleLocateInModal}
                        disabled={isLocatingUser}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 text-[#FF4500] hover:bg-orange-100 disabled:bg-gray-100 disabled:text-gray-400 text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        {isLocatingUser ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Navigation className="w-3 h-3" />
                        )}
                        <span>{t("checkout.locate_btn")}</span>
                      </button>
                    </div>

                    {/* Suggestions dropdown in modal */}
                    {isDropdownOpen && (modalSuggestions.length > 0 || isSearchingSuggestions) && (
                      <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[2000] max-h-48 overflow-y-auto divide-y divide-gray-50">
                        {isSearchingSuggestions ? (
                          <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF4500]" />
                            <span>{t("checkout.locating")}</span>
                          </div>
                        ) : (
                          modalSuggestions.map((item, idx) => (
                            <button
                              key={`${item.address}-${idx}`}
                              type="button"
                              onClick={() => {
                                setFormAddress(item.address);
                                setSearchQuery(item.address);
                                setFormLatitude(item.latitude);
                                setFormLongitude(item.longitude);
                                setModalSuggestions([]);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-orange-50/50 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                              <span className="truncate">{item.address}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("checkout.detailed_address_label")}</label>
                    <textarea
                      value={formAddress}
                      onChange={(e) => {
                        setFormAddress(e.target.value);
                      }}
                      placeholder={t("checkout.detailed_address_placeholder")}
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none text-gray-800"
                      required
                    />
                  </div>
 
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("checkout.phone_label")}</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder={t("checkout.phone_placeholder")}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                    />
                  </div>
 
                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      id="isDefaultCheckout"
                      checked={formIsDefault}
                      onChange={(e) => setFormIsDefault(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#FF4500] focus:ring-orange-500"
                    />
                    <label htmlFor="isDefaultCheckout" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                      {t("checkout.set_default_checkbox")}
                    </label>
                  </div>
                </form>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  disabled={isSaving || !formAddress.trim()}
                  onClick={() => handleQuickAddAddress()}
                  className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                >
                  {isSaving ? `${t("common.loading")}...` : editingAddress ? t("common.save") : t("common.add")}
                </button>
              </div>
            </div>

            {/* Map Column */}
            <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[300px] bg-gray-100 relative">
              <MapView
                center={
                  formLatitude && formLongitude
                    ? [formLatitude, formLongitude]
                    : [16.054404, 108.202167]
                }
                zoom={formLatitude && formLongitude ? 16 : 13}
                onMapClick={handleModalMapClick}
                className="h-full w-full"
              >
                {formLatitude && formLongitude && (
                  <UserMarker
                    position={{ lat: formLatitude, lng: formLongitude }}
                    addressName={formAddress || t("checkout.selected_position")}
                  />
                )}
              </MapView>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full z-[1000] pointer-events-none">
                {t("checkout.click_map_hint")}
              </div>
              {isReverseGeocoding && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-[1001] pointer-events-none">
                  <div className="bg-white/90 shadow-lg px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF4500]" />
                    <span>{t("checkout.locating")}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Promotion Selector Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t("checkout.select_voucher")}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t("checkout.apply_voucher_desc")}</p>
              </div>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingPromotions ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF4500]" />
                  <span className="text-sm">{t("checkout.loading_promos")}</span>
                </div>
              ) : promotions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  {t("checkout.no_promos")}
                </div>
              ) : (
                <>
                  {/* Food Vouchers Section */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                      🍔 {t("checkout.dish_discount")}
                    </h4>
                    <div className="space-y-3">
                      {promotions.filter(p => p.promotionType !== "shipping").map((p) => {
                        const isEligible = subtotal >= Number(p.minOrderValue || 0);
                        const isApplied = foodPromoCode === p.code && foodPromoApplied;
                        return (
                          <div
                            key={p.id}
                            className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                              isApplied
                                ? "border-orange-500 bg-orange-50/30"
                                : isEligible
                                ? "border-gray-100 hover:border-orange-200"
                                : "border-gray-50 opacity-60"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 text-lg">
                              🏷️
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-800 text-sm">{p.code}</span>
                                {isApplied && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-600">
                                    Đang áp dụng
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-2 font-medium">{p.description}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
                                <span>{t("discovery.min_order", { min: Number(p.minOrderValue || 0).toLocaleString() })}</span>
                                <span>HSD: {new Date(p.validTo).toLocaleDateString("vi-VN")}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!isEligible}
                              onClick={() => {
                                if (isApplied) {
                                  handleRemoveFoodPromo();
                                } else {
                                  handleApplyPromo(p.code);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                isApplied
                                  ? "bg-green-55 text-green-600 hover:bg-red-50 hover:text-red-500 border border-green-200 hover:border-red-200"
                                  : isEligible
                                  ? "bg-[#FF4500] text-white hover:opacity-90"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {isApplied ? t("checkout.applied") : t("checkout.apply")}
                            </button>
                          </div>
                        );
                      })}
                      {promotions.filter(p => p.promotionType !== "shipping").length === 0 && (
                        <p className="text-xs text-gray-400 italic pl-2">{t("checkout.no_dish_vouchers")}</p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Vouchers Section */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                      🚚 {t("checkout.delivery_discount")}
                    </h4>
                    <div className="space-y-3">
                      {promotions.filter(p => p.promotionType === "shipping").map((p) => {
                        const isEligible = subtotal >= Number(p.minOrderValue || 0);
                        const isApplied = shippingPromoCode === p.code && shippingPromoApplied;
                        return (
                          <div
                            key={p.id}
                            className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                              isApplied
                                ? "border-orange-500 bg-orange-50/30"
                                : isEligible
                                ? "border-gray-100 hover:border-orange-200"
                                : "border-gray-50 opacity-60"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-lg">
                              🚚
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-800 text-sm">{p.code}</span>
                                {isApplied && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-600">
                                    {t("checkout.applying")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-2 font-medium">{p.description}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
                                <span>{t("discovery.min_order", { min: Number(p.minOrderValue || 0).toLocaleString() })}</span>
                                <span>HSD: {new Date(p.validTo).toLocaleDateString("vi-VN")}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!isEligible}
                              onClick={() => {
                                if (isApplied) {
                                  handleRemoveShippingPromo();
                                } else {
                                  handleApplyPromo(p.code);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                isApplied
                                  ? "bg-green-55 text-green-600 hover:bg-red-50 hover:text-red-500 border border-green-200 hover:border-red-200"
                                  : isEligible
                                  ? "bg-[#FF4500] text-white hover:opacity-90"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {isApplied ? t("checkout.applied") : t("checkout.apply")}
                            </button>
                          </div>
                        );
                      })}
                      {promotions.filter(p => p.promotionType === "shipping").length === 0 && (
                        <p className="text-xs text-gray-400 italic pl-2">{t("checkout.no_delivery_vouchers")}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
