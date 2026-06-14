import { useEffect, useState, type FormEvent } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { CandidateDetail, AVType, AVStatus, ViolationCategory } from '../../shared/types'
import { X } from 'lucide-react'

const TYPE_MAP: Record<AVType, string> = { absence: '缺考', violation: '违纪' }
const STATUS_MAP: Record<AVStatus, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-amber-100 text-amber-700' },
  resubmitted: { label: '重提待审', cls: 'bg-orange-100 text-orange-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700' },
  supplemented: { label: '已补录', cls: 'bg-blue-100 text-blue-700' },
}
const VIOLATION_MAP: Record<ViolationCategory, string> = {
  cheat: '作弊', impersonate: '替考', disrupt: '扰乱考场', device: '携带设备', other: '其他',
}

export default function Query() {
  const { queryResults, fetchQuery, rooms, subjects, fetchRooms, loading } = useAppStore()
  const [keyword, setKeyword] = useState('')
  const [roomId, setRoomId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [detailItem, setDetailItem] = useState<CandidateDetail | null>(null)

  useEffect(() => { fetchRooms() }, [fetchRooms])

  const handleQuery = (e?: FormEvent) => {
    e?.preventDefault()
    const filters: Record<string, string> = {}
    if (keyword) filters.keyword = keyword
    if (roomId) filters.roomId = roomId
    if (subjectId) filters.subjectId = subjectId
    fetchQuery(filters)
  }

  const handleReset = () => {
    setKeyword('')
    setRoomId('')
    setSubjectId('')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <form onSubmit={handleQuery} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">关键词</label>
            <input
              value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="考生姓名或准考证号"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">考场</label>
            <select
              value={roomId} onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="">全部考场</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
            <select
              value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="">全部科目</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="submit" className="px-5 py-2 rounded-lg bg-[#d97706] text-white font-medium hover:bg-[#b45309] transition-colors text-sm">
            查询
          </button>
          <button type="button" onClick={handleReset} className="px-5 py-2 rounded-lg border border-[#d97706] text-[#d97706] font-medium hover:bg-amber-50 transition-colors text-sm">
            重置
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['考生姓名', '准考证号', '考场', '科目', '成绩', '缺考违纪', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">加载中...</td></tr>
              ) : queryResults.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无数据</td></tr>
              ) : queryResults.map((item) => (
                <tr key={item.candidate.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.candidate.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.candidate.ticketNo}</td>
                  <td className="px-4 py-3 text-gray-600">{item.room.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.subject.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.candidate.score ?? '-'}</td>
                  <td className="px-4 py-3">
                    {item.avRecords.length > 0 ? (
                      <span className="text-[#d97706] cursor-pointer hover:underline font-medium">
                        {item.avRecords.length} 条记录
                      </span>
                    ) : (
                      <span className="text-gray-400">无</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailItem(item)}
                      className="text-[#d97706] hover:underline font-medium"
                    >查看详情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">考生详情</h3>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['姓名', detailItem.candidate.name],
                  ['准考证号', detailItem.candidate.ticketNo],
                  ['考场', detailItem.room.name],
                  ['科目', detailItem.subject.name],
                  ['成绩', detailItem.candidate.score?.toString() ?? '-'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-sm text-gray-500">{label}</span>
                    <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {detailItem.avRecords.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">缺考违纪记录</h4>
                  <div className="space-y-3">
                    {detailItem.avRecords.map((av) => (
                      <div key={av.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{TYPE_MAP[av.type]}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_MAP[av.status].cls}`}>
                            {STATUS_MAP[av.status].label}
                          </span>
                          {av.violationType && (
                            <span className="text-xs text-gray-500">{VIOLATION_MAP[av.violationType]}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">备注：</span>{av.remark || '-'}</div>
                          <div><span className="text-gray-500">审核意见：</span>{av.opinion || '-'}</div>
                          <div><span className="text-gray-500">提交人：</span>{av.submittedBy}</div>
                          <div><span className="text-gray-500">审核人：</span>{av.reviewedBy || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
