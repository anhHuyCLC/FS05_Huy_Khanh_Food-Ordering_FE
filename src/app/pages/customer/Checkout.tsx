import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, CreditCard, Wallet, DollarSign, Tag, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { menuCategories } from "../../data/mock";
import { useTranslation } from "react-i18next";

const sampleItems = [
  { ...menuCategories[0].items[0], qty: 1 },
  { ...menuCategories[0].items[1], qty: 2 },
  { ...menuCategories[2].items[0], qty: 1 },
];

const payMethods = [
  { id: "card", icon: <CreditCard className="w-5 h-5" />, label: "Credit / Debit Card", sub: "**** **** **** 4242" },
  { id: "wallet", icon: <Wallet className="w-5 h-5" />, label: "E-Wallet", sub: "Apple Pay · Google Pay · PayPal" },
  { id: "cash", icon: <DollarSign className="w-5 h-5" />, label: "Cash on Delivery", sub: "Pay when your food arrives" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const [payMethod, setPayMethod] = useState("card");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [note, setNote] = useState("");
  const { t } = useTranslation();

  const subtotal = sampleItems.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = promoApplied ? subtotal * 0.2 : 0;
  const delivery = 1.99;
  const total = subtotal - discount + delivery;

  const translatedPayMethods = [
    { ...payMethods[0], label: t('checkout.credit_debit_card') },
    { ...payMethods[1], label: t('checkout.e_wallet') },
    { ...payMethods[2], label: t('checkout.cash_on_delivery'), sub: t('checkout.pay_on_arrival') },
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
              {[t('checkout.home_address'), t('checkout.office_address')].map((addr, i) => (
                <label key={i} className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:border-orange-200" style={i === 0 ? { borderColor: "#FF4500", background: "#FFF5F0" } : { borderColor: "#E5E7EB" }}>
                  <input type="radio" name="address" defaultChecked={i === 0} className="text-[#FF4500]" />
                  <span className="text-sm text-gray-700">{addr}</span>
                </label>
              ))}
              <button className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-[#FF4500] font-medium hover:border-orange-300 hover:bg-orange-50 transition-all">
                {t('checkout.add_new_address')}
              </button>
            </div>
          </div>

          {/* Estimated time */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#FF4500]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{t('checkout.estimated_arrival')}</p>
              <p className="text-2xl font-black" style={{ color: "#FF4500" }}>25–35 {t('checkout.minutes')}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">{t('checkout.driver_assigned')}</p>
              <p className="text-sm font-medium text-green-500">Alex K. 🚴</p>
            </div>
          </div>

          {/* Order Note */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">{t('checkout.order_note')}</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('checkout.order_note_placeholder')}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
            />
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
              {sampleItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">x{item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="flex gap-2 mb-5">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <Tag className="w-4 h-4 text-gray-400" />
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={t('cart.promo_code')}
                  className="bg-transparent text-sm outline-none flex-1 text-gray-600"
                />
              </div>
              <button
                onClick={() => { if (promoCode) setPromoApplied(true); }}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "#FF4500" }}
              >
                {t('cart.apply')}
              </button>
            </div>
            {promoApplied && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-600 text-sm mb-4">
                <CheckCircle className="w-4 h-4" /> {t('cart.discount_applied')}
              </div>
            )}

            {/* Price breakdown */}
            <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('cart.subtotal')}</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-sm text-green-500">
                  <span>{t('cart.discount')}</span><span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t('cart.delivery_fee')}</span><span>${delivery.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 text-lg pt-2 border-t border-gray-100">
                <span>{t('cart.total')}</span><span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/tracking")}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 24px rgba(255,69,0,0.3)" }}
            >
              {t('checkout.place_order')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
