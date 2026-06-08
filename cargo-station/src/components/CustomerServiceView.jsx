import { useCallback, useEffect, useState } from 'react'

const STATUS_MAP = {
  accepted: { label: '已受理', className: 'status-accepted' },
  reviewing: { label: '复核中', className: 'status-reviewing' },
  approved: { label: '已通过', className: 'status-approved' },
  rejected: { label: '已退回', className: 'status-rejected' },
  supplementing: { label: '补资料中', className: 'status-supplementing' },
}

export default function CustomerServiceView() {
  const [acceptances, setAcceptances] = useState([])
  const [keyword, setKeyword] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [traceData, setTraceData] = useState(null)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/acceptances')
    setAcceptances(await res.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = async () => {
    if (!keyword.trim()) return
    const res = await fetch(`/api/acceptances?keyword=${encodeURIComponent(keyword)}`)
    const data = await res.json()
    setSearchResult(data)
    setTraceData(null)
  }

  const handleTrace = async (id) => {
    const res = await fetch(`/api/acceptances/${id}/trace`)
    setTraceData(await res.json())
  }

  const rejectedItems = acceptances.filter(a => a.status === 'rejected' || a.status === 'supplementing')

  return (
    <div className="space-y-4 mb-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">票据退回查询</h2>
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="输入货主名称、到站或货品搜索..."
            className="flex-1"
          />
          <button className="btn btn-primary" onClick={handleSearch}>查询</button>
        </div>
      </div>

      {searchResult && searchResult.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">查询结果（{searchResult.length}条）</h3>
          <div className="space-y-3">
            {searchResult.map(a => (
              <div key={a.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.shipperName}</span>
                    <span className={`badge ${STATUS_MAP[a.status]?.className}`}>
                      {STATUS_MAP[a.status]?.label}
                    </span>
                  </div>
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => handleTrace(a.id)}
                  >
                    查看退回详情
                  </button>
                </div>
                <div className="text-sm text-slate-500">
                  {a.items.map(i => i.name).join('、')} → {a.destinationStation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {traceData && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            退回追溯 — {traceData.acceptance.shipperName}
          </h3>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">货主：</span>
                <span className="font-medium">{traceData.acceptance.shipperName}</span>
              </div>
              <div>
                <span className="text-slate-500">联系方式：</span>
                <span>{traceData.acceptance.shipperContact || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">到站：</span>
                <span>{traceData.acceptance.destinationStation}</span>
              </div>
              <div>
                <span className="text-slate-500">货品：</span>
                <span>{traceData.acceptance.items.map(i => i.name).join('、')}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-slate-500">已提交资料：</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {traceData.acceptance.shipperDocs.map((doc, i) => (
                  <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded">{doc}</span>
                ))}
              </div>
            </div>
          </div>

          {traceData.reviews.filter(r => r.result === 'rejected').map(r => (
            <div key={r.id} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-800 font-semibold text-sm">❌ 退回原因</span>
                <span className="text-xs text-slate-400">{new Date(r.reviewedAt).toLocaleString('zh-CN')}</span>
              </div>
              <p className="text-sm text-red-700 mb-3">{r.opinion}</p>

              <div className="bg-white rounded-lg p-3 border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-1">退回指向 → 原始托运资料</p>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>涉及货品：{r.relatedItem}</p>
                  <p>货主已提交资料：{r.relatedDoc}</p>
                </div>
                <div className="mt-2 text-xs">
                  <span className="font-medium text-slate-600">需补充：</span>
                  <span className="text-red-600">
                    {traceData.acceptance.remark || '请咨询货运员了解具体缺失资料'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {traceData.traceItems.filter(t => t.traceFrom).length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-600 mb-2">完整追溯链</h4>
              <div className="space-y-2">
                {traceData.traceItems.filter(t => t.traceFrom).map((t, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs text-red-600 font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-50 rounded p-2 mb-1">
                        <span className="text-xs text-slate-500">{t.traceFrom.type}</span>
                        <p className="text-slate-700">{t.traceFrom.detail}</p>
                      </div>
                      <div className="text-center text-slate-400 text-xs">↓ 指向</div>
                      <div className="bg-blue-50 rounded p-2 mt-1">
                        <span className="text-xs text-blue-500">{t.traceTo.type}</span>
                        <p className="text-blue-800">{t.traceTo.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {traceData.acceptance.status === 'supplementing' && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-800">当前状态：货主正在补交资料</p>
              <p className="text-sm text-purple-600 mt-1">{traceData.acceptance.remark}</p>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-600 mb-3">
          需关注的退回/补资料记录（{rejectedItems.length}条）
        </h3>
        {rejectedItems.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">暂无退回记录</div>
        ) : (
          <div className="space-y-2">
            {rejectedItems.map(a => (
              <div key={a.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{a.shipperName}</span>
                    <span className={`badge ${STATUS_MAP[a.status]?.className}`}>
                      {STATUS_MAP[a.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{a.remark}</p>
                </div>
                <button
                  className="btn btn-outline text-sm shrink-0 ml-2"
                  onClick={() => handleTrace(a.id)}
                >
                  查看详情
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
