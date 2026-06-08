import { useEffect, useState } from 'react'
import { api } from '../api'

const ROLE_LABELS = {
  station_receiver: '货站受理岗',
  security_inspector: '安检校验岗',
  warehouse_dispatcher: '库区调度岗',
}

export default function AuditTrail() {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRecordId, setFilterRecordId] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterOperator, setFilterOperator] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterRecordId) params.recordId = filterRecordId
      if (filterRole) params.operatorRole = filterRole
      if (filterOperator) params.operator = filterOperator
      const res = await api.audit.list(params)
      setAudits(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const statusBadge = (status) => {
    const map = {
      '待受理': 'badge-pending', '受理中': 'badge-processing', '待单证校验': 'badge-pending',
      '单证校验中': 'badge-processing', '校验退回': 'badge-danger', '校验通过': 'badge-success',
      '待入库': 'badge-warning', '已入库': 'badge-success',
    }
    return map[status] || 'badge-pending'
  }

  const groupedByRecord = {}
  audits.forEach(a => {
    if (!groupedByRecord[a.recordId]) groupedByRecord[a.recordId] = []
    groupedByRecord[a.recordId].push(a)
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>受理记录ID</label>
          <input className="input" placeholder="记录ID" value={filterRecordId}
            onChange={e => setFilterRecordId(e.target.value)} style={{ width: 100 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>操作角色</label>
          <select className="input" value={filterRole}
            onChange={e => setFilterRole(e.target.value)}>
            <option value="">全部</option>
            <option value="station_receiver">货站受理岗</option>
            <option value="security_inspector">安检校验岗</option>
            <option value="warehouse_dispatcher">库区调度岗</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>操作人</label>
          <input className="input" placeholder="姓名" value={filterOperator}
            onChange={e => setFilterOperator(e.target.value)} style={{ width: 100 }} />
        </div>
        <button className="btn btn-primary" onClick={loadData}>筛选</button>
        <button className="btn btn-ghost" onClick={() => {
          setFilterRecordId(''); setFilterRole(''); setFilterOperator('')
          setTimeout(loadData, 0)
        }}>重置</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {Object.entries(groupedByRecord).map(([recordId, items]) => {
            const sortedItems = [...items].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            const isExpanded = expandedId === recordId
            const latestItem = sortedItems[sortedItems.length - 1]

            return (
              <div key={recordId} className="card">
                <div style={{
                  padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', userSelect: 'none',
                }} onClick={() => setExpandedId(isExpanded ? null : recordId)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 12,
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      #{recordId}
                    </span>
                    <span style={{ fontSize: 13 }}>
                      {sortedItems.length} 步操作
                    </span>
                    {latestItem && (
                      <>
                        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>→</span>
                        <span className={`badge ${statusBadge(latestItem.toStatus)}`}>{latestItem.toStatus}</span>
                      </>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                    {isExpanded ? '收起 ▲' : '展开 ▼'}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
                    <div className="timeline" style={{ marginTop: 14 }}>
                      {sortedItems.map((item, idx) => (
                        <div key={item.id} className="timeline-item">
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                            <span className={`badge ${statusBadge(item.fromStatus)}`} style={{ fontSize: 11 }}>
                              {item.fromStatus}
                            </span>
                            <span style={{ color: 'var(--text-dim)' }}>→</span>
                            <span className={`badge ${statusBadge(item.toStatus)}`} style={{ fontSize: 11 }}>
                              {item.toStatus}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>
                              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{item.operator}</span>
                              <span style={{ margin: '0 4px' }}>·</span>
                              {ROLE_LABELS[item.operatorRole] || item.operatorRole}
                            </span>
                            <span>{item.displayTime || new Date(item.timestamp).toLocaleString('zh-CN')}</span>
                          </div>
                          {item.note && (
                            <div style={{
                              marginTop: 4, padding: '6px 10px', background: 'rgba(0,0,0,0.2)',
                              borderRadius: 4, fontSize: 12, color: 'var(--text)',
                            }}>
                              {item.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {Object.keys(groupedByRecord).length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>暂无操作日志</div>
          )}
        </div>
      )}
    </div>
  )
}
