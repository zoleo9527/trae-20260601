import type { BanquetStatus, Priority, ChangeType, ImpactScope } from '@shared/types';
import { getChangeTypeLabel, getPriorityLabel, getImpactScopeLabel } from '@/utils/compareUtils';

const statusConfig: Record<BanquetStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
  pending: { label: '待确认', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', className: 'bg-forest-100 text-forest-700' },
  modified: { label: '已变更', className: 'bg-wine-100 text-wine-700' },
  finalized: { label: '已定稿', className: 'bg-champagne-100 text-champagne-700' },
};

const priorityConfig: Record<Priority, { label: string; className: string; dotClass: string }> = {
  low: { label: '低', className: 'bg-gray-100 text-gray-600', dotClass: 'bg-gray-400' },
  medium: { label: '中', className: 'bg-blue-100 text-blue-700', dotClass: 'bg-blue-500' },
  high: { label: '高', className: 'bg-amber-100 text-amber-700', dotClass: 'bg-amber-500' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-700', dotClass: 'bg-red-500 animate-pulse-slow' },
};

const changeTypeIcons: Record<ChangeType, string> = {
  hall: '🏛️',
  table_count: '📊',
  table_layout: '🪑',
  equipment: '🎥',
  material: '📦',
  children_chair: '👶',
  other: '📝',
};

export function StatusBadge({ status }: { status: BanquetStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`}></span>
      {config.label}优先级
    </span>
  );
}

export function ChangeTypeBadge({ type }: { type: ChangeType }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-wine-50 text-wine-700 border border-wine-200">
      <span>{changeTypeIcons[type]}</span>
      {getChangeTypeLabel(type)}
    </span>
  );
}

export function ImpactScopeBadge({ scope }: { scope: ImpactScope }) {
  const config: Record<ImpactScope, { label: string; className: string }> = {
    hall: { label: '厅面', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    kitchen: { label: '后厨', className: 'bg-forest-50 text-forest-700 border-forest-200' },
    both: { label: '厅面+后厨', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config[scope].className}`}>
      {getImpactScopeLabel(scope)}
    </span>
  );
}

export function MaterialStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: '待确认', className: 'bg-gray-100 text-gray-600' },
    confirmed: { label: '已确认', className: 'bg-forest-100 text-forest-700' },
    shortage: { label: '缺货', className: 'bg-red-100 text-red-700' },
    prepared: { label: '已准备', className: 'bg-champagne-100 text-champagne-700' },
  };
  const cfg = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
