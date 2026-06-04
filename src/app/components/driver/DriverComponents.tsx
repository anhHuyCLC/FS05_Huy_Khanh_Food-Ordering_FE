import React, { useState, useEffect } from "react";
import { MapPin, History } from "lucide-react";
import type { Order, EarningsPeriod } from "../../types/driver";

export function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px flex-1 bg-neutral-100" />
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-400">
        {children}
      </span>
      <span className="h-px flex-1 bg-neutral-100" />
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = "orange",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: "orange" | "sky" | "violet" | "emerald";
  icon?: React.ElementType;
}) {
  const styles = {
    orange: {
      border: "border-l-orange-500",
      bg: "bg-orange-50",
      ic: "text-orange-600",
    },
    sky: { border: "border-l-sky-500", bg: "bg-sky-50", ic: "text-sky-600" },
    violet: {
      border: "border-l-violet-500",
      bg: "bg-violet-50",
      ic: "text-violet-600",
    },
    emerald: {
      border: "border-l-emerald-500",
      bg: "bg-emerald-50",
      ic: "text-emerald-600",
    },
  }[accent];
  return (
    <div
      className={`bg-white border border-neutral-100 border-l-4 ${styles.border} rounded-xl p-4 flex items-center justify-between gap-3 hover:shadow-md transition-shadow`}
    >
      <div className="min-w-0">
        <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-neutral-400 truncate">
          {label}
        </p>
        <p className="mt-1.5 text-3xl font-black text-neutral-900 leading-none">
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-[10px] text-neutral-400 truncate">{sub}</p>
        )}
      </div>
      {Icon && (
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${styles.bg} ${styles.ic}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire: () => void;
}) {
  const [secs, setSecs] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const targetTime = new Date(expiresAt).getTime();
    const initial = Number.isFinite(targetTime)
      ? Math.max(Math.floor((targetTime - Date.now()) / 1000), 0)
      : 0;

    const timer = setTimeout(() => {
      setSecs(initial);
      setTotal(initial);
    }, 0);

    return () => clearTimeout(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (secs <= 0) {
      const targetTime = new Date(expiresAt).getTime();
      if (Number.isFinite(targetTime) && targetTime <= Date.now()) {
        onExpire();
      }
      return;
    }

    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(id);
          onExpire();
          return 0;
        }

        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [secs, onExpire, expiresAt]);

  const pct = total > 0 ? (secs / total) * 100 : 0;

  const color =
    secs > 10
      ? "#10B981"
      : secs > 5
      ? "#F59E0B"
      : "#EF4444";

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[9px] font-bold mb-1">
        <span style={{ color }}>
          ⏱ {secs}s còn lại
        </span>

        <span className="text-neutral-400">
          Tự từ chối khi hết giờ
        </span>
      </div>

      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export function AvailableOrderCard({
  order,
  onAccept,
  onReject,
  onExpire,
  t,
}: {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  onExpire: () => void;
  t: (k: string) => string;
}) {
  const itemCount = order.orderItems?.length ?? 0;
  const isCOD = order.payment?.[0]?.method === "cash";
  return (
    <div className="group bg-white border border-neutral-100 rounded-xl overflow-hidden hover:border-orange-200 hover:shadow-md transition-all">
      <div className="h-0.5 bg-linear-to-r from-orange-500 via-amber-400 to-orange-300" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <h3 className="text-xs font-bold text-neutral-900 truncate">
                {order.restaurant?.name ?? "—"}
              </h3>
            </div>
            {order.deliveryAddress && (
              <p className="text-[10px] text-neutral-500 flex items-center gap-1 truncate">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                {order.deliveryAddress}
              </p>
            )}
            {order.customer?.fullName && (
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {order.customer.fullName}
              </p>
            )}
            {itemCount > 0 && (
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {itemCount} {t("driver_dashboard.items")}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-orange-600">
              {order.finalAmount?.toLocaleString("vi-VN")}đ
            </p>
            {isCOD && (
              <div className="mt-1 flex flex-col items-end">
                <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Đơn COD</span>
                <p className="text-[10px] text-red-500 font-medium mt-0.5">Thu khách: {order.finalAmount?.toLocaleString("vi-VN")}đ</p>
              </div>
            )}
          </div>
        </div>
        {order.assignmentExpiresAt && (
          <CountdownTimer
            key={order.assignmentExpiresAt}
            expiresAt={order.assignmentExpiresAt}
            onExpire={onExpire}
          />
        )}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onAccept}
            className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 py-1.5 text-[10px] font-bold text-white transition-all"
          >
            {t("driver_dashboard.accept")}
          </button>
          <button
            onClick={onReject}
            className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 active:scale-95 py-1.5 text-[10px] font-bold text-neutral-600 transition-all"
          >
            {t("driver_dashboard.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActiveOrderCard({
  order,
  onUpdate,
  t,
}: {
  order: Order;
  onUpdate: (s: string) => void;
  t: (k: string) => string;
}) {
  const isCOD = order.payment?.[0]?.method === "cash";
  const steps = [
    {
      key: "picked_up",
      emoji: "📦",
      label: t("driver_dashboard.mark_picked_up"),
      activeCls: "bg-sky-500 text-white border-sky-500",
      inactiveCls: "border-sky-100 text-sky-700 bg-sky-50 hover:bg-sky-100",
      disabled: order.status !== "ready",
    },
    {
      key: "delivering",
      emoji: "🚗",
      label: t("driver_dashboard.mark_delivering"),
      activeCls: "bg-amber-500 text-white border-amber-500",
      inactiveCls:
        "border-amber-100 text-amber-700 bg-amber-50 hover:bg-amber-100",
      disabled: order.status !== "ready" && order.status !== "delivering",
    },
    {
      key: "completed",
      emoji: "✅",
      label: t("driver_dashboard.mark_completed"),
      activeCls: "bg-emerald-600 text-white border-emerald-600",
      inactiveCls:
        "border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
      disabled: order.status !== "delivering",
    },
  ];

  const statusLabels: Record<string, string> = {
    accepted: "Đã nhận đơn",
    preparing: "Đang chuẩn bị",
    ready: "Món đã sẵn sàng",
    delivering: "Đang giao hàng",
    completed: "Đã hoàn thành",
    cancelled: "Đã huỷ",
  };

  const badgeMap: Record<string, string> = {
    accepted: "bg-blue-50 text-blue-600 border border-blue-200/50",
    preparing: "bg-amber-50 text-amber-600 border border-amber-200/50",
    ready: "bg-indigo-50 text-indigo-600 border border-indigo-200/50",
    delivering: "bg-orange-50 text-orange-600 border border-orange-200/50",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-200/50",
    cancelled: "bg-red-50 text-red-600 border border-red-200/50",
  };

  const statusEmoji: Record<string, string> = {
    accepted: "🤝",
    preparing: "🍳",
    ready: "🍱",
    delivering: "🚴",
    completed: "✅",
    cancelled: "❌",
  };

  return (
    <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-neutral-900 truncate">
            {order.restaurant?.name ?? "—"}
          </h3>
          {order.deliveryAddress && (
            <p className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {order.deliveryAddress}
            </p>
          )}
          {order.customer?.fullName && (
            <p className="text-[10px] text-neutral-400 truncate">
              {order.customer.fullName} · {order.customer.phone}
            </p>
          )}
          {isCOD && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Đơn COD</span>
              <p className="text-[10px] text-red-600 font-bold">Cần thu: {order.finalAmount?.toLocaleString("vi-VN")}đ</p>
            </div>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${badgeMap[order.status] ?? "bg-neutral-100 text-neutral-600"}`}
        >
          {statusEmoji[order.status] ?? "⏳"} {statusLabels[order.status] ?? order.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-neutral-100 border-t border-neutral-100">
        {steps.map(({ key, emoji, label, activeCls, inactiveCls, disabled }) => (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onUpdate(key)}
            className={`py-1.5 text-[9px] font-bold border transition-all ${
              disabled
                ? "bg-neutral-50 border-neutral-100 text-neutral-300 cursor-not-allowed opacity-50"
                : order.status === key
                ? activeCls
                : `bg-white ${inactiveCls}`
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-100 py-8 text-center">
      <Icon className="w-7 h-7 text-neutral-200 mb-2" />
      <p className="text-[10px] text-neutral-400">{text}</p>
    </div>
  );
}

export function EarningPeriodFilter({
  period,
  onChange,
}: {
  period: EarningsPeriod;
  onChange: (p: EarningsPeriod) => void;
}) {
  return (
    <div className="flex gap-2 mb-4">
      {(["today", "week", "month"] as EarningsPeriod[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p ? "bg-emerald-500 text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}
        >
          {p === "today" ? "Hôm nay" : p === "week" ? "Tuần này" : "Tháng này"}
        </button>
      ))}
    </div>
  );
}

export function HistorySection({
  orders,
  loading,
  hasMore,
  onLoadMore,
}: {
  orders: Order[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const historyOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-neutral-50">
        <History className="w-4 h-4 text-neutral-500" />
        <h2 className="text-sm font-bold text-neutral-900">
          Lịch sử giao hàng
        </h2>
        <span className="ml-auto text-[10px] text-neutral-400">
          {historyOrders.length} đơn
        </span>
      </div>
      {historyOrders.length === 0 && !loading ? (
        <div className="py-10 text-center text-[10px] text-neutral-400">
          Chưa có đơn nào hoàn thành
        </div>
      ) : (
        <div className="divide-y divide-neutral-50">
          {historyOrders.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="w-8 h-8 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center text-base">
                {o.status === "completed" ? "✅" : "❌"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-800 truncate">
                  {o.restaurant?.name ?? "—"}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {o.deliveryAddress ?? "—"}
                </p>
                <p className="text-[9px] text-neutral-300">
                  {new Date(o.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-emerald-600">
                  +{Number(o.deliveryFee ?? 0).toLocaleString("vi-VN")}đ
                </p>
                <div className="flex flex-col items-end gap-1 mt-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                  >
                    {o.status}
                  </span>
                  {o.payment?.[0]?.method === "cash" && (
                    <span className="bg-red-100 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">COD</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div className="py-4 text-center text-[10px] text-neutral-400">
          Đang tải...
        </div>
      )}
      {hasMore && !loading && historyOrders.length > 0 && (
        <div className="p-4 border-t border-neutral-50">
          <button
            onClick={onLoadMore}
            className="w-full py-2 rounded-xl border border-neutral-200 text-[10px] font-bold text-neutral-500 hover:bg-neutral-50"
          >
            Xem thêm
          </button>
        </div>
      )}
    </div>
  );
}
