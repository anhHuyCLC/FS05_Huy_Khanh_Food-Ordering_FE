import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { RestaurantCard } from "./RestaurantCard";
import type { Restaurant } from "../../types/restaurant";

interface RestaurantRowProps {
  title: string;
  icon: string;
  restaurants: (Restaurant & { distance?: number })[];
  viewAllHref?: string;
  /** Max cards to show (default 8) */
  limit?: number;
}

export function RestaurantRow({
  title,
  icon,
  restaurants,
  viewAllHref,
  limit = 8,
}: RestaurantRowProps) {
  const navigate = useNavigate();
  const items = restaurants.slice(0, limit);

  if (items.length === 0) return null;

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
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {items.map((r) => (
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
