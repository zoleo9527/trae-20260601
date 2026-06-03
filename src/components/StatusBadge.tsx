export function StatusBadge({ status }: { status: string }) {
  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_production: '生产中',
    production_completed: '生产完成',
    ready_for_dispatch: '待发货',
    completed: '已完成',
    cancelled: '已取消',
    scheduled: '待生产',
    in_progress: '生产中',
    dispatched: '配送中',
    received: '已收货',
  };

  return (
    <span className={`status-badge status-${status}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export function AnomalyStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function GroupBadge({ name }: { name: string }) {
  return (
    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
      {name}
    </span>
  );
}

export function UrgentBadge({ isUrgent }: { isUrgent: boolean }) {
  if (!isUrgent) return null;
  return <span className="urgent-badge">加急</span>;
}

export function AllergenBadge({ allergens }: { allergens: string }) {
  if (!allergens || allergens === '无') return null;
  return <span className="allergen-badge">⚠️ {allergens}</span>;
}
