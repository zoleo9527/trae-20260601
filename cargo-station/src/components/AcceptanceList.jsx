import { useEffect, useState } from 'react'
import { api } from '../api'

const STATUS_OPTIONS = ['待受理', '受理中', '待单证校验', '单证校验中', '校验退回', '校验通过', '待入库', '已入库']
const CARGO_OPTIONS = ['普货', '锂电池', '危险化学品', '生鲜冷链', '药品', '精密仪器', '纺织品', '文件资料']

export default function AcceptanceList() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', cargoType: '', waybillNo: '', flightNo: '', shipper: '' })
  const [total, setTotal] = useState(0)
  const [detailRecord, setDetailRecord] = useState(null)
  const [verification, setVerification] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await api.acceptance.list(params)
      setRecords(res.data)
      setTotal(res.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleFilter = () => { loadData() }
  const handleReset = () => {
    setFilters({ status: '', cargoType: '', waybillNo: '', flightNo: '', shipper: '' })
    setTimeout(() => loadData(), 0)
  }

  const statusBadge = (status) => {
    const map = {
      '待受理': 'badge-pending', '受理中': 'badge-processing', '待单证校验': 'badge-pending',
      '单证校验中': 'badge-processing', '校验退回': 'badge-danger', '校验通过': 'badge-success',
      '待入库': 'badge-warning', '已入库': 'badge-success',
    }
    return map[status] || 'badge-pending'
  }

  const cargoTagColor = (type) => {
    const map = {
      '锂电池': 'var(--danger)', '危险化学品': 'var(--danger)',
      '药品': 'var(--info)', '生鲜冷链': 'var(--info)',
      '精密仪器': 'var(--warning)',
    }
    return map[type] || 'var(--text-muted)'
  }

  const showDetail = async (record) => {
    setDetailRecord(record)
    try {
      const res = await api.verification.list({ acceptanceId: record.id })
      if (res.data.length > 0) setVerification(res.data[0])
      else setVerification(null)
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>运单号</label>
          <input className="input" placeholder="运单号" value={filters.waybillNo}
            onChange={e => setFilters(f => ({ ...f, waybillNo: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>航班号</label>
          <input className="input" placeholder="航班号" value={filters.flightNo}
            onChange={e => setFilters(f => ({ ...f, flightNo: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>货主</label>
          <input className="input" placeholder="货主名称" value={filters.shipper}
            onChange={e => setFilters(f => ({ ...f, shipper: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>状态</label>
          <select className="input" value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">全部状态</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>货物类型</label>
          <select className="input" value={filters.cargoType}
            onChange={e => setFilters(f => ({ ...f, cargoType: e.target.value }))}>
            <option value="">全部类型</option>
            {CARGO_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleFilter}>筛选</button>
        <button className="btn btn-ghost" onClick={handleReset}>重置</button>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: '36px' }}>
          共 {total} 条
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>加载中...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>运单号</th>
                  <th>航班号</th>
                  <th>货主</th>
                  <th>货物类型</th>
                  <th>重量(kg)</th>
                  <th>件数</th>
                  <th>状态</th>
                  <th>当前处理人</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-dim)' }}>{r.id}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{r.waybillNo}</td>
                    <td>{r.flightNo}</td>
                    <td>{r.shipper}</td>
                    <td>
                      <span className="tag" style={{
                        color: cargoTagColor(r.cargoType),
                        background: r.cargoType === '锂电池' || r.cargoType === '危险化学品'
                          ? 'var(--danger-bg)' : (r.cargoType === '药品' || r.cargoType === '生鲜冷链' ? 'var(--info-bg)' : 'rgba(100,116,139,0.15)')
                      }}>
                        {r.cargoType}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{r.weight}</td>
                    <td style={{ textAlign: 'center' }}>{r.pieces}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                    <td style={{ fontSize: 12 }}>{r.currentHandler}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {new Date(r.updatedAt).toLocaleString('zh-CN')}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => showDetail(r)}>详情</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailRecord && (
        <div className="modal-overlay" onClick={() => setDetailRecord(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>受理详情 · {detailRecord.waybillNo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  创建于 {new Date(detailRecord.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetailRecord(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['航班号', detailRecord.flightNo],
                  ['货主', detailRecord.shipper],
                  ['货物类型', detailRecord.cargoType],
                  ['重量', detailRecord.weight + ' kg'],
                  ['件数', detailRecord.pieces],
                  ['状态', detailRecord.status],
                  ['当前处理人', detailRecord.currentHandler],
                  ['处理人角色', detailRecord.currentHandlerRole],
                  ['创建时间', new Date(detailRecord.createdAt).toLocaleString('zh-CN')],
                  ['更新时间', new Date(detailRecord.updatedAt).toLocaleString('zh-CN')],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14 }}>{val}</div>
                  </div>
                ))}
              </div>

              {verification && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    单证校验信息
                  </div>
                  <table style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>单证类型</th>
                        <th>已提交</th>
                        <th>已校验</th>
                        <th>异常</th>
                        <th>提交人</th>
                        <th>校验人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verification.documents.map(doc => (
                        <tr key={doc.docType}>
                          <td>{doc.docType}</td>
                          <td>{doc.submitted ? '✓' : '—'}</td>
                          <td>{doc.verified ? '✓' : '—'}</td>
                          <td>{doc.hasIssue ? <span style={{ color: 'var(--danger)' }}>{doc.issueNote}</span> : '—'}</td>
                          <td style={{ fontSize: 11 }}>{doc.submittedBy || '—'}</td>
                          <td style={{ fontSize: 11 }}>{doc.verifiedBy || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 10, fontSize: 13 }}>
                    校验结果: <span className={`badge ${verification.overallResult === '通过' ? 'badge-success' : verification.overallResult === '退回' ? 'badge-danger' : 'badge-pending'}`}>
                      {verification.overallResult}
                    </span>
                    {verification.rejectReason && (
                      <span style={{ marginLeft: 10, color: 'var(--danger)', fontSize: 12 }}>退回原因: {verification.rejectReason}</span>
                    )}
                  </div>
                </>
              )}
              {!verification && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, borderTop: '1px solid var(--border)' }}>
                  尚未提交单证校验
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
