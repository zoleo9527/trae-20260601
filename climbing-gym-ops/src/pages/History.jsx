import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  routes, getUserById, getRouteById,
  ROUTE_OPEN_STATUS_LABEL, MAINTENANCE_STATUS_LABEL,
  ROLES,
} from '../mock/data'
import { useStore } from '../store/StoreContext'
import StatusBadge from '../components/StatusBadge'
import AuditTrail from '../components/AuditTrail'

export default function History() {
  const { currentUserId } = useOutletContext()
  const { routeOpenings, maintenanceRecords, actions } = useStore()
  const [tab, setTab] = useState('route_open')
  const [filterRoute, setFilterRoute] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const items = tab === 'route_open'
    ? routeOpenings.map(ro => ({ ...ro, _type: 'route_open', route: getRouteById(ro.routeId) }))
    : maintenanceRecords.map(m => ({ ...m, _type: 'maintenance', route: getRouteById(m.routeId) }))

  const filtered = items.filter(item => {
    if (filterRoute !== 'all' && item.routeId !== filterRoute) return false
    if (filterRole !== 'all') {
      const submitter = getUserById(item.submittedBy)
      if (submitter?.role !== filterRole) return false
    }
    return true
  })

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>📋 历史回看</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => { setTab('route_open'); setExpandedId(null) }}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: tab === 'route_open' ? '1px solid #1a73e8' : '1px solid #ddd',
            background: tab === 'route_open' ? '#e3f2fd' : '#fff',
            color: tab === 'route_open' ? '#1a73e8' : '#666',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: tab === 'route_open' ? 600 : 400,
          }}
        >
          🧗 线路开放
        </button>
        <button
          onClick={() => { setTab('maintenance'); setExpandedId(null) }}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: tab === 'maintenance' ? '1px solid #e65100' : '1px solid #ddd',
            background: tab === 'maintenance' ? '#fff3e0' : '#fff',
            color: tab === 'maintenance' ? '#e65100' : '#666',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: tab === 'maintenance' ? 600 : 400,
          }}
        >
          🔧 维护记录
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>按线路筛选</label>
          <select value={filterRoute} onChange={e => setFilterRoute(e.target.value)} style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            fontSize: 13,
            minWidth: 160,
          }}>
            <option value="all">全部线路</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.grade})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>按提交人角色筛选</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            fontSize: 13,
            minWidth: 120,
          }}>
            <option value="all">全部角色</option>
            <option value={ROLES.FRONT_DESK}>{ROLES.FRONT_DESK}</option>
            <option value={ROLES.BELAYER}>{ROLES.BELAYER}</option>
            <option value={ROLES.ROUTE_ADMIN}>{ROLES.ROUTE_ADMIN}</option>
          </select>
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#999' }}>
            暂无匹配的记录
          </div>
        ) : (
          filtered.map(item => {
            const isExpanded = expandedId === item.id
            const submitter = getUserById(item.submittedBy)
            const statusLabel = tab === 'route_open'
              ? ROUTE_OPEN_STATUS_LABEL[item.status]
              : MAINTENANCE_STATUS_LABEL[item.status]

            const auditLogsForItem = tab === 'route_open'
              ? actions.buildRouteOpeningAuditLogs(item)
              : actions.buildMaintenanceAuditLogs(item)

            return (
              <div key={item.id} style={{
                background: '#fff',
                borderRadius: 10,
                border: `1px solid ${isExpanded ? '#bbdefb' : '#f0f0f0'}`,
                marginBottom: 8,
                overflow: 'hidden',
                transition: 'all 0.15s',
              }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {tab === 'route_open' ? (
                      <>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: item.route?.setColor || '#ccc',
                        }} />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.route?.name}</span>
                        <span style={{ fontSize: 12, color: '#888' }}>{item.route?.grade}</span>
                      </>
                    ) : (
                      <>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          background: '#f5f5f5',
                        }}>{item.type}</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.route?.name}</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>
                      {submitter?.name} · {dayjs(item.submittedAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                    <StatusBadge status={item.status} label={statusLabel} />
                    <span style={{ fontSize: 12, color: '#bbb' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{
                    padding: '14px 18px',
                    borderTop: '1px solid #f0f0f0',
                    background: '#fafafa',
                  }}>
                    {tab === 'maintenance' && (
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
                        {item.description}
                      </div>
                    )}
                    {tab === 'maintenance' && item.attachments && item.attachments.length > 0 && (
                      <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 12, color: '#999' }}>📎 附件：</span>
                        {item.attachments.map((att, i) => (
                          <span key={i} style={{ fontSize: 13, color: '#1a73e8', marginRight: 12, cursor: 'pointer' }}>
                            📄 {att}
                          </span>
                        ))}
                      </div>
                    )}
                    {tab === 'route_open' && item.remark && (
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
                        备注：{item.remark}
                      </div>
                    )}
                    <AuditTrail logs={auditLogsForItem} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
