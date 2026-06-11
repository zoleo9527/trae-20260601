import React from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'
import RiskBadge from './RiskBadge.jsx'

export default function TodoCard({ record }) {
  return (
    <Link to={`/tasks/${record.id}`} className="todo-card">
      <div className="todo-top">
        <StatusBadge status={record.status} />
        <RiskBadge level={record.riskLevel} />
      </div>
      <div className="todo-title">{record.title}</div>
      <div className="todo-meta">
        <span>📍 {record.location}</span>
        <span>🆔 {record.id}</span>
      </div>
      {record.todoLabel && <div className="todo-label">👉 {record.todoLabel}</div>}
      <div className="todo-foot">
        <span>更新于 {record.updatedAt.slice(5)}</span>
      </div>
    </Link>
  )
}
