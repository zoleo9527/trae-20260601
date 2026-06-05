import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  routes, getUserById,
  MAINTENANCE_STATUS, MAINTENANCE_STATUS_LABEL, ROLES,
} from '../mock/data'
import { useStore } from '../store/StoreContext'
import StatusBadge from '../components/StatusBadge'
import AuditTrail from '../components/AuditTrail'

const MAINT_TYPES = ['换点', '补漆', '检查', '修复', '清洁', '其他']

export default function Maintenance() {
  const { currentUserId } = useOutletContext()
  const { maintenanceRecords, actions } = useStore()
  const [selectedId, setSelectedId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [filter, setFilter] = useState('all')

  const [newRouteId, setNewRouteId] = useState('')
  const [newType, setNewType] = useState('换点')
  const [newDesc, setNewDesc] = useState('')

  const currentUser = getUserById(currentUserId)

  const filtered = filter === 'all'
    ? maintenanceRecords
    : maintenanceRecords.filter(m => m.status === filter)

  const selected = maintenanceRecords.find(m => m.id === selectedId)
  const selectedRoute = selected ? routes.find(r => r.id === selected.routeId) : null

  function handleBelayerConfirm(id) {
    actions.confirmMaintenance({ id, confirmedBy: currentUserId })
  }

  function handleClose(id) {
    actions.closeMaintenance({ id, operatorId: currentUserId })
  }

  function handleSubmitNew() {
    if (!newRouteId || !newDesc) return
    const newId = actions.submitMaintenance({
      routeId: newRouteId,
      type: newType,
      description: newDesc,
      submittedBy: currentUserId,
    })
    setNewRouteId('')
    setNewDesc('')
    setShowNewForm(false)
    setSelectedId(newId)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>🔧 维护记录</h2>
        {currentUser?.role === ROLES.ROUTE_ADMIN && (
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{
              padding: '8px 20px',
              background: '#e65100',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + 提交维护记录
          </button>
        )}
      </div>

      {showNewForm && (
        <div style={{
          background: '#fff',
          border: '1px solid #ffe0b2',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>新建维护记录</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>线路</label>
              <select value={newRouteId} onChange={e => setNewRouteId(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
              }}>
                <option value="">-- 请选择 --</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.grade})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>维护类型</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14,
              }}>
                {MAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>描述</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="维护内容描述" style={{
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
              background: '#e65100',
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
          { key: MAINTENANCE_STATUS.PENDING_CONFIRM, label: '待保护员确认' },
          { key: MAINTENANCE_STATUS.CONFIRMED, label: '已确认' },
          { key: MAINTENANCE_STATUS.CLOSED, label: '已关闭' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: filter === f.key ? '1px solid #e65100' : '1px solid #ddd',
              background: filter === f.key ? '#fff3e0' : '#fff',
              color: filter === f.key ? '#e65100' : '#666',
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
            filtered.map(rec => {
              const route = routes.find(r => r.id === rec.routeId)
              const submitter = getUserById(rec.submittedBy)
              const isSelected = selectedId === rec.id
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedId(isSelected ? null : rec.id)}
                  style={{
                    background: isSelected ? '#fff8e1' : '#fff',
                    border: `1px solid ${isSelected ? '#ffe082' : '#f0f0f0'}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    marginBottom: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        background: '#f5f5f5',
                        fontWeight: 500,
                      }}>{rec.type}</span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{route?.name}</span>
                    </div>
                    <StatusBadge status={rec.status} label={MAINTENANCE_STATUS_LABEL[rec.status]} />
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                    {rec.description}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    {submitter?.name}提交 · {dayjs(rec.submittedAt).format('MM-DD HH:mm')}
                    {rec.attachments.length > 0 && ` · 📎${rec.attachments.length}个附件`}
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
              {selectedRoute?.name} <span style={{ fontSize: 13, color: '#888' }}>({selected.type})</span>
            </h3>

            <div style={{ fontSize: 13, marginBottom: 16, color: '#555', lineHeight: 1.6 }}>
              {selected.description}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13, marginBottom: 16 }}>
              <div><span style={{ color: '#999' }}>线路：</span>{selectedRoute?.name} ({selectedRoute?.grade})</div>
              <div><span style={{ color: '#999' }}>区域：</span>{selectedRoute?.zone}</div>
              <div><span style={{ color: '#999' }}>提交人：</span>{getUserById(selected.submittedBy)?.name}</div>
              <div><span style={{ color: '#999' }}>提交时间：</span>{dayjs(selected.submittedAt).format('MM-DD HH:mm')}</div>
              {selected.confirmedBy && (
                <>
                  <div><span style={{ color: '#999' }}>确认人：</span>{getUserById(selected.confirmedBy)?.name}</div>
                  <div><span style={{ color: '#999' }}>确认时间：</span>{dayjs(selected.confirmedAt).format('MM-DD HH:mm')}</div>
                </>
              )}
              {selected.closedAt && (
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#999' }}>关闭时间：</span>{dayjs(selected.closedAt).format('MM-DD HH:mm')}</div>
              )}
            </div>

            {selected.attachments.length > 0 && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#999' }}>📎 附件</p>
                {selected.attachments.map((att, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '3px 0', color: '#1a73e8', cursor: 'pointer' }}>
                    📄 {att}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {selected.status === MAINTENANCE_STATUS.PENDING_CONFIRM && currentUser?.role === ROLES.BELAYER && (
                <button onClick={() => handleBelayerConfirm(selected.id)} style={{
                  padding: '7px 16px',
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}>✓ 确认维护完成</button>
              )}
              {selected.status === MAINTENANCE_STATUS.CONFIRMED && currentUser?.role === ROLES.ROUTE_ADMIN && (
                <button onClick={() => handleClose(selected.id)} style={{
                  padding: '7px 16px',
                  background: '#616161',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}>关闭记录</button>
              )}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#666' }}>操作留痕</h4>
              <AuditTrail logs={actions.buildMaintenanceAuditLogs(selected)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
