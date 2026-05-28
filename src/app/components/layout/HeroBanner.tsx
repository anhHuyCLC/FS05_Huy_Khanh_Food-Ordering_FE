import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Promotion } from "../../types/order";
import { IMGS } from "../../data/mock";

interface HeroBannerProps {
  promotions: Promotion[];
}

interface BannerSlide {
  id: string;
  gradient: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  bgImage?: string;
}

function buildSlides(promotions: Promotion[]): BannerSlide[] {
  const dynamic: BannerSlide[] = promotions.slice(0, 2).map((p) => {
    const isFreeship =
      p.promotionType === "shipping" || p.code.includes("SHIP");
    return {
      id: p.id,
      gradient: isFreeship
        ? "from-orange-500 via-red-500 to-pink-600"
        : "from-violet-600 via-purple-600 to-indigo-700",
      eyebrow: isFreeship ? "🚀 Miễn phí giao hàng" : "🎉 Ưu đãi đặc biệt",
      title: p.code,
      subtitle:
        p.description ||
        (isFreeship
          ? "Freeship mọi đơn hàng hôm nay"
          : `Giảm ngay ${p.fixedDiscount ? Number(p.fixedDiscount).toLocaleString() + "đ" : ""}`),
      cta: "Dùng ngay",
    };
  });

  const fallback: BannerSlide[] = [
    {
      id: "fb1",
      gradient: "from-[#FF4500] via-orange-500 to-amber-500",
      eyebrow: "⚡ Flash Sale hôm nay",
      title: "Giảm tới 50%",
      subtitle: "Hàng ngàn món ngon, ưu đãi sốc mỗi ngày từ 11h–13h",
      cta: "Khám phá ngay",
      bgImage: IMGS.burger,
    },
    {
      id: "fb2",
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      eyebrow: "🚚 Freeship toàn thành phố",
      title: "Giao miễn phí",
      subtitle: "Không tối thiểu đơn hàng – giao tận nơi nhanh 20 phút",
      cta: "Đặt ngay",
      bgImage: IMGS.pho,
    },
    {
      id: "fb3",
      gradient: "from-violet-600 via-purple-600 to-pink-600",
      eyebrow: "🍣 Sushi & Nhật Bản",
      title: "Combo Sushi 59K",
      subtitle: "12 miếng sashimi tươi ngon, giao tận nhà trong 30 phút",
      cta: "Xem thực đơn",
      bgImage: IMGS.sushi,
    },
  ];

  const slides = [...dynamic, ...fallback].slice(0, 3);
  // Always ensure 3 slides
  while (slides.length < 3) slides.push(fallback[slides.length % fallback.length]);
  return slides;
}

export function HeroBanner({ promotions }: HeroBannerProps) {
  const slides = buildSlides(promotions);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id + i}
            className={`relative flex-shrink-0 w-full h-52 sm:h-60 bg-gradient-to-br ${slide.gradient} flex flex-col justify-end p-6 sm:p-8`}
          >
            {/* Background food image with overlay */}
            {slide.bgImage && (
              <>
                <img
                  src={slide.bgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent pointer-events-none" />
              </>
            )}

            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute top-4 right-1/3 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

            <div className="relative z-10">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                {slide.eyebrow}
              </p>
              <h2 className="text-white font-black text-3xl sm:text-4xl leading-tight">
                {slide.title}
              </h2>
              <p className="text-white/75 text-sm mt-1 max-w-xs leading-relaxed">
                {slide.subtitle}
              </p>
              <button className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-black text-xs rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                {slide.cta} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
