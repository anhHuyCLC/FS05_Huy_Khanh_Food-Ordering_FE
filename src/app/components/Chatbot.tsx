import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import './Chatbot.css';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, loading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hàm tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !loading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="status-dot"></span>
              <h3>FoodOrdering Trợ Lý AI</h3>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close Chat">
              &times;
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="chatbot-empty">
                <p>👋 Xin chào! Tôi là trợ lý AI của FoodOrdering.</p>
                <p>Tôi có thể giúp bạn tìm món ăn, giải đáp thắc mắc về đơn hàng, v.v. Hãy đặt câu hỏi nhé!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`message-wrapper ${msg.role === 'user' ? 'user' : 'ai'}`}
                >
                  <div className="message-content">
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="message-wrapper ai">
                <div className="message-content typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            
            {/* Element rỗng dùng để neo scroll */}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Nhập tin nhắn của bạn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || loading}
              className="send-btn"
              aria-label="Send Message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button 
          className="chatbot-floating-btn" 
          onClick={() => setIsOpen(true)}
          aria-label="Open Chat"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
