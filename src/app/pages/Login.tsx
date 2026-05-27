import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Flame, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IMGS } from "../data/mock";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useAuthActions } from "../hooks/useAuth";
import { useAuthStore } from "../stores/authStore";
import { toast } from "sonner";

import { getRedirectPath } from "../lib/authorization";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const { login } = useAuthActions();
  const { handleGoogleOAuthFlow, isLoading: googleLoading, error: googleError } = useGoogleAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const auth = await login(form);
      navigate(getRedirectPath(auth.user));
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate(getRedirectPath(user));
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Image */}
      <div className="hidden lg:block relative overflow-hidden">
        <img src={IMGS.restaurant} alt="Food" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,69,0,0.85), rgba(15,23,42,0.9))" }} />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Savour</span>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-2">{t('auth.trusted_by')}</p>
            <h2 className="text-4xl font-black text-white leading-tight mb-6">
              {t('auth.next_favorite_meal')}
            </h2>
            <div className="flex gap-4">
              {[t('auth.restaurants_500'), t('auth.delivery_30_min'), t('auth.rating_4_9')].map((b) => (
                <div key={b} className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur text-white text-xs font-medium border border-white/20">
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-col justify-center px-8 py-12 lg:px-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('common.back_to_home')}
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">{t('auth.welcome')}</h1>
            <p className="text-gray-500 text-sm">{t('auth.welcome_desc')}</p>
          </div>

          {/* Social logins */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={handleGoogleOAuthFlow}
              disabled={googleLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium text-gray-700"
            >
              {googleLoading ? (
                <span className="spinner-small"></span>
              ) : (
                <>🌐 {t('auth.continue_with_google')}</>
              )}
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
              🍎 {t('auth.continue_with_apple')}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">{t('auth.or_sign_in_with')}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('auth.email_placeholder')}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.password_placeholder')}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded" />
                {t('auth.remember_me')}
              </label>
              <a href="#" className="text-sm font-medium" style={{ color: "#FF4500" }}>{t('auth.forgot_password')}</a>
            </div>

            {(error || googleError) && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {typeof (error || googleError) === 'string' ? (error || googleError) : 'Login failed'}
              </div>
            )}

            <button
              type="submit"
              className="auth-button auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="button-loading">
                  <span className="spinner-small"></span>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.dont_have_account')}{" "}
            <Link to="/register" className="font-semibold" style={{ color: "#FF4500" }}>
              {t('auth.create_free')}
            </Link>
          </p>

          {/* Demo roles
          <div className="mt-8 p-4 rounded-2xl bg-orange-50 border border-orange-100">
            <p className="text-xs font-semibold text-orange-600 mb-3">{t('auth.demo_sign_in')}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t('auth.customer'), path: "/explore" },
                { label: t('auth.restaurant'), path: "/restaurant-dashboard" },
                { label: t('auth.driver'), path: "/driver-dashboard" },
                { label: t('auth.admin'), path: "/admin" },
              ].map((r) => (
                <button
                  key={r.path}
                  onClick={() => navigate(r.path)}
                  className="py-2 px-3 rounded-xl text-xs font-medium bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div >
  );
}


