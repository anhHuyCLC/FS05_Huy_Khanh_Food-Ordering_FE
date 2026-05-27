import { useNavigate } from "react-router-dom";
import { quickCategories } from "../../data/categories";

interface QuickCategoryBarProps {
  /** The currently active slug (or "all"). Pass "" / undefined to show none active. */
  activeSlug?: string;
  /** Called when a category pill is clicked.
   *  If omitted, the bar will navigate to /explore?category={slug} directly. */
  onSelect?: (slug: string) => void;
}

export function QuickCategoryBar({ activeSlug = "all", onSelect }: QuickCategoryBarProps) {
  const navigate = useNavigate();

  const handleClick = (slug: string) => {
    if (onSelect) {
      onSelect(slug);
    } else {
      if (slug === "all") {
        navigate("/explore");
      } else {
        navigate(`/explore?category=${slug}`);
      }
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {quickCategories.map((cat) => {
        const isActive = activeSlug === cat.slug;
        return (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.slug)}
            className={`
              flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold
              whitespace-nowrap shrink-0 transition-all duration-200
              ${
                isActive
                  ? "text-white shadow-md shadow-orange-500/25 scale-[1.04]"
                  : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-orange-200 hover:bg-orange-50 hover:text-[#FF4500] hover:scale-[1.02]"
              }
            `}
            style={
              isActive
                ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" }
                : {}
            }
          >
            <span className="text-base leading-none">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
