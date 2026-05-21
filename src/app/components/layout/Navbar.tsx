import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ChevronDown, Flame } from "lucide-react";
import { Button } from "../ui/button";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";

const demoRoles = [
  { label: "🛍️ Customer View", path: "/explore" },
  { label: "🍴 Restaurant Dashboard", path: "/restaurant-dashboard" },
  { label: "🚴 Driver Dashboard", path: "/driver-dashboard" },
  { label: "⚙️ Admin Panel", path: "/admin" },
];

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cartCount = useCartStore((state) => state.getItemCount());
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    navigate("/");
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${transparent ? "bg-transparent" : "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className={`text-xl font-bold ${transparent ? "text-white" : "text-gray-900"}`}>
            Savour
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: t('home.Explore'), path: "/explore" },
            { label: t('home.Community'), path: "/community" },
            { label: t('home.Partner'), path: "/restaurant-dashboard" },
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-[#FF4500] ${transparent ? "text-white/80" : "text-gray-600"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Demo Roles Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDemoOpen(!demoOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#FF4500]/10 text-[#FF4500] hover:bg-[#FF4500]/20 transition-colors"
            >
              {t('home.Demo Roles')} <ChevronDown className="w-3 h-3" />
            </button>
            {demoOpen && (
              <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-52 z-50">
                {demoRoles.map((role) => (
                  <button
                    key={role.path}
                    onClick={() => { navigate(role.path); setDemoOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF4500] transition-colors"
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user && (
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ShoppingCart className={`w-5 h-5 ${transparent ? "text-white" : "text-gray-700"}`} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-bold" style={{ background: "#FF4500" }}>
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={transparent ? "text-white hover:bg-white/10" : ""}
                onClick={() => navigate("/profile")}
              >
                {user.fullName}
              </Button>
              <Button
                size="sm"
                className="text-white font-semibold px-5"
                style={{
                  background: "linear-gradient(135deg, #ff0008, #FF6B35)",
                }}
                onClick={handleLogout}
              >
                {t("home.Logout")}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={transparent ? "text-white hover:bg-white/10" : ""}
              onClick={() => navigate("/login")}
            >
              {t("home.Sign In")}
            </Button>
          )}

          <Button
            size="sm"
            className="text-white font-semibold px-5"
            style={{
              background: "linear-gradient(135deg, #FF4500, #FF6B35)",
            }}
            onClick={() => navigate("/explore")}
          >
            {t("home.Order Now")}
          </Button>
        </div>
      </div>
    </nav>
  );
}
