import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  routeOpenings as initialOpenings, routes, getUserById,
  ROUTE_OPEN_STATUS, ROUTE_OPEN_STATUS_LABEL, ROLES,
} from '../mock/data'
import StatusBadge from '../components/StatusBadge'
import AuditTrail from '../components/AuditTrail'

export default function RouteOpening() {
  const { currentUserId } = useOutletContext()
  const [openings, setOpenings] = useState(initialOpenings)
  const [selectedId, setSelectedId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newRouteId, setNewRouteId] = useState('')
  const [newRemark, setNewRemark] = useState('')
  const [filter, setFilter] = useState('all')

  const currentUser = getUserById(currentUserId)

  const filtered = filter === 'all'
    ? openings
    : openings.filter(o => o.status === filter)

  const selected = openings.find(o => o.id === selectedId)
  const selectedRoute = selected ? routes.find(r => r.id === selected.routeId) : null

  function handleBelayerConfirm(id) {
    setOpenings(prev => prev.map(o => o.id === id ? {
      ...o,
      status: ROUTE_OPEN_STATUS.BELAYER_CONFIRMED,
      belayerId: currentUserId,
      belayerConfirmedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    } : o))
  }

  function handleAdminApprove(id) {
    setOpenings(prev => prev.map(o => o.id === id ? {
      ...o,
      status: ROUTE_OPEN_STATUS.APPROVED,
      adminId: currentUserId,
      adminApprovedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      openDate: dayjs().format('YYYY-MM-DD'),
    } : o))
  }

  function handleAdminReject(id) {
    setOpenings(prev => prev.map(o => o.id === id ? {
      ...o,
      status: ROUTE_OPEN_STATUS.REJECTED,
      adminId: currentUserId,
      adminApprovedAt: dayjs().format('YYYY-MM-DD HH:mm'),
    } : o))
  }

  function handleSubmitNew() {
    if (!newRouteId) return
    const newId = `ro${Date.now()}`
    setOpenings(prev => [{
      id: newId,
      routeId: newRouteId,
      submittedBy: currentUserId,
      submittedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      status: ROUTE_OPEN_STATUS.PENDING_BELAYER,
      belayerId: null,
      belayerConfirmedAt: null,
      adminId: null,
      adminApprovedAt: null,
      openDate: null,
      remark: newRemark,
    }, ...prev])
    setNewRouteId('')
    setNewRemark('')
    setShowNewForm(false)
    setSelectedId(newId)
  }

  function buildAuditLogs(opening) {
    const logs = []
    const route = routes.find(r => r.id === opening.routeId)
    logs.push({
      id: `${opening.id}-submit`,
      type: 'route_open',
      refId: opening.id,
      action: '提交线路开放申请',
      operatorId: opening.submittedBy,
      timestamp: opening.submittedAt,
      detail: `线路：${route?.name} (${route?.grade})`,
    })
    if (opening.belayerId) {
      logs.push({
        id: `${opening.id}-belayer`,
        type: 'route_open',
        refId: opening.id,
        action: '保护员确认',
        operatorId: opening.belayerId,
        timestamp: opening.belayerConfirmedAt,
        detail: '已确认安全检查通过',
      })
    }
    if (opening.adminId) {
      logs.push({
        id: `${opening.id}-admin`,
        type: 'route_open',
        refId: opening.id,
        action: opening.status === ROUTE_OPEN_STATUS.APPROVED ? '线路管理员审核通过' : '线路管理员驳回',
        operatorId: opening.adminId,
        timestamp: opening.adminApprovedAt,
        detail: opening.status === ROUTE_OPEN_STATUS.APPROVED ? '线路正式开放' : opening.remark,
      })
    }
    return logs
  }

  const openedRouteIds = new Set(openings.filter(o => o.status === ROUTE_OPEN_STATUS.APPROVED).map(o => o.routeId))
  const availableRoutes = routes.filter(r => !openedRouteIds.has(r.id))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🧗 线路开放</h2>
        {currentUser?.role === ROLES.FRONT_DESK && (
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{
              padding: '8px 20px',
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + 提交开放申请
          </button>
        )}
      </div>

      {showNewForm && (
        <div style={{
          background: '#fff',
          border: '1px solid #bbdefb',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>新建线路开放申请</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>选择线路</label>
              <select value={newRouteId} onChange={e => setNewRouteId(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
              }}>
                <option value="">-- 请选择 --</option>
                {availableRoutes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.grade} · {r.zone})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>备注</label>
              <input value={newRemark} onChange={e => setNewRemark(e.target.value)} placeholder="可选" style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
              }} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={handleSubmitNew} style={{
              padding: '7px 18px',
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}>提交</button>
            <button onClick={() => setShowNewForm(false)} style={{
              padding: '7px 18px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}>取消</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: '全部' },
          { key: ROUTE_OPEN_STATUS.PENDING_BELAYER, label: '待保护员确认' },
          { key: ROUTE_OPEN_STATUS.BELAYER_CONFIRMED, label: '待管理员审核' },
          { key: ROUTE_OPEN_STATUS.APPROVED, label: '已开放' },
          { key: ROUTE_OPEN_STATUS.REJECTED, label: '已驳回' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: filter === f.key ? '1px solid #1a73e8' : '1px solid #ddd',
              background: filter === f.key ? '#e3f2fd' : '#fff',
              color: filter === f.key ? '#1a73e8' : '#666',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '1fr 400px' : '1fr', gap: 16 }}>
        <div>
          {filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#999' }}>
              暂无匹配的记录
            </div>
          ) : (
            filtered.map(ro => {
              const route = routes.find(r => r.id === ro.routeId)
              const submitter = getUserById(ro.submittedBy)
              const isSelected = selectedId === ro.id
              return (
                <div
                  key={ro.id}
                  onClick={() => setSelectedId(isSelected ? null : ro.id)}
                  style={{
                    background: isSelected ? '#f0f7ff' : '#fff',
                    border: `1px solid ${isSelected ? '#90caf9' : '#f0f0f0'}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    marginBottom: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: route?.setColor || '#ccc',
                      }} />
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{route?.name}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        background: '#f5f5f5',
                        color: '#666',
                      }}>{route?.grade}</span>
                    </div>
                    <StatusBadge status={ro.status} label={ROUTE_OPEN_STATUS_LABEL[ro.status]} />
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                    {route?.zone} · {submitter?.name}提交 · {dayjs(ro.submittedAt).format('MM-DD HH:mm')}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {selectedId && selected && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #f0f0f0',
            height: 'fit-content',
            position: 'sticky',
            top: 24,
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600 }}>
              {selectedRoute?.name} <span style={{ fontSize: 13, color: '#888' }}>({selectedRoute?.grade})</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13, marginBottom: 16 }}>
              <div><span style={{ color: '#999' }}>区域：</span>{selectedRoute?.zone}</div>
              <div><span style={{ color: '#999' }}>定线员：</span>{selectedRoute?.setter}</div>
              <div><span style={{ color: '#999' }}>申请人：</span>{getUserById(selected.submittedBy)?.name}</div>
              <div><span style={{ color: '#999' }}>申请时间：</span>{dayjs(selected.submittedAt).format('MM-DD HH:mm')}</div>
              {selected.belayerId && (
                <>
                  <div><span style={{ color: '#999' }}>确认保护员：</span>{getUserById(selected.belayerId)?.name}</div>
                  <div><span style={{ color: '#999' }}>确认时间：</span>{dayjs(selected.belayerConfirmedAt).format('MM-DD HH:mm')}</div>
                </>
              )}
              {selected.adminId && (
                <>
                  <div><span style={{ color: '#999' }}>审核人：</span>{getUserById(selected.adminId)?.name}</div>
                  <div><span style={{ color: '#999' }}>审核时间：</span>{dayjs(selected.adminApprovedAt).format('MM-DD HH:mm')}</div>
                </>
              )}
              {selected.remark && (
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#999' }}>备注：</span>{selected.remark}</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {selected.status === ROUTE_OPEN_STATUS.PENDING_BELAYER && currentUser?.role === ROLES.BELAYER && (
                <button onClick={() => handleBelayerConfirm(selected.id)} style={{
                  padding: '7px 16px',
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}>✓ 确认安全</button>
              )}
              {selected.status === ROUTE_OPEN_STATUS.BELAYER_CONFIRMED && currentUser?.role === ROLES.ROUTE_ADMIN && (
                <>
                  <button onClick={() => handleAdminApprove(selected.id)} style={{
                    padding: '7px 16px',
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}>✓ 审核通过</button>
                  <button onClick={() => handleAdminReject(selected.id)} style={{
                    padding: '7px 16px',
                    background: '#c62828',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}>✗ 驳回</button>
                </>
              )}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#666' }}>操作留痕</h4>
              <AuditTrail logs={buildAuditLogs(selected)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
