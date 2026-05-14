import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, BookmarkPlus, Search, Trophy, TrendingUp, Star } from "lucide-react";
import { IMGS } from "../../data/mock";
import { useTranslation } from "react-i18next";

const posts = [
  {
    id: 1,
    user: { name: "Mia Tanaka", handle: "@mia.eats", avatar: "MT", verified: true },
    content: "Discovered the most insane tonkotsu ramen at Ramen House last night 🍜 The broth was simmered for 20 hours — you can taste every single one of them. Absolute perfection.",
    image: IMGS.ramen,
    restaurant: "Ramen House",
    likes: 12400,
    comments: 342,
    shares: 89,
    rating: 5,
    saved: false,
    liked: false,
    time: "2h ago",
  },
  {
    id: 2,
    user: { name: "James Olivier", handle: "@foodiedaddy", avatar: "JO", verified: false },
    content: "Sunday brunch goals 😍 This smash burger from Burger Republic hits differently on weekends. The secret sauce is literally ADDICTIVE. 10/10 no notes.",
    image: IMGS.burger,
    restaurant: "Burger Republic",
    likes: 8900,
    comments: 201,
    shares: 45,
    rating: 5,
    saved: false,
    liked: true,
    time: "5h ago",
  },
  {
    id: 3,
    user: { name: "Priya Sharma", handle: "@spicequeen", avatar: "PS", verified: true },
    content: "Green Bowl's new Buddha Bowl is speaking to my soul ✨ Quinoa, roasted chickpeas, avocado, and a tahini drizzle that dreams are made of. Perfect for meal prepping vibes.",
    image: IMGS.salad,
    restaurant: "Green Bowl",
    likes: 6200,
    comments: 178,
    shares: 32,
    rating: 4,
    saved: true,
    liked: false,
    time: "1d ago",
  },
  {
    id: 4,
    user: { name: "Leo Costa", handle: "@leo.bites", avatar: "LC", verified: false },
    content: "The tiramisu at Sweet Dreams is ILLEGAL 🍰 Criminally good. I ordered three in one week and I have zero regrets. My wallet regrets it but not me.",
    image: IMGS.dessert,
    restaurant: "Sweet Dreams",
    likes: 15100,
    comments: 589,
    shares: 234,
    rating: 5,
    saved: false,
    liked: false,
    time: "2d ago",
  },
];

const leaderboard = [
  { rank: 1, name: "Mia Tanaka", handle: "@mia.eats", avatar: "MT", posts: 142, followers: "48K", badge: "🥇" },
  { rank: 2, name: "Leo Costa", handle: "@leo.bites", avatar: "LC", posts: 118, followers: "31K", badge: "🥈" },
  { rank: 3, name: "Priya Sharma", handle: "@spicequeen", avatar: "PS", posts: 97, followers: "27K", badge: "🥉" },
  { rank: 4, name: "James Olivier", handle: "@foodiedaddy", avatar: "JO", posts: 84, followers: "22K", badge: "4" },
  { rank: 5, name: "Ana Lima", handle: "@ana.taste", avatar: "AL", posts: 76, followers: "18K", badge: "5" },
];

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export default function Community() {
  const navigate = useNavigate();
  const [postStates, setPostStates] = useState<Record<number, { liked: boolean; saved: boolean }>>(
    Object.fromEntries(posts.map((p) => [p.id, { liked: p.liked, saved: p.saved }]))
  );
  const { t } = useTranslation();
  const communityTabs = [t('community.for_you'), t('community.following'), t('community.trending'), t('community.near_you')];

  const toggle = (id: number, key: "liked" | "saved") => {
    setPostStates((s) => ({ ...s, [id]: { ...s[id], [key]: !s[id][key] } }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/explore")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">{t('community.food_community')}</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder={t('community.search_posts')} className="bg-transparent text-sm outline-none text-gray-600 w-36" />
          </div>
        </div>
        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-6 pb-3">
          <div className="flex gap-4">
            {communityTabs.map((t, i) => (
              <button key={t} className={`text-sm font-medium pb-2 border-b-2 transition-all ${i === 0 ? "text-[#FF4500] border-[#FF4500]" : "text-gray-500 border-transparent hover:text-gray-800"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-5">
          {posts.map((post) => {
            const state = postStates[post.id];
            return (
              <article key={post.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                {/* Post header */}
                <div className="flex items-center gap-3 p-5 pb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                    {post.user.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm">{post.user.name}</p>
                      {post.user.verified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-gray-400">{post.user.handle} · {post.time}</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-[#FF4500] transition-colors">
                    {t('community.follow')}
                  </button>
                </div>

                {/* Content */}
                <p className="px-5 pb-3 text-sm text-gray-700 leading-relaxed">{post.content}</p>

                {/* Image */}
                <div className="relative">
                  <img src={post.image} alt={post.content} className="w-full h-64 object-cover" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium text-white bg-black/40 backdrop-blur-sm border border-white/20">
                      📍 {post.restaurant}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(post.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-5 py-4">
                  <button
                    onClick={() => toggle(post.id, "liked")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${state.liked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <Heart className={`w-4 h-4 ${state.liked ? "fill-red-500" : ""}`} />
                    {formatNum(post.likes + (state.liked ? 1 : 0))}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all">
                    <MessageCircle className="w-4 h-4" /> {formatNum(post.comments)}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all">
                    <Share2 className="w-4 h-4" /> {t('community.shares')}
                  </button>
                  <button
                    onClick={() => toggle(post.id, "saved")}
                    className={`ml-auto p-2 rounded-xl transition-all ${state.saved ? "text-[#FF4500] bg-orange-50" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Sidebar: Leaderboard */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold text-gray-900">{t('community.leaderboard')}</h2>
            </div>
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div key={user.rank} className="flex items-center gap-3">
                  <div className="w-8 text-center font-bold text-lg">{user.badge}</div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.handle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-700">{user.followers}</p>
                    <p className="text-xs text-gray-400">{user.posts} {t('community.posts')}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              {t('community.view_full_leaderboard')}
            </button>
          </div>

          {/* Trending tags */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#FF4500]" />
              <h2 className="font-bold text-gray-900">{t('community.trending')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["#SushiVibes", "#BurgerNation", "#HealthyEats", "#RamenLife", "#CoffeeArt", "#StreetFood", "#DessertHeaven", "#PhoLover"].map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-orange-50 text-[#FF4500] cursor-pointer hover:bg-orange-100 transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Your Streak */}
          <div
            className="rounded-3xl p-5 text-white"
            style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
          >
            <p className="text-orange-100 text-sm mb-2">{t('community.posting_streak')}</p>
            <p className="text-4xl font-black">7 {t('common.days')}</p>
            <p className="text-orange-100 text-sm mt-1">{t('community.streak_hint')}</p>
            <div className="flex gap-1 mt-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 h-2 rounded-full bg-white/60" />
              ))}
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 h-2 rounded-full bg-white/20" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
