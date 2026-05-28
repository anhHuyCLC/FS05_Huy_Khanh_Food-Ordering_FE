import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Phone, MessageCircle, Star, CheckCircle,
  Clock, MapPin, Navigation, ArrowLeft, Wifi,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { orderService } from "../../services/orderService";
import type { Order } from "../../types/order";
import { toast } from "sonner";
import { calculateDistance, getDeliveryTimeText } from "../../utils/geo";
// ✅ Fix thiếu sót 9: import hook WebSocket đã có sẵn
import { useOrderTracking } from "../../hooks/useOrderTracking";

export default function Tracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // ✅ Fix thiếu sót 9: lấy token để dùng WebSocket
  const token =
    localStorage.getItem("token") ??
    sessionStorage.getItem("token") ??
    "";

  // ✅ Fix thiếu sót 9: real-time tracking qua WebSocket
  const { driverLat, driverLng, status: liveStatus, driverAssigned } =
    useOrderTracking(orderId ?? "", token);

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

  // Khoảng cách nhà hàng → điểm giao
  const distance =
    order?.restaurant?.latitude &&
    order?.restaurant?.longitude &&
    order?.deliveryLatitude &&
    order?.deliveryLongitude
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
      case "pending":    return "Đang chờ xác nhận từ nhà hàng... ⏳";
      case "accepted":   return "Nhà hàng đã nhận đơn... 👨‍🍳";
      case "preparing":  return "Món ăn đang được chuẩn bị... 🍳";
      case "ready":      return "Chuẩn bị xong! Đang chờ tài xế lấy hàng... 🛵";
      case "delivering": return "Tài xế đang giao món ăn đến bạn... 🛵";
      case "completed":  return "Đơn hàng đã giao thành công! 🎉";
      case "cancelled":  return "Đơn hàng đã bị hủy. ❌";
      default:           return t("tracking.kitchen_working") + " 👨‍🍳";
    }
  };

  const statusDescription = order
    ? getStatusDescription(order.status)
    : t("tracking.kitchen_working") + " 👨‍🍳";

  // ✅ Fix thiếu sót 9: chỉ fetch 1 lần đầu — real-time qua WebSocket
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    orderService
      .getOrder(orderId)
      .then((data) => {
        setOrder(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load order", err);
        setIsLoading(false);
      });
  }, [orderId]);

  // ✅ Fix thiếu sót 9: cập nhật order.status real-time từ WebSocket
  useEffect(() => {
    if (!liveStatus || !order) return;
    if (liveStatus !== order.status) {
      setOrder((prev) =>
        prev ? { ...prev, status: liveStatus as Order["status"] } : prev
      );
    }
  }, [liveStatus]);

  // ✅ Fix thiếu sót 9: thông báo khi tài xế được gán
  useEffect(() => {
    if (driverAssigned) {
      toast.info("Tài xế đã được gán cho đơn hàng của bạn! 🛵");
      // Re-fetch để lấy thông tin tài xế mới
      if (orderId) {
        orderService.getOrder(orderId).then(setOrder).catch(console.error);
      }
    }
  }, [driverAssigned, orderId]);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    const confirmCancel = window.confirm(
      "Bạn có chắc chắn muốn hủy đơn hàng này không?"
    );
    if (!confirmCancel) return;

    try {
      setIsCancelling(true);
      await orderService.cancelOrder(orderId, {
        reason: cancelReason || "Khách hàng tự hủy đơn",
      });
      const updatedOrder = await orderService.getOrder(orderId);
      setOrder(updatedOrder);
      toast.success("Hủy đơn hàng thành công!");
    } catch {
      toast.error("Không thể hủy đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsCancelling(false);
      setShowCancelPrompt(false);
    }
  };

  const handleSubmitReview = useCallback(async () => {
    if (!orderId || reviewSubmitted) return;
    setIsSubmittingReview(true);
    try {
      await orderService.submitReview(orderId, {
        restaurantRating,
        restaurantComment,
        ...(order?.driverId
          ? { driverRating, driverComment }
          : {}),
      });
      setReviewSubmitted(true);
      toast.success("Cảm ơn bạn đã đánh giá! ⭐");
    } catch {
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [
    orderId, restaurantRating, restaurantComment,
    driverRating, driverComment, reviewSubmitted, order,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white gap-4">
        <p className="text-sm text-neutral-400">Không tìm thấy đơn hàng.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";
  const isDelivering = order.status === "delivering";

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-neutral-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold">Theo dõi đơn hàng</h1>
          <p className="text-[11px] text-neutral-400">
            #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>
        {/* ✅ Badge WebSocket live */}
        <div className="flex items-center gap-1 bg-green-900/40 border border-green-700/40 rounded-full px-2 py-0.5">
          <Wifi className="w-2.5 h-2.5 text-green-400 animate-pulse" />
          <span className="text-[9px] font-semibold text-green-400">LIVE</span>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-4 flex flex-col gap-1">
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest">
          {order.status}
        </p>
        <p className="text-sm text-neutral-300">{statusDescription}</p>

        {/* ETA */}
        {!isCompleted && !isCancelled && (
          <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
            <Clock className="w-3 h-3" />
            <span>Dự kiến: {etaText}</span>
          </div>
        )}

        {/* Driver location badge (khi đang giao) */}
        {isDelivering && driverLat && driverLng && (
          <div className="flex items-center gap-1 mt-1 text-xs text-blue-400">
            <Navigation className="w-3 h-3 animate-pulse" />
            <span>Tài xế đang di chuyển đến bạn</span>
          </div>
        )}
      </div>

      {/* Restaurant info */}
      <div className="mx-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
          <p className="text-sm font-semibold">
            {order.restaurant?.name ?? "Nhà hàng"}
          </p>
        </div>
        {order.deliveryAddress && (
          <div className="flex items-start gap-2 pl-6">
            <p className="text-xs text-neutral-400">→ {order.deliveryAddress}</p>
          </div>
        )}
      </div>

      {/* Driver info (nếu đã có tài xế) */}
      {order.driver && (
        <div className="mx-4 mt-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
              {order.driver.profile?.fullName?.slice(0, 1) ?? "T"}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {order.driver.profile?.fullName ?? "Tài xế"}
              </p>
              <p className="text-xs text-neutral-500">
                {order.driver.profile?.phone ?? ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {order.driver.profile?.phone && (
              <a
                href={`tel:${order.driver.profile.phone}`}
                className="p-2 rounded-full bg-green-900/30 border border-green-700/40 text-green-400"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Cancel button (chỉ khi pending/accepted) */}
      {(order.status === "pending" || order.status === "accepted") && (
        <div className="mx-4 mt-3">
          {!showCancelPrompt ? (
            <button
              onClick={() => setShowCancelPrompt(true)}
              className="w-full py-2.5 rounded-xl border border-red-800/60 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition"
            >
              Huỷ đơn hàng
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Lý do huỷ (tùy chọn)..."
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white p-3 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
                >
                  {isCancelling ? "Đang huỷ..." : "Xác nhận huỷ"}
                </button>
                <button
                  onClick={() => setShowCancelPrompt(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 text-sm"
                >
                  Không huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review section (chỉ khi completed) */}
      {isCompleted && !reviewSubmitted && (
        <div className="mx-4 mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-4">
          <p className="text-sm font-bold text-white">Đánh giá đơn hàng</p>

          {/* Restaurant rating */}
          <div>
            <p className="text-xs text-neutral-400 mb-1.5">Nhà hàng</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRestaurantRating(s)}>
                  <Star
                    className={`w-6 h-6 ${s <= restaurantRating ? "text-amber-400 fill-amber-400" : "text-neutral-600"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={restaurantComment}
              onChange={(e) => setRestaurantComment(e.target.value)}
              placeholder="Nhận xét về nhà hàng..."
              className="mt-2 w-full rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white p-3 resize-none"
              rows={2}
            />
          </div>

          {/* Driver rating (chỉ khi có tài xế) */}
          {order.driverId && (
            <div>
              <p className="text-xs text-neutral-400 mb-1.5">Tài xế</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setDriverRating(s)}>
                    <Star
                      className={`w-6 h-6 ${s <= driverRating ? "text-amber-400 fill-amber-400" : "text-neutral-600"}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={driverComment}
                onChange={(e) => setDriverComment(e.target.value)}
                placeholder="Nhận xét về tài xế..."
                className="mt-2 w-full rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white p-3 resize-none"
                rows={2}
              />
            </div>
          )}

          <button
            onClick={handleSubmitReview}
            disabled={isSubmittingReview}
            className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold disabled:opacity-50"
          >
            {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      )}

      {/* Review submitted */}
      {isCompleted && reviewSubmitted && (
        <div className="mx-4 mt-4 rounded-xl border border-green-800/40 bg-green-900/20 p-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-400 font-medium">
            Cảm ơn bạn đã đánh giá!
          </p>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
