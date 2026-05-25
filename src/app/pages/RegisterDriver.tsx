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
import { useAuthActions } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

const VEHICLE_TYPES = [
  { value: "MOTORBIKE", label: "🏍️ Xe máy" },
  { value: "BICYCLE", label: "🚲 Xe đạp" },
  { value: "CAR", label: "🚗 Ô tô" },
  { value: "ELECTRIC_BIKE", label: "⚡ Xe máy điện" },
];

const steps = [
  { id: 1, label: "Tài khoản" },
  { id: 2, label: "Phương tiện" },
  { id: 3, label: "Hoàn tất" },
];

function StepIndicator({ current }: { current: number }) {
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

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep1 = () => {
    if (!form.firstname.trim()) return "Vui lòng nhập họ";
    if (!form.lastname.trim()) return "Vui lòng nhập tên";
    if (!form.email.trim()) return "Vui lòng nhập email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Email không hợp lệ";
    if (!form.phonenumber.trim()) return "Vui lòng nhập số điện thoại";
    if (!form.address.trim()) return "Vui lòng nhập địa chỉ thường trú";
    if (form.password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
    if (form.password !== form.confirmpassword)
      return "Mật khẩu xác nhận không khớp";
    return null;
  };

  const validateStep2 = () => {
    if (!form.vehicleType) return "Vui lòng chọn loại phương tiện";
    if (!form.licensePlate.trim()) return "Vui lòng nhập biển số xe";
    if (!form.driverLicenseNumber.trim())
      return "Vui lòng nhập số bằng lái xe";
    if (!form.nationalIdNumber.trim())
      return "Vui lòng nhập số CCCD/CMND";
    return null;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
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
          successMessage:
            "Đăng ký tài xế thành công! Tài khoản đang chờ được phê duyệt.",
        },
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Đăng ký thất bại. Vui lòng thử lại."
      );
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const vehicleLabel =
    VEHICLE_TYPES.find((v) => v.value === form.vehicleType)?.label || "";

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
              Đăng ký làm tài xế giao hàng
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Tự do về thời gian, thu nhập hấp dẫn, giao hàng mọi lúc bạn muốn
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

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
                    Thông tin cá nhân
                  </h2>
                  <p className="text-xs text-gray-400">
                    Thông tin tài khoản của bạn
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Họ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn"
                    value={form.firstname}
                    onChange={(e) => update("firstname", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Tên <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Văn A"
                    value={form.lastname}
                    onChange={(e) => update("lastname", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="driver@email.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Số điện thoại{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0901 234 567"
                    value={form.phonenumber}
                    onChange={(e) => update("phonenumber", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Địa chỉ thường trú{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, quận, thành phố..."
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Mật khẩu{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Tối thiểu 8 ký tự"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all pr-11"
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Xác nhận mật khẩu{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirmpassword}
                      onChange={(e) =>
                        update("confirmpassword", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all pr-11"
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
                Tiếp theo <ArrowRight className="w-4 h-4" />
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
                <ArrowLeft className="w-4 h-4" /> Quay lại
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
                    Thông tin phương tiện & giấy tờ
                  </h2>
                  <p className="text-xs text-gray-400">
                    Cần thiết để xác minh tài xế
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                {/* Vehicle type selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Loại phương tiện <span className="text-red-400">*</span>
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
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Car className="w-3 h-3" /> Biển số xe{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 51G-123.45"
                    value={form.licensePlate}
                    onChange={(e) =>
                      update("licensePlate", e.target.value.toUpperCase())
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Số bằng lái xe{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Số trên bằng lái xe của bạn"
                    value={form.driverLicenseNumber}
                    onChange={(e) =>
                      update("driverLicenseNumber", e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Số CCCD / CMND{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Số căn cước công dân hoặc CMND"
                    value={form.nationalIdNumber}
                    onChange={(e) =>
                      update("nationalIdNumber", e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Info notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs mb-4">
                🔒 Thông tin giấy tờ của bạn được bảo mật và chỉ dùng để xác
                minh danh tính tài xế.
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
                Tiếp theo <ArrowRight className="w-4 h-4" />
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
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>

              <h2 className="text-base font-bold text-gray-900 mb-1">
                Xác nhận thông tin
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                Kiểm tra lại trước khi gửi đăng ký
              </p>

              {/* Summary */}
              <div className="space-y-3 mb-5">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                    Thông tin tài xế
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-400 text-xs">Họ và tên</span>
                    <span className="font-medium text-gray-700">
                      {form.firstname} {form.lastname}
                    </span>
                    <span className="text-gray-400 text-xs">Email</span>
                    <span className="font-medium text-gray-700 truncate">
                      {form.email}
                    </span>
                    <span className="text-gray-400 text-xs">SĐT</span>
                    <span className="font-medium text-gray-700">
                      {form.phonenumber}
                    </span>
                    <span className="text-gray-400 text-xs">Địa chỉ</span>
                    <span className="font-medium text-gray-700 leading-tight">
                      {form.address}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">
                    Phương tiện & Giấy tờ
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-400 text-xs">Phương tiện</span>
                    <span className="font-medium text-gray-700">
                      {vehicleLabel}
                    </span>
                    <span className="text-gray-400 text-xs">Biển số</span>
                    <span className="font-medium text-gray-700 font-mono">
                      {form.licensePlate}
                    </span>
                    <span className="text-gray-400 text-xs">Bằng lái</span>
                    <span className="font-medium text-gray-700">
                      {form.driverLicenseNumber}
                    </span>
                    <span className="text-gray-400 text-xs">CCCD/CMND</span>
                    <span className="font-medium text-gray-700">
                      {form.nationalIdNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs mb-4">
                ℹ️ Tài khoản tài xế sẽ được kiểm duyệt trong vòng{" "}
                <strong>24–48 giờ</strong>. Chúng tôi sẽ liên hệ qua số điện
                thoại để xác nhận.
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <a href="#" className="text-blue-500">
                  Điều khoản tài xế
                </a>{" "}
                và{" "}
                <a href="#" className="text-blue-500">
                  Chính sách bảo mật
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
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Gửi đăng ký tài xế
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold"
            style={{ color: "#FF4500" }}
          >
            Đăng nhập
          </Link>
          {" · "}
          <Link
            to="/register"
            className="font-semibold text-gray-500 hover:text-gray-700"
          >
            Đăng ký cách khác
          </Link>
        </p>
      </div>
    </div>
  );
}
