import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuthStore } from "../../stores/authStore";

interface NavItem {
  icon?: string;
  label?: string;
  title?: string;
  path: string;
  badge?: number;
  permission?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: "restaurant" | "driver" | "admin";
  userName?: string;
  userAvatar?: string;
}

const roleColors = {
  restaurant: { primary: "#FF4500", gradient: "linear-gradient(135deg, #FF4500, #FF6B35)" },
  driver: { primary: "#10B981", gradient: "linear-gradient(135deg, #10B981, #34D399)" },
  admin: { primary: "#6366F1", gradient: "linear-gradient(135deg, #6366F1, #818CF8)" },
};

export function DashboardLayout({
  children,
  navItems,
  role,
  userName = "Alex Johnson",
  userAvatar = "AJ",
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const colors = roleColors[role];
  const { hasPermission } = usePermissions();
  const currentUser = useAuthStore((state) => state.user);
  const visibleNavItems = navItems.filter((item) => !item.permission || hasPermission(item.permission));
  const displayName = currentUser?.fullName ?? userName;
  const displayAvatar = currentUser?.fullName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase() || userAvatar;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div
          className={`h-16 flex items-center border-b border-gray-100 shrink-0 ${
            collapsed ? "justify-center px-3" : "px-5 gap-3"
          }`}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: colors.gradient }}
          >
            <Flame className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-gray-900">Savour</span>}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const active = location.pathname === item.path;
            const itemTitle = item.label ?? item.title ?? item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } ${collapsed ? "justify-center" : ""}`}
                style={active ? { background: colors.gradient } : {}}
                title={collapsed ? itemTitle : undefined}
              >
                {item.icon && <span className="text-base shrink-0">{item.icon}</span>}
                {!collapsed && (
                  <>
                    <span className="flex-1">{itemTitle}</span>
                    {item.badge != null && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + Collapse */}
        <div className="border-t border-gray-100 p-3 space-y-2 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: colors.gradient }}
              >
                {displayAvatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              navigate("/login");
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <span>🚪</span>
            {!collapsed && "Đăng xuất"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
