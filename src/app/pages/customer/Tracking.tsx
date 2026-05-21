import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Phone, MessageCircle, Star, CheckCircle, Clock, MapPin, Navigation, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { orderService } from "../../services/orderService";
import type { Order } from "../../types/order";

export default function Tracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (orderId) {
      orderService.getOrder(orderId)
        .then((data) => setOrder(data))
        .catch((err) => console.error("Failed to load order", err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  const statusRank: Record<string, number> = {
    pending: 1, accepted: 1,
    preparing: 2,
    ready: 3,
    delivering: 4,
    completed: 5,
    cancelled: 0
  };

  const currentRank = order ? statusRank[order.status] || 1 : 2;

  const steps = [
    { id: 1, label: t('tracking.order_confirmed'), desc: `${order?.restaurant?.name || "Restaurant"} ${t('tracking.received_order')}`, icon: "✅", done: currentRank > 1, active: currentRank === 1 },
    { id: 2, label: t('tracking.preparing'), desc: t('tracking.kitchen_working'), icon: "👨‍🍳", done: currentRank > 2, active: currentRank === 2 },
    { id: 3, label: t('tracking.driver_picked_up'), desc: `${order?.driver?.profile?.fullName || "Driver"} ${t('tracking.collected')}`, icon: "🛵", done: currentRank > 3, active: currentRank === 3 },
    { id: 4, label: t('tracking.on_the_way'), desc: `${order?.driver?.profile?.fullName || "Driver"} ${t('tracking.heading_to')}`, icon: "🗺️", done: currentRank > 4, active: currentRank === 4 },
    { id: 5, label: t('tracking.delivered'), desc: t('tracking.enjoy_meal'), icon: "🎉", done: currentRank === 5, active: currentRank === 5 },
  ];

  const currentStep = steps.findIndex((s) => s.active) + 1 || 2;

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
          {/* ETA Banner */}
          <div
            className="rounded-3xl p-6 text-white overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
          >
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
            <p className="text-orange-100 text-sm mb-1">{t('checkout.estimated_arrival')}</p>
            <p className="text-5xl font-black mb-1">18 <span className="text-2xl font-bold">min</span></p>
            <p className="text-orange-100 text-sm">{t('tracking.kitchen_working')} 👨‍🍳</p>
          </div>

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
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 4.97 · 1,342 {t('tracking.trips')}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">🏍️ Honda PCX White</p>
                </div>
                <div className="flex gap-3">
                  <button className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 hover:bg-green-100 transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Map + Order Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Map placeholder */}
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm h-64 relative">
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #E8F4FD, #D1EBF6)" }}>
              {/* Fake map grid */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="border-b border-blue-300" style={{ height: "12.5%" }} />
                ))}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border-r border-blue-300 absolute top-0 bottom-0" style={{ left: `${(i + 1) * 16.67}%` }} />
                ))}
              </div>
              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full">
                <path d="M 30 200 Q 150 100 240 80 Q 280 60 300 40" stroke="#FF4500" strokeWidth="3" fill="none" strokeDasharray="8 4" className="animate-pulse" />
              </svg>
              {/* Driver pin */}
              <div className="absolute" style={{ left: "55%", top: "40%" }}>
                <div className="w-10 h-10 rounded-full bg-[#FF4500] flex items-center justify-center shadow-lg border-2 border-white">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
              </div>
              {/* Destination pin */}
              <div className="absolute" style={{ left: "15%", top: "70%" }}>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-2xl px-4 py-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF4500]" />
              <span className="text-sm font-semibold text-gray-700">{t('tracking.min_away')}</span>
              <span className="text-xs text-gray-400 ml-auto">{t('tracking.km_left')}</span>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">{t('cart.order_summary')}</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {order ? order.items?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.menuItem?.name || "Item"} <span className="text-gray-400">x{item.quantity}</span></span>
                  <span className="font-medium text-gray-800">${item.price * item.quantity}</span>
                </div>
              )) : (
                <div className="flex justify-between">
                  <span>Loading items...</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>{t('cart.total')}</span><span>${order?.finalAmount || "0.00"}</span>
              </div>
            </div>
          </div>

          {/* Rate in advance */}
          {!rated ? (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <p className="font-semibold text-gray-900 mb-3">{t('tracking.rate_experience')}</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => { setRating(s); setRated(true); }} className="p-1 transition-transform hover:scale-125">
                    <Star className={`w-7 h-7 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 rounded-3xl p-5 border border-green-100 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
              <p className="text-sm font-medium text-green-700">{t('tracking.thanks_for_rating')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
