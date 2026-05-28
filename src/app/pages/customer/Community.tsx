import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Search, Trophy, TrendingUp, Loader2, Image as ImageIcon, X, Send, UserCheck, UserPlus, MapPin, Tag, Edit, Trash2, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { listRestaurants } from "../../services/restaurantService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "sonner";
import { socialPostService } from "../../services/socialPostService";
import type { SocialPost, PostComment, LeaderboardUser } from "../../services/socialPostService";
import type { Restaurant, MenuItem } from "../../features/restaurantSlice";

const viLocale = {
  name: "vi",
  weekdays: "chủ nhật_thứ hai_thứ ba_thứ tư_thứ năm_thứ sáu_thứ bảy".split("_"),
  months: "tháng 1_tháng 2_tháng 3_tháng 4_tháng 5_tháng 6_tháng 7_tháng 8_tháng 9_tháng 10_tháng 11_tháng 12".split("_"),
  weekStart: 1,
  weekdaysShort: "CN_T2_T3_T4_T5_T6_T7".split("_"),
  monthsShort: "Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"),
  weekdaysMin: "CN_T2_T3_T4_T5_T6_T7".split("_"),
  ordinal: (n: number) => n,
  formats: {
    LT: "HH:mm",
    LTS: "HH:mm:ss",
    L: "DD/MM/YYYY",
    LL: "D MMMM [năm] YYYY",
    LLL: "D MMMM [năm] YYYY HH:mm",
    LLLL: "dddd, D MMMM [năm] YYYY HH:mm",
    l: "DD/M/YYYY",
    ll: "D MMM YYYY",
    lll: "D MMM YYYY HH:mm",
    llll: "ddd, D MMM YYYY HH:mm",
  },
  relativeTime: {
    future: "%s tới",
    past: "%s trước",
    s: "vài giây",
    m: "một phút",
    mm: "%d phút",
    h: "một giờ",
    hh: "%d giờ",
    d: "một ngày",
    dd: "%d ngày",
    M: "một tháng",
    MM: "%d tháng",
    y: "một năm",
    yy: "%d năm",
  },
};

dayjs.extend(relativeTime);
dayjs.locale(viLocale, undefined, true);

