export const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "New Order", color: "#6366F1", bg: "#EEF2FF" },
  accepted: { label: "Accepted", color: "#F59E0B", bg: "#FFFBEB" },
  preparing: { label: "Preparing", color: "#F59E0B", bg: "#FFFBEB" },
  ready: { label: "Ready", color: "#10B981", bg: "#F0FDF4" },
  delivering: { label: "Delivering", color: "#10B981", bg: "#F0FDF4" },
  completed: { label: "Completed", color: "#10B981", bg: "#F0FDF4" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
};

export function timeAgo(dateStr: string, t: (key: string) => string): string {
  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return t("common.just_now") || "Vừa xong";
  if (diffMin < 60)
    return `${diffMin} ${t("restaurant_dashboard.minutes_ago") || "phút trước"}`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24)
    return `${diffHour} ${t("restaurant_dashboard.hours_ago") || "giờ trước"}`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ${t("restaurant_dashboard.days_ago") || "ngày trước"}`;
}
