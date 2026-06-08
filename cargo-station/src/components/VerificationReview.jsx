import { useEffect, useState } from 'react'
import { api } from '../api'

export default function VerificationReview() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterWaybill, setFilterWaybill] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterResult) params.result = filterResult
      if (filterWaybill) params.waybillNo = filterWaybill
      const res = await api.verification.list(params)
      setRecords(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

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
          {records.map(v => (
            <div key={v.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(v)}>
              <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.waybillNo}</span>
                  <span className={`badge ${resultBadge(v.overallResult)}`}>{v.overallResult}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {v.documents.length} 份单证
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    异常: {v.documents.filter(d => d.hasIssue).length}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {v.documents.map(doc => {
                    const s = docStatusIcon(doc)
                    return (
                      <span key={doc.docType} title={`${doc.docType}: ${doc.verified ? '已校验' : doc.submitted ? '已提交' : '未提交'}${doc.hasIssue ? ' (异常)' : ''}`}
                        style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: s.color, display: 'inline-block',
                          opacity: doc.submitted ? 1 : 0.3
                        }} />
                    )
                  })}
                </div>
              </div>
              <div style={{ padding: '0 18px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {v.documents.map(doc => {
                  const s = docStatusIcon(doc)
                  return (
                    <div key={doc.docType} style={{
                      padding: '4px 10px', borderRadius: 4, fontSize: 11,
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5,
                      borderColor: doc.hasIssue ? 'rgba(239,68,68,0.3)' : 'var(--border)',
                      background: doc.hasIssue ? 'var(--danger-bg)' : 'transparent',
                    }}>
                      <span style={{ color: s.color, fontWeight: 700 }}>{s.icon}</span>
                      {doc.docType}
                      {doc.hasIssue && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>异常</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>暂无校验记录</div>
          )}
        </div>
      )}

      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 850 }}>
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
              <table>
                <thead>
                  <tr>
                    <th>单证类型</th>
                    <th>提交状态</th>
                    <th>校验状态</th>
                    <th>异常</th>
                    <th>提交人</th>
                    <th>提交时间</th>
                    <th>校验人</th>
                    <th>校验时间</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecord.documents.map(doc => (
                    <tr key={doc.docType}>
                      <td style={{ fontWeight: 500 }}>{doc.docType}</td>
                      <td>
                        {doc.submitted
                          ? <span style={{ color: 'var(--success)' }}>已提交</span>
                          : <span style={{ color: 'var(--text-dim)' }}>未提交</span>}
                      </td>
                      <td>
                        {doc.verified
                          ? <span style={{ color: 'var(--success)' }}>已校验</span>
                          : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                      </td>
                      <td>
                        {doc.hasIssue
                          ? <span style={{ color: 'var(--danger)', fontSize: 12 }}>{doc.issueNote}</span>
                          : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>{doc.submittedBy || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {doc.submittedAt ? new Date(doc.submittedAt).toLocaleString('zh-CN') : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>{doc.verifiedBy || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleString('zh-CN') : '—'}
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
