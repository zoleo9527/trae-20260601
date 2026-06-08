import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

const SECURITY_INSPECTORS = ['赵国安', '钱卫东', '孙磊']

const REJECT_CATEGORIES = [
  '单证信息与运单不一致',
  '缺少必要单证',
  '危险品申报不完整',
  '签章或签名缺失',
  '有效期已过',
  '温控记录不达标',
  '其他',
]

function getLastOperator(verification) {
  let lastOp = ''
  let lastTime = ''
  for (const doc of verification.documents) {
    if (doc.verifiedBy && doc.verifiedAt) {
      if (!lastTime || new Date(doc.verifiedAt) > new Date(lastTime)) {
        lastOp = doc.verifiedBy
        lastTime = doc.verifiedAt
      }
    }
    if (doc.submittedBy && doc.submittedAt) {
      if (!lastTime || new Date(doc.submittedAt) > new Date(lastTime)) {
        lastOp = doc.submittedBy
        lastTime = doc.submittedAt
      }
    }
  }
  if (verification.verifiedBy && verification.updatedAt) {
    if (!lastTime || new Date(verification.updatedAt) > new Date(lastTime)) {
      lastOp = verification.verifiedBy
      lastTime = verification.updatedAt
    }
  }
  return { operator: lastOp, time: lastTime }
}

