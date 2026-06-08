import { useEffect, useState } from 'react'
import { handoverAPI, patrolAPI, exceptionAPI } from '../api'
import type { Handover } from '../types'
import dayjs from 'dayjs'

const statusColors: Record<string, string> = {
  pending: '#e94560',
  accepted: '#48bb78',
}

const statusLabels: Record<string, string> = {
  pending: '待接收', accepted: '已接收',
}

function Badge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      color: '#fff',
      background: statusColors[status] || '#718096',
    }}>{statusLabels[status] || status}</span>
  )
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#16213e',
        borderRadius: 12,
        padding: 28,
        minWidth: 420,
        maxWidth: 520,
        width: '90%',
      }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const roleMap: Record<string, string> = {
  admin: '管理员', manager: '店长', network: '网管', ops: '赛事运营',
}
const roleOptions = Object.entries(roleMap)

export default function ShiftHandover() {
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [accepting, setAccepting] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    toRole: '',
    toUser: '',
    notes: '',
  })

  const [pendingCount, setPendingCount] = useState({ patrol: 0, exception: 0 })

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null

  const fetchHandovers = () => {
    setLoading(true)
    handoverAPI.list()
      .then((res) => setHandovers(res.data))
      .catch(() => setHandovers([]))
      .finally(() => setLoading(false))
  }

  const fetchPendingCounts = async () => {
    try {
      const [patrols, exceptions] = await Promise.all([
        patrolAPI.list({ status: 'pending' }),
        exceptionAPI.list({ status: 'pending' }),
      ])
      setPendingCount({
        patrol: patrols.data?.length || 0,
        exception: exceptions.data?.length || 0,
      })
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchHandovers()
  }, [])

  useEffect(() => {
    if (showCreate) {
      fetchPendingCounts()
    }
  }, [showCreate])

  const handleCreate = async () => {
    if (!createForm.toRole || !createForm.toUser) return
    setSubmitting(true)
    try {
      await handoverAPI.create({
        shiftDate: dayjs().format('YYYY-MM-DD'),
        fromRole: currentUser?.role,
        fromUser: currentUser?.displayName || currentUser?.username,
        toRole: createForm.toRole,
        toUser: createForm.toUser,
        pendingPatrolCount: pendingCount.patrol,
        pendingExceptionCount: pendingCount.exception,
        notes: createForm.notes,
      })
      setShowCreate(false)
      setCreateForm({ toRole: '', toUser: '', notes: '' })
      fetchHandovers()
    } catch {
      alert('发起交班失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = async (id: string) => {
    setAccepting(id)
    try {
      await handoverAPI.accept(id, { toUser: currentUser?.displayName || currentUser?.username || '' })
      fetchHandovers()
    } catch {
      alert('接收交班失败')
    } finally {
      setAccepting(null)
    }
  }

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    color: '#a0aec0',
    fontWeight: 600,
    fontSize: 13,
    borderBottom: '2px solid #0f3460',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #0f3460',
    fontSize: 14,
    color: '#e0e0e0',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#0f3460',
    border: '1px solid #1a3a6e',
    borderRadius: 6,
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  }

  const btnSecondary: React.CSSProperties = {
    background: 'transparent',
    color: '#a0aec0',
    border: '1px solid #0f3460',
    borderRadius: 6,
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: 14,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#a0aec0',
    marginBottom: 6,
    fontSize: 14,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ color: '#e0e0e0', fontSize: 22, margin: 0 }}>交班管理</h2>
        <button style={btnPrimary} onClick={() => setShowCreate(true)}>发起交班</button>
      </div>

      {loading ? (
        <div style={{ color: '#a0aec0', textAlign: 'center', padding: 40 }}>加载中...</div>
      ) : handovers.length === 0 ? (
        <div style={{ color: '#718096', textAlign: 'center', padding: 40 }}>暂无交班记录</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#16213e', borderRadius: 8 }}>
            <thead>
              <tr>
                <th style={thStyle}>交班日期</th>
                <th style={thStyle}>交出人(角色)</th>
                <th style={thStyle}>接收人(角色)</th>
                <th style={thStyle}>待处理巡场</th>
                <th style={thStyle}>待处理异常</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {handovers.map((h, idx) => (
                <tr key={h.id} style={{ background: idx % 2 === 0 ? '#16213e' : '#1a2744' }}>
                  <td style={tdStyle}>{dayjs(h.shiftDate).format('YYYY-MM-DD')}</td>
                  <td style={tdStyle}>{h.fromUser}({roleMap[h.fromRole] || h.fromRole})</td>
                  <td style={tdStyle}>{h.toUser}({roleMap[h.toRole] || h.toRole})</td>
                  <td style={tdStyle}>{h.pendingPatrolCount}</td>
                  <td style={tdStyle}>{h.pendingExceptionCount}</td>
                  <td style={tdStyle}><Badge status={h.status} /></td>
                  <td style={tdStyle}>
                    {h.status === 'pending' && (
                      <button
                        style={{ ...btnPrimary, padding: '4px 12px', fontSize: 12 }}
                        disabled={accepting === h.id}
                        onClick={() => handleAccept(h.id)}
                      >
                        {accepting === h.id ? '接收中...' : '接收'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <h3 style={{ color: '#e0e0e0', marginBottom: 20 }}>发起交班</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>交出人</label>
          <input type="text" value={currentUser?.displayName || currentUser?.username || ''} disabled style={{ ...inputStyle, opacity: 0.6 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>交出角色</label>
          <input type="text" value={roleMap[currentUser?.role] || currentUser?.role || ''} disabled style={{ ...inputStyle, opacity: 0.6 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>接收角色</label>
          <select value={createForm.toRole} onChange={(e) => setCreateForm({ ...createForm, toRole: e.target.value, toUser: '' })} style={inputStyle}>
            <option value="">请选择</option>
            {roleOptions.filter(([r]) => r !== currentUser?.role).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>接收人</label>
          <input type="text" value={createForm.toUser} onChange={(e) => setCreateForm({ ...createForm, toUser: e.target.value })} style={inputStyle} placeholder="请输入接收人姓名" />
        </div>
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#0f3460', borderRadius: 6 }}>
          <div style={{ color: '#a0aec0', fontSize: 13, marginBottom: 6 }}>当前待处理统计</div>
          <div style={{ color: '#e0e0e0', fontSize: 14 }}>
            巡场: <span style={{ color: '#4299e1', fontWeight: 600 }}>{pendingCount.patrol}</span> 项 &nbsp;|&nbsp; 异常: <span style={{ color: '#e94560', fontWeight: 600 }}>{pendingCount.exception}</span> 项
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>备注</label>
          <textarea value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={btnSecondary} onClick={() => setShowCreate(false)}>取消</button>
          <button style={btnPrimary} disabled={submitting || !createForm.toRole || !createForm.toUser} onClick={handleCreate}>
            {submitting ? '提交中...' : '发起交班'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
