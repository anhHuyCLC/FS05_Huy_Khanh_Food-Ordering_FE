import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Phone, MessageCircle, Star, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { orderService } from "../../services/orderService";
import type { Order } from "../../types/order";
import { toast } from "sonner";
import { calculateDistance, getDeliveryTimeText, getStableCoords } from "../../utils/geo";
import { getDriverLocation } from "../../services/driverService";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRouteInfo } from "../../features/mapThunk";
import { selectRoute } from "../../features/mapSelectors";
import MapView from "../../components/map/MapView";
import UserMarker from "../../components/map/UserMarker";
import RestaurantMarkers from "../../components/map/RestaurantMarkers";
import DeliveryRoute from "../../components/map/DeliveryRoute";
import { Marker, Popup } from "react-leaflet";
import { driverIcon } from "../../components/map/mapIcons";

export default function Tracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const routeState = useAppSelector(selectRoute);

  // Cancel order state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // Review states
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [driverRating, setDriverRating] = useState(5);
  const [driverComment, setDriverComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Real-time driver location
  const [driverLoc, setDriverLoc] = useState<{ latitude: number; longitude: number } | null>(null);

  // Resolve restaurant coords
  const restaurantCoords = useMemo(() => {
    if (!order?.restaurant) return null;
    const lat = order.restaurant.latitude ? Number(order.restaurant.latitude) : null;
    const lon = order.restaurant.longitude ? Number(order.restaurant.longitude) : null;
    if (lat && lon) return { latitude: lat, longitude: lon };
    
    const coords = getStableCoords(order.restaurantId || "restaurant", order.restaurant.name || "Restaurant");
    return { latitude: coords.latitude, longitude: coords.longitude };
  }, [order]);

  // Resolve delivery coords
  const deliveryCoords = useMemo(() => {
    if (!order) return null;
    const lat = order.deliveryLatitude ? Number(order.deliveryLatitude) : null;
    const lon = order.deliveryLongitude ? Number(order.deliveryLongitude) : null;
    if (lat && lon) return { latitude: lat, longitude: lon };
    
    const coords = getStableCoords("delivery", order.deliveryAddress || "Vị trí giao hàng");
    return { latitude: coords.latitude, longitude: coords.longitude };
  }, [order]);

  // Poll driver location when order status is delivering or ready
  useEffect(() => {
    if (!orderId || !order?.driverId || (order.status !== "delivering" && order.status !== "ready")) {
      setTimeout(() => setDriverLoc(null), 0);
      return;
    }

    const fetchDriverLocation = async () => {
      try {
        const res = await getDriverLocation(order.driverId!);
        if (res && res.success && res.data) {
          setDriverLoc(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch driver location:", err);
      }
    };

    fetchDriverLocation();
    const interval = setInterval(fetchDriverLocation, 5000);
    return () => clearInterval(interval);
  }, [orderId, order?.driverId, order?.status]);

  // Fetch route info dynamically
  useEffect(() => {
    if (restaurantCoords && deliveryCoords) {
      const startLat = driverLoc ? driverLoc.latitude : restaurantCoords.latitude;
      const startLon = driverLoc ? driverLoc.longitude : restaurantCoords.longitude;
      
      dispatch(
        fetchRouteInfo({
          startLat,
          startLon,
          endLat: deliveryCoords.latitude,
          endLon: deliveryCoords.longitude,
        })
      );
    }
  }, [restaurantCoords, deliveryCoords, driverLoc, dispatch]);

  const mapCenter = useMemo(() => {
    if (driverLoc && deliveryCoords) {
      return [(driverLoc.latitude + deliveryCoords.latitude) / 2, (driverLoc.longitude + deliveryCoords.longitude) / 2] as [number, number];
    }
    if (restaurantCoords && deliveryCoords) {
      return [(restaurantCoords.latitude + deliveryCoords.latitude) / 2, (restaurantCoords.longitude + deliveryCoords.longitude) / 2] as [number, number];
    }
    return [16.054404, 108.202167] as [number, number]; // default Da Nang center
  }, [restaurantCoords, deliveryCoords, driverLoc]);

  // Calculate dynamic delivery ETA and status description
  const distance = (order?.restaurant?.latitude && order?.restaurant?.longitude && order?.deliveryLatitude && order?.deliveryLongitude)
    ? calculateDistance(
        Number(order.restaurant.latitude),
        Number(order.restaurant.longitude),
        Number(order.deliveryLatitude),
        Number(order.deliveryLongitude)
      )
    : null;

  const etaText = distance !== null ? getDeliveryTimeText(distance) : "15-25 min";

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pending":
        return "Đang chờ xác nhận từ nhà hàng... ⏳";
      case "accepted":
        return "Nhà hàng đã nhận đơn... 👨‍🍳";
      case "preparing":
        return "Món ăn đang được chuẩn bị... 🍳";
      case "ready":
        return "Chuẩn bị xong! Đang chờ tài xế lấy hàng... 🛵";
      case "delivering":
        return "Tài xế đang giao món ăn đến bạn... 🛵";
      case "completed":
        return "Đơn hàng đã giao thành công! 🎉";
      case "cancelled":
        return "Đơn hàng đã bị hủy. ❌";
      default:
        return t('tracking.kitchen_working') + " 👨‍🍳";
    }
  };

  const statusDescription = order ? getStatusDescription(order.status) : t('tracking.kitchen_working') + " 👨‍🍳";

  useEffect(() => {
    if (!orderId) {
      setTimeout(() => setIsLoading(false), 0);
      return;
    }

    const fetchOrder = () => {
      orderService.getOrder(orderId)
        .then(async (data) => {
          // If VNPay returns an error code (not 00) and order is still pending, cancel it
          if (vnpResponseCode && vnpResponseCode !== "00" && data.status === "pending") {
            try {
              await orderService.cancelOrder(orderId, { reason: "Thanh toán VNPay thất bại hoặc bị hủy." });
              const updatedData = await orderService.getOrder(orderId);
              setOrder(updatedData);
            } catch {
              // Backend might reject cancellation (e.g. 401/403) expecting IPN to handle it.
              // We visually set it to cancelled so the user isn't confused.
              setOrder({ ...data, status: "cancelled", cancelReason: "Thanh toán VNPay thất bại hoặc bị hủy." });
            }
          } else {
            setOrder(data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load order", err);
          setIsLoading(false);
        });
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [orderId, vnpResponseCode]);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
    if (!confirmCancel) return;

    try {
      setIsCancelling(true);
      await orderService.cancelOrder(orderId, { reason: cancelReason || "Khách hàng tự hủy đơn" });
      const updatedOrder = await orderService.getOrder(orderId);
      setOrder(updatedOrder);
      toast.success("Hủy đơn hàng thành công!");
      setShowCancelPrompt(false);
    } catch{
      toast.error("Không thể hủy đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!orderId) return;
    try {
      setIsSubmittingReview(true);
      await orderService.submitReview(orderId, {
        restaurantRating,
        restaurantComment: restaurantComment.trim() || undefined,
        driverRating: order?.driver ? driverRating : undefined,
        driverComment: (order?.driver && driverComment.trim()) ? driverComment.trim() : undefined,
      });
      toast.success("Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!");
      setReviewSubmitted(true);
    } catch {
      toast.error("Gửi đánh giá thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const statusRank: Record<string, number> = {
    pending: 1,
    accepted: 2,
    preparing: 2,
    ready: 3,
    delivering: 4,
    completed: 5,
    cancelled: 0
  };

  const currentRank = order ? statusRank[order.status] ?? 1 : 1;

  const steps = [
    { id: 1, label: "Chờ xác nhận", desc: "Đang chờ nhà hàng xác nhận đơn", icon: "⏳", done: currentRank > 1, active: currentRank === 1 },
    { id: 2, label: "Đang chuẩn bị", desc: `${order?.restaurant?.name || "Nhà hàng"} đang chuẩn bị món`, icon: "👨‍🍳", done: currentRank > 2, active: currentRank === 2 },
    { id: 3, label: "Chờ tài xế", desc: "Món ăn đã xong, chờ tài xế đến lấy", icon: "📦", done: currentRank > 3, active: currentRank === 3 },
    { id: 4, label: "Đang giao", desc: order?.driver ? `${order.driver.profile?.fullName || "Tài xế"} đang giao đến bạn` : "Tài xế đang giao đến bạn", icon: "🛵", done: currentRank > 4, active: currentRank === 4 },
    { id: 5, label: "Hoàn thành", desc: "Chúc bạn ngon miệng!", icon: "🎉", done: currentRank === 5, active: currentRank === 5 },
  ];

  const currentStep = steps.findIndex((s) => s.active) + 1 || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/explore")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{t('tracking.tracking_order')}</h1>
            {isLoading ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : order ? (
              <p className="text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()} · {order.restaurant?.name}</p>
            ) : (
              <p className="text-xs text-gray-400">Order not found</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100">
            <div className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
            <span className="text-xs font-semibold text-[#FF4500]">{t('tracking.live_tracking')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid lg:grid-cols-5 gap-8">
        {/* Left: Status + Driver */}
        <div className="lg:col-span-3 space-y-5">
          {/* ETA Banner / Cancelled Banner */}
          {order?.status === "cancelled" ? (
            <div
              className="rounded-3xl p-6 text-white overflow-hidden relative bg-red-500"
            >
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
              <p className="text-red-100 text-sm mb-1">Trạng thái đơn hàng</p>
              <p className="text-3xl font-black mb-1">ĐÃ HỦY ĐƠN</p>
              <p className="text-red-100 text-sm">Đơn hàng này đã bị hủy.</p>
            </div>
          ) : (
            <div
              className="rounded-3xl p-6 text-white overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
            >
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
              <p className="text-orange-100 text-sm mb-1">{t('checkout.estimated_arrival')}</p>
              <p className="text-4xl font-black mb-1">{etaText}</p>
              <p className="text-orange-100 text-sm">{statusDescription}</p>
            </div>
          )}

          {/* Progress steps */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-5">{t('tracking.order_status')}</h2>
            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
              <div
                className="absolute left-5 top-5 w-0.5 transition-all duration-1000"
                style={{
                  background: "linear-gradient(180deg, #FF4500, #FF6B35)",
                  height: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              />
              <div className="space-y-6">
                {steps.map((step) => (
                  <div key={step.id} className={`flex items-start gap-4 ${!step.done && !step.active ? "opacity-40" : ""}`}>
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 z-10 ${
                        step.done || step.active ? "shadow-md" : "bg-gray-100"
                      }`}
                      style={step.done || step.active ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className={`font-semibold ${step.active ? "text-[#FF4500]" : "text-gray-800"}`}>{step.label}</p>
                      <p className="text-sm text-gray-400">{step.desc}</p>
                      {step.active && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-bounce" />
                          <span className="text-xs text-[#FF4500] font-medium">{t('tracking.in_progress')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Driver Card */}
          {order?.driver && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">{t('tracking.your_driver')}</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-200">
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-bold">
                      {order.driver.profile?.fullName?.substring(0, 2).toUpperCase() || "DR"}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{order.driver.profile?.fullName || "Assigned Driver"}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {order.driver.rating ? Number(order.driver.rating).toFixed(1) : "5.0"} · Tài xế Savour
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    🏍️ {order.driver.vehicleInfo || "Xe máy"} {order.driver.licensePlate ? `· BKS: ${order.driver.licensePlate}` : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  {order.driver.profile?.phone && (
                    <>
                      <a 
                        href={`tel:${order.driver.profile.phone}`} 
                        title="Gọi điện cho tài xế"
                        className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 hover:bg-green-100 transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                      <a 
                        href={`sms:${order.driver.profile.phone}`}
                        title="Nhắn tin cho tài xế"
                        className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cancel Order Section */}
          {order && order.status === "pending" && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 animate-in fade-in duration-300">
              <h3 className="font-bold text-gray-900 text-sm">Hủy đơn hàng</h3>
              <p className="text-xs text-gray-400">Bạn chỉ có thể tự hủy đơn hàng khi nhà hàng chưa nhận và chuẩn bị món ăn.</p>
              
              {showCancelPrompt ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy đơn (không bắt buộc)..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelPrompt(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelPrompt(true)}
                  className="w-full py-3 rounded-2xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors"
                >
                  Hủy đơn hàng
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Map + Order Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Real Leaflet Map */}
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm h-64 relative z-10">
            {restaurantCoords && deliveryCoords ? (
              <MapView
                center={mapCenter}
                zoom={14}
                className="h-full w-full"
              >
                <UserMarker
                  position={{
                    lat: deliveryCoords.latitude,
                    lng: deliveryCoords.longitude,
                  }}
                  addressName={order?.deliveryAddress || "Vị trí giao hàng"}
                />
                <RestaurantMarkers
                  restaurants={[
                    {
                      id: order?.restaurantId || "restaurant",
                      name: order?.restaurant?.name || "Restaurant",
                      address: order?.restaurant?.address || "Restaurant Address",
                      latitude: restaurantCoords.latitude.toString(),
                      longitude: restaurantCoords.longitude.toString(),
                      description: "Điểm lấy hàng",
                    },
                  ]}
                />
                {driverLoc && (
                  <Marker position={[driverLoc.latitude, driverLoc.longitude]} icon={driverIcon}>
                    <Popup>
                      <div className="p-1">
                        <p className="font-bold text-xs text-gray-900">Tài xế của bạn</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Đang di chuyển...</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                <DeliveryRoute coordinates={routeState?.coordinates || null} />
              </MapView>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-sm text-gray-400">
                Đang tải bản đồ...
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2 z-[1000]">
              <Clock className="w-4 h-4 text-[#FF4500]" />
              <span className="text-sm font-semibold text-gray-700">
                {routeState
                  ? `${routeState.eta} phút`
                  : distance !== null
                    ? `${Math.round(distance * 2 + 10)} phút`
                    : `15-25 phút`}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {routeState
                  ? `${(routeState.distance / 1000).toFixed(1)} km`
                  : distance !== null
                    ? `${distance.toFixed(1)} km`
                    : ""}
              </span>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">{t('cart.order_summary')}</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {order ? order.orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.menuItem?.name || "Item"} <span className="text-gray-400">x{item.quantity}</span></span>
                  <span className="font-medium text-gray-800">{Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ</span>
                </div>
              )) : (
                <div className="flex justify-between">
                  <span>Loading items...</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>{t('cart.total')}</span><span>{Number(order?.finalAmount || 0).toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>

          {/* Real Review Section */}
          {order?.status === "completed" && !reviewSubmitted && (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-5 animate-in fade-in duration-300">
              <h2 className="font-bold text-gray-900 text-sm">{t('tracking.rate_experience', 'Đánh giá đơn hàng')}</h2>

              {/* Restaurant Review */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">Đánh giá nhà hàng ({order.restaurant?.name})</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRestaurantRating(s)} className="p-0.5 transition-transform hover:scale-110">
                      <Star className={`w-6 h-6 ${s <= restaurantRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={restaurantComment}
                  onChange={(e) => setRestaurantComment(e.target.value)}
                  placeholder="Nhập nhận xét về món ăn & nhà hàng..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none text-gray-800"
                />
              </div>

              {/* Driver Review */}
              {order.driver && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-600">Đánh giá tài xế ({order.driver.profile?.fullName || "Tài xế"})</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setDriverRating(s)} className="p-0.5 transition-transform hover:scale-110">
                        <Star className={`w-6 h-6 ${s <= driverRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={driverComment}
                    onChange={(e) => setDriverComment(e.target.value)}
                    placeholder="Nhập nhận xét về tài xế..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none text-gray-800"
                  />
                </div>
              )}

              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          )}

          {order?.status === "completed" && reviewSubmitted && (
            <div className="bg-green-50 rounded-3xl p-5 border border-green-100 flex items-center gap-3 animate-in fade-in duration-300">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-xs font-medium text-green-700">{t('tracking.thanks_for_rating', 'Cảm ơn bạn đã gửi đánh giá!')}</p>
            </div>
          )}

          {order && order.status !== "completed" && order.status !== "cancelled" && (
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-200 text-center">
              <p className="text-xs text-gray-500">Đánh giá nhà hàng & tài xế sẽ hiển thị khi đơn hàng hoàn thành. 🍽️</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
