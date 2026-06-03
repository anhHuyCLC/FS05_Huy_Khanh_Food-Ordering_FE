export const statusColors: Record<string, { color: string; bg: string }> = {
  delivered: { color: "#10B981", bg: "#F0FDF4" },
  on_way: { color: "#6366F1", bg: "#EEF2FF" },
  preparing: { color: "#F59E0B", bg: "#FFFBEB" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2" },
  completed: { color: "#10B981", bg: "#F0FDF4" },
  pending: { color: "#6366F1", bg: "#EEF2FF" },
  accepted: { color: "#F59E0B", bg: "#FFFBEB" },
  ready: { color: "#10B981", bg: "#F0FDF4" },
  delivering: { color: "#10B981", bg: "#F0FDF4" },
};

export const formatMoney = (amount: number | string | null | undefined) => {
  const numericAmount = Number(amount || 0);
  if (numericAmount >= 1000) {
    return `${numericAmount.toLocaleString("vi-VN")}đ`;
  }
  return `$${numericAmount.toFixed(2)}`;
};
