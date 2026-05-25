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
import { useAuthActions } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";

const CUISINE_TYPES = [
  "Việt Nam", "Nhật Bản", "Hàn Quốc", "Trung Hoa",
  "Ý", "Mỹ", "Thái Lan", "Ấn Độ",
  "Đồ nướng", "Hải sản", "Chay / Thuần chay", "Đồ uống & Tráng miệng",
  "Fastfood", "Pizza", "Ramen", "Khác",
];

const OPEN_HOURS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00",
];

const CLOSE_HOURS = [
  "18:00", "19:00", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30", "00:00",
];

const steps = [
  { id: 1, label: "Tài khoản" },
  { id: 2, label: "Nhà hàng" },
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
    password: "",
    confirmpassword: "",
    restaurantName: "",
    restaurantAddress: "",
    cuisineType: "",
    openTime: "09:00",
    closeTime: "22:00",
    restaurantDescription: "",
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
    if (form.password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
    if (form.password !== form.confirmpassword)
      return "Mật khẩu xác nhận không khớp";
    return null;
  };

  const validateStep2 = () => {
    if (!form.restaurantName.trim()) return "Vui lòng nhập tên nhà hàng";
    if (!form.restaurantAddress.trim()) return "Vui lòng nhập địa chỉ nhà hàng";
    if (!form.cuisineType) return "Vui lòng chọn loại ẩm thực";
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
          successMessage:
            "Đăng ký nhà hàng thành công! Tài khoản đang chờ được phê duyệt.",
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
              Đăng ký đối tác nhà hàng
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Mở rộng kinh doanh, tiếp cận hàng nghìn khách hàng mới
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
                    background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                  }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Thông tin chủ sở hữu
                  </h2>
                  <p className="text-xs text-gray-400">
                    Thông tin cá nhân của bạn
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
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
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
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="restaurant@email.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
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
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
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
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all pr-11"
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
                      onChange={(e) => update("confirmpassword", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all pr-11"
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
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                Tiếp theo <ArrowRight className="w-4 h-4" />
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
                <ArrowLeft className="w-4 h-4" /> Quay lại
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
                    Thông tin nhà hàng
                  </h2>
                  <p className="text-xs text-gray-400">
                    Chi tiết về nhà hàng của bạn
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <Store className="w-3 h-3" /> Tên nhà hàng{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Phở Bò Hà Nội, Pizza House..."
                    value={form.restaurantName}
                    onChange={(e) => update("restaurantName", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Địa chỉ nhà hàng{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, quận, thành phố..."
                    value={form.restaurantAddress}
                    onChange={(e) => update("restaurantAddress", e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Loại ẩm thực <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.cuisineType}
                      onChange={(e) => update("cuisineType", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all appearance-none pr-10"
                    >
                      <option value="">-- Chọn loại ẩm thực --</option>
                      {CUISINE_TYPES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Giờ mở cửa
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
                      <Clock className="w-3 h-3" /> Giờ đóng cửa
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
                    Mô tả ngắn về nhà hàng{" "}
                    <span className="text-gray-400">(tuỳ chọn)</span>
                  </label>
                  <textarea
                    placeholder="Mô tả phong cách, món đặc trưng của nhà hàng..."
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

              {/* Summary cards */}
              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">
                    Chủ sở hữu
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                    <span className="text-gray-400 text-xs">Họ và tên</span>
                    <span className="font-medium">
                      {form.firstname} {form.lastname}
                    </span>
                    <span className="text-gray-400 text-xs">Email</span>
                    <span className="font-medium truncate">{form.email}</span>
                    <span className="text-gray-400 text-xs">SĐT</span>
                    <span className="font-medium">{form.phonenumber}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wide">
                    Nhà hàng
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                    <span className="text-gray-400 text-xs">Tên</span>
                    <span className="font-medium">{form.restaurantName}</span>
                    <span className="text-gray-400 text-xs">Địa chỉ</span>
                    <span className="font-medium leading-tight">
                      {form.restaurantAddress}
                    </span>
                    <span className="text-gray-400 text-xs">Ẩm thực</span>
                    <span className="font-medium">{form.cuisineType}</span>
                    <span className="text-gray-400 text-xs">Giờ hoạt động</span>
                    <span className="font-medium">
                      {form.openTime} – {form.closeTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs mb-5">
                ℹ️ Tài khoản nhà hàng sẽ được kiểm duyệt trong vòng <strong>24–48 giờ</strong>.
                Chúng tôi sẽ liên hệ qua email để xác nhận.
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <a href="#" className="text-[#FF4500]">
                  Điều khoản đối tác
                </a>{" "}
                và{" "}
                <a href="#" className="text-[#FF4500]">
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
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Gửi đăng ký nhà hàng
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
