import { useEffect, useState } from 'react'
import { patrolAPI, exceptionAPI, statusLogAPI } from '../api'
import type { Patrol, StatusLog, Attachment } from '../types'
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

function Drawer({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 520,
      background: '#16213e',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
      zIndex: 1001,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>
        {children}
      </div>
    </div>
  )
}

function DrawerOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 1000,
    }} onClick={onClose} />
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

function StatusTimeline({ logs }: { logs: (StatusLog & { operatorName?: string })[] }) {
  if (logs.length === 0) {
    return <div style={{ color: '#718096', fontSize: 13, padding: '8px 0' }}>暂无流转记录</div>
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 24, marginTop: 8 }}>
      <div style={{
        position: 'absolute',
        left: 7,
        top: 6,
        bottom: 6,
        width: 2,
        background: '#0f3460',
      }} />
      {logs.map((log, idx) => {
        const isLast = idx === logs.length - 1
        const dotColor = statusColors[log.toStatus] || '#718096'
        return (
          <div key={log.id} style={{ position: 'relative', marginBottom: isLast ? 0 : 18, paddingLeft: 20 }}>
            <div style={{
              position: 'absolute',
              left: -20,
              top: 5,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: dotColor,
              border: '2px solid #16213e',
            }} />
            <div style={{ color: '#e0e0e0', fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: dotColor, fontWeight: 600 }}>
                {statusLabels[log.toStatus] || log.toStatus}
              </span>
              {log.fromStatus && log.fromStatus !== '' && (
                <span style={{ color: '#718096' }}>
                  {' '}← {statusLabels[log.fromStatus] || log.fromStatus}
                </span>
              )}
            </div>
            <div style={{ color: '#a0aec0', fontSize: 12, marginTop: 2 }}>
              {log.operatorName || log.operator} · {dayjs(log.operateTime).format('YYYY-MM-DD HH:mm')}
            </div>
            {log.note && (
              <div style={{ color: '#718096', fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>{log.note}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function NightPatrol() {
  const [patrols, setPatrols] = useState<Patrol[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedPatrol, setSelectedPatrol] = useState<Patrol | null>(null)
  const [statusLogs, setStatusLogs] = useState<(StatusLog & { operatorName?: string })[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmResult, setConfirmResult] = useState('')
  const [confirmNote, setConfirmNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({ patrolDate: '', area: '', notes: '' })

  const [showAttachInput, setShowAttachInput] = useState(false)
  const [attachFilename, setAttachFilename] = useState('')
  const [attachSubmitting, setAttachSubmitting] = useState(false)

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

  const openDrawer = async (patrol: Patrol) => {
    setSelectedPatrol(patrol)
    setShowDrawer(true)
    try {
      const res = await statusLogAPI.list({ recordType: 'patrol', recordId: String(patrol.id) })
      setStatusLogs(res.data)
    } catch {
      setStatusLogs([])
    }
  }

  const closeDrawer = () => {
    setShowDrawer(false)
    setSelectedPatrol(null)
    setStatusLogs([])
    setShowAttachInput(false)
    setAttachFilename('')
  }

  const refreshDrawerData = async (patrolId: string) => {
    const fresh = await patrolAPI.get(patrolId)
    setSelectedPatrol(fresh.data)
    const logs = await statusLogAPI.list({ recordType: 'patrol', recordId: patrolId })
    setStatusLogs(logs.data)
  }

  const handleAddAttachment = async () => {
    if (!selectedPatrol || !attachFilename.trim()) return
    setAttachSubmitting(true)
    try {
      await patrolAPI.addAttachment(String(selectedPatrol.id), {
        filename: attachFilename.trim(),
        uploader: currentUser?.username || '',
      })
      setAttachFilename('')
      setShowAttachInput(false)
      await refreshDrawerData(String(selectedPatrol.id))
      fetchPatrols()
    } catch {
      alert('添加附件失败')
    } finally {
      setAttachSubmitting(false)
    }
  }

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
      fetchPatrols()
      if (showDrawer && selectedPatrol) {
        const fresh = await patrolAPI.get(String(selectedPatrol.id))
        setSelectedPatrol(fresh.data)
        const logs = await statusLogAPI.list({ recordType: 'patrol', recordId: String(selectedPatrol.id) })
        setStatusLogs(logs.data)
      }
      if (!showDrawer) {
        setSelectedPatrol(null)
      }
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

  const btnSmall: React.CSSProperties = {
    ...btnPrimary,
    padding: '4px 12px',
    fontSize: 12,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#a0aec0',
    marginBottom: 6,
    fontSize: 14,
  }

  const detailLabelStyle: React.CSSProperties = {
    color: '#a0aec0',
    fontSize: 12,
    marginBottom: 2,
  }

  const detailValueStyle: React.CSSProperties = {
    color: '#e0e0e0',
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
                <th style={thStyle}>附件</th>
                <th style={thStyle}>确认人</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {patrols.map((p, idx) => (
                <tr key={p.id} style={{ background: idx % 2 === 0 ? '#16213e' : '#1a2744', cursor: 'pointer' }} onClick={() => openDrawer(p)}>
                  <td style={tdStyle}>{dayjs(p.patrolDate).format('YYYY-MM-DD')}</td>
                  <td style={tdStyle}>{p.area}</td>
                  <td style={tdStyle}>{p.submitter}</td>
                  <td style={tdStyle}>{dayjs(p.submitTime).format('YYYY-MM-DD HH:mm')}</td>
                  <td style={tdStyle}><Badge status={p.status} /></td>
                  <td style={tdStyle}>
                    {(() => {
                      const count = Array.isArray(p.attachments) ? p.attachments.length : 0
                      if (count === 0) return <span style={{ color: '#718096' }}>-</span>
                      return (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#fff',
                          background: '#0f3460',
                          border: '1px solid #1a3a6e',
                        }}>{count}</span>
                      )
                    })()}
                  </td>
                  <td style={tdStyle}>{p.confirmer || '-'}</td>
                  <td style={tdStyle} onClick={(ev) => ev.stopPropagation()}>
                    {p.status === 'pending' && (
                      <button style={{ ...btnPrimary, padding: '4px 12px', fontSize: 12 }} onClick={() => openConfirm(p)}>
                        确认
                      </button>
                    )}
                    <button style={{ ...btnSecondary, padding: '4px 12px', fontSize: 12, marginLeft: p.status === 'pending' ? 6 : 0 }} onClick={() => openDrawer(p)}>
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

      <DrawerOverlay open={showDrawer} onClose={closeDrawer} />
      <Drawer open={showDrawer}>
        {selectedPatrol && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#e0e0e0', fontSize: 18, margin: 0 }}>巡场详情</h3>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: '#a0aec0', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              <div>
                <div style={detailLabelStyle}>巡场日期</div>
                <div style={detailValueStyle}>{dayjs(selectedPatrol.patrolDate).format('YYYY-MM-DD')}</div>
              </div>
              <div>
                <div style={detailLabelStyle}>巡场区域</div>
                <div style={detailValueStyle}>{selectedPatrol.area}</div>
              </div>
              <div>
                <div style={detailLabelStyle}>提交人</div>
                <div style={detailValueStyle}>{selectedPatrol.submitter}</div>
              </div>
              <div>
                <div style={detailLabelStyle}>提交时间</div>
                <div style={detailValueStyle}>{dayjs(selectedPatrol.submitTime).format('YYYY-MM-DD HH:mm')}</div>
              </div>
              <div>
                <div style={detailLabelStyle}>当前状态</div>
                <div><Badge status={selectedPatrol.status} /></div>
              </div>
              <div>
                <div style={detailLabelStyle}>确认人</div>
                <div style={detailValueStyle}>{selectedPatrol.confirmer || '-'}</div>
              </div>
              <div>
                <div style={detailLabelStyle}>确认时间</div>
                <div style={detailValueStyle}>{selectedPatrol.confirmTime ? dayjs(selectedPatrol.confirmTime).format('YYYY-MM-DD HH:mm') : '-'}</div>
              </div>
            </div>

            {selectedPatrol.notes && (
              <div style={{ marginBottom: 20 }}>
                <div style={detailLabelStyle}>备注</div>
                <div style={{ ...detailValueStyle, lineHeight: 1.6 }}>{selectedPatrol.notes}</div>
              </div>
            )}

            <div style={{ marginBottom: 20, paddingTop: 20, borderTop: '1px solid #0f3460' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>
                  附件 ({Array.isArray(selectedPatrol.attachments) ? selectedPatrol.attachments.length : 0})
                </div>
                <button
                  style={{ ...btnSmall, background: '#0f3460', border: '1px solid #1a3a6e' }}
                  onClick={() => setShowAttachInput(!showAttachInput)}
                >
                  {showAttachInput ? '取消' : '+ 添加附件'}
                </button>
              </div>

              {showAttachInput && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={attachFilename}
                    onChange={(e) => setAttachFilename(e.target.value)}
                    placeholder="输入文件名，如：巡场照片.jpg"
                    style={{ ...inputStyle, flex: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && attachFilename.trim()) handleAddAttachment() }}
                  />
                  <button
                    style={btnPrimary}
                    disabled={attachSubmitting || !attachFilename.trim()}
                    onClick={handleAddAttachment}
                  >
                    {attachSubmitting ? '...' : '添加'}
                  </button>
                </div>
              )}

              {Array.isArray(selectedPatrol.attachments) && selectedPatrol.attachments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedPatrol.attachments.map((att: Attachment, idx: number) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: '#0f3460',
                      borderRadius: 6,
                      border: '1px solid #1a3a6e',
                    }}>
                      <span style={{ fontSize: 16 }}>📎</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e0e0e0', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.filename}</div>
                        <div style={{ color: '#718096', fontSize: 11, marginTop: 2 }}>
                          {att.uploader} · {dayjs(att.uploadTime).format('YYYY-MM-DD HH:mm')} · {att.fileSize}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#718096', fontSize: 13 }}>暂无附件</div>
              )}
            </div>

            <div style={{ paddingTop: 20, borderTop: '1px solid #0f3460' }}>
              <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                状态流转记录
              </div>
              <StatusTimeline logs={statusLogs} />
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}
