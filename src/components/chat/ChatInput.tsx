import React, { useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = React.useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      // Reset height
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl z-10">
      <div className={twMerge(
        "relative flex items-end shadow-sm border rounded-2xl bg-gray-50 dark:bg-gray-800 transition-all",
        "border-gray-200 dark:border-gray-700",
        "focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500"
      )}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask about our menu..."
          className="w-full max-h-[120px] bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 p-3.5 pr-12 rounded-2xl resize-none focus:outline-none text-[15px] min-h-[50px]"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={twMerge(
            "absolute right-2 bottom-2 p-2 rounded-xl transition-all flex items-center justify-center",
            input.trim() && !disabled 
              ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md transform hover:scale-105 active:scale-95" 
              : "text-gray-400 bg-transparent cursor-not-allowed"
          )}
        >
          {disabled ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={input.trim() && !disabled ? "ml-0.5" : ""} />}
        </button>
      </div>
      <div className="text-center mt-2.5">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          Press <kbd className="font-sans bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">Enter</kbd> to send, <kbd className="font-sans bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">Shift + Enter</kbd> for new line
        </span>
      </div>
    </div>
  );
};