const TAB_VALUES = ["for_you", "following", "trending", "near_you"];

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export default function Community() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Auth state
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.user);
  const isLoggedIn = !!accessToken;

  // Tabs
  const communityTabs = [
    t('community.for_you'), 
    t('community.following'), 
    t('community.trending'), 
    t('community.near_you')
  ];
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Comments state
  const [openedCommentsPostId, setOpenedCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [loadingCommentsMap, setLoadingCommentsMap] = useState<Record<string, boolean>>({});
  const [newCommentTextMap, setNewCommentTextMap] = useState<Record<string, string>>({});
  const [submittingCommentMap, setSubmittingCommentMap] = useState<Record<string, boolean>>({});

  // Create Post Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMedia, setNewPostMedia] = useState<string[]>([]);
  const [newPostRestaurantId, setNewPostRestaurantId] = useState("");
  const [newPostTaggedItems, setNewPostTaggedItems] = useState<{ menuItemId: string; name: string }[]>([]);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Restaurants & Dishes database cache for tagging
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch posts helper
  const fetchPosts = useCallback(async (tabName: string) => {
    setLoadingPosts(true);
    try {
      const data = await socialPostService.getSocialPosts(tabName);
      setPosts(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách bài viết.");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Fetch leaderboard helper
  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await socialPostService.getLeaderboard();
      setLeaderboard(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts(TAB_VALUES[activeTabIdx]);
    fetchLeaderboard();
  }, [activeTabIdx, fetchPosts, fetchLeaderboard]);

  // Load restaurants for tagging
  useEffect(() => {
    if (showCreateModal) {
      listRestaurants()
        .then((res) => {
          setRestaurantsList(res || []);
        })
        .catch(console.error);
    }
  }, [showCreateModal]);

  // Handle Like post
  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để thích bài viết.");
      navigate("/login");
      return;
    }

    try {
      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              liked: !p.liked,
              likesCount: p.liked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
            };
          }
          return p;
        })
      );

      await socialPostService.likeSocialPost(postId);
    } catch (err) {
      console.error(err);
      // Revert if error
      fetchPosts(TAB_VALUES[activeTabIdx]);
    }
  };

  // Toggle Comments section
  const handleToggleComments = async (postId: string) => {
    if (openedCommentsPostId === postId) {
      setOpenedCommentsPostId(null);
      return;
    }

    setOpenedCommentsPostId(postId);

    if (!commentsMap[postId]) {
      setLoadingCommentsMap((prev) => ({ ...prev, [postId]: true }));
      try {
        const commentsList = await socialPostService.getComments(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: commentsList }));
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi tải bình luận.");
      } finally {
        setLoadingCommentsMap((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  // Post Comment
  const handlePostComment = async (postId: string) => {
    const text = newCommentTextMap[postId]?.trim();
    if (!text) return;
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để bình luận.");
      navigate("/login");
      return;
    }

    setSubmittingCommentMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await socialPostService.addComment(postId, text);
      
      // Update comments locally
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setNewCommentTextMap((prev) => ({ ...prev, [postId]: "" }));
      
      // Update comment count on post
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return { ...p, commentsCount: p.commentsCount + 1 };
          }
          return p;
        })
      );
    } catch (err) {
      console.error(err);
      toast.error("Không thể đăng bình luận.");
    } finally {
      setSubmittingCommentMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Share post
  const handleShare = async (postId: string) => {
    try {
      const shareUrl = `${window.location.origin}/community/post/${postId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết bài viết vào bộ nhớ tạm!");
      
      await socialPostService.shareSocialPost(postId);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi chia sẻ.");
    }
  };

  // Toggle follow user
  const handleFollowToggle = async (postAuthorProfileId: string) => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để theo dõi.");
      navigate("/login");
      return;
    }

    try {
      // Optimistic update for all posts by this author
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.user.id === postAuthorProfileId) {
            return { ...p, followed: !p.followed };
          }
          return p;
        })
      );

      const res = await socialPostService.toggleFollow(postAuthorProfileId);
      toast.success(res.followed ? "Đã theo dõi người dùng!" : "Đã hủy theo dõi người dùng.");
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      toast.error("Không thể thay đổi trạng thái theo dõi.");
      fetchPosts(TAB_VALUES[activeTabIdx]);
    }
  };

  // Upload Media
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    try {
      const fileUrl = await socialPostService.uploadFile(file);
      setNewPostMedia((prev) => [...prev, fileUrl]);
      toast.success("Tải file lên thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Tải file lên thất bại. Hãy thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setNewPostContent("");
    setNewPostMedia([]);
    setNewPostRestaurantId("");
    setNewPostTaggedItems([]);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingPost(null);
    setNewPostContent("");
    setNewPostMedia([]);
    setNewPostRestaurantId("");
    setNewPostTaggedItems([]);
  };

  const handleEditClick = (post: SocialPost) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    setNewPostMedia(post.mediaUrls || []);
    setNewPostRestaurantId(post.restaurant?.id || "");
    setNewPostTaggedItems(post.taggedItems || []);
    setShowCreateModal(true);
    setActiveMenuPostId(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      await socialPostService.deleteSocialPost(postId);
      toast.success("Đã xóa bài viết thành công!");
      fetchPosts(TAB_VALUES[activeTabIdx]);
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      toast.error("Xóa bài viết thất bại. Hãy thử lại!");
    }
  };

  // Create/Update social post submission
  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      toast.warning("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    setIsSubmittingPost(true);
    try {
      if (editingPost) {
        await socialPostService.updateSocialPost(editingPost.id, {
          content: newPostContent,
          mediaUrls: newPostMedia,
          restaurantId: newPostRestaurantId || undefined,
          taggedItems: newPostTaggedItems.length > 0 ? newPostTaggedItems : undefined,
        });
        toast.success("Cập nhật bài viết thành công!");
      } else {
        await socialPostService.createSocialPost({
          content: newPostContent,
          mediaUrls: newPostMedia,
          restaurantId: newPostRestaurantId || undefined,
          taggedItems: newPostTaggedItems.length > 0 ? newPostTaggedItems : undefined,
        });
        toast.success("Đăng bài review thành công!");
      }
      
      handleCloseModal();
      
      // Reload posts
      fetchPosts(TAB_VALUES[activeTabIdx]);
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      toast.error(editingPost ? "Cập nhật bài viết thất bại. Hãy thử lại!" : "Đăng bài thất bại. Hãy thử lại!");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Tagging helpers
  const handleDishTagToggle = (itemId: string, itemName: string) => {
    const exists = newPostTaggedItems.some((item) => item.menuItemId === itemId);
    if (exists) {
      setNewPostTaggedItems((prev) => prev.filter((item) => item.menuItemId !== itemId));
    } else {
      setNewPostTaggedItems((prev) => [...prev, { menuItemId: itemId, name: itemName }]);
    }
  };

  // Filter posts locally by search query
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      post.content.toLowerCase().includes(query) ||
      post.user.name.toLowerCase().includes(query) ||
      (post.restaurant && post.restaurant.name.toLowerCase().includes(query)) ||
      (post.taggedItems && post.taggedItems.some((dish) => dish.name.toLowerCase().includes(query)))
    );
  });

  // Selected restaurant menu items for tagging
  const selectedRestaurantMenuItems = newPostRestaurantId
    ? restaurantsList.find((r) => r.id === newPostRestaurantId)?.menuItems || []
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/explore")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-lg">{t('community.food_community')}</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input 
              placeholder={t('community.search_posts')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none text-gray-600 w-full" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs font-semibold shrink-0">
                Xóa
              </button>
            )}
          </div>
        </div>
        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-6 pb-3">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {communityTabs.map((tab, i) => (
              <button 
                key={tab} 
                onClick={() => setActiveTabIdx(i)}
                className={`text-sm font-medium pb-2 border-b-2 transition-all shrink-0 ${activeTabIdx === i ? "text-[#FF4500] border-[#FF4500]" : "text-gray-500 border-transparent hover:text-gray-800"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* Left/Middle: Post Feed */}
        <div className="lg:col-span-2 space-y-5">
          {/* Post composer shortcut */}
          {isLoggedIn ? (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-[#FF4500] shrink-0">
                {currentUser?.fullName ? currentUser.fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) : "ME"}
              </div>
              <button 
                onClick={handleOpenCreateModal}
                className="flex-1 text-left px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-400 hover:bg-gray-100/50 transition-colors"
              >
                Hôm nay bạn ăn gì? Hãy đăng bài viết review cùng ảnh/video nào...
              </button>
              <button 
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white shrink-0 hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                Đăng bài
              </button>
            </div>
          ) : (
            <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Tham gia cộng đồng ẩm thực ẩm thực Savour</h3>
                <p className="text-xs text-gray-500 mt-1">Đăng nhập để chia sẻ các món ăn ngon của bạn, tương tác và tích điểm nâng bậc huy hiệu!</p>
              </div>
              <button 
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Posts list */}
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-6 border border-gray-100 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-gray-200 rounded" />
                      <div className="w-32 h-3 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded" />
                  <div className="w-full h-48 bg-gray-200 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl py-12 px-6 border border-gray-100 text-center space-y-3">
              <span className="text-4xl">🍜</span>
              <h3 className="font-bold text-gray-700 text-sm">Chưa có bài viết nào</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">Không tìm thấy bài viết nào phù hợp. Hãy là người đầu tiên chia sẻ review ăn uống của bạn!</p>
              {isLoggedIn && (
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                >
                  Đăng review đầu tiên
                </button>
              )}
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isLiked = post.liked;
              const isFollowed = post.followed;
              const isOwnPost = !!post.isOwnPost;

              return (
                <article key={post.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 p-5 pb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {post.user.avatarUrl ? (
                        <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        post.user.avatar
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm truncate">{post.user.name}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0" style={{
                          background: post.user.badgeLevel === "Gold" 
                            ? "linear-gradient(135deg, #D4AF37, #FFD700)" 
                            : post.user.badgeLevel === "Silver"
                            ? "linear-gradient(135deg, #C0C0C0, #E0E0E0)"
                            : post.user.badgeLevel === "Bronze"
                            ? "linear-gradient(135deg, #CD7F32, #D2B48C)"
                            : "#9e9e9e"
                        }}>
                          {post.user.badgeLevel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {dayjs(post.createdAt).fromNow()}
                      </p>
                    </div>
                    
                    {isOwnPost && (
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenuPostId === post.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenuPostId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-2xl border border-gray-100 shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                              <button
                                onClick={() => handleEditClick(post)}
                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-orange-500 transition-colors flex items-center gap-2"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null);
                                  handleDeletePost(post.id);
                                }}
                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa bài viết
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {!isOwnPost && isLoggedIn && (
                      <button 
                        onClick={() => handleFollowToggle(post.user.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                          isFollowed 
                            ? "border border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100" 
                            : "border border-orange-200 text-[#FF4500] hover:bg-orange-50"
                        }`}
                      >
                        {isFollowed ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Đang theo dõi
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            Theo dõi
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Content text */}
                  <div className="px-5 pb-3">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    
                    {/* Tagged dishes */}
                    {post.taggedItems && post.taggedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.taggedItems.map((dish, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-[#FF4500] border border-orange-100">
                            <Tag className="w-3 h-3" />
                            {dish.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Media Display (Photo/Video) */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="relative bg-gray-100 max-h-96 overflow-hidden flex items-center justify-center border-y border-gray-50">
                      {post.mediaUrls.map((url, i) => {
                        const isVideo = url && (url.endsWith(".mp4") || url.endsWith(".mov") || (url.includes("/uploads/") && !url.endsWith(".jpg") && !url.endsWith(".png") && !url.endsWith(".jpeg")));
                        return isVideo ? (
                          <video key={i} src={url} controls className="w-full max-h-96 object-cover" />
                        ) : (
                          <img key={i} src={url} alt="Review media" className="w-full max-h-96 object-cover" />
                        );
                      })}
                      
                      {post.restaurant && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                          <button 
                            onClick={() => navigate(`/restaurant/${post.restaurant?.id}`)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/60 transition-colors flex items-center gap-1 shadow"
                          >
                            <MapPin className="w-3 h-3 text-[#FF4500]" />
                            {post.restaurant.name}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 px-5 py-3 border-b border-gray-50">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isLiked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      {formatNum(post.likesCount)}
                    </button>
                    
                    <button 
                      onClick={() => handleToggleComments(post.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        openedCommentsPostId === post.id ? "text-[#FF4500] bg-orange-50/50" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" /> 
                      {formatNum(post.commentsCount)}
                    </button>
                    
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      <Share2 className="w-4 h-4" /> 
                      Chia sẻ
                    </button>
                  </div>

                  {/* Expandable comments section */}
                  {openedCommentsPostId === post.id && (
                    <div className="bg-gray-50/50 p-5 space-y-4">
                      {loadingCommentsMap[post.id] ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 text-[#FF4500] animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                          {(commentsMap[post.id] || []).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2">Chưa có bình luận nào. Hãy bắt đầu cuộc thảo luận!</p>
                          ) : (
                            commentsMap[post.id].map((comment) => (
                              <div key={comment.id} className="flex gap-2.5 items-start">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-400 shrink-0">
                                  {comment.user.avatarUrl ? (
                                    <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    comment.user.avatar
                                  )}
                                </div>
                                <div className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                  <div className="flex items-center justify-between mb-1 flex-wrap gap-x-2">
                                    <h4 className="font-bold text-gray-800 text-xs">{comment.user.name}</h4>
                                    <span className="text-[10px] text-gray-400">{dayjs(comment.createdAt).fromNow()}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Comment Input */}
                      {isLoggedIn ? (
                        <div className="flex gap-2 items-center">
                          <input
                            placeholder="Viết bình luận của bạn..."
                            value={newCommentTextMap[post.id] || ""}
                            onChange={(e) => setNewCommentTextMap((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handlePostComment(post.id);
                              }
                            }}
                            className="flex-1 bg-white text-xs px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#FF4500] transition-colors"
                          />
                          <button
                            disabled={submittingCommentMap[post.id] || !newCommentTextMap[post.id]?.trim()}
                            onClick={() => handlePostComment(post.id)}
                            className="p-2.5 rounded-xl bg-[#FF4500] hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
                          >
                            {submittingCommentMap[post.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 text-center mt-1">
                          Vui lòng <span onClick={() => navigate("/login")} className="text-[#FF4500] cursor-pointer font-bold hover:underline">đăng nhập</span> để bình luận bài viết này.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Leaderboard panel */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold text-gray-900 text-sm">Bảng xếp hạng Reviewer tích cực</h2>
            </div>
            
            {loadingLeaderboard ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#FF4500] animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Chưa có bảng xếp hạng tuần này.</p>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold text-base">{user.badge}</div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.avatar
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-xs truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400">{user.posts} bài đăng</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-orange-500">{user.score} pts</p>
                      <p className="text-[9px] text-gray-400">{user.followers} follow</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending tags */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#FF4500]" />
              <h2 className="font-bold text-gray-900 text-sm">Từ khóa thịnh hành</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["#RamenNgon", "#BurgerRepublic", "#BuddhaBowl", "#TiramisuLovers", "#PhoGiaTruyen", "#BunBoHue", "#DessertDreams", "#HealthyEats"].map((tag) => (
                <span 
                  key={tag} 
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-[#FF4500] cursor-pointer hover:bg-orange-100 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Posting Streak Card */}
          <div className="rounded-3xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)", boxShadow: "0 8px 24px rgba(255, 69, 0, 0.25)" }}>
            <p className="text-orange-100 text-xs font-medium mb-1">Chuỗi đăng bài tuần này</p>
            <p className="text-3xl font-black">7 {t('common.days')}</p>
            <p className="text-orange-100 text-[11px] mt-1.5 leading-relaxed">Đăng bài liên tục mỗi ngày để nhận danh hiệu "Chiến thần Review"!</p>
            <div className="flex gap-1 mt-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-white/60" />
              ))}
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-white/20" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE SOCIAL POST MODAL */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            if (!isSubmittingPost && !isUploading) handleCloseModal();
          }}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900 text-base">
                {editingPost ? "Chỉnh sửa bài viết review" : "Đăng bài review món ăn"}
              </h2>
              <button 
                disabled={isSubmittingPost || isUploading}
                onClick={handleCloseModal}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePostSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Post Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Đánh giá của bạn</label>
                <textarea
                  placeholder="Hãy chia sẻ trải nghiệm chân thực của bạn về món ăn, dịch vụ và không gian quán..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  required
                  className="w-full text-sm p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-[#FF4500] transition-all resize-none"
                />
              </div>

              {/* Tag Restaurant */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Gắn thẻ nhà hàng (Tùy chọn)</label>
                <select
                  value={newPostRestaurantId}
                  onChange={(e) => {
                    setNewPostRestaurantId(e.target.value);
                    setNewPostTaggedItems([]); // Clear dish tags if restaurant changes
                  }}
                  className="w-full text-sm px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#FF4500] transition-all cursor-pointer"
                >
                  <option value="">Chọn nhà hàng...</option>
                  {restaurantsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Dishes */}
              {newPostRestaurantId && selectedRestaurantMenuItems.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 block">Gắn thẻ món ăn review</label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    {selectedRestaurantMenuItems.map((item: MenuItem) => {
                      const isTagged = newPostTaggedItems.some((t) => t.menuItemId === item.id);
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleDishTagToggle(item.id, item.name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                            isTagged
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media File Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 block">Hình ảnh / Video review</label>
                
                {/* Media list preview */}
                {newPostMedia.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5">
                    {newPostMedia.map((url, index) => {
                      const isVideo = url && (url.endsWith(".mp4") || url.endsWith(".mov") || (url.includes("/uploads/") && !url.endsWith(".jpg") && !url.endsWith(".png") && !url.endsWith(".jpeg")));
                      return (
                        <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group border border-gray-100">
                          {isVideo ? (
                            <video src={url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => setNewPostMedia((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50 hover:border-[#FF4500] hover:text-[#FF4500] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF4500]" />
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        Tải ảnh hoặc video lên
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubmittingPost || isUploading}
                  onClick={handleCloseModal}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost || isUploading || !newPostContent.trim()}
                  className="flex-1 py-3 text-sm font-bold text-white rounded-xl hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
                >
                  {isSubmittingPost ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editingPost ? "Lưu thay đổi" : "Đăng bài viết"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
