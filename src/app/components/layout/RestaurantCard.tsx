import { Heart, Star, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
// import { useTranslation } from "react-i18next";
import { IMGS } from "../../data/mock";
import { getDeliveryTimeText, calculateDeliveryFee } from "../../utils/geo";
import type { Restaurant } from "../../types/restaurant";
import { useAuthStore } from "../../stores/authStore";
import { useFavoriteStore } from "../../stores/favoriteStore";

interface RestaurantCardProps {
  restaurant: Restaurant & { distance?: number };
  /** Optional promo label override (e.g. "Giảm 20%"). Falls back to i18n key. */
  promoLabel?: string;
  /** Show a "Best Seller" badge on the image */
  showBestSeller?: boolean;
  /** Compact horizontal card variant (for recent orders row) */
  compact?: boolean;
}

export function RestaurantCard({
  restaurant: r,
  promoLabel,
  showBestSeller = true,
  compact = false,
}: RestaurantCardProps) {
  const navigate = useNavigate();
  // const { t } = useTranslation();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isLoggedIn = !!accessToken;
  const favoriteIds = useFavoriteStore((state) => state.favoriteIds);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const isFavorited = favoriteIds.includes(r.id);

  const isClosed = r.isActive === false;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để thêm vào danh sách yêu thích!");
      navigate("/login");
      return;
    }
    try {
      await toggleFavorite(r.id);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const dist = r.distance;
  const eta = getDeliveryTimeText(dist ?? null);
  const distLabel =
    dist !== undefined && dist !== Infinity
      ? `${dist.toFixed(1)} km`
      : null;

  const deliveryFee = dist !== undefined && dist !== Infinity ? calculateDeliveryFee(dist) : null;
  const activePromo = r.promotions && r.promotions.find(p => p.isActive);
  const displayPromoLabel = promoLabel ?? (activePromo ? `Mã: ${activePromo.code}` : null);

  if (compact) {
    return (
      <div
        onClick={() => !isClosed && navigate(`/restaurant/${r.id}`)}
        className={`flex-shrink-0 w-64 bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 shadow-sm transition-all group ${
          isClosed
            ? "grayscale opacity-75 cursor-not-allowed hover:border-gray-100"
            : "hover:shadow-md hover:border-orange-200 cursor-pointer"
        }`}
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
          <img
            src={r.imageUrl || IMGS.restaurant}
            alt={r.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isClosed ? "" : "group-hover:scale-105"
            }`}
          />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-gray-800 truncate group-hover:text-[#FF4500] transition-colors">
              {r.name}
            </h4>
            <p className="text-[10px] text-gray-500 font-semibold truncate mt-0.5">
              {r.address || "Đà Nẵng"}
            </p>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-black text-[#FF4500] bg-orange-50 px-2 py-0.5 rounded-lg">
              Đặt lại
            </span>
            <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-0.5">
              ⭐ {r.rating ?? "New"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => !isClosed && navigate(`/restaurant/${r.id}`)}
      className={`group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 flex flex-col h-full ${
        isClosed
          ? "grayscale opacity-75 cursor-not-allowed hover:-translate-y-0 hover:shadow-sm"
          : "hover:shadow-xl hover:-translate-y-1.5 cursor-pointer"
      }`}
    >
      {/* ── Image ── */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={r.imageUrl || IMGS.restaurant}
          alt={r.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isClosed ? "" : "group-hover:scale-[1.04]"
          }`}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {showBestSeller && (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black text-white bg-gradient-to-r from-[#FF4500] to-[#FF6B35] uppercase tracking-wide shadow-sm">
              Best Seller
            </span>
          )}
          {r.isActive ? (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black text-white bg-green-500/90 uppercase tracking-wide shadow-sm backdrop-blur-[2px]">
              Mở cửa
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black text-white bg-gray-500/90 uppercase tracking-wide shadow-sm backdrop-blur-[2px]">
              Đóng cửa
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          aria-label={isFavorited ? "Bỏ yêu thích" : "Thêm yêu thích"}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10 shadow-md ${
            isClosed ? "pointer-events-none opacity-50" : ""
          } ${
            isFavorited ? "text-red-500" : "text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart className={`w-4 h-4 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Bottom floating pills (rating + ETA) */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-sm shadow-md flex items-center gap-1 text-xs font-black text-gray-800">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{r.rating ?? "New"}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-sm shadow-md flex items-center gap-1 text-xs font-black text-gray-800">
            <Clock className="w-3 h-3 text-[#FF4500]" />
            <span>{eta}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Name + Promo */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#FF4500] transition-colors line-clamp-1">
              {r.name}
            </h3>
            {displayPromoLabel && (
              <span className="text-[#FF4500] font-black text-[10px] whitespace-nowrap bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-lg shrink-0 mt-0.5">
                {displayPromoLabel}
              </span>
            )}
          </div>

          {/* Category tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {r.categories?.slice(0, 3).map((cat) => (
              <span
                key={cat.id}
                className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Footer row */}
        <div className="border-t border-gray-50 pt-3 mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 font-semibold truncate max-w-[60%]">
            <MapPin className="w-3 h-3 text-[#FF4500] shrink-0" />
            <span className="truncate">
              {distLabel ? `${distLabel} · ` : ""}
              {r.address ?? ""}
            </span>
          </span>
          <span className="font-bold text-green-600 text-[10px] whitespace-nowrap">
            {deliveryFee !== null ? `Phí giao: ${deliveryFee.toLocaleString("vi-VN")}đ` : "Freeship"}
          </span>
        </div>
      </div>
    </div>
  );
}
