import { useCallback, useEffect, useState } from 'react'

const STATUS_MAP = {
  accepted: { label: '已受理', className: 'status-accepted' },
  reviewing: { label: '复核中', className: 'status-reviewing' },
  approved: { label: '已通过', className: 'status-approved' },
  rejected: { label: '已退回', className: 'status-rejected' },
  supplementing: { label: '补资料中', className: 'status-supplementing' },
}

export default function LoadingImpactView() {
  const [acceptances, setAcceptances] = useState([])
  const [expanded, setExpanded] = useState(null)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/acceptances?role=loading_supervisor')
    setAcceptances(await res.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalTonnage = acceptances.reduce((s, a) => s + a.items.reduce((s2, i) => s2 + (parseFloat(i.weight) || 0), 0), 0)

  const getLoadingNote = (a) => {
    const notes = []
    a.items.forEach(item => {
      if (item.category?.includes('危险品')) {
        notes.push(`${item.name}为危险品，需专用车辆和隔离装载`)
      }
      if (parseFloat(item.weight) > 100) {
        notes.push(`${item.name}重量${item.weight}吨，需注意车体承重和配载均衡`)
      }
      if (item.packaging === '散装' && parseFloat(item.weight) > 50) {
        notes.push(`${item.name}散装大宗货物，需安排敞车并做好加固`)
      }
    })
    return notes
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">装车影响评估</h2>
          <div className="text-sm text-slate-500">
            待装车 <span className="font-bold text-blue-900">{acceptances.length}</span> 单 ·
            合计 <span className="font-bold text-blue-900">{totalTonnage.toFixed(1)}</span> 吨
          </div>
        </div>
      </div>

      {acceptances.length === 0 && (
        <div className="card text-center text-slate-400 py-8">暂无待装车记录</div>
      )}

      {acceptances.map(a => {
        const notes = getLoadingNote(a)
        const totalW = a.items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0)
        const isExpanded = expanded === a.id

        return (
          <div key={a.id} className="card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : a.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">#{a.id} {a.shipperName}</span>
                  <span className={`badge ${STATUS_MAP[a.status]?.className}`}>
                    {STATUS_MAP[a.status]?.label}
                  </span>
                  {notes.length > 0 && (
                    <span className="badge bg-amber-100 text-amber-800">⚠ {notes.length}项注意</span>
                  )}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {a.items.map(i => i.name).join('、')} · {totalW}吨 → {a.destinationStation}
                </div>
              </div>
              <span className="text-slate-400">{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-600 mb-2">货品装车明细</h4>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-1.5 text-slate-500 font-medium">品名</th>
                      <th className="text-left py-1.5 text-slate-500 font-medium">类别</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium">重量</th>
                      <th className="text-left py-1.5 text-slate-500 font-medium">包装方式</th>
                      <th className="text-left py-1.5 text-slate-500 font-medium">装车要求</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.items.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-1.5 font-medium">{item.name}</td>
                        <td className="py-1.5">
                          {item.category?.includes('危险品')
                            ? <span className="text-red-600 font-medium">{item.category}</span>
                            : <span className="text-slate-600">{item.category}</span>
                          }
                        </td>
                        <td className="py-1.5 text-right">{item.weight} {item.unit}</td>
                        <td className="py-1.5">{item.packaging}</td>
                        <td className="py-1.5 text-xs">
                          {item.category?.includes('危险品') && '专用车辆·隔离装载'}
                          {item.packaging === '散装' && parseFloat(item.weight) > 50 && '敞车·加固'}
                          {!item.category?.includes('危险品') && !(item.packaging === '散装' && parseFloat(item.weight) > 50) && '常规装载'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {notes.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">⚠ 装车注意事项</h4>
                    <ul className="space-y-1">
                      {notes.map((note, i) => (
                        <li key={i} className="text-sm text-amber-700">• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 text-sm text-slate-500">
                  <span>到站：{a.destinationStation}</span>
                  {a.remark && <span className="ml-4 text-amber-600">备注：{a.remark}</span>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