export default function VerificationReview() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterWaybill, setFilterWaybill] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [currentOperator, setCurrentOperator] = useState('赵国安')
  const [actionLoading, setActionLoading] = useState(false)
  const [completeResult, setCompleteResult] = useState('')
  const [completeRejectReason, setCompleteRejectReason] = useState('')
  const [completeRejectCategory, setCompleteRejectCategory] = useState('')
  const [issueDocType, setIssueDocType] = useState('')
  const [issueNote, setIssueNote] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterResult) params.result = filterResult
      if (filterWaybill) params.waybillNo = filterWaybill
      const res = await api.verification.list(params)
      setRecords(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filterResult, filterWaybill])

  useEffect(() => { loadData() }, [])

  const refreshSelectedRecord = useCallback(async () => {
    if (!selectedRecord) return
    try {
      const fresh = await api.verification.get(selectedRecord.id)
      setSelectedRecord(fresh)
    } catch (e) { console.error(e) }
  }, [selectedRecord])

  const resultBadge = (result) => {
    const map = { '通过': 'badge-success', '退回': 'badge-danger', '有异常': 'badge-warning', '待校验': 'badge-pending' }
    return map[result] || 'badge-pending'
  }

  const docStatusIcon = (doc) => {
    if (doc.hasIssue) return { icon: '✗', color: 'var(--danger)' }
    if (doc.verified) return { icon: '✓', color: 'var(--success)' }
    if (doc.submitted) return { icon: '●', color: 'var(--info)' }
    return { icon: '○', color: 'var(--text-dim)' }
  }

  const handleSubmitDoc = async (doc) => {
    if (doc.submitted) return
    setActionLoading(true)
    try {
      await api.verification.submitDoc(selectedRecord.id, {
        docType: doc.docType,
        operator: currentOperator,
        operatorRole: 'security_inspector',
      })
      await refreshSelectedRecord()
      await loadData()
    } catch (e) { alert('提交失败: ' + e.message) }
    setActionLoading(false)
  }

  const handleVerifyDoc = async (doc, passed) => {
    if (!doc.submitted) {
      alert('请先标记单证为已提交')
      return
    }
    if (doc.verified) return

    let note = ''
    if (!passed) {
      if (doc.docType !== issueDocType) {
        setIssueDocType(doc.docType)
        setIssueNote('')
        setActionLoading(false)
        return
      }
      note = issueNote
      if (!note.trim()) {
        alert('退回单证必须填写异常说明')
        return
      }
    }

    setActionLoading(true)
    try {
      await api.verification.verify(selectedRecord.id, {
        docType: doc.docType,
        passed,
        issueNote: note,
        operator: currentOperator,
        operatorRole: 'security_inspector',
      })
      setIssueDocType('')
      setIssueNote('')
      await refreshSelectedRecord()
      await loadData()
    } catch (e) { alert('校验失败: ' + e.message) }
    setActionLoading(false)
  }

  const handleComplete = async () => {
    if (!completeResult) {
      alert('请选择校验结论')
      return
    }
    if (completeResult === '退回') {
      if (!completeRejectCategory && !completeRejectReason.trim()) {
        alert('退回时必须选择原因分类或填写具体原因')
        return
      }
    }

    setActionLoading(true)
    try {
      const reason = completeResult === '退回'
        ? [completeRejectCategory, completeRejectReason].filter(Boolean).join('：')
        : ''
      await api.verification.complete(selectedRecord.id, {
        result: completeResult,
        rejectReason: reason,
        operator: currentOperator,
        operatorRole: 'security_inspector',
      })
      setCompleteResult('')
      setCompleteRejectReason('')
      setCompleteRejectCategory('')
      await refreshSelectedRecord()
      await loadData()
    } catch (e) { alert('出结论失败: ' + e.message) }
    setActionLoading(false)
  }

  const canOperate = selectedRecord && selectedRecord.overallResult === '待校验'

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>运单号</label>
          <input className="input" placeholder="运单号" value={filterWaybill}
            onChange={e => setFilterWaybill(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>校验结果</label>
          <select className="input" value={filterResult}
            onChange={e => setFilterResult(e.target.value)}>
            <option value="">全部</option>
            <option value="待校验">待校验</option>
            <option value="通过">通过</option>
            <option value="退回">退回</option>
            <option value="有异常">有异常</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={loadData}>筛选</button>
        <button className="btn btn-ghost" onClick={() => { setFilterResult(''); setFilterWaybill(''); setTimeout(loadData, 0) }}>重置</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {records.map(v => {
            const abnormalCount = v.documents.filter(d => d.hasIssue).length
            const { operator: lastOp, time: lastTime } = getLastOperator(v)
            return (
              <div key={v.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedRecord(v); setCompleteResult(''); setCompleteRejectReason(''); setCompleteRejectCategory(''); setIssueDocType(''); setIssueNote('') }}>
                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.waybillNo}</span>
                    <span className={`badge ${resultBadge(v.overallResult)}`}>{v.overallResult}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {v.documents.length} 份单证
                    </span>
                    {abnormalCount > 0 && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: 'var(--danger-bg)', color: 'var(--danger)',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}>
                        {abnormalCount} 项异常
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {v.documents.map(doc => {
                      const s = docStatusIcon(doc)
                      return (
                        <span key={doc.docType} title={`${doc.docType}: ${doc.verified ? '已校验' : doc.submitted ? '已提交' : '未提交'}${doc.hasIssue ? ' (异常)' : ''}`}
                          style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: s.color, display: 'inline-block',
                            opacity: doc.submitted || doc.verified ? 1 : 0.3,
                          }} />
                      )
                    })}
                  </div>
                </div>
                <div style={{ padding: '0 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {v.documents.map(doc => {
                      const s = docStatusIcon(doc)
                      return (
                        <div key={doc.docType} style={{
                          padding: '4px 10px', borderRadius: 4, fontSize: 11,
                          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5,
                          borderColor: doc.hasIssue ? 'rgba(239,68,68,0.3)' : doc.verified ? 'rgba(34,197,94,0.3)' : 'var(--border)',
                          background: doc.hasIssue ? 'var(--danger-bg)' : doc.verified ? 'var(--success-bg)' : 'transparent',
                        }}>
                          <span style={{ color: s.color, fontWeight: 700 }}>{s.icon}</span>
                          {doc.docType}
                          {doc.hasIssue && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>异常</span>}
                          {doc.verified && !doc.hasIssue && <span style={{ color: 'var(--success)', marginLeft: 4 }}>通过</span>}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 130, marginLeft: 12 }}>
                    {lastOp && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        最近: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{lastOp}</span>
                      </div>
                    )}
                    {lastTime && (
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        {new Date(lastTime).toLocaleString('zh-CN')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {records.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>暂无校验记录</div>
          )}
        </div>
      )}

      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '95%' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>单证校验详情 · {selectedRecord.waybillNo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  校验结果: <span className={`badge ${resultBadge(selectedRecord.overallResult)}`}>{selectedRecord.overallResult}</span>
                  {selectedRecord.verifiedBy && <span style={{ marginLeft: 10 }}>校验人: {selectedRecord.verifiedBy}</span>}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="modal-body">
              {canOperate && (
                <div style={{
                  marginBottom: 18, padding: '14px 16px', borderRadius: 8,
                  background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>整体出结论</span>
                    <select className="input" value={currentOperator} onChange={e => setCurrentOperator(e.target.value)} style={{ width: 100, fontSize: 12 }}>
                      {SECURITY_INSPECTORS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className={`btn btn-sm ${completeResult === '通过' ? 'btn-success' : 'btn-ghost'}`}
                      onClick={() => { setCompleteResult('通过'); setCompleteRejectReason(''); setCompleteRejectCategory('') }}
                      style={completeResult === '通过' ? { boxShadow: '0 0 0 2px var(--success)' } : {}}>
                      ✓ 校验通过
                    </button>
                    <button className={`btn btn-sm ${completeResult === '退回' ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => setCompleteResult('退回')}
                      style={completeResult === '退回' ? { boxShadow: '0 0 0 2px var(--danger)' } : {}}>
                      ✗ 校验退回
                    </button>
                    {completeResult && (
                      <button className="btn btn-primary btn-sm" onClick={handleComplete} disabled={actionLoading}>
                        {actionLoading ? '提交中...' : '确认提交结论'}
                      </button>
                    )}
                  </div>
                  {completeResult === '退回' && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'start' }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>原因分类</label>
                        <select className="input" value={completeRejectCategory}
                          onChange={e => setCompleteRejectCategory(e.target.value)} style={{ fontSize: 12 }}>
                          <option value="">请选择</option>
                          {REJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>具体原因</label>
                        <input className="input" style={{ width: '100%', fontSize: 12 }}
                          placeholder="退回必须填写具体原因" value={completeRejectReason}
                          onChange={e => setCompleteRejectReason(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <table style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>单证类型</th>
                    <th>提交状态</th>
                    <th>校验状态</th>
                    <th>异常说明</th>
                    <th>提交人</th>
                    <th>校验人</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecord.documents.map(doc => (
                    <tr key={doc.docType}>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{doc.docType}</td>
                      <td>
                        {doc.submitted
                          ? <span style={{ color: 'var(--success)', fontSize: 12 }}>已提交</span>
                          : canOperate
                            ? <button className="btn btn-sm btn-ghost" disabled={actionLoading}
                                onClick={() => handleSubmitDoc(doc)} style={{ fontSize: 11, padding: '2px 8px' }}>
                                标记已提交
                              </button>
                            : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>未提交</span>}
                      </td>
                      <td>
                        {doc.verified
                          ? <span style={{ color: doc.hasIssue ? 'var(--danger)' : 'var(--success)', fontSize: 12 }}>
                              {doc.hasIssue ? '退回' : '通过'}
                            </span>
                          : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>待校验</span>}
                      </td>
                      <td style={{ maxWidth: 180 }}>
                        {doc.hasIssue
                          ? <span style={{ color: 'var(--danger)', fontSize: 11, wordBreak: 'break-all' }}>{doc.issueNote}</span>
                          : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
                        {issueDocType === doc.docType && canOperate && (
                          <div style={{ marginTop: 4 }}>
                            <input className="input" style={{ width: '100%', fontSize: 11, padding: '3px 6px' }}
                              placeholder="填写异常说明" value={issueNote}
                              onChange={e => setIssueNote(e.target.value)} />
                            <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                              <button className="btn btn-sm btn-danger" disabled={actionLoading || !issueNote.trim()}
                                style={{ fontSize: 10, padding: '2px 6px' }}
                                onClick={() => handleVerifyDoc(doc, false)}>
                                确认退回
                              </button>
                              <button className="btn btn-sm btn-ghost"
                                style={{ fontSize: 10, padding: '2px 6px' }}
                                onClick={() => { setIssueDocType(''); setIssueNote('') }}>
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{doc.submittedBy || '—'}</td>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{doc.verifiedBy || '—'}</td>
                      <td>
                        {canOperate && doc.submitted && !doc.verified && issueDocType !== doc.docType && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm btn-success" disabled={actionLoading}
                              style={{ fontSize: 10, padding: '2px 6px' }}
                              onClick={() => handleVerifyDoc(doc, true)}>
                              ✓ 通过
                            </button>
                            <button className="btn btn-sm btn-danger" disabled={actionLoading}
                              style={{ fontSize: 10, padding: '2px 6px' }}
                              onClick={() => { setIssueDocType(doc.docType); setIssueNote('') }}>
                              ✗ 退回
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedRecord.rejectReason && (
                <div style={{
                  marginTop: 14, padding: '10px 14px', background: 'var(--danger-bg)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 13
                }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>退回原因: </span>
                  <span style={{ color: 'var(--text)' }}>{selectedRecord.rejectReason}</span>
                </div>
              )}

              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderRadius: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>创建时间: {new Date(selectedRecord.createdAt).toLocaleString('zh-CN')}</div>
                  <div>更新时间: {new Date(selectedRecord.updatedAt).toLocaleString('zh-CN')}</div>
                  <div>提交单证: {selectedRecord.documents.filter(d => d.submitted).length} / {selectedRecord.documents.length}</div>
                  <div>已校验: {selectedRecord.documents.filter(d => d.verified).length} / {selectedRecord.documents.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
