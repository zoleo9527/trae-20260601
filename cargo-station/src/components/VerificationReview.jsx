import { useCallback, useEffect, useMemo, useState } from 'react'
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

const RESULT_KEYS = ['待校验', '通过', '退回', '有异常']

const RESULT_COLORS = {
  '待校验': { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: 'var(--text-muted)', accent: '#64748b' },
  '通过': { bg: 'var(--success-bg)', border: 'rgba(34,197,94,0.3)', text: 'var(--success)', accent: '#22c55e' },
  '退回': { bg: 'var(--danger-bg)', border: 'rgba(239,68,68,0.3)', text: 'var(--danger)', accent: '#ef4444' },
  '有异常': { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: 'var(--warning)', accent: '#f59e0b' },
}

const OVERDUE_HOURS = 24
const APPROACHING_HOURS = 18

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

function collectOperators(records) {
  const set = new Set()
  for (const v of records) {
    for (const doc of v.documents) {
      if (doc.submittedBy) set.add(doc.submittedBy)
      if (doc.verifiedBy) set.add(doc.verifiedBy)
    }
    if (v.verifiedBy) set.add(v.verifiedBy)
  }
  return [...set].sort()
}

function formatElapsed(ms) {
  const hours = Math.floor(ms / 3600000)
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const rem = hours % 24
    return rem > 0 ? `${days}天${rem}时` : `${days}天`
  }
  return `${hours}时`
}

function getElapsedBadge(updatedAt) {
  const diff = Date.now() - new Date(updatedAt).getTime()
  if (diff >= OVERDUE_HOURS * 3600000) {
    return { text: formatElapsed(diff), level: 'overdue' }
  }
  if (diff >= APPROACHING_HOURS * 3600000) {
    return { text: formatElapsed(diff), level: 'approaching' }
  }
  return { text: formatElapsed(diff), level: 'normal' }
}

const ELAPSED_STYLES = {
  overdue: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.4)' },
  approaching: { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.4)' },
  normal: { bg: 'rgba(100,116,139,0.08)', color: 'var(--text-dim)', border: '1px solid var(--border)' },
}

