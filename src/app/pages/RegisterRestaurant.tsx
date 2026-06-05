import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame,
  ArrowLeft,
  ArrowRight,
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  Lock,
  User,
  ChevronDown,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthActions } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

const CUISINE_TYPES = [
  { value: "Việt Nam", labelKey: "auth.cuisine_types.vietnamese" },
  { value: "Nhật Bản", labelKey: "auth.cuisine_types.japanese" },
  { value: "Hàn Quốc", labelKey: "auth.cuisine_types.korean" },
  { value: "Trung Hoa", labelKey: "auth.cuisine_types.chinese" },
  { value: "Ý", labelKey: "auth.cuisine_types.italian" },
  { value: "Mỹ", labelKey: "auth.cuisine_types.american" },
  { value: "Thái Lan", labelKey: "auth.cuisine_types.thai" },
  { value: "Ấn Độ", labelKey: "auth.cuisine_types.indian" },
  { value: "Đồ nướng", labelKey: "auth.cuisine_types.bbq" },
  { value: "Hải sản", labelKey: "auth.cuisine_types.seafood" },
  { value: "Chay / Thuần chay", labelKey: "auth.cuisine_types.vegan" },
  { value: "Đồ uống & Tráng miệng", labelKey: "auth.cuisine_types.drinks" },
  { value: "Fastfood", labelKey: "auth.cuisine_types.fastfood" },
  { value: "Pizza", labelKey: "auth.cuisine_types.pizza" },
  { value: "Ramen", labelKey: "auth.cuisine_types.ramen" },
  { value: "Khác", labelKey: "auth.cuisine_types.other" },
];

const OPEN_HOURS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00",
];

const CLOSE_HOURS = [
  "18:00", "19:00", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30", "00:00",
];

interface Step {
  id: number;
  label: string;
}

