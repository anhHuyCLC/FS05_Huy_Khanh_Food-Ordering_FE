import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "../../types/chat.types";
import { chatService } from "../../services/chat.service";
import { toast } from "sonner";

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
  toggleChat: () => void;
  addMessage: (content: string, role: Message["role"]) => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isOpen: false,

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (content, role) => {
    const newMessage: Message = {
      id: uuidv4(),
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  sendMessage: async (content: string) => {
    const { messages, addMessage } = get();

    // 1. Optimistic UI update (add user message instantly)
    addMessage(content, "user");
    set({ isLoading: true });

    try {
      // 2. Format history for API contract (excluding the one we just optimistically added)
      // Filter out any messages with missing/empty content to avoid validation errors
      const history = messages
        .filter((m) => m.content && m.content.trim() !== "")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // 3. Prevent duplicate requests by relying on isLoading lock, then fetch
      const response = await chatService.sendMessage({
        message: content,
        history,
      });

      console.log("[Chat] API Response:", response);

      if (response.success && response.answer) {
        addMessage(response.answer, "assistant");
      } else {
        throw new Error("API returned failure");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      console.error("Chat Error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearHistory: () => set({ messages: [] }),
}));
