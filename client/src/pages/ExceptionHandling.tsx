import { useEffect, useState } from 'react'
import { exceptionAPI } from '../api'
import type { Exception } from '../types'
import dayjs from 'dayjs'

const statusColors: Record<string, string> = {
  pending: '#e94560',
  handling: '#ed8936',
  resolved: '#4299e1',
  confirmed: '#48bb78',
}

const statusLabels: Record<string, string> = {
  pending: '待处理', handling: '处理中', resolved: '已解决', confirmed: '已确认',
}

const severityColors: Record<string, string> = {
  high: '#e94560',
  medium: '#ed8936',
  low: '#4299e1',
}

const severityLabels: Record<string, string> = {
  high: '高', medium: '中', low: '低',
}

function Badge({ status, colors }: { status: string; colors?: Record<string, string> }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      color: '#fff',
      background: (colors || statusColors)[status] || '#718096',
    }}>{statusLabels[status] || status}</span>
  )
}

const exceptionTypeMap: Record<string, string> = {
  equipment: '设备故障', customer: '人员异常', tournament: '赛事异常', safety: '安全隐患', other: '其他',
}
const exceptionTypeOptions = Object.entries(exceptionTypeMap)
const severityOptions = ['high', 'medium', 'low']

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
        maxHeight: '80vh',
        overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function ExceptionHandling() {
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [showAction, setShowAction] = useState(false)
  const [selectedException, setSelectedException] = useState<Exception | null>(null)
  const [actionType, setActionType] = useState('')
  const [actionNote, setActionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: '',
    exceptionType: '',
    description: '',
    severity: '',
    patrolId: '',
  })

  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  const fetchExceptions = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterStatus) params.status = filterStatus
    if (filterType) params.exceptionType = filterType
    exceptionAPI.list(params)
      .then((res) => setExceptions(res.data))
      .catch(() => setExceptions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchExceptions()
  }, [filterStatus, filterType])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await exceptionAPI.create({
        ...createForm,
        submitter: currentUser?.username || '',
        patrolId: createForm.patrolId || undefined,
      })
      setShowCreate(false)
      setCreateForm({ title: '', exceptionType: '', description: '', severity: '', patrolId: '' })
      fetchExceptions()
    } catch {
      alert('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async () => {
    if (!selectedException || !actionType) return
    setSubmitting(true)
    try {
      if (actionType === 'handle') {
        await exceptionAPI.handle(selectedException.id, { handler: currentUser?.username || '', handleNote: actionNote })
      } else if (actionType === 'resolve') {
        await exceptionAPI.resolve(selectedException.id, { handleNote: actionNote })
      } else if (actionType === 'confirm') {
        await exceptionAPI.confirm(selectedException.id, { confirmer: currentUser?.username || '' })
      }
      setShowAction(false)
      setActionNote('')
      setActionType('')
      setSelectedException(null)
      fetchExceptions()
    } catch {
      alert('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openAction = (exception: Exception, type: string) => {
    setSelectedException(exception)
    setActionType(type)
    setShowAction(true)
  }

  const getActionLabel = (status: string) => {
    switch (status) {
      case 'pending': return '开始处理'
      case 'handling': return '处理完成'
      case 'resolved': return isAdmin ? '确认处理' : ''
      case 'confirmed': return '查看详情'
      default: return ''
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
        <h2 style={{ color: '#e0e0e0', fontSize: 22, margin: 0 }}>异常处理</h2>
        <button style={btnPrimary} onClick={() => setShowCreate(true)}>提交异常</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="handling">处理中</option>
          <option value="resolved">已解决</option>
          <option value="confirmed">已确认</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">全部类型</option>
          {exceptionTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#a0aec0', textAlign: 'center', padding: 40 }}>加载中...</div>
      ) : exceptions.length === 0 ? (
        <div style={{ color: '#718096', textAlign: 'center', padding: 40 }}>暂无异常记录</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#16213e', borderRadius: 8 }}>
            <thead>
              <tr>
                <th style={thStyle}>类型</th>
                <th style={thStyle}>标题</th>
                <th style={thStyle}>严重程度</th>
                <th style={thStyle}>提交人</th>
                <th style={thStyle}>处理人</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((e, idx) => (
                <tr key={e.id} style={{ background: idx % 2 === 0 ? '#16213e' : '#1a2744' }}>
                  <td style={tdStyle}>{exceptionTypeMap[e.exceptionType] || e.exceptionType}</td>
                  <td style={tdStyle}>{e.title}</td>
                  <td style={tdStyle}>
                    <span style={{ color: severityColors[e.severity] || '#718096', fontWeight: 600 }}>{severityLabels[e.severity] || e.severity}</span>
                  </td>
                  <td style={tdStyle}>{e.submitter}</td>
                  <td style={tdStyle}>{e.handler || '-'}</td>
                  <td style={tdStyle}><Badge status={e.status} /></td>
                  <td style={tdStyle}>
                    {(() => {
                      const label = getActionLabel(e.status)
                      if (!label) return null
                      let action = ''
                      if (e.status === 'pending') action = 'handle'
                      else if (e.status === 'handling') action = 'resolve'
                      else if (e.status === 'resolved' && isAdmin) action = 'confirm'
                      if (action) {
                        return (
                          <button style={{ ...btnPrimary, padding: '4px 12px', fontSize: 12 }} onClick={() => openAction(e, action)}>
                            {label}
                          </button>
                        )
                      }
                      return (
                        <button style={{ ...btnSecondary, padding: '4px 12px', fontSize: 12 }} onClick={() => openAction(e, 'view')}>
                          {label}
                        </button>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <h3 style={{ color: '#e0e0e0', marginBottom: 20 }}>提交异常</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>标题</label>
          <input type="text" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>异常类型</label>
          <select value={createForm.exceptionType} onChange={(e) => setCreateForm({ ...createForm, exceptionType: e.target.value })} style={inputStyle}>
            <option value="">请选择</option>
            {exceptionTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>严重程度</label>
          <select value={createForm.severity} onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })} style={inputStyle}>
            <option value="">请选择</option>
            {severityOptions.map((s) => <option key={s} value={s}>{s === 'high' ? '高' : s === 'medium' ? '中' : '低'}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>描述</label>
          <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>关联巡场ID (可选)</label>
          <input type="text" value={createForm.patrolId} onChange={(e) => setCreateForm({ ...createForm, patrolId: e.target.value })} style={inputStyle} placeholder="选填" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>附件</label>
          <div style={{ padding: '10px 14px', background: '#0f3460', borderRadius: 6, color: '#718096', fontSize: 14 }}>附件功能开发中</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={btnSecondary} onClick={() => setShowCreate(false)}>取消</button>
          <button style={btnPrimary} disabled={submitting || !createForm.title || !createForm.exceptionType || !createForm.severity} onClick={handleCreate}>
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </Modal>

      <Modal open={showAction} onClose={() => { setShowAction(false); setActionNote(''); setSelectedException(null) }}>
        <h3 style={{ color: '#e0e0e0', marginBottom: 20 }}>
          {actionType === 'handle' ? '开始处理' : actionType === 'resolve' ? '处理完成' : actionType === 'confirm' ? '确认处理' : '异常详情'}
        </h3>
        {selectedException && actionType === 'view' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['标题', selectedException.title],
              ['类型', exceptionTypeMap[selectedException.exceptionType] || selectedException.exceptionType],
              ['严重程度', severityLabels[selectedException.severity] || selectedException.severity],
              ['状态', selectedException.status],
              ['提交人', selectedException.submitter],
              ['处理人', selectedException.handler || '-'],
              ['提交时间', dayjs(selectedException.submitTime).format('YYYY-MM-DD HH:mm')],
              ['处理时间', selectedException.handleTime ? dayjs(selectedException.handleTime).format('YYYY-MM-DD HH:mm') : '-'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ color: '#a0aec0', fontSize: 13, marginBottom: 2 }}>{label}</div>
                <div style={{ color: '#e0e0e0', fontSize: 14 }}>{value}</div>
              </div>
            ))}
            {selectedException.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#a0aec0', fontSize: 13, marginBottom: 2 }}>描述</div>
                <div style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedException.description}</div>
              </div>
            )}
            {selectedException.handleNote && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#a0aec0', fontSize: 13, marginBottom: 2 }}>处理备注</div>
                <div style={{ color: '#e0e0e0', fontSize: 14 }}>{selectedException.handleNote}</div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>处理备注</label>
              <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => { setShowAction(false); setActionNote(''); setSelectedException(null) }}>取消</button>
              <button style={btnPrimary} disabled={submitting} onClick={handleAction}>
                {submitting ? '处理中...' : '确认'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
