import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { abnormalTypeLabels, type ReviewSnapshot } from '@/store'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function ReviewReplay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [snapshots, setSnapshots] = useState<ReviewSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/outbound-orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSnapshots(data.data?.reviewSnapshots || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/outbound/${id}`)}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">复核回看</h2>
      </div>

      {snapshots.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm p-12 text-center">
          <p className="text-gray-400">暂无复核记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot, idx) => (
            <div key={snapshot.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{snapshot.reviewedBy}</p>
                    <p className="text-xs text-gray-400">{formatTime(snapshot.reviewAt)}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {snapshot.items.filter((i) => i.result === 'abnormal').length} 项异常 / 共{' '}
                  {snapshot.items.length} 项
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-6 py-2.5 text-left font-medium text-gray-500">耗材名称</th>
                    <th className="px-6 py-2.5 text-left font-medium text-gray-500">批号</th>
                    <th className="px-6 py-2.5 text-left font-medium text-gray-500">复核结果</th>
                    <th className="px-6 py-2.5 text-left font-medium text-gray-500">异常类型</th>
                    <th className="px-6 py-2.5 text-left font-medium text-gray-500">异常说明</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.items.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b last:border-0',
                        item.result === 'abnormal' && 'bg-amber-50'
                      )}
                    >
                      <td className="px-6 py-3 text-gray-900">{item.consumableName}</td>
                      <td className="px-6 py-3 text-gray-700">{item.batchNo}</td>
                      <td className="px-6 py-3">
                        {item.result === 'normal' ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                            正常
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                            异常
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {item.abnormalType ? abnormalTypeLabels[item.abnormalType] || item.abnormalType : '-'}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{item.abnormalNote || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
