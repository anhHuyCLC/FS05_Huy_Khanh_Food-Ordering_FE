import React from "react";
import { Shield } from "lucide-react";
import type { FraudAlert } from "../../services/adminService";

interface KPIStatCardProps {
  label: string;
  value: string;
  sub: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
  color: string;
}

export function KPIStatCard({
  label,
  value,
  sub,
  change,
  up,
  icon: Icon,
  color,
}: KPIStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
      <span className={`text-xs font-semibold ${up ? "text-green-500" : "text-red-400"}`}>
        {change}
      </span>
    </div>
  );
}

interface FraudAlertsWidgetProps {
  fraudAlerts: FraudAlert[];
  t: (key: string) => string;
  onInvestigate: (alert: FraudAlert) => void;
}

export function FraudAlertsWidget({
  fraudAlerts,
  t,
  onInvestigate,
}: FraudAlertsWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <h2 className="font-bold text-gray-900 text-sm">{t('admin.fraud_alerts')}</h2>
        </div>
        {fraudAlerts.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-500">
            {fraudAlerts.length} {t('admin.alerts')}
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {fraudAlerts.slice(0, 2).map((alert) => (
          <div key={alert.id} className="p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-semibold text-gray-800">{alert.type}</p>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  alert.risk === "High" ? "bg-red-100 text-red-500" : "bg-yellow-100 text-yellow-600"
                }`}
              >
                {alert.risk}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{alert.detail}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{alert.time}</span>
              <button
                onClick={() => onInvestigate(alert)}
                className="text-xs font-semibold text-red-500 hover:underline"
              >
                {t('admin.investigate')}
              </button>
            </div>
          </div>
        ))}
        {fraudAlerts.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">
            Hệ thống bảo mật an toàn. Không có cảnh báo.
          </div>
        )}
      </div>
    </div>
  );
}
