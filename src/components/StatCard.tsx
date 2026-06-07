import { DollarSign, Droplets, Users, FileText } from 'lucide-react';
import type { DiscrepancySummary, DiscrepancyType } from '@/types';

interface StatCardProps {
  summary: DiscrepancySummary;
}

const iconMap: Record<DiscrepancyType, React.ReactNode> = {
  cash: <DollarSign className="w-6 h-6" />,
  oil: <Droplets className="w-6 h-6" />,
  member: <Users className="w-6 h-6" />,
  invoice: <FileText className="w-6 h-6" />,
};

const colorMap: Record<DiscrepancyType, { bg: string; text: string; ring: string }> = {
  cash: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  oil: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  member: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
  invoice: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
};

export default function StatCard({ summary }: StatCardProps) {
  const colors = colorMap[summary.type];
  
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{summary.typeName}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{summary.count}</span>
            <span className="text-sm text-gray-500">项差异</span>
          </div>
          <p className="mt-1 text-sm">
            <span className={`font-semibold ${colors.text}`}>
              {summary.type === 'cash' ? '¥' : ''}{summary.amount}{summary.unit}
            </span>
          </p>
        </div>
        <div className={`${colors.bg} ${colors.ring} ring-8 p-3 rounded-xl`}>
          <div className={colors.text}>{iconMap[summary.type]}</div>
        </div>
      </div>
    </div>
  );
}
