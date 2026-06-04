import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Clock, CheckCircle, Edit, Trash2 } from "lucide-react";
import { IMGS } from "../../data/mock";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchRestaurants } from "../../features/restaurantSlice";
import { addressService } from "../../services/addressService";
import type { SavedAddress } from "../../types/address";
import { useAuthStore } from "../../stores/authStore";
import type { UserMission, UserBadge } from "../../types/auth";
import { toast } from "sonner";
import { favoriteService } from "../../services/favoriteService";
import type { Restaurant } from "../../types/restaurant";
import { profileService } from "../../services/profileService";
import { changePassword } from "../../services/authService";

import { orderService } from "../../services/orderService";
import type { Order } from "../../types/order";
import dayjs from "dayjs";
import { selectSelectedAddress } from "../../features/mapSelectors";
import { calculateDistance, getStableCoords, getDeliveryTimeText } from "../../utils/geo";



const restaurantImages = [IMGS.burger, IMGS.pizza, IMGS.chicken, IMGS.coffee, IMGS.sushi, IMGS.ramen, IMGS.dessert, IMGS.restaurant];

const getRestaurantImage = (index: number) => restaurantImages[index % restaurantImages.length];

const getBadgeIcon = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("bronze") || normalized.includes("đồng")) return "🥉";
  if (normalized.includes("silver") || normalized.includes("bạc")) return "🥈";
  if (normalized.includes("gold") || normalized.includes("vàng")) return "🥇";
  if (normalized.includes("platinum") || normalized.includes("bạch kim")) return "💎";
  return "🏅";
};

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("orders");
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const selectedAddress = useAppSelector(selectSelectedAddress);

  // Settings Modals States
  const [settingsModal, setSettingsModal] = useState<string | null>(null);

  // Personal Info Form
  const [profileName, setProfileName] = useState(user?.fullName || "");
  const [profilePhone, setProfilePhone] = useState(user?.profile?.phone || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.profile?.avatarUrl || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Notification Settings
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [isSavingNotif, setIsSavingNotif] = useState(false);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Payment Cards
  const [cards, setCards] = useState<Array<{ id: string; number: string; expiry: string; type: string }>>([
    { id: "1", number: "**** **** **** 4242", expiry: "12/28", type: "Visa" },
    { id: "2", number: "**** **** **** 8888", expiry: "08/27", type: "Mastercard" },
  ]);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCVV, setNewCardCVV] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);

  const openSettingsModal = (type: string) => {
    setSettingsModal(type);
    if (type === "personal_info") {
      setProfileName(user?.fullName || "");
      setProfilePhone(user?.profile?.phone || "");
      setProfileAvatar(user?.profile?.avatarUrl || "");
    } else if (type === "security") {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profileName.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    try {
      setIsUpdatingProfile(true);
      await profileService.updateProfile(user.id, {
        fullName: profileName,
        phone: profilePhone,
        avatarUrl: profileAvatar,
      });
      // Refresh user store
      const { getMe } = await import("../../services/authService");
      const updatedUser = await getMe();
      useAuthStore.getState().setUser(updatedUser);
      toast.success("Cập nhật thông tin thành công!");
      setSettingsModal(null);
    } catch {
      toast.error("Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingNotif(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Cập nhật cài đặt thông báo thành công!");
      setSettingsModal(null);
    } catch {
      toast.error("Không thể lưu cài đặt thông báo");
    } finally {
      setIsSavingNotif(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự");
      return;
    }
    try {
      setIsChangingPass(true);
      await changePassword(oldPassword, newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setSettingsModal(null);
    } catch {
      toast.error("Đổi mật khẩu thất bại. Mật khẩu cũ có thể không chính xác.");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber.trim() || !newCardExpiry.trim() || !newCardCVV.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin thẻ");
      return;
    }
    const cleanNumber = newCardNumber.replace(/\s+/g, "");
    if (cleanNumber.length < 12) {
      toast.error("Số thẻ không hợp lệ");
      return;
    }
    const masked = `**** **** **** ${cleanNumber.slice(-4)}`;
    const newCard = {
      id: Date.now().toString(),
      number: masked,
      expiry: newCardExpiry,
      type: cleanNumber.startsWith("4") ? "Visa" : "Mastercard",
    };
    setCards([...cards, newCard]);
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCVV("");
    setIsAddingCard(false);
    toast.success("Thêm thẻ thanh toán thành công!");
  };

  const handleDeleteCard = (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thẻ này?")) return;
    setCards(cards.filter((c) => c.id !== id));
    toast.success("Xóa thẻ thanh toán thành công!");
  };

  const handleDeleteAccount = () => {
    const doubleConfirm = prompt("Để xác nhận xóa tài khoản, vui lòng nhập chữ 'DELETE' dưới đây:");
    if (doubleConfirm !== "DELETE") {
      toast.error("Xác nhận không chính xác. Hủy yêu cầu xóa.");
      return;
    }
    toast.info("Đang xử lý yêu cầu xóa tài khoản...");
    setTimeout(() => {
      useAuthStore.getState().logout();
      toast.success("Tài khoản của bạn đã được xóa thành công.");
      navigate("/login");
    }, 1500);
  };

  const currentPoints = user?.profile?.rewardPoints ?? 0;
  let currentLevelName = "Newbie";
  let nextLevelName = "Bronze";
  let currentMin = 0;
  let nextMin = 100;

  if (currentPoints >= 2500) {
    currentLevelName = "Platinum";
    nextLevelName = "Max Level";
    currentMin = 2500;
    nextMin = 2500;
  } else if (currentPoints >= 1000) {
    currentLevelName = "Gold";
    nextLevelName = "Platinum";
    currentMin = 1000;
    nextMin = 2500;
  } else if (currentPoints >= 300) {
    currentLevelName = "Silver";
    nextLevelName = "Gold";
    currentMin = 300;
    nextMin = 1000;
  } else if (currentPoints >= 100) {
    currentLevelName = "Bronze";
    nextLevelName = "Silver";
    currentMin = 100;
    nextMin = 300;
  }

  const progressRange = nextMin - currentMin;
  const progressEarned = currentPoints - currentMin;
  const progressPercentage = progressRange > 0 ? Math.min(100, Math.max(0, (progressEarned / progressRange) * 100)) : 100;
  const pointsToNext = nextMin - currentPoints;

  const userBadges = user?.profile?.achievedBadges || [];
  const userMissions = user?.profile?.missionProgresses || [];

  // Order states
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const { getMe } = await import("../../services/authService");
        const updatedUser = await getMe();
        useAuthStore.getState().setUser(updatedUser);
      } catch (err) {
        console.error("Failed to refresh user profile:", err);
      }
    };
    refreshUser();
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);
      const data = await addressService.getMyAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "addresses") {
      setTimeout(() => { fetchAddresses(); }, 0);
    }
  }, [activeTab, fetchAddresses]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Fetch orders on mount to display count in the stats header
  useEffect(() => {
    setTimeout(() => { fetchOrders(); }, 0);
  }, [fetchOrders]);

  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoadingFavorites(true);
      const data = await favoriteService.listFavorites();
      setFavoriteRestaurants(data || []);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "favorites") {
      setTimeout(() => { fetchFavorites(); }, 0);
    }
  }, [activeTab, fetchFavorites]);

  const getAddressIcon = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes("nhà") || normalized.includes("home")) return "🏠";
    if (normalized.includes("văn phòng") || normalized.includes("công ty") || normalized.includes("office") || normalized.includes("work")) return "🏢";
    if (normalized.includes("trường") || normalized.includes("school") || normalized.includes("university")) return "🏫";
    return "📍";
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormLabel("");
    setFormAddress("");
    setFormIsDefault(false);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setFormLabel(addr.label);
    setFormAddress(addr.address);
    setFormIsDefault(addr.isDefault);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formAddress.trim()) {
      toast.error("Vui lòng điền đầy đủ nhãn và địa chỉ");
      return;
    }
    try {
      setIsSaving(true);
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, {
          label: formLabel,
          address: formAddress,
          isDefault: formIsDefault,
        });
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await addressService.createAddress({
          label: formLabel,
          address: formAddress,
          isDefault: formIsDefault,
        });
        toast.success("Thêm địa chỉ thành công");
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch {
      toast.error("Không thể lưu địa chỉ. Vui lòng thử lại sau.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await addressService.deleteAddress(id);
      toast.success("Xóa địa chỉ thành công");
      fetchAddresses();
    } catch {
      toast.error("Không thể xóa địa chỉ. Vui lòng thử lại sau.");
    }
  };

  const handleSetDefault = async (addr: SavedAddress) => {
    if (addr.isDefault) return;
    try {
      await addressService.updateAddress(addr.id, { isDefault: true });
      toast.success("Đặt địa chỉ mặc định thành công");
      fetchAddresses();
    } catch {
      toast.error("Không thể đặt mặc định. Vui lòng thử lại sau.");
    }
  };

  const userInitials = user?.fullName
    ? user.fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "SC";

  const tabs = [
    { id: "orders", label: t('profile.orders') },
    { id: "addresses", label: t('profile.addresses') },
    { id: "favorites", label: t('profile.favorites') },
    { id: "rewards", label: t('profile.rewards') },
    { id: "settings", label: t('profile.settings') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/explore")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">{t('profile.my_profile')}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile card */}
        <div
          className="rounded-3xl p-6 mb-6 text-white overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #0F172A, #1E1040)" }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#FF4500]/20 blur-2xl" />
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                {userInitials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-gray-900 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.fullName || "Sarah Chen"}</h2>
              <p className="text-gray-400 text-sm">{user?.email || "sarah.chen@email.com"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                  {user?.profile?.badgeLevel || "Newbie"}
                </span>
                <span className="text-xs text-gray-400">{t('profile.since')} 2024</span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-3xl font-black text-white">{(user?.profile?.rewardPoints ?? 0).toLocaleString()}</p>
              <p className="text-gray-400 text-sm">{t('profile.savour_points')}</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            {[[orders.length.toString(), t('profile.orders')], ["4.9★", t('profile.avg_rating')], [userBadges.length.toString(), t('profile.badges')]].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-white">{val}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${activeTab === tab.id ? "text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
              style={activeTab === tab.id ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {isLoadingOrders ? (
              <div className="text-center py-8 text-gray-400 text-sm">Đang tải lịch sử đơn hàng...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Chưa có đơn hàng nào.</div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 hover:border-orange-200 transition-all cursor-pointer"
                  onClick={() => navigate(`/tracking?orderId=${order.id}`)}
                >
                  <img src={order.restaurant?.logo || IMGS.burger} alt={order.restaurant?.name || "Restaurant"} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{order.restaurant?.name || "Restaurant"}</p>
                    <p className="text-sm text-gray-400">#{order.id.slice(0, 8).toUpperCase()} · {dayjs(order.createdAt).format("MMM D, YYYY")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{order.finalAmount.toLocaleString("vi-VN")}đ</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.status === "completed" ? "bg-green-100 text-green-600" : order.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                      {order.status === "completed" ? "✓ " : ""}{order.status}
                    </span>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#FF4500] bg-orange-50 hover:bg-orange-100 transition-colors"
                    onClick={(e) => { e.stopPropagation(); navigate(`/restaurant/${order.restaurantId}`); }}
                  >
                    {t('profile.reorder')}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="space-y-3">
            {isLoadingAddresses ? (
              <div className="text-center py-8 text-gray-400 text-sm">Đang tải danh sách địa chỉ...</div>
            ) : !Array.isArray(addresses) || addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Chưa có địa chỉ nào được lưu.</div>
            ) : (
              addresses.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl p-5 flex items-start gap-4 border border-gray-100 hover:border-orange-100 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-lg shrink-0">
                    {getAddressIcon(a.label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{a.label}</p>
                      {a.isDefault ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-[#FF4500] font-medium shrink-0">
                          {t('profile.default')}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(a)}
                          className="text-xs text-gray-400 hover:text-[#FF4500] transition-colors shrink-0"
                        >
                          Thiết lập mặc định
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 break-words">{a.address}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(a)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF4500] hover:bg-orange-50 transition-colors cursor-pointer"
                      title="Sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(a.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={openAddModal}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-[#FF4500] hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer"
            >
              {t('profile.add_address')}
            </button>
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {isLoadingFavorites ? (
              <div className="text-center py-8 text-gray-400 text-sm col-span-2 w-full">Đang tải danh sách yêu thích...</div>
            ) : favoriteRestaurants.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm col-span-2 w-full">Chưa có nhà hàng yêu thích nào.</div>
            ) : (
              favoriteRestaurants.map((r, index) => {
                let restLat = r.latitude ? parseFloat(String(r.latitude)) : null;
                let restLon = r.longitude ? parseFloat(String(r.longitude)) : null;
                if (restLat === null || restLon === null || isNaN(restLat) || isNaN(restLon)) {
                  const stable = getStableCoords(r.id, r.name);
                  restLat = stable.latitude;
                  restLon = stable.longitude;
                }
                const dist = selectedAddress
                  ? calculateDistance(selectedAddress.lat, selectedAddress.lng, restLat, restLon)
                  : null;

                return (
                  <div key={r.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/restaurant/${r.id}`)}>
                    <img src={getRestaurantImage(index)} alt={r.name} className="w-full h-32 object-cover" />
                    <div className="p-4">
                      <p className="font-bold text-gray-900">{r.name}</p>
                      <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{r.rating ?? "New"}</span>
                        <span><Clock className="w-3.5 h-3.5 inline mr-1" />{getDeliveryTimeText(dist)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "rewards" && (
          <div>
            {/* Progress */}
            <div className="bg-white rounded-3xl p-6 mb-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">
                    Cấp độ {currentLevelName} &rarr; {nextLevelName}
                  </p>
                  <p className="text-sm text-gray-400">Tiến trình: {progressPercentage.toFixed(1)}%</p>
                </div>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progressPercentage}%`, background: "linear-gradient(90deg, #FF4500, #FF6B35)" }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {pointsToNext > 0
                  ? `Tích lũy thêm ${pointsToNext.toLocaleString()} điểm để đạt hạng ${nextLevelName}`
                  : "Bạn đã đạt cấp độ cao nhất!"}
              </p>
            </div>

            {/* Missions List */}
            <div className="bg-white rounded-3xl p-6 mb-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                🎯 Nhiệm vụ tích điểm
              </h3>
              {userMissions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Không có nhiệm vụ hoạt động nào.</p>
              ) : (
                <div className="space-y-4">
                  {userMissions.map((um: UserMission) => {
                    const missionPct = Math.min(100, (um.currentProgress / um.mission.targetCount) * 100);
                    return (
                      <div key={um.mission.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{um.mission.title}</p>
                            <p className="text-xs text-gray-400">{um.mission.description}</p>
                          </div>
                          <span className="text-xs font-bold text-[#FF4500] bg-orange-50 px-2.5 py-1 rounded-full shrink-0">
                            +{um.mission.pointsReward} Điểm
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${missionPct}%`, background: "linear-gradient(90deg, #FF4500, #FF6B35)" }} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 shrink-0">
                            {um.currentProgress}/{um.mission.targetCount}
                          </span>
                          {um.isCompleted && (
                            <span className="text-xs font-bold text-green-500 flex items-center gap-0.5 shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Badges Grid */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                🏆 Huy hiệu đã đạt
              </h3>
              {userBadges.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Bạn chưa đạt huy hiệu nào. Hãy hoàn thành các đơn hàng để tích điểm và mở khóa!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userBadges.map((ub: UserBadge) => (
                    <div key={ub.badge.id} className="bg-white rounded-2xl p-4 text-center border border-orange-200 shadow-sm transition-all">
                      <div className="text-4xl mb-2">{getBadgeIcon(ub.badge.name)}</div>
                      <p className="font-semibold text-gray-900 text-sm">{ub.badge.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ub.badge.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-green-500 mt-2">
                        <CheckCircle className="w-3 h-3" /> Đã đạt
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-3">
            {[
              { icon: "👤", label: t('profile.settings_tabs.personal_info'), sub: t('profile.settings_desc.personal_info'), key: "personal_info" },
              { icon: "🔔", label: t('profile.settings_tabs.notifications'), sub: t('profile.settings_desc.notifications'), key: "notifications" },
              { icon: "🔒", label: t('profile.settings_tabs.security'), sub: t('profile.settings_desc.security'), key: "security" },
              { icon: "💳", label: t('profile.settings_tabs.payments'), sub: t('profile.settings_desc.payments'), key: "payments" },
              { icon: "🎁", label: t('profile.settings_tabs.referral'), sub: t('profile.settings_desc.referral'), key: "referral" },
              { icon: "⚠️", label: t('profile.settings_tabs.delete_account'), sub: t('profile.settings_desc.delete_account'), danger: true, key: "delete_account" },
            ].map((item: { icon: string; label: string; sub: string; danger?: boolean; key: string }) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.key === "delete_account") {
                    handleDeleteAccount();
                  } else {
                    openSettingsModal(item.key);
                  }
                }}
                className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 hover:border-gray-200 transition-all text-left cursor-pointer"
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold ${item.danger ? "text-red-500" : "text-gray-900"}`}>{item.label}</p>
                  <p className="text-sm text-gray-400">{item.sub}</p>
                </div>
                <span className="text-gray-300">›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Lưu địa chỉ để đặt món nhanh chóng hơn</p>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nhãn địa chỉ</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["Nhà riêng", "Văn phòng", "Trường học"].map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => setFormLabel(suggested)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${formLabel === suggested
                        ? "bg-orange-50 text-[#FF4500] border-orange-200"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ví dụ: Nhà riêng, Công ty, Người yêu..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Địa chỉ chi tiết</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all resize-none text-gray-800"
                  required
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#FF4500] focus:ring-orange-500"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                >
                  {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal Wrapper */}
      {settingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setSettingsModal(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {settingsModal === "personal_info" && "Thông tin cá nhân"}
                  {settingsModal === "notifications" && "Cài đặt thông báo"}
                  {settingsModal === "security" && "Mật khẩu & Bảo mật"}
                  {settingsModal === "payments" && "Phương thức thanh toán"}
                  {settingsModal === "referral" && "Giới thiệu bạn bè"}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {settingsModal === "personal_info" && "Cập nhật tên, số điện thoại và ảnh đại diện"}
                  {settingsModal === "notifications" && "Chọn các kênh bạn muốn nhận thông báo"}
                  {settingsModal === "security" && "Thay đổi mật khẩu đăng nhập của bạn"}
                  {settingsModal === "payments" && "Quản lý các thẻ thanh toán liên kết"}
                  {settingsModal === "referral" && "Chia sẻ mã để nhận thêm điểm thưởng"}
                </p>
              </div>
              <button onClick={() => setSettingsModal(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">

              {/* 1. PERSONAL INFO FORM */}
              {settingsModal === "personal_info" && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Họ và tên</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="Nhập số điện thoại..."
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Đường dẫn ảnh đại diện (Avatar URL)</label>
                    <input
                      type="url"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setSettingsModal(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                      Hủy
                    </button>
                    <button type="submit" disabled={isUpdatingProfile} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              )}

              {/* 2. NOTIFICATIONS CONFIG */}
              {settingsModal === "notifications" && (
                <form onSubmit={handleSaveNotifications} className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { state: notifPush, setter: setNotifPush, title: "Thông báo ứng dụng (Push)", desc: "Nhận tin tức cập nhật đơn hàng tức thời" },
                      { state: notifEmail, setter: setNotifEmail, title: "Email Marketing", desc: "Nhận hóa đơn và mã giảm giá hàng tuần" },
                      { state: notifSMS, setter: setNotifSMS, title: "Tin nhắn SMS", desc: "Nhận OTP và thông báo khẩn cấp từ tài xế" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.state}
                            onChange={(e) => item.setter(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4500]"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setSettingsModal(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                      Hủy
                    </button>
                    <button type="submit" disabled={isSavingNotif} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {isSavingNotif ? "Đang lưu..." : "Lưu cài đặt"}
                    </button>
                  </div>
                </form>
              )}

              {/* 3. SECURITY / PASSWORD CHANGE */}
              {settingsModal === "security" && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự..."
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setSettingsModal(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                      Hủy
                    </button>
                    <button type="submit" disabled={isChangingPass} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {isChangingPass ? "Đang đổi..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </form>
              )}

              {/* 4. PAYMENTS MANAGEMENT */}
              {settingsModal === "payments" && (
                <div className="space-y-4">
                  {isAddingCard ? (
                    <form onSubmit={handleAddCard} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Số thẻ</label>
                        <input
                          type="text"
                          value={newCardNumber}
                          onChange={(e) => setNewCardNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 16))}
                          placeholder="4111 2222 3333 4444"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hết hạn (MM/YY)</label>
                          <input
                            type="text"
                            value={newCardExpiry}
                            onChange={(e) => setNewCardExpiry(e.target.value.slice(0, 5))}
                            placeholder="12/28"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mã CVV</label>
                          <input
                            type="password"
                            value={newCardCVV}
                            onChange={(e) => setNewCardCVV(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                            placeholder="•••"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsAddingCard(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50">
                          Hủy
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                          Xác nhận
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      {cards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{card.type === "Visa" ? "💳" : "🎴"}</span>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{card.type} {card.number}</p>
                              <p className="text-xs text-gray-400">Hết hạn {card.expiry}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteCard(card.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            ✕
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setIsAddingCard(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-[#FF4500] hover:bg-orange-50 hover:border-orange-200 transition-colors mt-2">
                        + Thêm thẻ thanh toán mới
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 5. REFERRAL CODE */}
              {settingsModal === "referral" && (
                <div className="space-y-4 text-center">
                  <div className="p-6 rounded-3xl bg-orange-50/50 border border-orange-100 inline-block w-full">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Mã giới thiệu của bạn</p>
                    <div className="flex items-center justify-center gap-3 bg-white border border-orange-150 rounded-2xl p-4 shadow-sm">
                      <span className="font-mono text-2xl font-black text-gray-800">
                        {`SAVOUR-${user?.id?.slice(0, 6).toUpperCase() || "FRIEND"}`}
                      </span>
                      <button
                        onClick={() => {
                          const code = `SAVOUR-${user?.id?.slice(0, 6).toUpperCase() || "FRIEND"}`;
                          navigator.clipboard.writeText(code);
                          toast.success("Đã sao chép mã giới thiệu!");
                        }}
                        className="p-2 rounded-xl bg-orange-100 text-[#FF4500] hover:bg-orange-200 transition-colors"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                  <div className="text-left space-y-2 text-xs text-gray-500 px-2">
                    <p className="font-bold text-gray-700">🎁 Thể lệ chương trình:</p>
                    <p>• Bạn bè nhập mã khi đăng ký tài khoản mới.</p>
                    <p>• Bạn nhận ngay <span className="font-black text-[#FF4500]">50 điểm thưởng Savour</span> khi bạn bè hoàn thành đơn hàng đầu tiên.</p>
                    <p>• Bạn bè được tặng ngay <span className="font-black text-green-600">Voucher WELCOME10</span> giảm 10%.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
