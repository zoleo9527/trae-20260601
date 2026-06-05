import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  routeOpenings, maintenanceRecords, auditLogs, routes,
  getUserById, getRouteById, ROUTE_OPEN_STATUS, MAINTENANCE_STATUS,
  ROUTE_OPEN_STATUS_LABEL, MAINTENANCE_STATUS_LABEL,
} from '../mock/data'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const { currentUserId } = useOutletContext()
  const navigate = useNavigate()
  const [expandedLog, setExpandedLog] = useState(null)

  const pendingBelayer = routeOpenings.filter(r => r.status === ROUTE_OPEN_STATUS.PENDING_BELAYER)
  const pendingAdmin = routeOpenings.filter(r => r.status === ROUTE_OPEN_STATUS.BELAYER_CONFIRMED)
  const pendingMaintConfirm = maintenanceRecords.filter(m => m.status === MAINTENANCE_STATUS.PENDING_CONFIRM)
  const activeRoutes = routes.length

  const stats = [
    {
      label: '待保护员确认',
      value: pendingBelayer.length,
      color: '#e65100',
      bg: '#fff3e0',
      icon: '⏳',
      onClick: () => navigate('/route-opening'),
    },
    {
      label: '待管理员审核',
      value: pendingAdmin.length,
      color: '#1565c0',
      bg: '#e3f2fd',
      icon: '📝',
      onClick: () => navigate('/route-opening'),
    },
    {
      label: '待维护确认',
      value: pendingMaintConfirm.length,
      color: '#e65100',
      bg: '#fff3e0',
      icon: '🔧',
      onClick: () => navigate('/maintenance'),
    },
    {
      label: '在线线路',
      value: activeRoutes,
      color: '#2e7d32',
      bg: '#e8f5e9',
      icon: '🧗',
      onClick: () => navigate('/history'),
    },
  ]

  const recentLogs = [...auditLogs]
    .sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf())
    .slice(0, 8)

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>📊 运营仪表盘</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 28,
      }}>
        {stats.map(s => (
          <div
            key={s.label}
            onClick={s.onClick}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '20px 20px 16px',
              cursor: 'pointer',
              border: '1px solid #f0f0f0',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: '#888' }}>{s.label}</p>
                <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
              <span style={{ fontSize: 28, opacity: 0.8 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #f0f0f0',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>🧗 待处理线路开放</h3>
          {[...pendingBelayer, ...pendingAdmin].length === 0 ? (
            <p style={{ color: '#999', fontSize: 13 }}>暂无待处理项</p>
          ) : (
            [...pendingBelayer, ...pendingAdmin].map(ro => {
              const route = getRouteById(ro.routeId)
              const submitter = getUserById(ro.submittedBy)
              return (
                <div
                  key={ro.id}
                  onClick={() => navigate('/route-opening')}
                  style={{
                    padding: '10px 14px',
                    marginBottom: 8,
                    background: '#fafafa',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: '1px solid #f0f0f0',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{route?.name}</span>
                    <StatusBadge status={ro.status} label={ROUTE_OPEN_STATUS_LABEL[ro.status]} />
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    {route?.grade} · {route?.zone} · {submitter?.name}提交于{dayjs(ro.submittedAt).format('MM-DD HH:mm')}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #f0f0f0',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>📋 最近操作流水</h3>
          <div>
            {recentLogs.map(log => {
              const operator = getUserById(log.operatorId)
              const isExpanded = expandedLog === log.id
              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 4,
                    background: isExpanded ? '#f0f7ff' : '#fafafa',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: `1px solid ${isExpanded ? '#bbdefb' : '#f0f0f0'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>
                      {log.type === 'route_open' ? '🧗' : '🔧'} {log.action}
                    </span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{dayjs(log.timestamp).format('MM-DD HH:mm')}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: 6 }}>
                      <div>操作人：{operator?.avatar} {operator?.name} ({operator?.role})</div>
                      <div>详情：{log.detail}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
