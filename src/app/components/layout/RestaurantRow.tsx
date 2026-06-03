import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { RestaurantCard } from "./RestaurantCard";
import type { Restaurant } from "../../types/restaurant";

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex flex-col h-full animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-video bg-gray-200 relative">
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="w-16 h-5 rounded-xl bg-gray-300" />
          <span className="w-14 h-5 rounded-xl bg-gray-300" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between">
          <span className="w-12 h-5 rounded-xl bg-gray-300/60" />
          <span className="w-16 h-5 rounded-xl bg-gray-300/60" />
        </div>
      </div>
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
            <div className="h-5 w-14 bg-orange-50 rounded-lg" />
          </div>
          <div className="flex gap-1 mt-2">
            <span className="h-4 w-12 bg-gray-100 rounded-lg" />
            <span className="h-4 w-14 bg-gray-100 rounded-lg" />
            <span className="h-4 w-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="border-t border-gray-50 pt-3 mt-3 flex justify-between">
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

interface RestaurantRowProps {
  title: string;
  icon: string;
  restaurants: (Restaurant & { distance?: number })[];
  viewAllHref?: string;
  /** Max cards to show (default 8) */
  limit?: number;
  /** Show skeleton loading cards */
  loading?: boolean;
}

export function RestaurantRow({
  title,
  icon,
  restaurants,
  viewAllHref,
  limit = 8,
  loading = false,
}: RestaurantRowProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const items = restaurants.slice(0, limit);

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-3.5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {title}
        </h2>
        {viewAllHref && (
          <button
            onClick={() => navigate(viewAllHref)}
            className="flex items-center gap-1 text-xs font-bold text-[#FF4500] hover:gap-2 transition-all"
          >
            {t("home.view_all")} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="snap-start shrink-0 w-[85%] sm:w-[44%] md:w-[30%] lg:w-[22%]"
              >
                <SkeletonCard />
              </div>
            ))
          : items.map((r) => (
              <div
                key={r.id}
                className="snap-start shrink-0 w-[85%] sm:w-[44%] md:w-[30%] lg:w-[22%]"
              >
                <RestaurantCard restaurant={r} />
              </div>
            ))}
      </div>
    </div>
  );
}
