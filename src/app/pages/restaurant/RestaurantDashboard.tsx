  import {
    useState,
    useEffect,
    useCallback,
    type FormEvent,
  } from "react";
  import { useLocation, useNavigate } from "react-router-dom";
  import { DashboardLayout } from "../../components/layout/DashboardLayout";
  import { orderService } from "../../services/orderService";
  import { restaurantService } from "../../services/restaurantService";
  import type {
    ComboSuggestion,
    MenuItem,
    Restaurant,
  } from "../../types/restaurant";
  import type { Order, Promotion } from "../../types/order";
  import { toast } from "sonner";
  import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  import {
    TrendingUp,
    ShoppingBag,
    Star,
    Users,
    Plus,
    Edit,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    RefreshCcw,
    Trash2,
    Calendar,
    Tag,
    MapPin,
  } from "lucide-react";
  import { useTranslation } from "react-i18next";
  import { Can } from "../../components/auth/Can";
  import { PERMISSIONS } from "../../constants/permissions";

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    pending: { label: "New Order", color: "#6366F1", bg: "#EEF2FF" },
    accepted: { label: "Accepted", color: "#F59E0B", bg: "#FFFBEB" },
    preparing: { label: "Preparing", color: "#F59E0B", bg: "#FFFBEB" },
    ready: { label: "Ready", color: "#10B981", bg: "#F0FDF4" },
    delivering: { label: "Delivering", color: "#10B981", bg: "#F0FDF4" },
    completed: { label: "Completed", color: "#10B981", bg: "#F0FDF4" },
    cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
  };

  /** Tính thời gian tương đối (vd: "5 phút trước") */
  function timeAgo(dateStr: string, t: (key: string) => string): string {
    const now = new Date();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return t("common.just_now") || "Vừa xong";
    if (diffMin < 60)
      return `${diffMin} ${t("restaurant_dashboard.minutes_ago") || "phút trước"}`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24)
      return `${diffHour} ${t("restaurant_dashboard.hours_ago") || "giờ trước"}`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ${t("restaurant_dashboard.days_ago") || "ngày trước"}`;
  }
  const STATUS_COLORS: Record<string, { dot: string; label: string }> = {
    pending: { dot: "bg-gray-400", label: "Chờ xác nhận" },
    accepted: { dot: "bg-blue-500", label: "Đã nhận đơn" },
    preparing: { dot: "bg-yellow-500", label: "Đang chuẩn bị" },
    ready: { dot: "bg-orange-500", label: "Sẵn sàng giao" },
    delivering: { dot: "bg-purple-500", label: "Đang giao" },
    completed: { dot: "bg-green-500", label: "Hoàn thành" },
    cancelled: { dot: "bg-red-400", label: "Đã huỷ" },
  };


  export default function RestaurantDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersMeta, setOrdersMeta] = useState({
      total: 0,
      page: 1,
      limit: 20,
    });
    const [orderPage, setOrderPage] = useState(1);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [comboSuggestions, setComboSuggestions] = useState<ComboSuggestion[]>(
      [],
    );
    const [loadingCombos, setLoadingCombos] = useState(false);
    const [myRestaurant, setMyRestaurant] = useState<Restaurant | null>(null);
    const [loadingRestaurant, setLoadingRestaurant] = useState(true);
    const [chartPeriod, setChartPeriod] = useState("30days"); // "30days" or "7months"
    const { t } = useTranslation();

    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname.replace(/\/+$/, "");
    const currentTab = currentPath === "/restaurant-dashboard"
      ? "overview"
      : currentPath.includes("/restaurant-dashboard/orders")
        ? "orders"
        : currentPath.includes("/restaurant-dashboard/menu") ||
            currentPath.includes("/restaurant-dashboard/pricing")
          ? "menu"
          : currentPath.includes("/restaurant-dashboard/promotions")
            ? "promotions"
            : currentPath.includes("/restaurant-dashboard/analytics")
              ? "analytics"
              : currentPath.includes("/restaurant-dashboard/settings")
                ? "settings"
                : "overview";

    // State các Modal
    const [showAddMenuModal, setShowAddMenuModal] = useState(false);
    const [showEditMenuModal, setShowEditMenuModal] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
      null,
    );
    const [showAddPromoModal, setShowAddPromoModal] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Form states cho Món ăn
    const [menuForm, setMenuForm] = useState({
      name: "",
      description: "",
      basePrice: "",
      categoryId: "",
      imageUrl: "",
      isAvailable: true,
    });

    // Form states cho Khuyến mãi
    const [promoForm, setPromoForm] = useState(() => ({
      code: "",
      description: "",
      discountType: "percentage", // "percentage" or "fixed"
      discountValue: "",
      minOrderValue: "0",
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      isActive: true,
    }));

    // Tìm kiếm & bộ lọc cho các tab
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("all");
    const [menuSearch, setMenuSearch] = useState("");
    const [menuCatFilter, setMenuCatFilter] = useState("all");

    // ── Lấy thông tin nhà hàng từ API /restaurant/me ──────────────────────
    const restaurantId = myRestaurant?.id;

    useEffect(() => {
      let active = true;

      restaurantService
        .getMyRestaurant()
        .then((data) => {
          if (active) {
            setMyRestaurant(data);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch my restaurant", error);
          toast.error(
            t("restaurant_dashboard.fetch_restaurant_failed") ||
              "Không thể tải thông tin nhà hàng",
          );
        })
        .finally(() => {
          if (active) {
            setLoadingRestaurant(false);
          }
        });

      return () => {
        active = false;
      };
    }, [t]);
    // ── Lấy đơn hàng ──────────────────────────────────────────────────────

    const fetchOrders = useCallback(
      async (page = 1) => {
        if (!restaurantId) return;
        try {
          const data = await orderService.getRestaurantOrders(restaurantId, {
            status: orderStatusFilter !== "all" ? orderStatusFilter : undefined,
            page,
            limit: 20,
          });
          setOrders(data.items || []);
          setOrdersMeta(
            data.meta ?? { total: data.items?.length ?? 0, page, limit: 20 },
          );
          setOrderPage(page);
        } catch (error) {
          console.error("Failed to fetch restaurant orders", error);
        }
      },
      [restaurantId, orderStatusFilter],
    );

    useEffect(() => {
      if (!restaurantId) return;

      // Fetch lần đầu sau khi mount
      const timeout = setTimeout(() => {
        fetchOrders();
      }, 0);

      // Auto-refresh mỗi 30 giây
      const interval = setInterval(() => {
        fetchOrders();
      }, 30000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }, [restaurantId, fetchOrders]);

    const fetchMenuItems = useCallback(async () => {
      if (!restaurantId) return;
      try {
        const data = await restaurantService.getMenuItems(restaurantId);
        setMenuItems(data);
      } catch (error) {
        console.error("Failed to fetch restaurant menu items", error);
      }
    }, [restaurantId]);

    useEffect(() => {
      if (!restaurantId) return;
      fetchMenuItems();
    }, [restaurantId, fetchMenuItems]);

    const fetchPromotions = useCallback(async () => {
      if (!restaurantId) return;
      try {
        const data = await restaurantService.listPromotions(restaurantId);
        setPromotions(data);
      } catch (error) {
        console.error("Failed to fetch promotions", error);
      }
    }, [restaurantId]);

    useEffect(() => {
      if (!restaurantId) return;
      fetchPromotions();
    }, [restaurantId, fetchPromotions]);

    // ── Lấy gợi ý combo (AI Suggestions) ──────────────────────────────────
    useEffect(() => {
      if (currentTab !== "promotions" || !restaurantId) return;
      let active = true;
      // setLoadingCombos(true);

      restaurantService
        .getComboSuggestions(restaurantId)
        .then((data) => {
          if (active) {
            setComboSuggestions(data);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch combo suggestions", error);
        })
        .finally(() => {
          if (active) {
            setLoadingCombos(false);
          }
        });

      return () => {
        active = false;
      };
    }, [currentTab, restaurantId]);

    const now = new Date();

    // ── Tiện ích format tiền ──────────────────────────────────────────────
    const formatMoney = (amount: number | string | undefined | null) => {
      const numericAmount = Number(amount || 0);
      if (t("common.currency") === "VND") {
        if (numericAmount > 0 && numericAmount < 1000) {
          return `${(numericAmount * 25000).toLocaleString("vi-VN")}đ`;
        }
        return `${numericAmount.toLocaleString("vi-VN")}đ`;
      }
      return `$${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ── Tính toán số liệu KPIs động ────────────────────────────────────────
    const getDynamicKpis = () => {
      const todayStr = now.toDateString();
      const todayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === todayStr,
      );
      const todayRevenue = todayOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);

      const todayCount = todayOrders.length;
      const avgOrderVal = todayCount > 0 ? todayRevenue / todayCount : 0;

      const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();
      const yesterdayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === yesterdayStr,
      );
      const yesterdayRevenue = yesterdayOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);
      const yesterdayCount = yesterdayOrders.length;

      const revChange =
        yesterdayRevenue > 0
          ? `${(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)}%`
          : "+100%";
      const orderChange =
        yesterdayCount > 0
          ? `${(((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1)}%`
          : "+100%";

      const ratingVal =
        myRestaurant?.rating !== undefined
          ? `${Number(myRestaurant.rating).toFixed(1)} ★`
          : "4.8 ★";

      return [
        {
          label: t("restaurant_dashboard.today_revenue") || "Doanh thu hôm nay",
          value: formatMoney(todayRevenue),
          change: `${revChange} so với hôm qua`,
          up: todayRevenue >= yesterdayRevenue,
          icon: TrendingUp,
          color: "#FF4500",
        },
        {
          label: t("restaurant_dashboard.orders_today") || "Đơn hàng hôm nay",
          value: todayCount.toString(),
          change: `${orderChange} so với hôm qua`,
          up: todayCount >= yesterdayCount,
          icon: ShoppingBag,
          color: "#10B981",
        },
        {
          label: t("restaurant_dashboard.avg_order_value") || "Giá trị đơn TB",
          value: formatMoney(avgOrderVal),
          change: "+0% so với hôm qua",
          up: true,
          icon: Users,
          color: "#6366F1",
        },
        {
          label: t("home.rating") || "Đánh giá nhà hàng",
          value: ratingVal,
          change: "Đã xác thực",
          up: true,
          icon: Star,
          color: "#F59E0B",
        },
      ];
    };

    // ── Thống kê biểu đồ doanh thu động ───────────────────────────────────
    const getRevenueChartData = () => {
      if (chartPeriod === "30days") {
        const days: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000);
          const key = d.toLocaleDateString(
            t("common.language") === "Tiếng Việt" ? "vi-VN" : "en-US",
            { month: "short", day: "numeric" },
          );
          days[key] = 0;
        }
        orders.forEach((o) => {
          if (o.status === "cancelled") return;
          const key = new Date(o.createdAt).toLocaleDateString(
            t("common.language") === "Tiếng Việt" ? "vi-VN" : "en-US",
            { month: "short", day: "numeric" },
          );
          if (days[key] !== undefined) {
            days[key] += Number(o.finalAmount || 0);
          }
        });
        return Object.entries(days).map(([day, revenue]) => ({
          month: day,
          revenue,
        }));
      } else {
        const months: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime());
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleDateString(
            t("common.language") === "Tiếng Việt" ? "vi-VN" : "en-US",
            { month: "short" },
          );
          months[key] = 0;
        }
        orders.forEach((o) => {
          if (o.status === "cancelled") return;
          const key = new Date(o.createdAt).toLocaleDateString(
            t("common.language") === "Tiếng Việt" ? "vi-VN" : "en-US",
            { month: "short" },
          );
          if (months[key] !== undefined) {
            months[key] += Number(o.finalAmount || 0);
          }
        });
        return Object.entries(months).map(([month, revenue]) => ({
          month,
          revenue,
        }));
      }
    };

    // ── Thống kê Top 5 món ăn bán chạy nhất ───────────────────────────────
    const getCalculatedTopDishes = () => {
      const dishCounts: Record<
        string,
        { name: string; sold: number; revenue: number }
      > = {};
      orders.forEach((o) => {
        if (o.status === "cancelled") return;
        o.orderItems?.forEach((item) => {
          const name = item.menuItem?.name || "Món ăn";
          const quantity = item.quantity || 1;
          const price = Number(item.menuItem?.basePrice || 0);
          if (!dishCounts[name]) {
            dishCounts[name] = { name, sold: 0, revenue: 0 };
          }
          dishCounts[name].sold += quantity;
          dishCounts[name].revenue += quantity * price;
        });
      });
      return Object.values(dishCounts)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map((d) => ({
          name: d.name,
          sold: d.sold,
          revenue: d.revenue,
          trend: "+15%",
        }));
    };

    const dynamicKpis = getDynamicKpis();
    const revenueChartData = getRevenueChartData();
    const topDishesData = getCalculatedTopDishes();

    // Navigation Items
    const translatedNavItems = [
      {
        icon: "📊",
        label: t("restaurant_dashboard.nav.dashboard") || "Tổng quan",
        path: "/restaurant-dashboard",
      },
      {
        icon: "🛒",
        label: t("restaurant_dashboard.nav.orders") || "Đơn hàng",
        path: "/restaurant-dashboard/orders",
        badge: orders.filter((o) => o.status === "pending").length || undefined,
      },
      {
        icon: "🍔",
        label: t("restaurant_dashboard.nav.menu") || "Thực đơn",
        path: "/restaurant-dashboard/menu",
      },
      {
        icon: "💰",
        label: t("restaurant_dashboard.nav.pricing") || "Định giá",
        path: "/restaurant-dashboard/pricing",
      },
      {
        icon: "🎯",
        label: t("restaurant_dashboard.nav.promotions") || "Khuyến mãi",
        path: "/restaurant-dashboard/promotions",
      },
      {
        icon: "📈",
        label: t("restaurant_dashboard.nav.analytics") || "Thống kê",
        path: "/restaurant-dashboard/analytics",
      },
      {
        icon: "⚙️",
        label: t("restaurant_dashboard.nav.settings") || "Cài đặt",
        path: "/restaurant-dashboard/settings",
      },
    ];

    const navPermissions: Record<string, string> = {
      "/restaurant-dashboard": PERMISSIONS.RESTAURANT_PROFILE.READ,
      "/restaurant-dashboard/orders": PERMISSIONS.ORDER.READ,
      "/restaurant-dashboard/menu": PERMISSIONS.MENU.READ,
      "/restaurant-dashboard/pricing": PERMISSIONS.MENU.READ,
      "/restaurant-dashboard/promotions": PERMISSIONS.MENU.READ,
      "/restaurant-dashboard/analytics": PERMISSIONS.RESTAURANT_PROFILE.READ,
      "/restaurant-dashboard/settings": PERMISSIONS.RESTAURANT_PROFILE.UPDATE,
    };

    const authorizedNavItems = translatedNavItems.map((item) => ({
      ...item,
      permission: navPermissions[item.path],
    }));

    // ── Nhận đơn hàng ────────────────────────────────────────────────────
    const acceptOrder = async (id: string) => {
      try {
        await orderService.updateOrderStatus(id, {
          status: "accepted",
          note:
            t("restaurant_dashboard.accepted_note") || "Nhà hàng đã xác nhận đơn",
        });
        toast.success(
          t("restaurant_dashboard.order_accepted_toast") || "Đã nhận đơn hàng!",
        );
        fetchOrders();
      } catch (err) {
        const errorMsg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        toast.error(
          errorMsg ||
            t("restaurant_dashboard.order_accept_failed_toast") ||
            "Không thể nhận đơn",
        );
      }
    };

    // ── Huỷ / Từ chối đơn hàng ───────────────────────────────────────────
    const cancelOrder = async (id: string, note?: string) => {
      try {
        await orderService.updateOrderStatus(id, {
          status: "cancelled",
          note:
            note ??
            (t("restaurant_dashboard.cancelled_note") || "Nhà hàng huỷ đơn"),
        });
        toast.success(
          t("restaurant_dashboard.order_cancelled_toast") || "Đơn hàng đã bị huỷ",
        );
        fetchOrders();
      } catch (err) {
        const errorMsg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        toast.error(
          errorMsg ||
            t("restaurant_dashboard.order_cancel_failed_toast") ||
            "Không thể huỷ đơn",
        );
      }
    };

    const rejectOrder = async (id: string) =>
      cancelOrder(
        id,
        t("restaurant_dashboard.rejected_note") || "Nhà hàng từ chối đơn",
      );

    // ── Chuyển trạng thái đơn (preparing, ready) ─────────────────────────
    const advanceOrderStatus = async (id: string, newStatus: string) => {
      const statusLabels: Record<string, string> = {
        preparing: t("restaurant_dashboard.status_preparing") || "Đang chuẩn bị",
        ready: t("restaurant_dashboard.status_ready") || "Sẵn sàng giao",
      };
      try {
        await orderService.updateOrderStatus(id, {
          status: newStatus,
          note: statusLabels[newStatus] || newStatus,
        });
        toast.success(
          `${t("restaurant_dashboard.status_updated") || "Cập nhật trạng thái"}: ${statusLabels[newStatus] || newStatus}`,
        );
        fetchOrders();
      } catch (err) {
        const errorMsg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        toast.error(
          errorMsg ||
            t("restaurant_dashboard.status_update_failed") ||
            "Không thể cập nhật trạng thái",
        );
      }
    };

    // ── Toggle ẩn/hiện món ────────────────────────────────────────────────
    const toggleMenuItemAvailability = async (
      menuItemId: string,
      currentAvailable: boolean,
    ) => {
      try {
        await restaurantService.updateMenuItemAvailability(
          menuItemId,
          !currentAvailable,
          !currentAvailable
            ? undefined
            : t("restaurant_dashboard.out_of_stock") || "Hết nguyên liệu",
        );
        toast.success(
          !currentAvailable
            ? t("restaurant_dashboard.item_shown") || "Đã bật hiển thị món"
            : t("restaurant_dashboard.item_hidden") || "Đã ẩn món (tạm ngưng)",
        );
        fetchMenuItems();
      } catch {
        toast.error(
          t("restaurant_dashboard.toggle_failed") ||
            "Không thể thay đổi trạng thái món",
        );
      }
    };

    // ── CRUD Menu Items ───────────────────────────────────────────────────
    const handleAddMenuItem = async (e: FormEvent) => {
      e.preventDefault();
      if (!restaurantId) return;
      try {
        await restaurantService.createMenuItem(restaurantId, {
          name: menuForm.name,
          description: menuForm.description || undefined,
          basePrice: menuForm.basePrice,
          categoryId: menuForm.categoryId || undefined,
          imageUrl: menuForm.imageUrl || undefined,
          isAvailable: menuForm.isAvailable,
        });
        toast.success(
          t("restaurant_dashboard.add_item_success") || "Thêm món thành công",
        );
        setShowAddMenuModal(false);
        setMenuForm({
          name: "",
          description: "",
          basePrice: "",
          categoryId: "",
          imageUrl: "",
          isAvailable: true,
        });
        fetchMenuItems();
      } catch {
        toast.error("Không thể thêm món ăn");
      }
    };

    const handleEditMenuItem = async (e: FormEvent) => {
      e.preventDefault();
      if (!selectedMenuItem) return;
      try {
        await restaurantService.updateMenuItem(selectedMenuItem.id, {
          name: menuForm.name,
          description: menuForm.description || undefined,
          basePrice: menuForm.basePrice,
          categoryId: menuForm.categoryId || undefined,
          imageUrl: menuForm.imageUrl || undefined,
          isAvailable: menuForm.isAvailable,
        });
        toast.success(
          t("restaurant_dashboard.update_item_success") ||
            "Cập nhật món thành công",
        );
        setShowEditMenuModal(false);
        setSelectedMenuItem(null);
        fetchMenuItems();
      } catch {
        toast.error("Không thể cập nhật món ăn");
      }
    };

    const handleDeleteMenuItem = async (itemId: string) => {
      if (
        !window.confirm(
          t("restaurant_dashboard.confirm_delete_item") ||
            "Bạn có chắc chắn muốn xóa món này?",
        )
      )
        return;
      try {
        await restaurantService.deleteMenuItem(itemId);
        toast.success(
          t("restaurant_dashboard.delete_item_success") || "Đã xóa món ăn",
        );
        fetchMenuItems();
      } catch {
        toast.error("Không thể xóa món ăn");
      }
    };

    const openEditModal = (item: MenuItem) => {
      setSelectedMenuItem(item);
      setMenuForm({
        name: item.name,
        description: item.description || "",
        basePrice: String(item.basePrice),
        categoryId: item.categoryId || "",
        imageUrl: item.imageUrl || "",
        isAvailable: item.isAvailable !== false,
      });
      setShowEditMenuModal(true);
    };

    // ── CRUD Promotions ───────────────────────────────────────────────────
    const handleAddPromotion = async (e: FormEvent) => {
      e.preventDefault();
      if (!restaurantId) return;
      try {
        const promotionData = {
          code: promoForm.code,
          description: promoForm.description,
          discountPercentage:
            promoForm.discountType === "percentage"
              ? Number(promoForm.discountValue)
              : undefined,
          fixedDiscount:
            promoForm.discountType === "fixed"
              ? Number(promoForm.discountValue)
              : undefined,
          minOrderValue: Number(promoForm.minOrderValue),
          validFrom: new Date(promoForm.validFrom).toISOString(),
          validTo: new Date(promoForm.validTo).toISOString(),
          isActive: promoForm.isActive,
        };

        await restaurantService.createPromotion(restaurantId, promotionData);
        toast.success("Tạo chương trình khuyến mãi thành công");
        setShowAddPromoModal(false);
        setPromoForm(() => ({
          code: "",
          description: "",
          discountType: "percentage",
          discountValue: "",
          minOrderValue: "0",
          validFrom: new Date().toISOString().split("T")[0],
          validTo: new Date(Date.now() + 7 * 86400000)
            .toISOString()
            .split("T")[0],
          isActive: true,
        }));
        fetchPromotions();
      } catch (error) {
        console.error("Failed to create promotion", error);
        toast.error("Không thể tạo khuyến mãi");
      }
    };

    const handleDeletePromotion = async (promoId: string) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) return;
      try {
        await restaurantService.deletePromotion(promoId);
        toast.success("Đã xóa chương trình khuyến mãi");
        fetchPromotions();
      } catch (error) {
        console.error("Failed to delete promotion", error);
        toast.error("Không thể xóa khuyến mãi");
      }
    };
    const handleTogglePromotion = async (
      promoId: string,
      currentActive: boolean,
    ) => {
      try {
        await restaurantService.togglePromotion(promoId, !currentActive);
        toast.success(!currentActive ? "Đã bật khuyến mãi" : "Đã tắt khuyến mãi");
        fetchPromotions();
      } catch (error) {
        console.error("Failed to toggle promotion", error);
        toast.error("Không thể thay đổi trạng thái khuyến mãi");
      }
    };

    // ── Loading state ─────────────────────────────────────────────────────
    if (loadingRestaurant) {
      return (
        <DashboardLayout
          navItems={[]}
          role="restaurant"
          userName="..."
          userAvatar=".."
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        </DashboardLayout>
      );
    }

    const restaurantName = myRestaurant?.name || "Nhà hàng";
    const restaurantAvatar = restaurantName
      .split(" ")
      .map((w: any) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // ── RENDER COMPONENT THEO TAB ──────────────────────────────────────────
    const renderTabContent = () => {
      switch (currentTab) {
        case "orders": {
          const filteredOrders = orders.filter((o) => {
            const matchesStatus =
              orderStatusFilter === "all" || o.status === orderStatusFilter;
            const matchesSearch =
              o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
              (o.customer?.fullName || o.customer?.name || "")
                .toLowerCase()
                .includes(orderSearch.toLowerCase());
            return matchesStatus && matchesSearch;
          });

          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header & Bộ lọc */}
              <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-bold text-gray-900 text-lg">
                  {t("restaurant_dashboard.live_orders") || "Danh sách đơn hàng"}
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder={
                      t("restaurant_dashboard.search_order") ||
                      "Tìm theo mã đơn, khách hàng..."
                    }
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="px-3.5 py-1.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-orange-500 max-w-xs"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => {
                      setOrderStatusFilter(e.target.value);
                      fetchOrders(1);
                      // Gọi lại API với status mới thay vì chỉ filter local
                      orderService
                        .getRestaurantOrders(restaurantId!, {
                          status:
                            e.target.value !== "all" ? e.target.value : undefined,
                        })
                        .then((d) => setOrders(d.items || []));
                    }}
                    className="px-3.5 py-1.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none"
                  >
                    <option value="all">
                      {t("restaurant_dashboard.all_orders") || "Tất cả đơn"}
                    </option>
                    <option value="pending">
                      {t("restaurant_dashboard.status_pending") || "Chờ xử lý"}
                    </option>
                    <option value="accepted">
                      {t("restaurant_dashboard.status_accepted") || "Đã nhận đơn"}
                    </option>
                    <option value="preparing">
                      {t("restaurant_dashboard.status_preparing") ||
                        "Đang chế biến"}
                    </option>
                    <option value="ready">
                      {t("restaurant_dashboard.status_ready") || "Sẵn sàng giao"}
                    </option>
                    <option value="delivering">
                      {t("restaurant_dashboard.status_delivering") ||
                        "Đang vận chuyển"}
                    </option>
                    <option value="completed">
                      {t("restaurant_dashboard.status_completed") || "Hoàn thành"}
                    </option>
                    <option value="cancelled">
                      {t("restaurant_dashboard.status_cancelled") || "Đã huỷ"}
                    </option>
                  </select>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-gray-50">
                {filteredOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <ShoppingBag className="w-12 h-12 mb-2 opacity-30" />
                    <p className="text-sm">
                      {t("restaurant_dashboard.no_orders") ||
                        "Không tìm thấy đơn hàng nào"}
                    </p>
                  </div>
                )}
                {/* Pagination */}
                {ordersMeta.total > ordersMeta.limit && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
                    <p className="text-xs text-gray-400">
                      {orders.length > 0
                        ? `${(orderPage - 1) * ordersMeta.limit + 1}–${Math.min(orderPage * ordersMeta.limit, ordersMeta.total)} / ${ordersMeta.total} đơn`
                        : "0 đơn"}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={orderPage <= 1}
                        onClick={() => fetchOrders(orderPage - 1)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Trước
                      </button>
                      <span className="text-xs text-gray-500 font-medium px-1">
                        {orderPage} /{" "}
                        {Math.ceil(ordersMeta.total / ordersMeta.limit)}
                      </span>
                      <button
                        disabled={
                          orderPage >=
                          Math.ceil(ordersMeta.total / ordersMeta.limit)
                        }
                        onClick={() => fetchOrders(orderPage + 1)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Tiếp →
                      </button>
                    </div>
                  </div>
                )}
                {filteredOrders.map((order) => {
                  const cfg = statusConfig[order.status] || {
                    label: "Unknown",
                    color: "#9ca3af",
                    bg: "#f3f4f6",
                  };
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="hover:bg-gray-50/30 transition-colors"
                    >
                      <div
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? null : order.id)
                        }
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center w-14">
                            <p className="text-xs font-bold text-gray-700">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {timeAgo(order.createdAt, t)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {order.customer?.fullName ||
                                order.customer?.name ||
                                "Khách hàng"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {order.orderItems?.length || 0} món ăn
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">
                              {formatMoney(order.finalAmount)}
                            </p>
                            {order.payment?.method && (
                              <span className="text-[10px] text-gray-400 uppercase">
                                {order.payment.method}
                              </span>
                            )}
                          </div>

                          <span
                            className="px-2.5 py-1 rounded-xl text-xs font-bold"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {t(`restaurant_dashboard.status_${order.status}`) ||
                              cfg.label}
                          </span>

                          <div
                            className="flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.status === "pending" && (
                              <>
                                <Can permission={PERMISSIONS.ORDER.UPDATE}>
                                  <button
                                    onClick={() => acceptOrder(order.id)}
                                    className="w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors"
                                    title="Nhận đơn"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                </Can>
                                <Can permission={PERMISSIONS.ORDER.DELETE}>
                                  <button
                                    onClick={() => rejectOrder(order.id)}
                                    className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
                                    title="Từ chối đơn"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </Can>
                              </>
                            )}
                            {order.status === "accepted" && (
                              <>
                                <Can permission={PERMISSIONS.ORDER.UPDATE}>
                                  <button
                                    onClick={() =>
                                      advanceOrderStatus(order.id, "preparing")
                                    }
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                                  >
                                    <Clock className="w-3.5 h-3.5" /> Chuẩn bị
                                  </button>
                                </Can>
                                <Can permission={PERMISSIONS.ORDER.DELETE}>
                                  <button
                                    onClick={() => cancelOrder(order.id)}
                                    className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </Can>
                              </>
                            )}
                            {order.status === "preparing" && (
                              <Can permission={PERMISSIONS.ORDER.UPDATE}>
                                <button
                                  onClick={() =>
                                    advanceOrderStatus(order.id, "ready")
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors"
                                >
                                  <Truck className="w-3.5 h-3.5" /> Sẵn sàng
                                </button>
                              </Can>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand chi tiết đơn */}
                      {isExpanded && (
                        <div className="bg-gray-50/50 p-5 border-t border-b border-gray-100 flex flex-col md:flex-row gap-8">
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                              Chi tiết món ăn
                            </h4>
                            <div className="space-y-2">
                              {order.orderItems?.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-gray-700">
                                    {item.menuItem?.name || "Món ăn"}{" "}
                                    <strong className="text-gray-900">
                                      x{item.quantity}
                                    </strong>
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {formatMoney(
                                      Number(
                                        item.price ??
                                          item.unitPrice ??
                                          item.menuItem?.basePrice ??
                                          0,
                                      ) * (item.quantity || 1),
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 md:pl-8 pt-4 md:pt-0 space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                              Thông tin thanh toán
                            </h4>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Tạm tính</span>
                              <span>{formatMoney(order.totalAmount)}</span>
                            </div>
                            {Number(order.discountAmount) > 0 && (
                              <div className="flex justify-between text-sm text-red-500 font-medium">
                                <span>
                                  Khuyến mãi{" "}
                                  {order.promotion?.code
                                    ? `(${order.promotion.code})`
                                    : ""}
                                </span>
                                <span>-{formatMoney(order.discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Phí giao hàng</span>
                              <span>{formatMoney(order.deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2">
                              <span>Tổng cộng</span>
                              <span>{formatMoney(order.finalAmount)}</span>
                            </div>
                            {order.customer?.phone && (
                              <div className="pt-2 text-xs text-gray-500 flex items-center gap-1.5">
                                <span>
                                  📞 Điện thoại:{" "}
                                  <strong>{order.customer.phone}</strong>
                                </span>
                              </div>
                            )}
                            {order.deliveryAddress && (
                              <div>
                                📍 <strong>{order.deliveryAddress}</strong>
                              </div>
                            )}
                            {order.note && (
                              <div className="bg-orange-50 ...">
                                📝 {order.note}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        case "menu": {
          const filteredMenuItems = menuItems.filter((item) => {
            const matchesCategory =
              menuCatFilter === "all" || item.categoryId === menuCatFilter;
            const matchesSearch = item.name
              .toLowerCase()
              .includes(menuSearch.toLowerCase());
            return matchesCategory && matchesSearch;
          });

          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header & Controls */}
              <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-bold text-gray-900 text-lg">
                  {t("restaurant_dashboard.menu_items") || "Quản lý thực đơn"}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder={
                      t("restaurant_dashboard.search_menu") || "Tìm món ăn..."
                    }
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="px-3.5 py-1.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-orange-500"
                  />
                  <select
                    value={menuCatFilter}
                    onChange={(e) => setMenuCatFilter(e.target.value)}
                    className="px-3.5 py-1.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {myRestaurant?.categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <Can permission={PERMISSIONS.MENU.CREATE}>
                    <button
                      onClick={() => {
                        setMenuForm({
                          name: "",
                          description: "",
                          basePrice: "",
                          categoryId: myRestaurant?.categories?.[0]?.id || "",
                          imageUrl: "",
                          isAvailable: true,
                        });
                        setShowAddMenuModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                      style={{
                        background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                      }}
                    >
                      <Plus className="w-4 h-4" /> Thêm món mới
                    </button>
                  </Can>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-gray-50">
                {filteredMenuItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <p className="text-sm">Chưa có món ăn nào trong thực đơn</p>
                  </div>
                )}

                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50/20 transition-all ${item.isAvailable === false ? "opacity-60 bg-gray-50/10" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 text-sm font-bold">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.name}
                          {item.isAvailable === false && (
                            <span className="ml-2 text-xs font-normal text-red-500 bg-red-50 px-1.5 py-0.5 rounded-lg">
                              Tạm dừng
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.category?.name || "Không rõ danh mục"}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-1 max-w-lg truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-black text-gray-900 text-sm">
                          {formatMoney(item.basePrice)}
                        </p>
                        {item.effectivePrice !== undefined &&
                          item.effectivePrice < Number(item.basePrice) && (
                            <p className="text-xs text-orange-500 font-bold mt-0.5">
                              {formatMoney(item.effectivePrice)}
                            </p>
                          )}
                      </div>

                      <div className="flex gap-2">
                        <Can permission={PERMISSIONS.MENU.UPDATE}>
                          <button
                            onClick={() =>
                              toggleMenuItemAvailability(
                                item.id,
                                item.isAvailable !== false,
                              )
                            }
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                              item.isAvailable !== false
                                ? "bg-green-50 text-green-500 hover:bg-green-100"
                                : "bg-red-50 text-red-400 hover:bg-red-100"
                            }`}
                            title={
                              item.isAvailable !== false
                                ? "Tạm ẩn món"
                                : "Hiển thị món"
                            }
                          >
                            {item.isAvailable !== false ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            title="Sửa món"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Can>
                        <Can permission={PERMISSIONS.MENU.DELETE}>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Xóa món"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Can>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        case "promotions": {
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">
                    Chương trình khuyến mãi
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Tạo các mã giảm giá cho khách hàng khi đặt đơn hàng của nhà
                    hàng.
                  </p>
                </div>
                <Can permission={PERMISSIONS.MENU.UPDATE}>
                  <button
                    onClick={() => setShowAddPromoModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{
                      background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                    }}
                  >
                    <Plus className="w-4 h-4" /> Tạo khuyến mãi
                  </button>
                </Can>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {promotions.length === 0 ? (
                  <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                    <Tag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có mã khuyến mãi nào hoạt động</p>
                  </div>
                ) : (
                  promotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-48"
                    >
                      {/* Badge hoạt động */}
                      <div className="flex justify-between items-start">
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-xl font-black text-sm uppercase border border-orange-100 tracking-wider">
                          {promo.code}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${promo.isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
                          />
                          <span className="text-xs text-gray-400 font-semibold">
                            {promo.isActive ? "Hoạt động" : "Tạm dừng"}
                          </span>
                          <button
                            onClick={() =>
                              handleTogglePromotion(
                                promo.id,
                                promo.isActive ?? false,
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              promo.isActive
                                ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {promo.isActive ? "Tắt" : "Bật"}
                          </button>
                        </div>
                      </div>

                      <div className="my-3">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                          {promo.description || "Khuyến mãi hấp dẫn từ cửa hàng"}
                        </p>
                        <p className="text-xs font-bold text-orange-500 mt-1">
                          {promo.discountPercentage
                            ? `Giảm ${promo.discountPercentage}%`
                            : `Giảm ${formatMoney(promo.fixedDiscount)}`}
                          <span className="text-gray-400 font-normal ml-1">
                            · Đơn tối thiểu: {formatMoney(promo.minOrderValue)}
                          </span>
                        </p>
                      </div>

                      <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-300" /> Hết
                          hạn:{" "}
                          {new Date(promo.validTo).toLocaleDateString("vi-VN")}
                        </span>
                        <Can permission={PERMISSIONS.MENU.UPDATE}>
                          <button
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            title="Xóa khuyến mãi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Can>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Combo Suggestions Section */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Gợi ý Combo từ Trí tuệ Nhân tạo (AI)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Hệ thống phân tích lịch sử đơn hàng của khách hàng để tự
                      động đề xuất kết hợp các món ăn bán chạy cùng nhau.
                    </p>
                  </div>
                </div>

                {loadingCombos ? (
                  <div className="flex items-center justify-center h-32 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
                  </div>
                ) : comboSuggestions.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-xs shadow-sm">
                    Chưa có đủ dữ liệu lịch sử đơn hàng để phân tích gợi ý combo.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {comboSuggestions.map((combo, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between h-52 hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-sm text-gray-800 line-clamp-1">
                              {combo.name}
                            </h4>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 shrink-0 capitalize">
                              {combo.reason}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            {combo.items?.map((item, itemIdx) => (
                              <div
                                key={item.id || itemIdx}
                                className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-xl border border-gray-100 text-xs"
                              >
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-5 h-5 rounded-md object-cover shrink-0"
                                  />
                                )}
                                <span className="font-medium text-gray-700 truncate max-w-20">
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-50 pt-3 flex justify-between items-center mt-3">
                          <div>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">
                              Tổng giá trị combo
                            </p>
                            <p className="text-sm font-black text-orange-500 mt-0.5">
                              {formatMoney(combo.totalPrice)}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setPromoForm({
                                ...promoForm,
                                code: `COMBO${String(combo.totalPrice).split(".")[0].slice(0, 4)}`,
                                description: `Khuyến mãi đặc biệt cho Combo ${combo.items?.map((i) => i.name).join(" + ")}`,
                                discountType: "percentage",
                                discountValue: "10",
                                minOrderValue: String(combo.totalPrice),
                              });
                              setShowAddPromoModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-xs font-semibold border border-orange-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tạo khuyến mãi
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }

        case "analytics": {
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900 text-lg">
                    Biểu đồ doanh thu nâng cao
                  </h2>
                  <select
                    value={chartPeriod}
                    onChange={(e) => setChartPeriod(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 outline-none text-gray-600"
                  >
                    <option value="30days">Doanh thu 30 ngày qua</option>
                    <option value="7months">Doanh thu 7 tháng qua</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient
                        id="analyticsGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#FF4500" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#FF4500" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        t("common.currency") === "VND"
                          ? `${((v * 25000) / 1000000).toFixed(1)}M`
                          : `$${v}`
                      }
                    />
                    <Tooltip
                      formatter={(v) => [formatMoney(v as number), "Doanh thu"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #F3F4F6",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#FF4500"
                      strokeWidth={2.5}
                      fill="url(#analyticsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Thống kê đơn hàng */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Trạng thái đơn hàng phân bố
                  </h3>
                  <div className="space-y-3">
                    {Object.keys(statusConfig).map((status) => {
                      const count = orders.filter(
                        (o) => o.status === status,
                      ).length;
                      const pct =
                        orders.length > 0
                          ? ((count / orders.length) * 100).toFixed(0)
                          : "0";
                      const cfg = statusConfig[status];
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-500 w-24 capitalize">
                            {status}
                          </span>
                          <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cfg.color,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Món ăn bán chạy chi tiết */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Hiệu suất món ăn bán chạy nhất
                  </h3>
                  <div className="space-y-4">
                    {topDishesData.map((d, i) => (
                      <div
                        key={d.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-lg bg-gray-50 text-xs font-black text-gray-400 flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-gray-700">
                            {d.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                          <span>
                            Đã bán:{" "}
                            <strong className="text-gray-800">{d.sold}</strong>
                          </span>
                          <span className="text-green-500">
                            {formatMoney(d.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        case "settings": {
          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-3xl">
              <h2 className="font-bold text-gray-900 text-lg mb-6 border-b border-gray-100 pb-3">
                Hồ sơ nhà hàng
              </h2>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {myRestaurant?.imageUrl ? (
                    <img
                      src={myRestaurant.imageUrl}
                      alt={restaurantName}
                      className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center text-3xl font-black">
                      {restaurantAvatar}
                    </div>
                  )}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900">
                      {restaurantName}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-gray-300" />{" "}
                      {myRestaurant?.address || "Địa chỉ chưa cập nhật"}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                      <span className="px-2.5 py-0.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />{" "}
                        Đang mở cửa
                      </span>
                      <span className="text-sm text-yellow-500 font-bold flex items-center gap-1">
                        ★{" "}
                        {myRestaurant?.rating
                          ? Number(myRestaurant.rating).toFixed(1)
                          : "4.8"}{" "}
                        / 5.0
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Tên nhà hàng
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      disabled
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={myRestaurant?.address || ""}
                      disabled
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Mô tả giới thiệu
                    </label>
                    <textarea
                      value={
                        myRestaurant?.description ||
                        "Nhà hàng đối tác đáng tin cậy của Savour."
                      }
                      disabled
                      rows={3}
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600 font-medium cursor-not-allowed resize-none"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-xs text-amber-700 font-medium">
                  <span>ℹ️</span>
                  <p>
                    Để thay đổi các thông tin hồ sơ nhà hàng hoặc trạng thái hoạt
                    động chính thức trên ứng dụng, vui lòng gửi yêu cầu xác minh
                    trực tiếp cho Admin thông qua trung tâm hỗ trợ của Savour
                    Partner.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        default: {
          // OVERVIEW VIEW (Giao diện chính mặc định)
          return (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {dynamicKpis.map((k) => (
                  <div
                    key={k.label}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-500 font-semibold">
                        {k.label}
                      </p>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${k.color}15` }}
                      >
                        <k.icon className="w-4 h-4" style={{ color: k.color }} />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900 mb-1">
                      {k.value}
                    </p>
                    <span
                      className={`text-xs font-bold ${k.up ? "text-green-500" : "text-gray-400"}`}
                    >
                      {k.change}
                    </span>
                  </div>
                ))}
              </div>

              {/* Charts & Top Dishes */}
              <div className="grid lg:grid-cols-3 gap-5 mb-5">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-gray-900">
                      {t("restaurant_dashboard.revenue_overview") ||
                        "Tổng quan doanh thu"}
                    </h2>
                    <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 outline-none text-gray-600"
                    >
                      <option value="30days">30 ngày qua</option>
                      <option value="7months">7 tháng qua</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#FF4500"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#FF4500"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: "#9CA3AF" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#9CA3AF" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          t("common.currency") === "VND"
                            ? `${((v * 25000) / 1000000).toFixed(0)}M`
                            : `$${v}`
                        }
                      />
                      <Tooltip
                        formatter={(v) => [
                          formatMoney(v as number),
                          t("restaurant_dashboard.nav.revenue") || "Doanh thu",
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #F3F4F6",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#FF4500"
                        strokeWidth={2.5}
                        fill="url(#revGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Dishes */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-4">
                    {t("restaurant_dashboard.top_dishes") || "Món ăn bán chạy"}
                  </h2>
                  <div className="space-y-3">
                    {topDishesData.length === 0 ? (
                      <div className="text-sm text-gray-400 py-12 text-center">
                        Chưa có thống kê đơn hàng
                      </div>
                    ) : (
                      topDishesData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-3">
                          <span className="text-lg font-black text-gray-300 w-5 text-center">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {d.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {d.sold}{" "}
                              {t("restaurant_dashboard.sold") || "đã bán"} ·{" "}
                              {formatMoney(d.revenue)}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-green-500">
                            {d.trend}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom section: Live Orders + Menu Items */}
              <div className="grid lg:grid-cols-5 gap-5">
                {/* Live Orders (Recent 5) */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <h2 className="font-bold text-gray-900">
                      {t("restaurant_dashboard.live_orders") ||
                        "Đơn hàng mới nhận"}
                    </h2>
                    <button
                      onClick={() => navigate("/restaurant-dashboard/orders")}
                      className="text-xs text-[#FF4500] font-semibold hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {orders.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">
                          {t("restaurant_dashboard.no_orders") ||
                            "Chưa có đơn hàng nào"}
                        </p>
                      </div>
                    )}
                    {orders.slice(0, 5).map((order) => {
                      const cfg = statusConfig[order.status] || {
                        label: "Unknown",
                        color: "#9ca3af",
                        bg: "#f3f4f6",
                      };
                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="text-center w-14">
                            <p className="text-xs font-bold text-gray-700">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {timeAgo(order.createdAt, t)}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {order.customer?.fullName ||
                                order.customer?.name ||
                                "Khách hàng"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {order.orderItems?.length || 0} món ăn
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 shrink-0">
                            {formatMoney(order.finalAmount)}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {t(`restaurant_dashboard.status_${order.status}`) ||
                              cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Menu items (Recent 5) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <h2 className="font-bold text-gray-900">
                      {t("restaurant_dashboard.menu_items") ||
                        "Thực đơn tiêu biểu"}
                    </h2>
                    <button
                      onClick={() => navigate("/restaurant-dashboard/menu")}
                      className="text-xs text-[#FF4500] font-semibold hover:underline"
                    >
                      Quản lý thực đơn
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {menuItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <p className="text-sm">Chưa có món ăn nào</p>
                      </div>
                    )}
                    {menuItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50/50 transition-colors"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 text-xs font-bold">
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatMoney(item.basePrice)}
                          </p>
                        </div>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${item.isAvailable !== false ? "bg-green-500" : "bg-red-400"}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          );
        }
      }
    };

    return (
      <DashboardLayout
        navItems={authorizedNavItems}
        role="restaurant"
        userName={restaurantName}
        userAvatar={restaurantAvatar}
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 capitalize">
              {currentTab === "overview" &&
                (t("restaurant_dashboard.restaurant_dashboard") ||
                  "Bảng điều khiển")}
              {currentTab === "orders" && "Quản lý đơn hàng"}
              {currentTab === "menu" && "Quản lý thực đơn"}
              {currentTab === "promotions" && "Quản lý khuyến mãi"}
              {currentTab === "analytics" && "Báo cáo doanh thu"}
              {currentTab === "settings" && "Cài đặt tài khoản"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date().toLocaleDateString(
                t("common.language") === "Tiếng Việt" ? "vi-VN" : "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}{" "}
              · Savour Platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-55 bg-opacity-10 border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-600">
                {t("restaurant_dashboard.restaurant_open") || "Đang mở cửa"}
              </span>
            </div>
            <button
              onClick={() => {
                fetchOrders();
                fetchMenuItems();
                fetchPromotions();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCcw className="w-4 h-4 animate-spin-hover" />{" "}
              {t("restaurant_dashboard.refresh_dashboard") || "Làm mới"}
            </button>
          </div>
        </div>

        {/* RENDER THE ACTIVE TAB CONTENT */}
        {renderTabContent()}

        {/* ── MODAL THÊM MÓN ĂN MỚI ────────────────────────────────────────── */}
        {showAddMenuModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Thêm món ăn mới
              </h3>
              <form onSubmit={handleAddMenuItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Tên món ăn
                  </label>
                  <input
                    type="text"
                    required
                    value={menuForm.name}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, name: e.target.value })
                    }
                    placeholder="Ví dụ: Cơm rang dưa bò"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Danh mục
                  </label>
                  <select
                    value={menuForm.categoryId}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, categoryId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm bg-white"
                  >
                    <option value="">Chọn danh mục</option>
                    {myRestaurant?.categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Giá bán cơ bản (VND hoặc USD)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={menuForm.basePrice}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, basePrice: e.target.value })
                    }
                    placeholder="Ví dụ: 45000"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, description: e.target.value })
                    }
                    placeholder="Mô tả nguyên liệu, hương vị..."
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Link ảnh món ăn
                  </label>
                  <input
                    type="url"
                    value={menuForm.imageUrl}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, imageUrl: e.target.value })
                    }
                    placeholder="Link ảnh món ăn"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="add_isAvailable"
                    checked={menuForm.isAvailable}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, isAvailable: e.target.checked })
                    }
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="add_isAvailable"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Món ăn có sẵn để chế biến
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddMenuModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{
                      background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                    }}
                  >
                    Lưu món mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL SỬA MÓN ĂN ────────────────────────────────────────────── */}
        {showEditMenuModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Chỉnh sửa thông tin món
              </h3>
              <form onSubmit={handleEditMenuItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Tên món ăn
                  </label>
                  <input
                    type="text"
                    required
                    value={menuForm.name}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Danh mục
                  </label>
                  <select
                    value={menuForm.categoryId}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, categoryId: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm bg-white"
                  >
                    <option value="">Chọn danh mục</option>
                    {myRestaurant?.categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Giá bán cơ bản
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={menuForm.basePrice}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, basePrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Link ảnh món ăn
                  </label>
                  <input
                    type="url"
                    value={menuForm.imageUrl}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, imageUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit_isAvailable"
                    checked={menuForm.isAvailable}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, isAvailable: e.target.checked })
                    }
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="edit_isAvailable"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Món ăn có sẵn để chế biến
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditMenuModal(false);
                      setSelectedMenuItem(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{
                      background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                    }}
                  >
                    Cập nhật món ăn
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL TẠO KHUYẾN MÃI MỚI ────────────────────────────────────── */}
        {showAddPromoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Tạo chương trình khuyến mãi
              </h3>
              <form onSubmit={handleAddPromotion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Mã Code khuyến mãi (viết liền không dấu)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: SAVOUR20"
                    value={promoForm.code}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Mô tả chương trình
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Giảm giá 20% cho đơn từ 100k"
                    value={promoForm.description}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Loại giảm giá
                    </label>
                    <select
                      value={promoForm.discountType}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          discountType: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm bg-white"
                    >
                      <option value="percentage">Theo % (phần trăm)</option>
                      <option value="fixed">Số tiền cố định</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Giá trị giảm
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={
                        promoForm.discountType === "percentage"
                          ? "% ví dụ: 20"
                          : "Tiền ví dụ: 25000"
                      }
                      value={promoForm.discountValue}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          discountValue: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Đơn hàng tối thiểu (VND hoặc USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.minOrderValue}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        minOrderValue: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      required
                      value={promoForm.validFrom}
                      onChange={(e) =>
                        setPromoForm({ ...promoForm, validFrom: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      required
                      value={promoForm.validTo}
                      onChange={(e) =>
                        setPromoForm({ ...promoForm, validTo: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddPromoModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{
                      background: "linear-gradient(135deg, #FF4500, #FF6B35)",
                    }}
                  >
                    Tạo khuyến mãi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }
