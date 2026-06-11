import React from 'react'

const MAP = {
  pending_dispatch: { label: '待派发',       cls: 'status-pending' },
  dispatched:       { label: '已派发待整改', cls: 'status-warn' },
  rectified:        { label: '待复检',       cls: 'status-info' },
  rejected:         { label: '已驳回待补录', cls: 'status-danger' },
  passed:           { label: '复检通过',     cls: 'status-success' }
}

export default function StatusBadge({ status }) {
  const m = MAP[status] || { label: status, cls: '' }
  return <span className={'status-badge ' + m.cls}>{m.label}</span>
}
