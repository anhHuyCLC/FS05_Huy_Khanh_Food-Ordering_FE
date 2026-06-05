import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame,
  ArrowLeft,
  ArrowRight,
  User,
  Store,
  Bike,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthActions } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { register } = useAuthActions();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const [form, setForm] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    password: "",
    confirmpassword: "",
    phonenumber: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[\p{L}\s]{1,16}$/u;

    if (!form.firstname.trim()) {
      newErrors.firstname = t("auth.errors.firstname_required");
    } else if (!nameRegex.test(form.firstname.trim())) {
      newErrors.firstname = t("auth.errors.firstname_invalid");
    }

    if (form.middlename.trim() && !nameRegex.test(form.middlename.trim())) {
      newErrors.middlename = t("auth.errors.middlename_invalid");
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
      newErrors.address = t("auth.errors.address_required");
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

  const roles = [
    {
      id: "CUSTOMER",
      icon: <User className="w-6 h-6" />,
      label: t("auth.customer"),
      desc: t("auth.role_customer"),
      color: "#FF4500",
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      route: null,
    },
    {
      id: "RESTAURANT",
      icon: <Store className="w-6 h-6" />,
      label: t("auth.restaurant"),
      desc: t("auth.role_restaurant"),
      color: "#F59E0B",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      route: "/register/restaurant",
    },
    {
      id: "DRIVER",
      icon: <Bike className="w-6 h-6" />,
      label: t("auth.driver"),
      desc: t("auth.role_driver"),
      color: "#3B82F6",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      route: "/register/driver",
    },
  ];

  const handleContinue = () => {
    const selected = roles.find((r) => r.id === selectedRole);
    if (selected?.route) {
      navigate(selected.route);
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({ ...form, role: selectedRole });
      navigate("/login", {
        state: {
          successMessage: t("auth.register_success"),
        },
      });
    } catch {
      setError(t("auth.register_failed"));
    } finally {
      setLoading(false);
    }
  };

  const activeRole = roles.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
            >
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              {t("common.appName")}
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {t("auth.create_account")}
          </h1>
          <p className="text-gray-500 text-sm">{t("auth.create_account_desc")}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200"
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: step >= s ? "100%" : "0%",
                  background: "linear-gradient(90deg, #FF4500, #FF6B35)",
                }}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {step === 1 ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t("auth.choose_role")}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {t("auth.choose_role_desc")}
              </p>

              <div className="space-y-3 mb-6">
                {roles.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? `${role.bg} border-current`
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}
                      style={isSelected ? { borderColor: role.color } : {}}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isSelected ? role.iconBg : "bg-gray-100"
                        }`}
                        style={isSelected ? { color: role.color } : { color: "#9CA3AF" }}
                      >
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <p
                          className="font-semibold"
                          style={isSelected ? { color: role.color } : { color: "#374151" }}
                        >
                          {role.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {role.desc}
                        </p>
                        {role.route && (
                          <span
                            className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={
                              isSelected
                                ? {
                                    backgroundColor: role.color + "20",
                                    color: role.color,
                                  }
                                : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                            }
                          >
                            {t("auth.separate_register_page")}
                          </span>
                        )}
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={
                          isSelected
                            ? { borderColor: role.color, backgroundColor: role.color }
                            : { borderColor: "#D1D5DB" }
                        }
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Notice for Restaurant/Driver */}
              {activeRole?.route && (
                <div className="mb-6 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
                  {t("auth.choose_role_redirect_notice", { role: activeRole.label })}
                </div>
              )}

              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {t("common.continue")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ── Customer Registration Form ── */
            <form onSubmit={handleSubmit}>
              <button
                onClick={() => setStep(1)}
                type="button"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {t("auth.your_details")}
              </h2>
              <div className="space-y-4 mb-6">
                {[
                  {
                    label: t("auth.firstname"),
                    key: "firstname",
                    type: "text",
                    placeholder: t("auth.firstname_placeholder"),
                    maxLength: 16,
                  },
                  {
                    label: t("auth.middlename"),
                    key: "middlename",
                    type: "text",
                    placeholder: t("auth.middlename_placeholder"),
                    maxLength: 16,
                  },
                  {
                    label: t("auth.lastname"),
                    key: "lastname",
                    type: "text",
                    placeholder: t("auth.lastname_placeholder"),
                    maxLength: 16,
                  },
                  {
                    label: t("auth.email"),
                    key: "email",
                    type: "email",
                    placeholder: t("auth.email_placeholder"),
                  },
                  {
                    label: t("auth.phonenumber"),
                    key: "phonenumber",
                    type: "tel",
                    placeholder: t("auth.phonenumber_placeholder"),
                  },
                  {
                    label: t("auth.address"),
                    key: "address",
                    type: "text",
                    placeholder: t("auth.address_placeholder"),
                  },
                ].map((field) => {
                  const hasError = !!errors[field.key];
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {field.label} {field.key !== "middlename" && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        maxLength={field.maxLength}
                        className={`w-full px-4 py-3 rounded-2xl border bg-gray-50 text-sm outline-none transition-all ${
                          hasError
                            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        }`}
                      />
                      {hasError && (
                        <p className="text-xs text-red-500 mt-1">{errors[field.key]}</p>
                      )}
                    </div>
                  );
                })}

                {/* Password with eye toggle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t("auth.password")} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder={t("auth.min_8_chars")}
                      value={form.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t("auth.confirm_password")} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder={t("auth.confirmpassword_placeholder")}
                      value={form.confirmpassword}
                      onChange={(e) =>
                        handleFieldChange("confirmpassword", e.target.value)
                      }
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

              <p className="text-xs text-gray-400 mb-4">
                {t("auth.terms_agree")}{" "}
                <a href="#" className="text-[#FF4500]">
                  {t("auth.terms_of_service")}
                </a>{" "}
                {t("auth.and")}{" "}
                <a href="#" className="text-[#FF4500]">
                  {t("auth.privacy_policy")}
                </a>
                .
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("auth.register_submitting")}
                  </>
                ) : (
                  t("auth.create_account_btn")
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t("auth.already_have_account")}{" "}
          <Link to="/login" className="font-semibold" style={{ color: "#FF4500" }}>
            {t("auth.sign_in")}
          </Link>
        </p>
      </div>
    </div>
  );
}

