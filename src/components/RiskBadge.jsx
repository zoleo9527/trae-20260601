import React from 'react'

const MAP = {
  high:   { label: '高风险', cls: 'risk-high',   icon: '🔴' },
  medium: { label: '中风险', cls: 'risk-medium', icon: '🟠' },
  low:    { label: '低风险', cls: 'risk-low',    icon: '🟢' }
}

export default function RiskBadge({ level }) {
  const m = MAP[level] || { label: level, cls: '', icon: '' }
  return (
    <span className={'risk-badge ' + m.cls}>
      <span className="risk-icon">{m.icon}</span>{m.label}
    </span>
  )
}
