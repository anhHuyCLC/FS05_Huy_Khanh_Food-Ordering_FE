import apiClient from "./apiClient";

export interface SocialPost {
  id: string;
  content: string;
  mediaUrls?: string[];
  taggedItems?: { menuItemId: string; name: string }[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    avatarUrl: string | null;
    badgeLevel: string;
  };
  restaurant?: {
    id: string;
    name: string;
  } | null;
  liked: boolean;
  followed: boolean;
  isOwnPost?: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    avatarUrl: string | null;
  };
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  posts: number;
  followers: string;
  score: number;
  rank: number;
  badge: string;
}

const extractArray = <T>(resBody: unknown): T[] => {
  if (!resBody || typeof resBody !== "object") return [];
  if (Array.isArray(resBody)) return resBody as T[];
  
  const obj = resBody as Record<string, unknown>;
  if (obj.data) {
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (obj.data && typeof obj.data === "object") {
      const nested = obj.data as Record<string, unknown>;
      if (Array.isArray(nested.data)) return nested.data as T[];
    }
  }
  return [];
};

export const socialPostService = {
  getSocialPosts: async (tab: string): Promise<SocialPost[]> => {
    const response = await apiClient.get(`/v1/social-posts?tab=${tab}`);
    return extractArray<SocialPost>(response.data);
  },

  createSocialPost: async (data: {
    content: string;
    mediaUrls?: string[];
    restaurantId?: string;
    taggedItems?: { menuItemId: string; name: string }[];
  }): Promise<SocialPost> => {
    const response = await apiClient.post("/v1/social-posts", data);
    return response.data.data || response.data;
  },

  updateSocialPost: async (postId: string, data: {
    content: string;
    mediaUrls?: string[];
    restaurantId?: string;
    taggedItems?: { menuItemId: string; name: string }[];
  }): Promise<SocialPost> => {
    const response = await apiClient.patch(`/v1/social-posts/${postId}`, data);
    return response.data.data || response.data;
  },

  deleteSocialPost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/v1/social-posts/${postId}`);
  },

  likeSocialPost: async (postId: string): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await apiClient.post(`/v1/social-posts/${postId}/like`);
    return response.data.data || response.data;
  },

  addComment: async (postId: string, content: string): Promise<PostComment> => {
    const response = await apiClient.post(`/v1/social-posts/${postId}/comments`, { content });
    return response.data.data || response.data;
  },

  getComments: async (postId: string): Promise<PostComment[]> => {
    const response = await apiClient.get(`/v1/social-posts/${postId}/comments`);
    return extractArray<PostComment>(response.data);
  },

  shareSocialPost: async (postId: string): Promise<void> => {
    await apiClient.post(`/v1/social-posts/${postId}/share`);
  },

  toggleFollow: async (profileId: string): Promise<{ followed: boolean }> => {
    const response = await apiClient.post(`/v1/social-posts/users/${profileId}/follow`);
    return response.data.data || response.data;
  },

  reportPost: async (postId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/v1/social-posts/${postId}/report`, { reason });
    return response.data;
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    const response = await apiClient.get("/v1/social-posts/leaderboard");
    return extractArray<LeaderboardUser>(response.data);
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/v1/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const resData = response.data.data || response.data;
    return resData.url;
  },

  getSidebarStats: async (): Promise<{ trendingTags: string[]; postingStreak: number }> => {
    const response = await apiClient.get("/v1/social-posts/stats");
    return response.data;
  },
};
