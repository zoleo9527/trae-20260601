import { useCallback, useEffect, useMemo, useState } from 'react'
import AuditTrail from './AuditTrail'

const STATUS_MAP = {
  accepted: { label: '已受理', className: 'status-accepted' },
  reviewing: { label: '复核中', className: 'status-reviewing' },
  approved: { label: '已通过', className: 'status-approved' },
  rejected: { label: '已退回', className: 'status-rejected' },
  supplementing: { label: '补资料中', className: 'status-supplementing' },
}

const STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'accepted', label: '已受理' },
  { key: 'reviewing', label: '复核中' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已退回' },
  { key: 'supplementing', label: '补资料中' },
]

export default function VerificationReview({ role }) {
  const [acceptances, setAcceptances] = useState([])
  const [allAcceptances, setAllAcceptances] = useState([])
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [reviewModal, setReviewModal] = useState(null)
  const [supplementModal, setSupplementModal] = useState(null)
  const [reviews, setReviews] = useState([])
  const [traceData, setTraceData] = useState(null)
  const [showTrace, setShowTrace] = useState(false)

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (keyword) params.set('keyword', keyword)
    if (role === 'loading_supervisor') params.set('role', 'loading_supervisor')
    const res = await fetch(`/api/acceptances?${params}`)
    const data = await res.json()
    setAcceptances(data)
  }, [statusFilter, keyword, role])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    fetch('/api/acceptances').then(r => r.json()).then(setAllAcceptances)
  }, [acceptances])

  const fetchReviews = useCallback(async (id) => {
    const res = await fetch(`/api/reviews?acceptanceId=${id}`)
    setReviews(await res.json())
  }, [])

  const fetchTrace = useCallback(async (id) => {
    const res = await fetch(`/api/acceptances/${id}/trace`)
    setTraceData(await res.json())
  }, [])

  const handleSelect = async (item) => {
    if (selected?.id === item.id) {
      setSelected(null)
      setReviews([])
      setTraceData(null)
      setShowTrace(false)
      return
    }
    setSelected(item)
    setShowTrace(false)
    await fetchReviews(item.id)
    await fetchTrace(item.id)
  }

  const handleReview = async () => {
    if (!reviewModal) return
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acceptanceId: selected.id,
        result: reviewModal.result,
        opinion: reviewModal.opinion,
        reviewer: reviewModal.reviewer || '张审核'
      })
    })
    if (res.ok) {
      setReviewModal(null)
      await fetchData()
      const updated = await fetch(`/api/acceptances/${selected.id}`)
      setSelected(await updated.json())
      await fetchReviews(selected.id)
      await fetchTrace(selected.id)
    }
  }

  const handleSupplement = async () => {
    if (!supplementModal) return
    const payload = { operator: supplementModal.operator || '货主' }
    if (supplementModal.newDocs?.length) payload.shipperDocs = supplementModal.newDocs.filter(d => d.trim())
    if (supplementModal.remark) payload.remark = supplementModal.remark
    if (supplementModal.newDest) payload.destinationStation = supplementModal.newDest

    const res = await fetch(`/api/acceptances/${selected.id}/supplement`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      setSupplementModal(null)
      await fetchData()
      const updated = await fetch(`/api/acceptances/${selected.id}`)
      setSelected(await updated.json())
      await fetchReviews(selected.id)
      await fetchTrace(selected.id)
    }
  }

  const handleReturn = async (reason) => {
    const res = await fetch(`/api/acceptances/${selected.id}/return`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, operator: '张审核' })
    })
    if (res.ok) {
      await fetchData()
      const updated = await fetch(`/api/acceptances/${selected.id}`)
      setSelected(await updated.json())
      await fetchReviews(selected.id)
      await fetchTrace(selected.id)
    }
  }

  const totalWeight = useMemo(() => {
    if (!selected) return 0
    return selected.items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0)
  }, [selected])

  const hasDangerous = useMemo(() => {
    if (!selected) return false
    return selected.items.some(i => i.category?.includes('危险品'))
  }, [selected])

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayList = allAcceptances.filter(a => a.createdAt?.slice(0, 10) === today)
    if (todayList.length === 0) return null

    const byStatus = {}
    Object.keys(STATUS_MAP).forEach(k => { byStatus[k] = 0 })
    todayList.forEach(a => { if (byStatus[a.status] !== undefined) byStatus[a.status]++ })

    const dangerCount = todayList.filter(a => a.items.some(i => i.category?.includes('危险品'))).length
    const totalTonnage = todayList.reduce((s, a) => s + a.items.reduce((s2, i) => s2 + (parseFloat(i.weight) || 0), 0), 0)

    const destMap = {}
    todayList.forEach(a => { destMap[a.destinationStation] = (destMap[a.destinationStation] || 0) + 1 })
    const topDest = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

    return { total: todayList.length, byStatus, dangerCount, totalTonnage, topDest }
  }, [allAcceptances])

  return (
    <div>
      {role === 'clerk' && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">今日受理概览</h2>
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString('zh-CN')}</span>
          </div>

          {!todayStats ? (
            <div className="text-center text-slate-400 py-6 text-sm">今日暂无受理记录</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                <div
                  className={`rounded-lg p-3 cursor-pointer transition-all border-2 ${
                    statusFilter === 'all' ? 'border-blue-900 bg-blue-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
                  onClick={() => setStatusFilter('all')}
                >
                  <div className="text-2xl font-bold text-blue-900">{todayStats.total}</div>
                  <div className="text-xs text-slate-500 mt-0.5">受理总数</div>
                </div>

                {Object.entries(STATUS_MAP).map(([key, cfg]) => (
                  <div
                    key={key}
                    className={`rounded-lg p-3 cursor-pointer transition-all border-2 ${
                      statusFilter === key ? `border-blue-900 bg-blue-50` : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => setStatusFilter(key)}
                  >
                    <div className="text-2xl font-bold">
                      <span className={`badge ${cfg.className} text-base px-2`}>{todayStats.byStatus[key]}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{cfg.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="text-2xl font-bold text-red-700">{todayStats.dangerCount}</div>
                  <div className="text-xs text-red-500 mt-0.5">危险品票数</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="text-2xl font-bold text-blue-800">{todayStats.totalTonnage.toFixed(1)}</div>
                  <div className="text-xs text-blue-500 mt-0.5">累计吨位</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-700 mb-1">到站 Top3</div>
                  {todayStats.topDest.length > 0 ? todayStats.topDest.map(([station, count], i) => (
                    <div key={station} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{i + 1}. {station}</span>
                      <span className="font-medium text-slate-800">{count}票</span>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-400">-</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  statusFilter === f.key
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索货主、到站、货品..."
              className="!py-1.5"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <div className="space-y-2">
            {acceptances.length === 0 && (
              <div className="card text-center text-slate-400 py-8">暂无记录</div>
            )}
            {acceptances.map(a => (
              <div
                key={a.id}
                onClick={() => handleSelect(a)}
                className={`card cursor-pointer transition-all hover:shadow-md ${
                  selected?.id === a.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 truncate">{a.shipperName}</span>
                      <span className={`badge ${STATUS_MAP[a.status]?.className}`}>
                        {STATUS_MAP[a.status]?.label}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {a.items.map(i => i.name).join('、')} · {a.items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0)}吨 → {a.destinationStation}
                    </div>
                    {a.remark && (
                      <div className="text-xs text-amber-600 mt-1 truncate" title={a.remark}>
                        ⚠ {a.remark}
                      </div>
                    )}
                    {a.status === 'rejected' && (() => {
                      const lastReject = [...(a.reviewHistory || [])].reverse().find(r => r.result === 'rejected')
                      if (!lastReject) return null
                      const short = lastReject.opinion.length > 40 ? lastReject.opinion.slice(0, 40) + '…' : lastReject.opinion
                      const dt = new Date(lastReject.reviewedAt)
                      const mm = String(dt.getMonth() + 1).padStart(2, '0')
                      const dd = String(dt.getDate()).padStart(2, '0')
                      const hh = String(dt.getHours()).padStart(2, '0')
                      const mi = String(dt.getMinutes()).padStart(2, '0')
                      return (
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-red-100 text-xs text-red-500">
                          <span className="truncate mr-2" title={lastReject.opinion}>退回原因：{short}</span>
                          <span className="shrink-0 text-red-400">{lastReject.reviewer} {mm}-{dd} {hh}:{mi}</span>
                        </div>
                      )
                    })()}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    #{a.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="lg:col-span-3 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">
                  托运受理单 #{selected.id}
                  <span className={`badge ml-2 ${STATUS_MAP[selected.status]?.className}`}>
                    {STATUS_MAP[selected.status]?.label}
                  </span>
                </h3>
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setShowTrace(!showTrace)}
                >
                  {showTrace ? '隐藏追溯' : '查看追溯链'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="text-slate-500">货主：</span>
                  <span className="font-medium">{selected.shipperName}</span>
                </div>
                <div>
                  <span className="text-slate-500">联系方式：</span>
                  <span>{selected.shipperContact || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">发站：</span>
                  <span>{selected.originStation}</span>
                </div>
                <div>
                  <span className="text-slate-500">到站：</span>
                  <span className="font-medium">{selected.destinationStation}</span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-600 mb-2">货主提交资料</h4>
                <div className="flex flex-wrap gap-2">
                  {selected.shipperDocs.length > 0 ? selected.shipperDocs.map((doc, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                      📄 {doc}
                    </span>
                  )) : (
                    <span className="text-sm text-red-500">（未提交任何资料）</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-600 mb-2">货品明细</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-slate-500 font-medium">品名</th>
                        <th className="text-left py-2 text-slate-500 font-medium">类别</th>
                        <th className="text-right py-2 text-slate-500 font-medium">重量</th>
                        <th className="text-left py-2 text-slate-500 font-medium">包装</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 font-medium">
                            {item.name}
                            {item.category?.includes('危险品') && (
                              <span className="ml-1 text-red-500 text-xs">⚠危险品</span>
                            )}
                          </td>
                          <td className="py-2 text-slate-600">{item.category}</td>
                          <td className="py-2 text-right">{item.weight} {item.unit}</td>
                          <td className="py-2 text-slate-600">{item.packaging}</td>
                        </tr>
                      ))}
                      <tr className="font-semibold">
                        <td colSpan={2} className="py-2">合计</td>
                        <td className="py-2 text-right">{totalWeight} 吨</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selected.remark && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <span className="font-medium text-amber-800">备注/退回原因：</span>
                  <span className="text-amber-700 ml-1">{selected.remark}</span>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-3">票据复核意见</h3>

              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className={`p-3 rounded-lg border ${
                      r.result === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {r.reviewer} · {r.result === 'approved' ? '✅ 通过' : '❌ 退回'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(r.reviewedAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm">{r.opinion}</p>
                      {r.result === 'rejected' && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-red-600 font-medium">退回指向原始资料：</p>
                          <p className="text-xs text-red-500 mt-1">
                            涉及货品：{r.relatedItem}
                          </p>
                          <p className="text-xs text-red-500">
                            已提交资料：{r.relatedDoc}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 text-center py-4">尚无复核记录</div>
              )}

              <div className="mt-4 flex gap-2 flex-wrap">
                {role === 'clerk' && (selected.status === 'rejected' || selected.status === 'supplementing') && (
                  <button
                    className="btn btn-warning"
                    onClick={() => setSupplementModal({ newDocs: [''], remark: '', newDest: '', operator: '' })}
                  >
                    补交资料
                  </button>
                )}
                {role === 'clerk' && selected.status === 'accepted' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setReviewModal({ result: '', opinion: '', reviewer: '' })}
                  >
                    提交复核
                  </button>
                )}
                {role === 'clerk' && selected.status === 'reviewing' && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => setReviewModal({ result: 'approved', opinion: '', reviewer: '' })}
                    >
                      复核通过
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => setReviewModal({ result: 'rejected', opinion: '', reviewer: '' })}
                    >
                      复核退回
                    </button>
                  </>
                )}
              </div>
            </div>

            {showTrace && traceData && (
              <AuditTrail traceData={traceData} />
            )}
          </div>
        )}

        {!selected && (
          <div className="lg:col-span-3">
            <div className="card text-center text-slate-400 py-16">
              <div className="text-4xl mb-3">📋</div>
              <p>点击左侧受理单查看详情</p>
              <p className="text-xs mt-1">货主资料、货票与复核意见将在此处显示</p>
            </div>
          </div>
        )}
      </div>

      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {reviewModal.result === 'approved' ? '复核通过' : reviewModal.result === 'rejected' ? '复核退回' : '提交复核'}
            </h3>

            {!reviewModal.result && (
              <div className="mb-4">
                <label>复核结果</label>
                <select value={reviewModal.result} onChange={e => setReviewModal(p => ({ ...p, result: e.target.value }))}>
                  <option value="">请选择</option>
                  <option value="approved">通过</option>
                  <option value="rejected">退回</option>
                </select>
              </div>
            )}

            <div className="mb-4">
              <label>复核意见</label>
              {reviewModal.result === 'rejected' && (
                <div className="flex flex-wrap gap-2 mb-2">
                  <button className="btn btn-outline !py-1 !px-2.5 !text-xs" onClick={() => setReviewModal(p => ({ ...p, opinion: '危险品资料缺失，需补充《危险货物托运人资质证书》及安全技术说明书(MSDS)' }))}>危险品资料缺失需补充MSDS</button>
                  <button className="btn btn-outline !py-1 !px-2.5 !text-xs" onClick={() => setReviewModal(p => ({ ...p, opinion: '重量与货品明细不一致，需重新过磅确认实际重量' }))}>重量不一致需重新过磅</button>
                  <button className="btn btn-outline !py-1 !px-2.5 !text-xs" onClick={() => setReviewModal(p => ({ ...p, opinion: '到站信息变更，需重新核实路径及正确到站名称' }))}>到站信息变更需重新核实</button>
                </div>
              )}
              <textarea
                rows={3}
                value={reviewModal.opinion}
                onChange={e => setReviewModal(p => ({ ...p, opinion: e.target.value }))}
                placeholder={reviewModal.result === 'rejected' ? '请说明退回原因，该原因将关联至原始托运资料' : '复核意见'}
              />
            </div>

            <div className="mb-4">
              <label>复核人</label>
              <input
                value={reviewModal.reviewer}
                onChange={e => setReviewModal(p => ({ ...p, reviewer: e.target.value }))}
                placeholder="默认：张审核"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setReviewModal(null)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleReview}
                disabled={!reviewModal.result || !reviewModal.opinion}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {supplementModal && (
        <div className="modal-overlay" onClick={() => setSupplementModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">补交资料</h3>

            <div className="mb-4">
              <label>补充资料</label>
              {supplementModal.newDocs.map((doc, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    value={doc}
                    onChange={e => {
                      const docs = [...supplementModal.newDocs]
                      docs[idx] = e.target.value
                      setSupplementModal(p => ({ ...p, newDocs: docs }))
                    }}
                    placeholder="资料名称"
                  />
                  {supplementModal.newDocs.length > 1 && (
                    <button className="text-red-500 text-sm shrink-0" onClick={() => {
                      const docs = supplementModal.newDocs.filter((_, i) => i !== idx)
                      setSupplementModal(p => ({ ...p, newDocs: docs }))
                    }}>删除</button>
                  )}
                </div>
              ))}
              <button className="text-blue-600 text-sm hover:underline" onClick={() => {
                setSupplementModal(p => ({ ...p, newDocs: [...p.newDocs, ''] }))
              }}>+ 添加更多资料</button>
            </div>

            <div className="mb-4">
              <label>修正到站（如需）</label>
              <input
                value={supplementModal.newDest}
                onChange={e => setSupplementModal(p => ({ ...p, newDest: e.target.value }))}
                placeholder={selected?.destinationStation}
              />
            </div>

            <div className="mb-4">
              <label>补充说明</label>
              <textarea
                rows={2}
                value={supplementModal.remark}
                onChange={e => setSupplementModal(p => ({ ...p, remark: e.target.value }))}
                placeholder="说明补充情况"
              />
            </div>

            <div className="mb-4">
              <label>操作人</label>
              <input
                value={supplementModal.operator}
                onChange={e => setSupplementModal(p => ({ ...p, operator: e.target.value }))}
                placeholder="默认：货主"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setSupplementModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleSupplement}>提交补充</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
