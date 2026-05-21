import axios from "axios";
import type { ChatRequest, ChatResponse } from "../types/chat.types";

const CHAT_API_URL = "http://localhost:8000/api/v1/chat";

export const chatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await axios.post(CHAT_API_URL, request);
    // Backend wraps response as { success, data: { success, answer } }
    // axios also wraps in response.data, so actual payload is at response.data.data
    const payload = response.data?.data ?? response.data;
    return payload as ChatResponse;
  },
};
