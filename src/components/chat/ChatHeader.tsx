import React from "react";
import { X, Bot, Trash2 } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
  onClear: () => void;
  hasMessages: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose, onClear, hasMessages }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl shadow-sm z-10">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-orange-500 shadow-sm flex items-center justify-center">
          <Bot size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Food Assistant</h3>
          <p className="text-xs text-green-500 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 block animate-pulse" />
            Always Online
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {hasMessages && (
          <button 
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
