import React from 'react'
import { ActivityLog } from '../types'

interface ActivityTimelineProps {
  logs: ActivityLog[]
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <div className="empty">暂无操作记录</div>
  }

  return (
    <div className="timeline">
      {logs.map(log => (
        <div key={log.id} className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content">
            <div className="timeline-title">
              {log.project_name && <span style={{ color: '#1890ff', marginRight: 8 }}>[{log.project_name}]</span>}
              {log.action_detail || log.action_type}
            </div>
            <div>
              <span className="timeline-time">{formatTime(log.created_at)}</span>
              <span className="timeline-operator">操作人：{log.operator}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  return `${month}-${day} ${hour}:${minute}`
}

export default ActivityTimeline
