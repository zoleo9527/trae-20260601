import { useEffect, useState } from 'react'
import { patrolAPI, exceptionAPI } from '../api'
import type { Patrol } from '../types'
import dayjs from 'dayjs'

const statusColors: Record<string, string> = {
  pending: '#e94560',
  confirmed: '#48bb78',
  has_exception: '#ed8936',
}

const statusLabels: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', has_exception: '有异常',
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

const areaOptions = ['A区大厅', 'B区包间', 'C区赛事区', 'D区外设区']

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

export default function NightPatrol() {
  const [patrols, setPatrols] = useState<Patrol[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedPatrol, setSelectedPatrol] = useState<Patrol | null>(null)

  const [createForm, setCreateForm] = useState({ patrolDate: '', area: '', notes: '' })
  const [confirmResult, setConfirmResult] = useState('')
  const [confirmNote, setConfirmNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPatrols = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterStatus) params.status = filterStatus
    if (filterDate) params.patrolDate = filterDate
    patrolAPI.list(params)
      .then((res) => setPatrols(res.data))
      .catch(() => setPatrols([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPatrols()
  }, [filterStatus, filterDate])

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await patrolAPI.create({ ...createForm, submitter: currentUser?.username || '' })
      setShowCreate(false)
      setCreateForm({ patrolDate: '', area: '', notes: '' })
      fetchPatrols()
    } catch {
      alert('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedPatrol || !confirmResult) return
    setSubmitting(true)
    try {
      await patrolAPI.confirm(selectedPatrol.id, { status: confirmResult, confirmer: currentUser?.username || '' })
      if (confirmResult === 'has_exception') {
        setShowConfirm(false)
        const res = await exceptionAPI.create({
          patrolId: selectedPatrol.id,
          title: `${selectedPatrol.area}巡场异常`,
          exceptionType: 'other',
          description: confirmNote || '巡场发现异常',
          severity: 'medium',
          submitter: currentUser?.username || '',
        })
        if (res.data?.id) {
          alert(`异常已创建，ID: ${res.data.id}`)
        }
      } else {
        setShowConfirm(false)
      }
      setConfirmResult('')
      setConfirmNote('')
      setSelectedPatrol(null)
      fetchPatrols()
    } catch {
      alert('确认失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openConfirm = (patrol: Patrol) => {
    setSelectedPatrol(patrol)
    setShowConfirm(true)
  }

  const openDetail = (patrol: Patrol) => {
    setSelectedPatrol(patrol)
    setShowDetail(true)
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
        <h2 style={{ color: '#e0e0e0', fontSize: 22, margin: 0 }}>夜间巡场</h2>
        <button style={btnPrimary} onClick={() => setShowCreate(true)}>提交巡场</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="has_exception">有异常</option>
        </select>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ ...inputStyle, width: 170 }} />
      </div>

      {loading ? (
        <div style={{ color: '#a0aec0', textAlign: 'center', padding: 40 }}>加载中...</div>
      ) : patrols.length === 0 ? (
        <div style={{ color: '#718096', textAlign: 'center', padding: 40 }}>暂无巡场记录</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#16213e', borderRadius: 8 }}>
            <thead>
              <tr>
                <th style={thStyle}>日期</th>
                <th style={thStyle}>巡场区域</th>
                <th style={thStyle}>提交人</th>
                <th style={thStyle}>提交时间</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>确认人</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {patrols.map((p, idx) => (
                <tr key={p.id} style={{ background: idx % 2 === 0 ? '#16213e' : '#1a2744', cursor: 'pointer' }} onClick={() => openDetail(p)}>
                  <td style={tdStyle}>{dayjs(p.patrolDate).format('YYYY-MM-DD')}</td>
                  <td style={tdStyle}>{p.area}</td>
                  <td style={tdStyle}>{p.submitter}</td>
                  <td style={tdStyle}>{dayjs(p.submitTime).format('YYYY-MM-DD HH:mm')}</td>
                  <td style={tdStyle}><Badge status={p.status} /></td>
                  <td style={tdStyle}>{p.confirmer || '-'}</td>
                  <td style={tdStyle}>
                    {p.status === 'pending' && (
                      <button style={{ ...btnPrimary, padding: '4px 12px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); openConfirm(p) }}>
                        确认
                      </button>
                    )}
                    <button style={{ ...btnSecondary, padding: '4px 12px', fontSize: 12, marginLeft: 6 }} onClick={(e) => { e.stopPropagation(); openDetail(p) }}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <h3 style={{ color: '#e0e0e0', marginBottom: 20 }}>提交巡场</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>巡场日期</label>
          <input type="date" value={createForm.patrolDate} onChange={(e) => setCreateForm({ ...createForm, patrolDate: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>巡场区域</label>
          <select value={createForm.area} onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })} style={inputStyle}>
            <option value="">请选择</option>
            {areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>备注</label>
          <textarea value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={btnSecondary} onClick={() => setShowCreate(false)}>取消</button>
          <button style={btnPrimary} disabled={submitting || !createForm.patrolDate || !createForm.area} onClick={handleCreate}>
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </Modal>

      <Modal open={showConfirm} onClose={() => { setShowConfirm(false); setConfirmResult(''); setConfirmNote(''); setSelectedPatrol(null) }}>
        <h3 style={{ color: '#e0e0e0', marginBottom: 20 }}>确认巡场</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>确认结果</label>
          <select value={confirmResult} onChange={(e) => setConfirmResult(e.target.value)} style={inputStyle}>
            <option value="">请选择</option>
            <option value="confirmed">已确认</option>
            <option value="has_exception">有异常</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>备注</label>
          <textarea value={confirmNote} onChange={(e) => setConfirmNote(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={btnSecondary} onClick={() => { setShowConfirm(false); setConfirmResult(''); setConfirmNote(''); setSelectedPatrol(null) }}>取消</button>
          <button style={btnPrimary} disabled={submitting || !confirmResult} onClick={handleConfirm}>
            {submitting ? '处理中...' : '确认'}
          </button>
        </div>
      </Modal>

      <Modal open={showDetail && !!selectedPatrol} onClose={() => { setShowDetail(false); setSelectedPatrol(null) }}>
        {selectedPatrol && (
          <>
            <h3 style={{ color: '#e0e0e0', marginBottom: 20 }}>巡场详情</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['日期', dayjs(selectedPatrol.patrolDate).format('YYYY-MM-DD')],
                ['区域', selectedPatrol.area],
                ['提交人', selectedPatrol.submitter],
                ['提交时间', dayjs(selectedPatrol.submitTime).format('YYYY-MM-DD HH:mm')],
                ['状态', selectedPatrol.status],
                ['确认人', selectedPatrol.confirmer || '-'],
                ['确认时间', selectedPatrol.confirmTime ? dayjs(selectedPatrol.confirmTime).format('YYYY-MM-DD HH:mm') : '-'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: '#a0aec0', fontSize: 13, marginBottom: 2 }}>{label}</div>
                  <div style={{ color: '#e0e0e0', fontSize: 14 }}>{value}</div>
                </div>
              ))}
            </div>
            {selectedPatrol.notes && (
              <div style={{ marginTop: 14 }}>
                <div style={{ color: '#a0aec0', fontSize: 13, marginBottom: 2 }}>备注</div>
                <div style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedPatrol.notes}</div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
