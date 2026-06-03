import { Link } from 'react-router-dom';
import { Clock, MapPin, Users, UtensilsCrossed, AlertTriangle, GitCompare, Calendar } from 'lucide-react';
import type { BanquetSummary } from '@shared/types';
import { StatusBadge } from './Badges';

const typeLabels: Record<string, { label: string; icon: string; gradient: string }> = {
  wedding: { label: '婚宴', icon: '💒', gradient: 'from-rose-100 to-pink-50' },
  annual: { label: '年会', icon: '🏢', gradient: 'from-blue-100 to-indigo-50' },
  birthday: { label: '寿宴', icon: '🎂', gradient: 'from-amber-100 to-orange-50' },
  other: { label: '其他', icon: '🎉', gradient: 'from-gray-100 to-gray-50' },
};

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
    time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function BanquetCard({ banquet, index }: { banquet: BanquetSummary; index: number }) {
  const typeConfig = typeLabels[banquet.type] || typeLabels.other;
  const { date, time } = formatDateTime(banquet.startTime);

  return (
    <Link
      to={`/banquet/${banquet.id}`}
      className="group block stagger-item"
      style={{ animationDelay: `${index * 0.1}s`, transform: 'translateY(20px)' }}
    >
      <div className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden border border-champagne-100 hover:border-champagne-300 hover:-translate-y-1 relative grain-overlay`}>
        <div className={`bg-gradient-to-r ${typeConfig.gradient} px-5 py-4 border-b border-champagne-100`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{typeConfig.icon}</span>
              <div>
                <span className="text-xs font-medium text-wine-600 bg-white/70 px-2 py-0.5 rounded-full">
                  {typeConfig.label}
                </span>
                <h3 className="font-display text-lg font-semibold text-gray-800 mt-1 line-clamp-1 group-hover:text-wine-800 transition-colors">
                  {banquet.name}
                </h3>
              </div>
            </div>
            <StatusBadge status={banquet.status} />
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-champagne-500 flex-shrink-0" />
              <span className="truncate">{date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-champagne-500 flex-shrink-0" />
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-champagne-500 flex-shrink-0" />
              <span className="truncate">{banquet.hall}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users size={16} className="text-champagne-500 flex-shrink-0" />
              <span>{banquet.guestCount}位宾客 · {banquet.tableCount}桌</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-champagne-100">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={14} className="text-wine-500" />
              <span className="text-xs text-gray-500">方案 v{banquet.currentVersion}</span>
            </div>

            {banquet.hasUnacknowledgedAlerts && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full animate-pulse-border">
                <AlertTriangle size={12} />
                <span className="text-xs font-medium">{banquet.highPriorityAlerts > 0 ? banquet.highPriorityAlerts : banquet.alertCount} 项变更</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-wine-600 group-hover:text-wine-800 transition-colors">
              <GitCompare size={14} />
              <span className="text-xs font-medium">查看详情</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
