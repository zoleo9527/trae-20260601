import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api.js'
import { useRole } from '../context/RoleContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import RiskBadge from '../components/RiskBadge.jsx'

const STATUS_OPTIONS = [
  { value: '',                label: '全部状态' },
  { value: 'pending_dispatch',label: '待派发' },
  { value: 'dispatched',      label: '已派发待整改' },
  { value: 'rectified',       label: '待复检' },
  { value: 'rejected',        label: '已驳回待补录' },
  { value: 'passed',          label: '复检通过' }
]

const RISK_OPTIONS = [
  { value: '',       label: '全部风险' },
  { value: 'high',   label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low',    label: '低风险' }
]

export default function TaskList() {
  const { role, current } = useRole()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [batchNote, setBatchNote] = useState('')
  const [batchResult, setBatchResult] = useState('')
  const [batchRejectReason, setBatchRejectReason] = useState('')
  const [showBatch, setShowBatch] = useState(false)

  const load = () => {
    setLoading(true)
    const params = { role }
    if (status) params.status = status
    if (riskLevel) params.riskLevel = riskLevel
    api.getRecords(params).then(d => { setRecords(d.records); setLoading(false); setSelected(new Set()) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [status, riskLevel, role])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return records
    const k = keyword.trim().toLowerCase()
    return records.filter(r =>
      r.title.toLowerCase().includes(k) ||
      r.location.toLowerCase().includes(k) ||
      r.id.toLowerCase().includes(k)
    )
  }, [records, keyword])

  const toggleOne = (id) => {
    const n = new Set(selected)
    n.has(id) ? n.delete(id) : n.add(id)
    setSelected(n)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  const canBatchDispatch = role === 'supervisor' && [...selected].every(id => {
    const r = records.find(x => x.id === id)
    return r && r.status === 'pending_dispatch'
  })
  const canBatchReinspect = role === 'inspector' && [...selected].every(id => {
    const r = records.find(x => x.id === id)
    return r && r.status === 'rectified'
  })

  const handleBatchDispatch = async () => {
    if (!canBatchDispatch) return
    try {
      await api.batchDispatch({ ids: [...selected], note: batchNote })
      alert(`已批量派发 ${selected.size} 条记录`)
      setBatchNote(''); setSelected(new Set()); setShowBatch(false); load()
    } catch (e) { alert(e.message) }
  }

  const handleBatchReinspect = async () => {
    if (!canBatchReinspect) return
    try {
      await api.batchReinspect({ ids: [...selected], passed: true, result: batchResult || '批量复检通过' })
      alert(`已批量复检通过 ${selected.size} 条记录`)
      setBatchResult(''); setBatchRejectReason(''); setSelected(new Set()); setShowBatch(false); load()
    } catch (e) { alert(e.message) }
  }

  const handleBatchReject = async () => {
    if (!canBatchReinspect) return
    if (!batchRejectReason.trim()) { alert('请填写驳回原因'); return }
    try {
      await api.batchReinspect({ ids: [...selected], passed: false, rejectReason: batchRejectReason })
      alert(`已批量驳回 ${selected.size} 条记录，物业联系人将收到待补录通知`)
      setBatchResult(''); setBatchRejectReason(''); setSelected(new Set()); setShowBatch(false); load()
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <h2 className="page-title">整改记录</h2>
      <p className="page-desc">
        以 <b>{current.name}</b> 身份操作。
        {role === 'supervisor' && ' 选中"待派发"记录可批量派发；'}
        {role === 'inspector'  && ' 选中"待复检"记录可批量复检通过或批量驳回；'}
        {role === 'property'   && ' 点击进入详情可提交整改或补录。'}
      </p>

      <div className="filter-bar">
        <div className="filter-group">
          <label>状态</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>风险</label>
          <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)}>
            {RISK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
          <label>搜索</label>
          <input
            type="text"
            placeholder="按标题 / 地点 / 编号搜索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        {selected.size > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowBatch(!showBatch)}>
            {showBatch ? '收起批量操作' : `展开批量操作 (${selected.size})`}
          </button>
        )}
      </div>

      {selected.size > 0 && showBatch && (
        <div className="batch-bar">
          <span>
            已选择 <span className="count">{selected.size}</span> 条记录
            {canBatchDispatch && <span className="text-muted"> · 可批量派发</span>}
            {canBatchReinspect && <span className="text-muted"> · 可批量复检通过 / 批量驳回</span>}
            {!canBatchDispatch && !canBatchReinspect && <span className="text-danger"> · 所选记录状态不一致，无法批量</span>}
          </span>
          <div className="actions">
            {canBatchDispatch && (
              <>
                <input
                  type="text"
                  placeholder="派发说明（可选）"
                  value={batchNote}
                  onChange={e => setBatchNote(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #fdba74', borderRadius: 6, width: 200 }}
                />
                <button className="btn btn-warn btn-sm" onClick={handleBatchDispatch}>📤 批量派发</button>
              </>
            )}
            {canBatchReinspect && (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="复检说明（可选，用于通过）"
                    value={batchResult}
                    onChange={e => setBatchResult(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #6ee7b7', borderRadius: 6, width: 200 }}
                  />
                  <button className="btn btn-success btn-sm" onClick={handleBatchReinspect}>✅ 批量复检通过</button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="驳回原因 *"
                    value={batchRejectReason}
                    onChange={e => setBatchRejectReason(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #fca5a5', borderRadius: 6, width: 260 }}
                  />
                  <button className="btn btn-danger btn-sm" onClick={handleBatchReject}>❌ 批量驳回</button>
                </div>
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>取消选择</button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" className="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll} />
              </th>
              <th>编号</th>
              <th>标题</th>
              <th>地点</th>
              <th>风险</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="empty">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" className="empty">暂无记录</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox" className="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)} />
                </td>
                <td className="text-muted">{r.id}</td>
                <td>{r.title}</td>
                <td className="text-muted">{r.location}</td>
                <td><RiskBadge level={r.riskLevel} /></td>
                <td><StatusBadge status={r.status} /></td>
                <td className="text-muted">{r.createdAt.slice(5)}</td>
                <td className="text-muted">{r.updatedAt.slice(5)}</td>
                <td>
                  <span className="link" onClick={() => navigate(`/tasks/${r.id}`)}>查看 / 处理</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