function StepIndicator({ current, steps }: { current: number; steps: Step[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                current > s.id
                  ? "bg-green-500 text-white"
                  : current === s.id
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-400"
              }`}
              style={
                current === s.id
                  ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" }
                  : {}
              }
            >
              {current > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                current >= s.id ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mb-5 mx-1 rounded-full overflow-hidden bg-gray-200">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: current > s.id ? "100%" : "0%",
                  background: "linear-gradient(90deg, #FF4500, #FF6B35)",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface FormData {
  // Account info
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  password: string;
  confirmpassword: string;
  // Restaurant info
  restaurantName: string;
  restaurantAddress: string;
  cuisineType: string;
  openTime: string;
  closeTime: string;
  restaurantDescription: string;
}

export default function RegisterRestaurant() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { register } = useAuthActions();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const steps = [
    { id: 1, label: t("auth.step_account") },
    { id: 2, label: t("auth.step_restaurant") },
    { id: 3, label: t("auth.step_complete") },
  ];

  const [form, setForm] = useState<FormData>({
    firstname: "",
    lastname: "",
    email: "",
    phonenumber: "",
    password: "",
    confirmpassword: "",
    restaurantName: "",
    restaurantAddress: "",
    cuisineType: "",
    openTime: "09:00",
    closeTime: "22:00",
    restaurantDescription: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[\p{L}\s]+$/u;

    if (!form.firstname.trim()) {
      newErrors.firstname = t("auth.errors.firstname_required");
    } else if (!nameRegex.test(form.firstname.trim())) {
      newErrors.firstname = t("auth.errors.firstname_invalid");
    }

    if (!form.lastname.trim()) {
      newErrors.lastname = t("auth.errors.lastname_required");
    } else if (!nameRegex.test(form.lastname.trim())) {
      newErrors.lastname = t("auth.errors.lastname_invalid");
    }

    if (!form.email.trim()) {
      newErrors.email = t("auth.errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t("auth.errors.email_invalid");
    }

    if (!form.phonenumber.trim()) {
      newErrors.phonenumber = t("auth.errors.phone_required");
    } else if (!/^(0|\+84)[35789][0-9]{8}$/.test(form.phonenumber)) {
      newErrors.phonenumber = t("auth.errors.phone_invalid");
    }

    if (!form.password) {
      newErrors.password = t("auth.errors.password_required");
    } else if (form.password.length < 8) {
      newErrors.password = t("auth.errors.password_min");
    }

    if (!form.confirmpassword) {
      newErrors.confirmpassword = t("auth.errors.confirm_password_required");
    } else if (form.password !== form.confirmpassword) {
      newErrors.confirmpassword = t("auth.errors.confirm_password_mismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!form.restaurantName.trim()) {
      newErrors.restaurantName = t("auth.errors.restaurant_name_required");
    }
    if (!form.restaurantAddress.trim()) {
      newErrors.restaurantAddress = t("auth.errors.restaurant_address_required");
    }
    if (!form.cuisineType) {
      newErrors.cuisineType = t("auth.errors.cuisine_type_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      const isValid = validateStep1();
      if (!isValid) return;
    }
    if (step === 2) {
      const isValid = validateStep2();
      if (!isValid) return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await register({
        firstname: form.firstname,
        middlename: "",
        lastname: form.lastname,
        email: form.email,
        phonenumber: form.phonenumber,
        password: form.password,
        confirmpassword: form.confirmpassword,
        address: form.restaurantAddress,
        role: "RESTAURANT",
        restaurantName: form.restaurantName,
        restaurantAddress: form.restaurantAddress,
        cuisineType: form.cuisineType,
        openTime: form.openTime,
        closeTime: form.closeTime,
        restaurantDescription: form.restaurantDescription,
      });
      navigate("/login", {
        state: {
          successMessage: t("auth.register_restaurant_success"),
        },
      });
    } catch {
      setError(t("auth.register_restaurant_failed"));
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
            >
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900">Savour</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 mb-3">
            <Store className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-700">
              {t("auth.restaurant_register_title")}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {t("auth.restaurant_register_subtitle")}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} steps={steps} />

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* ── STEP 1: Account Info ── */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                  }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {t("auth.restaurant_owner_info")}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {t("auth.restaurant_owner_info_desc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {t("auth.firstname")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.firstname_placeholder")}
                    value={form.firstname}
                    onChange={(e) => update("firstname", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.firstname
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                  />
                  {errors.firstname && (
                    <p className="text-xs text-red-500 mt-1">{errors.firstname}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {t("auth.lastname")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.lastname_placeholder")}
                    value={form.lastname}
                    onChange={(e) => update("lastname", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.lastname
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                  />
                  {errors.lastname && (
                    <p className="text-xs text-red-500 mt-1">{errors.lastname}</p>
                  )}
                </div>
              </div>
 
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {t("auth.email")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {t("auth.phonenumber")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder={t("auth.phonenumber_placeholder")}
                    value={form.phonenumber}
                    onChange={(e) => update("phonenumber", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.phonenumber
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                  />
                  {errors.phonenumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.phonenumber}</p>
                  )}
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {t("auth.password")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder={t("auth.min_8_chars")}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all pr-11 ${
                        errors.password
                          ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                  )}
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {t("auth.confirm_password")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder={t("auth.confirmpassword_placeholder")}
                      value={form.confirmpassword}
                      onChange={(e) => update("confirmpassword", e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all pr-11 ${
                        errors.confirmpassword
                          ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmpassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmpassword}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleNextStep}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {t("common.next")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Restaurant Info ── */}
          {step === 2 && (
            <div>
              <button
                onClick={() => { setError(null); setStep(1); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>

              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                  }}
                >
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {t("auth.restaurant_info")}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {t("auth.restaurant_info_desc")}
                  </p>
                </div>
              </div>
 
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Store className="w-3 h-3" /> {t("auth.restaurant_name_label")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.restaurant_name_placeholder")}
                    value={form.restaurantName}
                    onChange={(e) => update("restaurantName", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.restaurantName
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                  />
                  {errors.restaurantName && (
                    <p className="text-xs text-red-500 mt-1">{errors.restaurantName}</p>
                  )}
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {t("auth.restaurant_address_label")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.restaurant_address_placeholder")}
                    value={form.restaurantAddress}
                    onChange={(e) => update("restaurantAddress", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.restaurantAddress
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                  />
                  {errors.restaurantAddress && (
                    <p className="text-xs text-red-500 mt-1">{errors.restaurantAddress}</p>
                  )}
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {t("auth.cuisine_type_label")} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.cuisineType}
                      onChange={(e) => update("cuisineType", e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all appearance-none pr-10 ${
                        errors.cuisineType
                          ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      }`}
                    >
                      <option value="">{t("auth.cuisine_type_select")}</option>
                      {CUISINE_TYPES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {t(c.labelKey)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.cuisineType && (
                    <p className="text-xs text-red-500 mt-1">{errors.cuisineType}</p>
                  )}
                </div>
 
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t("auth.open_time_label")}
                    </label>
                    <div className="relative">
                      <select
                        value={form.openTime}
                        onChange={(e) => update("openTime", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all appearance-none pr-8"
                      >
                        {OPEN_HOURS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t("auth.close_time_label")}
                    </label>
                    <div className="relative">
                      <select
                        value={form.closeTime}
                        onChange={(e) => update("closeTime", e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all appearance-none pr-8"
                      >
                        {CLOSE_HOURS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {t("auth.restaurant_desc_label")}{" "}
                    <span className="text-gray-400">{t("auth.restaurant_desc_optional")}</span>
                  </label>
                  <textarea
                    placeholder={t("auth.restaurant_desc_placeholder")}
                    value={form.restaurantDescription}
                    onChange={(e) =>
                      update("restaurantDescription", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                  />
                </div>
              </div>
 
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
 
              <button
                onClick={handleNextStep}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {t("common.next")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 3: Review & Submit ── */}
          {step === 3 && (
            <div>
              <button
                onClick={() => { setError(null); setStep(2); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>

              <h2 className="text-base font-bold text-gray-900 mb-1">
                {t("auth.confirm_info_title")}
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                {t("auth.confirm_info_desc")}
              </p>

              {/* Summary cards */}
              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">
                    {t("auth.owner_section_title")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                    <span className="text-gray-400 text-xs">{t("auth.full_name")}</span>
                    <span className="font-medium">
                      {form.firstname} {form.lastname}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.email")}</span>
                    <span className="font-medium truncate">{form.email}</span>
                    <span className="text-gray-400 text-xs">{t("auth.phonenumber")}</span>
                    <span className="font-medium">{form.phonenumber}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wide">
                    {t("auth.restaurant_section_title")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                    <span className="text-gray-400 text-xs">{t("auth.restaurant_name_label")}</span>
                    <span className="font-medium">{form.restaurantName}</span>
                    <span className="text-gray-400 text-xs">{t("auth.restaurant_address_label")}</span>
                    <span className="font-medium leading-tight">
                      {form.restaurantAddress}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.cuisine_type_label")}</span>
                    <span className="font-medium">
                      {t(CUISINE_TYPES.find(c => c.value === form.cuisineType)?.labelKey || form.cuisineType)}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.open_time_label")}</span>
                    <span className="font-medium">
                      {form.openTime} – {form.closeTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs mb-5">
                {t("auth.restaurant_audit_notice")}
              </div>

              <p className="text-xs text-gray-400 mb-4">
                {t("auth.partner_terms_agree")}{" "}
                <a href="#" className="text-[#FF4500]">
                  {t("auth.partner_terms")}
                </a>{" "}
                {t("auth.and")}{" "}
                <a href="#" className="text-[#FF4500]">
                  {t("auth.partner_privacy")}
                </a>
                .
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("auth.submit_restaurant_loading")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> {t("auth.submit_restaurant_btn")}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t("auth.already_have_account")}{" "}
          <Link
            to="/login"
            className="font-semibold"
            style={{ color: "#FF4500" }}
          >
            {t("auth.sign_in")}
          </Link>
          {" · "}
          <Link
            to="/register"
            className="font-semibold text-gray-500 hover:text-gray-700"
          >
            {t("auth.other_register_options")}
          </Link>
        </p>
      </div>
    </div>
  );
}
