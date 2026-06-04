import { useEffect, useState } from 'react'
import { api } from '../api.js'

const styles = {
  container: {
    marginTop: 16,
    border: '1px solid #e4e7ed',
    borderRadius: 6,
    background: '#fff',
  },
  header: {
    padding: '10px 16px',
    background: '#fafafa',
    borderBottom: '1px solid #e4e7ed',
    fontSize: 14,
    fontWeight: 600,
    color: '#303133',
  },
  timeline: {
    padding: '12px 16px',
  },
  item: {
    display: 'flex',
    gap: 12,
    position: 'relative',
    paddingBottom: 16,
  },
  dotLine: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 16,
  },
  dot: (isLast) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: isLast ? '#409eff' : '#dcdfe6',
    flexShrink: 0,
    marginTop: 4,
  }),
  line: {
    width: 2,
    flex: 1,
    background: '#dcdfe6',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 4,
  },
  toStatus: {
    fontWeight: 600,
    fontSize: 14,
    color: '#303133',
  },
  note: {
    fontSize: 13,
    color: '#606266',
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: '#909399',
    marginTop: 4,
  },
  empty: {
    padding: 20,
    textAlign: 'center',
    color: '#909399',
    fontSize: 14,
  },
}

export default function StatusLog({ entityType, entityId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entityType || !entityId) return
    setLoading(true)
    api.logs.timeline(entityType, entityId)
      .then(data => setLogs(data.logs))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [entityType, entityId])

  if (loading) return <div style={styles.empty}>加载中...</div>
  if (logs.length === 0) return <div style={styles.empty}>暂无状态记录</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>状态流转记录</div>
      <div style={styles.timeline}>
        {logs.map((log, i) => (
          <div key={log.id} style={styles.item}>
            <div style={styles.dotLine}>
              <div style={styles.dot(i === logs.length - 1)} />
              {i < logs.length - 1 && <div style={styles.line} />}
            </div>
            <div style={styles.content}>
              <div style={styles.toStatus}>
                {log.from_status ? `${log.from_status} → ${log.to_status}` : `创建为 ${log.to_status}`}
              </div>
              {log.note && <div style={styles.note}>{log.note}</div>}
              <div style={styles.meta}>
                {log.operator_name} ({log.operator_role}) · {log.created_at}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
