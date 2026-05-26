import { useEffect, useState } from "react";
import type { ToastItem, ToastType } from "./usetoast";

/* ─── Icon per type ──────────────────────────────────────────────────────── */
function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success")
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4.5 7.5l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (type === "error")
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 5l5 5M10 5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  if (type === "warning")
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M7.5 1.5L13.5 13H1.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M7.5 6v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="7.5" cy="10.5" r="0.6" fill="currentColor" />
      </svg>
    );
  // info
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7.5 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="7.5" cy="4.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/* ─── Style map ──────────────────────────────────────────────────────────── */
const STYLE: Record<ToastType, { bar: string; icon: string; text: string; bg: string; border: string; close: string }> = {
  success: {
    bar:    "bg-emerald-500",
    icon:   "text-emerald-600",
    text:   "text-emerald-900",
    bg:     "bg-white",
    border: "border-emerald-200",
    close:  "text-emerald-400 hover:text-emerald-700",
  },
  error: {
    bar:    "bg-red-500",
    icon:   "text-red-600",
    text:   "text-red-900",
    bg:     "bg-white",
    border: "border-red-200",
    close:  "text-red-400 hover:text-red-700",
  },
  warning: {
    bar:    "bg-amber-400",
    icon:   "text-amber-600",
    text:   "text-amber-900",
    bg:     "bg-white",
    border: "border-amber-200",
    close:  "text-amber-400 hover:text-amber-700",
  },
  info: {
    bar:    "bg-sky-500",
    icon:   "text-sky-600",
    text:   "text-sky-900",
    bg:     "bg-white",
    border: "border-sky-200",
    close:  "text-sky-400 hover:text-sky-700",
  },
};

/* ─── Single toast ───────────────────────────────────────────────────────── */
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const s = STYLE[item.type];

  // mount → trigger slide-in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onDismiss, 280); // wait for slide-out
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        transform: visible ? "translateX(0)" : "translateX(calc(100% + 24px))",
        opacity: visible ? 1 : 0,
        transition: "transform 0.28s cubic-bezier(0.34,1.26,0.64,1), opacity 0.22s ease",
        willChange: "transform, opacity",
      }}
      className={`relative flex items-start gap-3 w-[320px] max-w-[calc(100vw-32px)]
        rounded-xl border shadow-lg shadow-neutral-900/8 overflow-hidden
        ${s.bg} ${s.border} pl-4 pr-3 py-3`}
    >
      {/* left colour bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${s.bar}`} />

      {/* icon */}
      <span className={`shrink-0 mt-[1px] ${s.icon}`}>
        <ToastIcon type={item.type} />
      </span>

      {/* message */}
      <p className={`flex-1 text-[12.5px] leading-[1.5] font-medium ${s.text}`}>
        {item.message}
      </p>

      {/* close */}
      <button
        onClick={handleClose}
        aria-label="Đóng thông báo"
        className={`shrink-0 text-[17px] leading-none mt-[-1px] transition-colors ${s.close}`}
      >
        ×
      </button>

      {/* progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 overflow-hidden">
        <div
          className={`h-full ${s.bar} opacity-40`}
          style={{
            animation: "toastProgress 3.5s linear forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Container (fixed, top-right) ──────────────────────────────────────── */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Thông báo"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastCard item={item} onDismiss={() => onDismiss(item.id)} />
        </div>
      ))}
    </div>
  );
}