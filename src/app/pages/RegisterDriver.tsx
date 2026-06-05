import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame,
  ArrowLeft,
  ArrowRight,
  Bike,
  User,
  Mail,
  Phone,
  Lock,
  CreditCard,
  Car,
  MapPin,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthActions } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

const VEHICLE_TYPES = [
  { value: "MOTORBIKE", labelKey: "auth.vehicle_types.motorbike" },
  { value: "BICYCLE", labelKey: "auth.vehicle_types.bicycle" },
  { value: "CAR", labelKey: "auth.vehicle_types.car" },
  { value: "ELECTRIC_BIKE", labelKey: "auth.vehicle_types.electric_bike" },
]

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
                  ? { background: "linear-gradient(135deg, #3B82F6, #6366F1)" }
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
                  background: "linear-gradient(90deg, #3B82F6, #6366F1)",
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
  // Account
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  address: string;
  password: string;
  confirmpassword: string;
  // Vehicle
  vehicleType: string;
  licensePlate: string;
  driverLicenseNumber: string;
  nationalIdNumber: string;
}

export default function RegisterDriver() {
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
    { id: 2, label: t("auth.step_vehicle") },
    { id: 3, label: t("auth.step_complete") },
  ];

  const [form, setForm] = useState<FormData>({
    firstname: "",
    lastname: "",
    email: "",
    phonenumber: "",
    address: "",
    password: "",
    confirmpassword: "",
    vehicleType: "MOTORBIKE",
    licensePlate: "",
    driverLicenseNumber: "",
    nationalIdNumber: "",
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

    if (!form.address.trim()) {
      newErrors.address = t("auth.errors.address_driver_required");
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

    if (!form.vehicleType) {
      newErrors.vehicleType = t("auth.errors.vehicle_type_required");
    }
    if (!form.licensePlate.trim()) {
      newErrors.licensePlate = t("auth.errors.license_plate_required");
    }
    if (!form.driverLicenseNumber.trim()) {
      newErrors.driverLicenseNumber = t("auth.errors.driver_license_required");
    }
    if (!form.nationalIdNumber.trim()) {
      newErrors.nationalIdNumber = t("auth.errors.national_id_required");
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
        address: form.address,
        role: "DRIVER",
        vehicleType: form.vehicleType,
        licensePlate: form.licensePlate,
        driverLicenseNumber: form.driverLicenseNumber,
        nationalIdNumber: form.nationalIdNumber,
      });
      navigate("/login", {
        state: {
          successMessage: t("auth.register_driver_success"),
        },
      });
    } catch {
      setError(t("auth.register_driver_failed"));
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const vehicleLabel = t(VEHICLE_TYPES.find((v) => v.value === form.vehicleType)?.labelKey || "");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EEF2FF 100%)",
      }}
    >
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
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
            style={{ backgroundColor: "#EFF6FF" }}
          >
            <Bike className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              {t("auth.driver_register_title")}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {t("auth.driver_register_subtitle")}
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
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {t("auth.driver_personal_info")}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {t("auth.driver_personal_info_desc")}
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
                        : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                        : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                    <Mail className="w-3 h-3" /> {t("auth.email")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                        : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.phonenumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.phonenumber}</p>
                  )}
                </div>
 
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {t("auth.driver_address_label")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.driver_address_placeholder")}
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.address
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1">{errors.address}</p>
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
                          : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                      onChange={(e) =>
                        update("confirmpassword", e.target.value)
                      }
                      className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all pr-11 ${
                        errors.confirmpassword
                          ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}
              >
                {t("common.next")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Vehicle Info ── */}
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
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  }}
                >
                  <Car className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {t("auth.driver_vehicle_info")}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {t("auth.driver_vehicle_info_desc")}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                {/* Vehicle type selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    {t("auth.vehicle_type_label")} <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_TYPES.map((v) => (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => update("vehicleType", v.value)}
                        className={`py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all text-left ${
                          form.vehicleType === v.value
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {t(v.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Car className="w-3 h-3" /> {t("auth.license_plate_label")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.license_plate_placeholder")}
                    value={form.licensePlate}
                    onChange={(e) =>
                      update("licensePlate", e.target.value.toUpperCase())
                    }
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all font-mono ${
                      errors.licensePlate
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-blue-400 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.licensePlate && (
                    <p className="text-xs text-red-500 mt-1">{errors.licensePlate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> {t("auth.driver_license_label")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.driver_license_placeholder")}
                    value={form.driverLicenseNumber}
                    onChange={(e) =>
                      update("driverLicenseNumber", e.target.value)
                    }
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.driverLicenseNumber
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-blue-400 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.driverLicenseNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.driverLicenseNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> {t("auth.national_id_label")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("auth.national_id_placeholder")}
                    value={form.nationalIdNumber}
                    onChange={(e) =>
                      update("nationalIdNumber", e.target.value)
                    }
                    className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                      errors.nationalIdNumber
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-blue-400 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.nationalIdNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.nationalIdNumber}</p>
                  )}
                </div>
              </div>

              {/* Info notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs mb-4">
                {t("auth.driver_secure_notice")}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleNextStep}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}
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

              {/* Summary */}
              <div className="space-y-3 mb-5">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                    {t("auth.driver_personal_info")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-400 text-xs">{t("auth.full_name")}</span>
                    <span className="font-medium text-gray-700">
                      {form.firstname} {form.lastname}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.email")}</span>
                    <span className="font-medium text-gray-700 truncate">
                      {form.email}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.phonenumber")}</span>
                    <span className="font-medium text-gray-700">
                      {form.phonenumber}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.address")}</span>
                    <span className="font-medium text-gray-700 leading-tight">
                      {form.address}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">
                    {t("auth.driver_vehicle_label")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-400 text-xs">{t("auth.vehicle_type_label")}</span>
                    <span className="font-medium text-gray-700">
                      {vehicleLabel}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.license_plate_label")}</span>
                    <span className="font-medium text-gray-700 font-mono">
                      {form.licensePlate}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.driver_license_label")}</span>
                    <span className="font-medium text-gray-700">
                      {form.driverLicenseNumber}
                    </span>
                    <span className="text-gray-400 text-xs">{t("auth.national_id_label")}</span>
                    <span className="font-medium text-gray-700">
                      {form.nationalIdNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs mb-4">
                {t("auth.driver_audit_notice")}
              </div>

              <p className="text-xs text-gray-400 mb-4">
                {t("auth.partner_terms_agree")}{" "}
                <a href="#" className="text-blue-500">
                  {t("auth.driver_terms")}
                </a>{" "}
                {t("auth.and")}{" "}
                <a href="#" className="text-blue-500">
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
                style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("auth.submit_driver_loading")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> {t("auth.submit_driver_btn")}
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
