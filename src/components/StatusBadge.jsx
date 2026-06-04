const STATUS_CONFIG = {
  pending_review: { label: '待审方', color: '#e6a23c', bg: '#fdf6ec' },
  approved: { label: '已审方', color: '#67c23a', bg: '#f0f9eb' },
  rejected: { label: '已驳回', color: '#f56c6c', bg: '#fef0f0' },
  pending: { label: '待煎药', color: '#909399', bg: '#f4f4f5' },
  processing: { label: '煎药中', color: '#409eff', bg: '#ecf5ff' },
  completed: { label: '已完成', color: '#67c23a', bg: '#f0f9eb' },
  labeled: { label: '已贴标', color: '#409eff', bg: '#ecf5ff' },
  ready_ship: { label: '待配送', color: '#e6a23c', bg: '#fdf6ec' },
  shipping: { label: '配送中', color: '#409eff', bg: '#ecf5ff' },
  delivered: { label: '已签收', color: '#67c23a', bg: '#f0f9eb' },
  returned: { label: '已退回', color: '#f56c6c', bg: '#fef0f0' },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#909399', bg: '#f4f4f5' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 500,
      color: cfg.color,
      background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  )
}

export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label || status
}

export default STATUS_CONFIG
