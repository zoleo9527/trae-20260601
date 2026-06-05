import dayjs from 'dayjs'
import { getUserById } from '../mock/data'

const TYPE_ICONS = {
  route_open: '🧗',
  maintenance: '🔧',
}

export default function AuditTrail({ logs }) {
  if (!logs || logs.length === 0) {
    return <p style={{ color: '#999', fontSize: 13, padding: '12px 0' }}>暂无操作记录</p>
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{
        position: 'absolute',
        left: 8,
        top: 8,
        bottom: 8,
        width: 2,
        background: '#e0e0e0',
        borderRadius: 1,
      }} />
      {logs.map((log, idx) => {
        const operator = getUserById(log.operatorId)
        return (
          <div key={log.id} style={{
            position: 'relative',
            paddingBottom: idx === logs.length - 1 ? 0 : 20,
          }}>
            <div style={{
              position: 'absolute',
              left: -20,
              top: 4,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: idx === logs.length - 1 ? '#4fc3f7' : '#bbb',
              border: '2px solid #fff',
              boxShadow: '0 0 0 2px #e0e0e0',
            }} />
            <div style={{
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>{TYPE_ICONS[log.type] || '📌'}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{log.action}</span>
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                <span>{operator?.avatar} {operator?.name}</span>
                <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
                <span>{dayjs(log.timestamp).format('MM-DD HH:mm')}</span>
              </div>
              {log.detail && (
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{log.detail}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
