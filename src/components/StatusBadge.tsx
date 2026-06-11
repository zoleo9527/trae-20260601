import React from 'react'
import { ProjectStatus, STATUS_LABELS, STATUS_COLORS, RiskLevel, RISK_LABELS, RISK_COLORS } from '../types'

interface StatusBadgeProps {
  status: ProjectStatus
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]
  
  return (
    <span className="badge" style={{ background: `${color}15`, color }}>
      <span className="badge-dot" style={{ background: color }}></span>
      {label}
    </span>
  )
}

interface RiskBadgeProps {
  level: RiskLevel
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const color = RISK_COLORS[level]
  const label = RISK_LABELS[level]
  
  return (
    <span className="badge" style={{ background: `${color}15`, color }}>
      <span className="badge-dot" style={{ background: color }}></span>
      {label}
    </span>
  )
}

export default StatusBadge
