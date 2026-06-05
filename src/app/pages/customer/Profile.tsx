import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Clock, CheckCircle, Edit, Trash2 } from "lucide-react";
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
  const [profilePhone, setProfilePhone] = useState(user?.profile?.phone || user?.phoneNumber || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.profile?.avatarUrl || user?.avatarUrl || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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
      setProfilePhone(user?.profile?.phone || user?.phoneNumber || "");
      setProfileAvatar(user?.profile?.avatarUrl || user?.avatarUrl || "");
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
      toast.error(t("profile.name_required"));
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
      toast.success(t("profile.update_info_success"));
      setAvatarError(false);
      setSettingsModal(null);
    } catch {
      toast.error(t("profile.update_info_error"));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingNotif(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(t("profile.update_notif_success"));
      setSettingsModal(null);
    } catch {
      toast.error(t("profile.update_notif_error"));
    } finally {
      setIsSavingNotif(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.confirm_password_mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("profile.password_min_length"));
      return;
    }
    try {
      setIsChangingPass(true);
      await changePassword(oldPassword, newPassword);
      toast.success(t("profile.change_password_success"));
      setSettingsModal(null);
    } catch {
      toast.error(t("profile.change_password_error"));
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber.trim() || !newCardExpiry.trim() || !newCardCVV.trim()) {
      toast.error(t("profile.card_info_required"));
      return;
    }
    const cleanNumber = newCardNumber.replace(/\s+/g, "");
    if (cleanNumber.length < 12) {
      toast.error(t("profile.card_number_invalid"));
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
    toast.success(t("profile.add_card_success"));
  };

  const handleDeleteCard = (id: string) => {
    if (!confirm(t("profile.confirm_delete_card"))) return;
    setCards(cards.filter((c) => c.id !== id));
    toast.success(t("profile.delete_card_success"));
  };

  const handleDeleteAccount = () => {
    const doubleConfirm = prompt(t("profile.confirm_delete_account_prompt"));
    if (doubleConfirm !== "DELETE") {
      toast.error(t("profile.confirm_delete_account_invalid"));
      return;
    }
    toast.info(t("profile.deleting_account"));
    setTimeout(() => {
      useAuthStore.getState().logout();
      toast.success(t("profile.delete_account_success"));
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
      toast.error(t("profile.address_fields_required"));
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
        toast.success(t("profile.update_address_success"));
      } else {
        await addressService.createAddress({
          label: formLabel,
          address: formAddress,
          isDefault: formIsDefault,
        });
        toast.success(t("profile.add_address_success"));
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch {
      toast.error(t("profile.save_address_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm(t("profile.confirm_delete_address"))) return;
    try {
      await addressService.deleteAddress(id);
      toast.success(t("profile.delete_address_success"));
      fetchAddresses();
    } catch {
      toast.error(t("profile.delete_address_error"));
    }
  };

  const handleSetDefault = async (addr: SavedAddress) => {
    if (addr.isDefault) return;
    try {
      await addressService.updateAddress(addr.id, { isDefault: true });
      toast.success(t("profile.set_default_address_success"));
      fetchAddresses();
    } catch {
      toast.error(t("profile.set_default_address_error"));
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
              {(user?.profile?.avatarUrl || user?.avatarUrl) && !avatarError ? (
                <img
                  src={user?.profile?.avatarUrl || user?.avatarUrl || ""}
                  alt={user.fullName}
                  className="w-20 h-20 rounded-3xl object-cover border border-white/10"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                  {userInitials}
                </div>
              )}
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
              <div className="text-center py-8 text-gray-400 text-sm">{t("profile.loading_orders")}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">{t("profile.no_orders")}</div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 hover:border-orange-200 transition-all cursor-pointer"
                  onClick={() => navigate(`/tracking?orderId=${order.id}`)}
                >
                  <img src={order.restaurant?.logo} alt={order.restaurant?.name || "Restaurant"} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
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
              <div className="text-center py-8 text-gray-400 text-sm">{t("profile.loading_addresses")}</div>
            ) : !Array.isArray(addresses) || addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">{t("profile.no_addresses")}</div>
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
                          {t("profile.set_default")}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 break-words">{a.address}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(a)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF4500] hover:bg-orange-50 transition-colors cursor-pointer"
                      title={t("common.edit")}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(a.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title={t("common.delete")}
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
              <div className="text-center py-8 text-gray-400 text-sm col-span-2 w-full">{t("profile.loading_favorites")}</div>
            ) : favoriteRestaurants.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm col-span-2 w-full">{t("profile.no_favorites")}</div>
            ) : (
              favoriteRestaurants.map((r) => {
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
                    <img src={r.imageUrl ?? undefined} alt={r.name} className="w-full h-32 object-cover" />
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
                    {t("profile.level_transition", { current: currentLevelName, next: nextLevelName })}
                  </p>
                  <p className="text-sm text-gray-400">{t("profile.progress_percentage", { percent: progressPercentage.toFixed(1) })}</p>
                </div>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progressPercentage}%`, background: "linear-gradient(90deg, #FF4500, #FF6B35)" }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {pointsToNext > 0
                  ? t("profile.points_to_next", { points: pointsToNext.toLocaleString(), tier: nextLevelName })
                  : t("profile.max_level_reached")}
              </p>
            </div>

            {/* Missions List */}
            <div className="bg-white rounded-3xl p-6 mb-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                {t("profile.points_mission")}
              </h3>
              {userMissions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t("profile.no_active_missions")}</p>
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
                            +{um.mission.pointsReward} {t("profile.points")}
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
                              <CheckCircle className="w-3.5 h-3.5" /> {t("profile.mission_completed")}
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
                {t("profile.achieved_badges_title")}
              </h3>
              {userBadges.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  {t("profile.badges_empty")}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userBadges.map((ub: UserBadge) => (
                    <div key={ub.badge.id} className="bg-white rounded-2xl p-4 text-center border border-orange-200 shadow-sm transition-all">
                      <div className="text-4xl mb-2">{getBadgeIcon(ub.badge.name)}</div>
                      <p className="font-semibold text-gray-900 text-sm">{ub.badge.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ub.badge.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-green-500 mt-2">
                        <CheckCircle className="w-3 h-3" /> {t("profile.badge_achieved")}
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
                {editingAddress ? t("checkout.edit_address") : t("profile.add_address")}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{t("profile.save_address_btn")}</p>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("checkout.address_label")}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[t("checkout.label_home"), t("checkout.label_office"), t("checkout.label_school")].map((suggested) => (
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
                  placeholder={t("checkout.address_label_placeholder")}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("checkout.detailed_address_label")}</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder={t("checkout.detailed_address_placeholder")}
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
                  {t("checkout.set_default_checkbox")}
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                >
                  {isSaving ? `${t("profile.loading_save")}...` : t("profile.save_address_btn")}
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
                  {settingsModal === "personal_info" && t("profile.settings_tabs.personal_info")}
                  {settingsModal === "notifications" && t("profile.settings_tabs.notifications")}
                  {settingsModal === "security" && t("profile.settings_tabs.security")}
                  {settingsModal === "payments" && t("profile.settings_tabs.payments")}
                  {settingsModal === "referral" && t("profile.settings_tabs.referral")}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {settingsModal === "personal_info" && t("profile.personal_info_desc")}
                  {settingsModal === "notifications" && t("profile.notifications_desc")}
                  {settingsModal === "security" && t("profile.security_desc")}
                  {settingsModal === "payments" && t("profile.payments_desc")}
                  {settingsModal === "referral" && t("profile.referral_desc")}
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
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("auth.full_name")}</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder={t("auth.full_name")}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("auth.phonenumber")}</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder={t("auth.phonenumber_placeholder")}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("profile.avatar_url_label")}</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={profileAvatar}
                        onChange={(e) => setProfileAvatar(e.target.value)}
                        placeholder={t("profile.avatar_url_placeholder")}
                        className="w-full pl-4 pr-16 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) {
                              setProfileAvatar(text);
                              toast.success(t("common.success"));
                            }
                          } catch (err) {
                            console.error("Failed to read clipboard:", err);
                          }
                        }}
                        className="absolute right-2 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF4500] hover:text-[#FF6B35] rounded-xl text-xs font-bold transition-all"
                      >
                        {t("common.paste")}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setSettingsModal(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                      {t("common.cancel")}
                    </button>
                    <button type="submit" disabled={isUpdatingProfile} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {isUpdatingProfile ? `${t("profile.loading_save")}...` : t("common.save_changes")}
                    </button>
                  </div>
                </form>
              )}

              {/* 2. NOTIFICATIONS CONFIG */}
              {settingsModal === "notifications" && (
                <form onSubmit={handleSaveNotifications} className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { state: notifPush, setter: setNotifPush, title: t("profile.settings_tabs.notifications") + " (Push)", desc: t("profile.notifications_desc") },
                      { state: notifEmail, setter: setNotifEmail, title: "Email Marketing", desc: t("profile.settings_desc.notifications") },
                      { state: notifSMS, setter: setNotifSMS, title: "SMS", desc: t("profile.settings_desc.notifications") },
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
                      {t("common.cancel")}
                    </button>
                    <button type="submit" disabled={isSavingNotif} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {isSavingNotif ? `${t("profile.loading_save")}...` : t("profile.save_settings_btn")}
                    </button>
                  </div>
                </form>
              )}

              {/* 3. SECURITY / PASSWORD CHANGE */}
              {settingsModal === "security" && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("profile.current_password")}</label>
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
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("profile.new_password")}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("profile.confirm_new_password")}</label>
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
                      {t("common.cancel")}
                    </button>
                    <button type="submit" disabled={isChangingPass} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {isChangingPass ? t("profile.changing") : t("profile.update_password_btn")}
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
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("profile.card_number_label")}</label>
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
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("profile.card_expiry_label")}</label>
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
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("profile.card_cvv_label")}</label>
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
                          {t("common.cancel")}
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                          {t("profile.card_confirm_btn")}
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
                              <p className="text-xs text-gray-400">{t("profile.expires")} {card.expiry}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteCard(card.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            ✕
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setIsAddingCard(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-[#FF4500] hover:bg-orange-50 hover:border-orange-200 transition-colors mt-2">
                        {t("profile.add_new_card")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 5. REFERRAL CODE */}
              {settingsModal === "referral" && (
                <div className="space-y-4 text-center">
                  <div className="p-6 rounded-3xl bg-orange-50/50 border border-orange-100 inline-block w-full">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">{t("profile.referral_code_title")}</p>
                    <div className="flex items-center justify-center gap-3 bg-white border border-orange-150 rounded-2xl p-4 shadow-sm">
                      <span className="font-mono text-2xl font-black text-gray-800">
                        {`SAVOUR-${user?.id?.slice(0, 6).toUpperCase() || "FRIEND"}`}
                      </span>
                      <button
                        onClick={() => {
                          const code = `SAVOUR-${user?.id?.slice(0, 6).toUpperCase() || "FRIEND"}`;
                          navigator.clipboard.writeText(code);
                          toast.success(t("profile.referral_copied"));
                        }}
                        className="p-2 rounded-xl bg-orange-100 text-[#FF4500] hover:bg-orange-200 transition-colors"
                      >
                        {t("discovery.copy_code")}
                      </button>
                    </div>
                  </div>
                  <div className="text-left space-y-2 text-xs text-gray-500 px-2">
                    <p className="font-bold text-gray-700">{t("profile.referral_rules_title")}</p>
                    <p>{t("profile.referral_rule_1")}</p>
                    <p>{t("profile.referral_rule_2")}</p>
                    <p>{t("profile.referral_rule_3")}</p>
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
