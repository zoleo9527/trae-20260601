const STATUS_COLORS = {
  pending_belayer: { bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
  belayer_confirmed: { bg: '#e3f2fd', text: '#1565c0', border: '#bbdefb' },
  approved: { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
  rejected: { bg: '#ffebee', text: '#c62828', border: '#ffcdd2' },
  pending_confirm: { bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
  confirmed: { bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
  closed: { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' },
}

export default function StatusBadge({ status, label }) {
  const colors = STATUS_COLORS[status] || { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' }

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 12px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 500,
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    }}>
      {label}
    </span>
  )
}
