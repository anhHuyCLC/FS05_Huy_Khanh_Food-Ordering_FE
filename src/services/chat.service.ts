import apiClient from "../app/services/apiClient";
import type { ChatRequest, ChatResponse } from "../types/chat.types";

export const chatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post("/v1/chat", request);
    // Backend wraps response as { success, data: { success, answer } }
    // axios also wraps in response.data, so actual payload is at response.data.data
    const payload = response.data?.data ?? response.data;
    return payload as ChatResponse;
  },
};

