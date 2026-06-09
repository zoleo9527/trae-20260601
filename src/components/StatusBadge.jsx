const statusConfig = {
  draft: { label: '草稿', className: 'status-draft' },
  pending_confirmation: { label: '待农技员确认', className: 'status-pending_confirmation' },
  confirmed: { label: '已确认待出库', className: 'status-confirmed' },
  pending_warehouse: { label: '待仓管出库', className: 'status-pending_warehouse' },
  completed: { label: '已完成', className: 'status-completed' },
  rejected: { label: '已退回', className: 'status-rejected' },
  cancelled: { label: '已取消', className: 'status-cancelled' },
  stock_insufficient: { label: '库存不足', className: 'status-stock_insufficient' },
};

const confirmationResultConfig = {
  available: { label: '可用', className: 'bg-green-100 text-green-800' },
  caution: { label: '慎用', className: 'bg-yellow-100 text-yellow-800' },
  prohibited: { label: '禁用', className: 'bg-red-100 text-red-800' },
};

export default function StatusBadge({ status, type = 'sales' }) {
  const config = type === 'confirmation'
    ? confirmationResultConfig[status]
    : statusConfig[status];

  if (!config) return null;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
