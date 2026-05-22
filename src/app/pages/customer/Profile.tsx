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
import { toast } from "sonner";

import { orderService } from "../../services/orderService";
import type { Order } from "../../types/order";
import dayjs from "dayjs";

const badges = [
  { icon: "🔥", name: "Food Fiend", desc: "Ordered 50+ times", earned: true },
  { icon: "⭐", name: "Star Reviewer", desc: "Left 20+ reviews", earned: true },
  { icon: "🤝", name: "Group Master", desc: "Used group order 10x", earned: true },
  { icon: "🏆", name: "Leaderboard", desc: "Top 100 reviewer", earned: false },
  { icon: "💎", name: "VIP Member", desc: "Spent $1000+", earned: false },
  { icon: "🚀", name: "Speed Order", desc: "Ordered in < 60s", earned: false },
];

const restaurantImages = [IMGS.burger, IMGS.pizza, IMGS.chicken, IMGS.coffee, IMGS.sushi, IMGS.ramen, IMGS.dessert, IMGS.restaurant];

const getRestaurantImage = (index: number) => restaurantImages[index % restaurantImages.length];

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("Orders");
  const { t } = useTranslation();
  const { restaurants } = useAppSelector((state) => state.restaurants);
  const user = useAuthStore((state) => state.user);

  // Order states
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

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
    if (activeTab === t('profile.addresses')) {
      fetchAddresses();
    }
  }, [activeTab, t, fetchAddresses]);

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

  useEffect(() => {
    if (activeTab === t('profile.orders')) {
      fetchOrders();
    }
  }, [activeTab, t, fetchOrders]);

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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể lưu địa chỉ");
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể xóa địa chỉ");
    }
  };

  const handleSetDefault = async (addr: SavedAddress) => {
    if (addr.isDefault) return;
    try {
      await addressService.updateAddress(addr.id, { isDefault: true });
      toast.success("Đặt địa chỉ mặc định thành công");
      fetchAddresses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể đặt mặc định");
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

  const translatedTabs = [
    t('profile.orders'),
    t('profile.addresses'),
    t('profile.favorites'),
    t('profile.rewards'),
    t('profile.settings'),
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
                  {t('profile.gold_member')}
                </span>
                <span className="text-xs text-gray-400">{t('profile.since')} 2024</span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-3xl font-black text-white">2,840</p>
              <p className="text-gray-400 text-sm">{t('profile.savour_points')}</p>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            {[["84", t('profile.orders')], ["4.9★", t('profile.avg_rating')], ["12", t('profile.badges')]].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-white">{val}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {translatedTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab ? "text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
              style={activeTab === tab ? { background: "linear-gradient(135deg, #FF4500, #FF6B35)" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === t('profile.orders') && (
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

        {activeTab === t('profile.addresses') && (
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

        {activeTab === t('profile.favorites') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restaurants.slice(0, 4).map((r, index) => (
              <div key={r.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/restaurant/${r.id}`)}>
                <img src={getRestaurantImage(index)} alt={r.name} className="w-full h-32 object-cover" />
                <div className="p-4">
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{r.rating ?? "New"}</span>
                    <span><Clock className="w-3.5 h-3.5 inline mr-1" />20-30 min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === t('profile.rewards') && (
          <div>
            {/* Progress */}
            <div className="bg-white rounded-3xl p-6 mb-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{t('profile.gold_to_platinum')}</p>
                  <p className="text-sm text-gray-400">{t('profile.points_progress')}</p>
                </div>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "56.8%", background: "linear-gradient(90deg, #FF4500, #FF6B35)" }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{t('profile.points_to_unlock')}</p>
            </div>
            {/* Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((b) => (
                <div key={b.name} className={`bg-white rounded-2xl p-4 text-center border transition-all ${b.earned ? "border-orange-200 shadow-sm" : "border-gray-100 opacity-50"}`}>
                  <div className={`text-4xl mb-2 ${b.earned ? "" : "grayscale"}`}>{b.icon}</div>
                  <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.desc}</p>
                  {b.earned && <span className="inline-flex items-center gap-1 text-xs text-green-500 mt-2"><CheckCircle className="w-3 h-3" /> {t('profile.earned')}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === t('profile.settings') && (
          <div className="space-y-3">
            {[
              { icon: "👤", label: t('profile.settings_tabs.personal_info'), sub: t('profile.settings_desc.personal_info') },
              { icon: "🔔", label: t('profile.settings_tabs.notifications'), sub: t('profile.settings_desc.notifications') },
              { icon: "🔒", label: t('profile.settings_tabs.security'), sub: t('profile.settings_desc.security') },
              { icon: "💳", label: t('profile.settings_tabs.payments'), sub: t('profile.settings_desc.payments') },
              { icon: "🎁", label: t('profile.settings_tabs.referral'), sub: t('profile.settings_desc.referral') },
              { icon: "⚠️", label: t('profile.settings_tabs.delete_account'), sub: t('profile.settings_desc.delete_account'), danger: true },
            ].map((item: { icon: string; label: string; sub: string; danger?: boolean }) => (
              <button key={item.label} className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 border border-gray-100 hover:border-gray-200 transition-all text-left">
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        formLabel === suggested
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
    </div>
  );
}
