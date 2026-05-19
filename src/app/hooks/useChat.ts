import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '../services/apiClient';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Khởi tạo hoặc lấy sessionId từ localStorage
    let currentSessionId = localStorage.getItem('chat_session_id');
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      localStorage.setItem('chat_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Gọi API lấy lịch sử chat
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get(`/chat/history/${currentSessionId}`);

        if (res.status == 200) {
          const data = res.data;
          // Tương thích với các định dạng trả về khác nhau của Backend (object chứa messages hoặc mảng trực tiếp)
          if (data && data.messages) {
            setMessages(data.messages);
          } else if (Array.isArray(data)) {
            setMessages(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history', error);
      }
    };

    fetchHistory();
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId) return;

    // 1. Thêm tin nhắn user vào state ngay lập tức để hiển thị
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // 2. Gửi request tới Backend
    try {
      const res = await apiClient.post('/chat', {
        sessionId,
        message: content,
      });

      if (res.status == 200) {
        const data = res.data;
        const aiMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: data.reply || data.response || data.message || 'Xin lỗi, tôi không thể trả lời lúc này.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error('Lỗi phản hồi từ server');
      }
    } catch (error) {
      console.error('Failed to send message', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Đã có lỗi xảy ra khi kết nối. Vui lòng thử lại sau.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    sessionId,
    sendMessage,
  };
};
