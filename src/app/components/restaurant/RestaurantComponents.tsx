import React from "react";
import { Plus } from "lucide-react";
import type { ComboSuggestion } from "../../types/restaurant";

interface KPIStatCardProps {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
  color: string;
  t: (key: string) => string;
}

export function KPIStatCard({
  label,
  value,
  change,
  up,
  icon: Icon,
  color
}: KPIStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-500">{label}</span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
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

interface ComboSuggestionsWidgetProps {
  loadingCombos: boolean;
  comboSuggestions: ComboSuggestion[];
  formatMoney: (amount: number | string) => string;
  onSelectCombo: (combo: ComboSuggestion) => void;
}

export function ComboSuggestionsWidget({
  loadingCombos,
  comboSuggestions,
  formatMoney,
  onSelectCombo,
}: ComboSuggestionsWidgetProps) {
  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <div>
          <h3 className="font-bold text-gray-900 text-base">
            Gợi ý Combo từ Trí tuệ Nhân tạo (AI)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Hệ thống phân tích lịch sử đơn hàng của khách hàng để tự động đề xuất kết hợp các món ăn bán chạy cùng nhau.
          </p>
        </div>
      </div>

      {loadingCombos ? (
        <div className="flex items-center justify-center h-32 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : comboSuggestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-xs shadow-sm">
          Chưa có đủ dữ liệu lịch sử đơn hàng để phân tích gợi ý combo.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {comboSuggestions.map((combo, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between h-52 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="font-bold text-sm text-gray-800 line-clamp-1">
                    {combo.name}
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 shrink-0 capitalize">
                    {combo.reason}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {combo.items?.map((item, itemIdx) => (
                    <div
                      key={item.id || itemIdx}
                      className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-xl border border-gray-100 text-xs"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-5 h-5 rounded-md object-cover shrink-0"
                        />
                      )}
                      <span className="font-medium text-gray-700 truncate max-w-20">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-50 pt-3 flex justify-between items-center mt-3">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">
                    Tổng giá trị combo
                  </p>
                  <p className="text-sm font-black text-orange-500 mt-0.5">
                    {formatMoney(combo.totalPrice)}
                  </p>
                </div>
                <button
                  onClick={() => onSelectCombo(combo)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-xs font-semibold border border-orange-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo khuyến mãi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
