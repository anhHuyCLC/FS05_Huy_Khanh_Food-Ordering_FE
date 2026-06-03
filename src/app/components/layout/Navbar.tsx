import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Flame, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cartCount = useCartStore((state) => state.getItemCount());
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { label: t('home.Explore'), path: "/explore" },
    { label: t('home.Community'), path: "/community" },
    { label: t('home.Partner'), path: "/restaurant-dashboard" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${transparent ? "bg-transparent" : "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center brand-gradient-bg">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className={`text-xl font-bold ${transparent ? "text-white" : "text-gray-900"}`}>
              Savour
            </span>
          </Link>

          {/* Nav Links – Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-[var(--brand)] ${transparent ? "text-white/80" : "text-gray-600"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {user && (
              <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Giỏ hàng">
                <ShoppingCart className={`w-5 h-5 ${transparent ? "text-white" : "text-gray-700"}`} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-bold brand-gradient-bg">
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
                  className={`hidden sm:inline-flex ${transparent ? "text-white hover:bg-white/10" : ""}`}
                  onClick={() => navigate("/profile")}
                >
                  {user.fullName}
                </Button>
                <Button
                  size="sm"
                  className="hidden sm:inline-flex text-white font-semibold px-5 brand-gradient-bg border-none"
                  onClick={handleLogout}
                >
                  {t("home.Logout")}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className={`hidden sm:inline-flex ${transparent ? "text-white hover:bg-white/10" : ""}`}
                onClick={() => navigate("/login")}
              >
                {t("home.Sign In")}
              </Button>
            )}

            <Button
              size="sm"
              className="hidden sm:inline-flex text-white font-semibold px-5 brand-gradient-bg border-none"
              onClick={() => navigate("/explore")}
            >
              {t("home.Order Now")}
            </Button>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className={`w-5 h-5 ${transparent ? "text-white" : "text-gray-700"}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center brand-gradient-bg">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Savour</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-[var(--brand)] transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-[var(--brand)] transition-colors"
            >
              👤 {user.fullName}
            </Link>
          )}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {user ? (
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm brand-gradient-bg transition-all hover:opacity-90"
            >
              {t("home.Logout")}
            </button>
          ) : (
            <>
              <button
                onClick={() => { navigate("/login"); setMobileOpen(false); }}
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm brand-gradient-bg transition-all hover:opacity-90"
              >
                {t("home.Sign In")}
              </button>
              <button
                onClick={() => { navigate("/explore"); setMobileOpen(false); }}
                className="w-full py-3 rounded-2xl text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-all"
              >
                {t("home.Order Now")}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