export default function VerificationReview({ onNavigateToAcceptance }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterWaybill, setFilterWaybill] = useState('')
  const [filterOperator, setFilterOperator] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [currentOperator, setCurrentOperator] = useState('赵国安')
  const [actionLoading, setActionLoading] = useState(false)
  const [completeResult, setCompleteResult] = useState('')
  const [completeRejectReason, setCompleteRejectReason] = useState('')
  const [completeRejectCategory, setCompleteRejectCategory] = useState('')
  const [issueDocType, setIssueDocType] = useState('')
  const [issueNote, setIssueNote] = useState('')
  const [allRecords, setAllRecords] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const allRes = await api.verification.list()
      setAllRecords(allRes.data)
      const params = {}
      if (filterResult) params.result = filterResult
      if (filterWaybill) params.waybillNo = filterWaybill
      if (filterOperator) params.operator = filterOperator
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      const res = await api.verification.list(params)
      setRecords(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filterResult, filterWaybill, filterOperator, filterDateFrom, filterDateTo])

  useEffect(() => { loadData() }, [])

  const summary = useMemo(() => {
    const total = allRecords.length
    const counts = { '待校验': 0, '通过': 0, '退回': 0, '有异常': 0 }
    for (const v of allRecords) {
      if (counts[v.overallResult] !== undefined) counts[v.overallResult]++
    }
    return { total, counts }
  }, [allRecords])

  const overdueInfo = useMemo(() => {
    const now = Date.now()
    const pending = allRecords.filter(v => v.overallResult === '待校验')
    const overdue = pending.filter(v => {
      const diff = now - new Date(v.updatedAt).getTime()
      return diff >= OVERDUE_HOURS * 3600000
    })
    let earliestTime = null
    for (const v of overdue) {
      const t = new Date(v.updatedAt).getTime()
      if (!earliestTime || t < earliestTime) earliestTime = t
    }
    return { count: overdue.length, earliestTime, records: overdue }
  }, [allRecords])

  const hasActiveFilter = filterResult || filterWaybill || filterOperator || filterDateFrom || filterDateTo

  const resetFilters = useCallback(() => {
    setFilterResult('')
    setFilterWaybill('')
    setFilterOperator('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setTimeout(() => {
      api.verification.list().then(res => setRecords(res.data)).catch(() => {})
    }, 0)
  }, [])

  const applyDashboardFilter = useCallback((result) => {
    if (filterResult === result) {
      setFilterResult('')
    } else {
      setFilterResult(result)
    }
    setTimeout(() => {
      const params = {}
      const nextResult = filterResult === result ? '' : result
      if (nextResult) params.result = nextResult
      if (filterWaybill) params.waybillNo = filterWaybill
      if (filterOperator) params.operator = filterOperator
      if (filterDateFrom) params.dateFrom = filterDateFrom
      if (filterDateTo) params.dateTo = filterDateTo
      api.verification.list(params).then(res => setRecords(res.data)).catch(() => {})
    }, 0)
  }, [filterResult, filterWaybill, filterOperator, filterDateFrom, filterDateTo])

  const handleOverdueClick = useCallback(() => {
    setFilterResult('待校验')
    setTimeout(() => {
      setRecords(overdueInfo.records)
    }, 0)
  }, [overdueInfo.records])

  const handleExportCSV = useCallback(() => {
    const header = '运单号,校验结果,校验人,最近操作时间,异常单证数\n'
    const rows = records.map(v => {
      const { operator: lastOp, time: lastTime } = getLastOperator(v)
      const abnormalCount = v.documents.filter(d => d.hasIssue).length
      const waybill = `"${v.waybillNo}"`
      const result = `"${v.overallResult}"`
      const op = `"${lastOp || ''}"`
      const t = lastTime ? `"${new Date(lastTime).toLocaleString('zh-CN')}"` : '""'
      return [waybill, result, op, t, abnormalCount].join(',')
    }).join('\n')
    const csv = '\uFEFF' + header + rows
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const parts = []
    if (filterResult) parts.push(filterResult)
    if (filterWaybill) parts.push(filterWaybill)
    if (filterOperator) parts.push(filterOperator)
    const tag = parts.length > 0 ? `_${parts.join('_')}` : '_全部'
    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `校验记录${tag}_${dateStr}.csv`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [records, filterResult, filterWaybill, filterOperator])

  const operatorOptions = useMemo(() => collectOperators(allRecords), [allRecords])

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
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${RESULT_KEYS.length + 1}, 1fr)`,
        gap: 10, marginBottom: 16,
      }}>
        <div
          onClick={() => { setFilterResult(''); loadData() }}
          style={{
            padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderLeft: '4px solid var(--accent)',
            transition: 'box-shadow 0.15s',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>总数</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{summary.total}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>全部校验记录</div>
        </div>
        {RESULT_KEYS.map(key => {
          const c = RESULT_COLORS[key]
          const count = summary.counts[key]
          const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0
          const active = filterResult === key
          return (
            <div
              key={key}
              onClick={() => applyDashboardFilter(key)}
              style={{
                padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                background: active ? c.bg : 'var(--bg-card)',
                border: `1px solid ${active ? c.border : 'var(--border)'}`,
                borderLeft: `4px solid ${c.accent}`,
                boxShadow: active ? `0 0 0 1px ${c.accent}` : 'none',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 11, color: c.text, marginBottom: 4 }}>{key}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: c.accent }}>{count}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{pct}%</div>
            </div>
          )
        })}
      </div>

      {overdueInfo.count > 0 && (
        <div
          onClick={handleOverdueClick}
          style={{
            marginBottom: 16, padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
            background: 'linear-gradient(90deg, rgba(239,68,68,0.1) 0%, rgba(245,158,11,0.06) 100%)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderLeft: '4px solid var(--danger)',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: 'var(--danger)', fontSize: 13 }}>
              逾期待办: {overdueInfo.count} 条记录超{OVERDUE_HOURS}小时未处理
            </span>
            {overdueInfo.earliestTime && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>
                最早待处理: {new Date(overdueInfo.earliestTime).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            点击查看 →
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>运单号</label>
          <input className="input" placeholder="运单号" value={filterWaybill}
            onChange={e => setFilterWaybill(e.target.value)} style={{ width: 130 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>校验结果</label>
          <select className="input" value={filterResult}
            onChange={e => setFilterResult(e.target.value)} style={{ width: 100 }}>
            <option value="">全部</option>
            <option value="待校验">待校验</option>
            <option value="通过">通过</option>
            <option value="退回">退回</option>
            <option value="有异常">有异常</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>校验人</label>
          <select className="input" value={filterOperator}
            onChange={e => setFilterOperator(e.target.value)} style={{ width: 110 }}>
            <option value="">全部</option>
            {operatorOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>开始日期</label>
          <input type="date" className="input" value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)} style={{ width: 140 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>结束日期</label>
          <input type="date" className="input" value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)} style={{ width: 140 }} />
        </div>
        <button className="btn btn-primary" onClick={loadData}>筛选</button>
        <button className="btn btn-ghost" onClick={resetFilters}>重置</button>
        {hasActiveFilter && (
          <span style={{ fontSize: 12, color: 'var(--accent)', lineHeight: '36px' }}>
            已筛选 {records.length} / {summary.total}
          </span>
        )}
        <button className="btn btn-ghost" onClick={handleExportCSV}
          disabled={records.length === 0}
          style={{ marginLeft: 'auto', fontSize: 12 }}>
          📥 导出CSV
        </button>
      </div>

      {loading ? (
        <div style={{
          textAlign: 'center', padding: 60, color: 'var(--text-dim)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 28, opacity: 0.4 }}>⏳</div>
          <div>正在加载校验记录...</div>
        </div>
      ) : records.length === 0 && summary.total === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, color: 'var(--text-dim)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 28, opacity: 0.4 }}>📋</div>
          <div>系统中暂无校验记录</div>
          <div style={{ fontSize: 12 }}>请先在"入库受理处理"中提交受理记录</div>
        </div>
      ) : records.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, color: 'var(--text-dim)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 28, opacity: 0.4 }}>🔍</div>
          <div>当前筛选条件下无匹配记录</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            共 {summary.total} 条记录，当前筛选结果为空
          </div>
          <button className="btn btn-ghost" onClick={resetFilters} style={{ marginTop: 6 }}>
            重置筛选条件
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {records.map(v => {
            const abnormalCount = v.documents.filter(d => d.hasIssue).length
            const { operator: lastOp, time: lastTime } = getLastOperator(v)
            const elapsed = getElapsedBadge(v.updatedAt)
            const elapsedStyle = ELAPSED_STYLES[elapsed.level]
            return (
              <div key={v.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedRecord(v); setCompleteResult(''); setCompleteRejectReason(''); setCompleteRejectCategory(''); setIssueDocType(''); setIssueNote('') }}>
                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.waybillNo}</span>
                    <span className={`badge ${resultBadge(v.overallResult)}`}>{v.overallResult}</span>
                    <span style={{
                      padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      background: elapsedStyle.bg, color: elapsedStyle.color,
                      border: elapsedStyle.border,
                    }}>
                      {elapsed.text}
                    </span>
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
                  <div style={{ textAlign: 'right', minWidth: 130, marginLeft: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
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
                    {onNavigateToAcceptance && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 10, padding: '2px 8px', marginTop: 2 }}
                        onClick={e => {
                          e.stopPropagation()
                          onNavigateToAcceptance(v.acceptanceId, v.waybillNo)
                        }}
                      >
                        → 受理记录
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
