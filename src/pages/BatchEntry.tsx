import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Contract } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

type BatchMode = 'create' | 'supplement'

interface CreateRow {
  resident_name: string
  resident_id_card: string
  resident_phone: string
  contract_type: string
  service_package: string
  team_doctor: string
  team_nurse: string
}

const EMPTY_ROW: CreateRow = {
  resident_name: '',
  resident_id_card: '',
  resident_phone: '',
  contract_type: '家庭签约',
  service_package: '基础服务包',
  team_doctor: '',
  team_nurse: '',
}

export default function BatchEntry() {
  const { currentRole, currentUser } = useAppStore()
  const [mode, setMode] = useState<BatchMode>('create')
  const [rows, setRows] = useState<CreateRow[]>([{ ...EMPTY_ROW }])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [supplementNote, setSupplementNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null)

  useEffect(() => {
    if (mode === 'supplement') {
      api.contracts.list({ limit: 50 }).then((res) => {
        setContracts(res.data)
      })
    }
  }, [mode])

  const addRow = () => {
    setRows([...rows, { ...EMPTY_ROW }])
  }

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return
    setRows(rows.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: keyof CreateRow, value: string) => {
    const updated = [...rows]
    updated[idx] = { ...updated[idx], [field]: value }
    setRows(updated)
  }

  const handleBatchCreate = async () => {
    if (loading) return
    const validRows = rows.filter((r) => r.resident_name.trim())
    if (validRows.length === 0) {
      alert('至少填写一条签约记录')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await api.batch.createContracts({
        contracts: validRows.map((r) => ({
          ...r,
          period_start: new Date().toISOString(),
          period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        })),
        createdBy: currentUser,
      })
      setResult({ success: true, count: res.count })
      setRows([{ ...EMPTY_ROW }])
    } catch (e) {
      alert(e instanceof Error ? e.message : '批量创建失败')
    }
    setLoading(false)
  }

  const handleBatchSupplement = async () => {
    if (loading) return
    if (selectedIds.size === 0) {
      alert('请选择至少一条签约记录')
      return
    }
    if (!supplementNote.trim()) {
      alert('请填写补充备注')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await api.batch.supplement({
        contractIds: Array.from(selectedIds),
        note: supplementNote.trim(),
        createdBy: currentUser,
        createdByRole: currentRole,
      })
      setResult({ success: true, count: res.count })
      setSupplementNote('')
      setSelectedIds(new Set())
    } catch (e) {
      alert(e instanceof Error ? e.message : '批量补充失败')
    }
    setLoading(false)
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">批量录入</h2>
      </div>

      <div className="card px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMode('create'); setResult(null) }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mode === 'create' ? 'bg-primary-700 text-white' : 'text-zinc-500 hover:bg-zinc-100'
            )}
          >
            <Upload size={14} className="inline mr-1.5" />
            批量创建签约
          </button>
          <button
            onClick={() => { setMode('supplement'); setResult(null) }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mode === 'supplement' ? 'bg-primary-700 text-white' : 'text-zinc-500 hover:bg-zinc-100'
            )}
          >
            <MessageSquare size={14} className="inline mr-1.5" />
            批量补充备注
          </button>
        </div>
      </div>

      {result && (
        <div className={cn(
          'rounded-lg p-3 text-sm font-medium',
          result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        )}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            {mode === 'create'
              ? `成功创建 ${result.count} 条签约记录`
              : `成功为 ${result.count} 条签约补充备注`}
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="card">
          <div className="border-b border-zinc-100 px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-700">批量创建签约</h3>
            <button onClick={addRow} className="btn-ghost text-xs">
              <Plus size={12} />
              添加一行
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-3 py-2 text-left font-medium text-zinc-500 w-8">#</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">居民姓名*</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">身份证号</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">联系电话</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">签约类型</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">服务包</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">全科医生</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">护士</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-zinc-50">
                    <td className="px-3 py-2 text-zinc-400">{idx + 1}</td>
                    <td className="px-3 py-1.5">
                      <input type="text" className="input-field py-1 text-xs" placeholder="姓名" value={row.resident_name} onChange={(e) => updateRow(idx, 'resident_name', e.target.value)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="text" className="input-field py-1 text-xs" placeholder="身份证号" value={row.resident_id_card} onChange={(e) => updateRow(idx, 'resident_id_card', e.target.value)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="text" className="input-field py-1 text-xs" placeholder="电话" value={row.resident_phone} onChange={(e) => updateRow(idx, 'resident_phone', e.target.value)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <select className="select-field py-1 text-xs" value={row.contract_type} onChange={(e) => updateRow(idx, 'contract_type', e.target.value)}>
                        <option value="家庭签约">家庭签约</option>
                        <option value="个人签约">个人签约</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <select className="select-field py-1 text-xs" value={row.service_package} onChange={(e) => updateRow(idx, 'service_package', e.target.value)}>
                        <option value="基础服务包">基础服务包</option>
                        <option value="老年人服务包">老年人服务包</option>
                        <option value="慢性病管理包">慢性病管理包</option>
                        <option value="孕产妇服务包">孕产妇服务包</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="text" className="input-field py-1 text-xs" placeholder="医生" value={row.team_doctor || currentUser} onChange={(e) => updateRow(idx, 'team_doctor', e.target.value)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <input type="text" className="input-field py-1 text-xs" placeholder="护士" value={row.team_nurse} onChange={(e) => updateRow(idx, 'team_nurse', e.target.value)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <button onClick={() => removeRow(idx)} disabled={rows.length <= 1} className="text-zinc-400 hover:text-red-500 disabled:opacity-30">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
            <span className="text-xs text-zinc-400">共 {rows.length} 行</span>
            <button onClick={handleBatchCreate} disabled={loading} className="btn-primary text-xs">
              <Upload size={12} />
              批量创建
            </button>
          </div>
        </div>
      )}

      {mode === 'supplement' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">批量补充备注</h3>
            <p className="text-[10px] text-zinc-400 mb-3">选择多条签约记录，一次性添加补充备注。备注将携带至建档流程。</p>
            <textarea
              className="input-field min-h-[80px] resize-y mb-3"
              placeholder="输入补充备注内容..."
              value={supplementNote}
              onChange={(e) => setSupplementNote(e.target.value)}
            />
          </div>

          <div className="card">
            <div className="border-b border-zinc-100 px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">选择签约记录</h3>
              <span className="text-xs text-zinc-400">已选 {selectedIds.size} 条</span>
            </div>
            <div className="max-h-72 overflow-auto scrollbar-thin divide-y divide-zinc-50">
              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                  <FileText size={24} className="mb-2 opacity-30" />
                  <p className="text-xs">暂无签约记录</p>
                </div>
              ) : (
                contracts.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-800">{c.resident_name}</span>
                        <span className={cn('badge', `badge-${c.status}`)}>{c.contract_type}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{c.contract_no} · {c.service_package}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
              <span className="text-xs text-zinc-400">共 {contracts.length} 条签约</span>
              <button onClick={handleBatchSupplement} disabled={loading || selectedIds.size === 0 || !supplementNote.trim()} className="btn-primary text-xs">
                <MessageSquare size={12} />
                批量补充
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
