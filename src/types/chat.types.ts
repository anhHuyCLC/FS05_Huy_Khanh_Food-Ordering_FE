export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  history: { role: MessageRole; content: string }[];
}

export interface ChatResponse {
  success: boolean;
  answer: string;
}
