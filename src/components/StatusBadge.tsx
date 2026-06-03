export function StatusBadge({ status }: { status: string }) {
  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_production: '生产中',
    completed: '已完成',
    cancelled: '已取消',
    scheduled: '待生产',
    in_progress: '生产中',
    dispatched: '已发货',
    received: '已收货',
  };

  return (
    <span className={`status-badge status-${status}`}>
      {statusLabels[status] || status}
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
