import { DollarSign, Droplets, Users, FileText } from 'lucide-react';
import type { Discrepancy, DiscrepancyType } from '@/types';

interface DiscrepancyTabsProps {
  discrepancies: Discrepancy[];
  activeType: DiscrepancyType | 'all';
  onTypeChange: (type: DiscrepancyType | 'all') => void;
}

const typeConfig: Array<{ type: DiscrepancyType | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { type: 'all', label: '全部', icon: FileText },
  { type: 'cash', label: '现金', icon: DollarSign },
  { type: 'oil', label: '油品', icon: Droplets },
  { type: 'member', label: '会员', icon: Users },
  { type: 'invoice', label: '发票', icon: FileText },
];

export default function DiscrepancyTabs({ discrepancies, activeType, onTypeChange }: DiscrepancyTabsProps) {
  const getCount = (type: DiscrepancyType | 'all') => {
    if (type === 'all') return discrepancies.length;
    return discrepancies.filter((d) => d.type === type).length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="border-b border-gray-100">
        <nav className="flex overflow-x-auto">
          {typeConfig.map(({ type, label, icon: Icon }) => {
            const isActive = activeType === type;
            const count = getCount(type);
            return (
              <button
                key={type}
                onClick={() => onTypeChange(type)}
                className={`tab-item flex items-center gap-2 whitespace-nowrap ${
                  isActive ? 'tab-item-active' : 'tab-item-inactive'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive ? 'bg-primary-100 text-primary-900' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
