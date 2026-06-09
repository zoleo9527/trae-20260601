import { useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { PROBLEM_TYPE_LABELS, ROLE_LABELS, type ProblemType, type Role } from '../../shared/types'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const responsiblePersons = [
  { id: 'CS001', name: '王丽娟', role: 'station_cs' as Role },
  { id: 'C001', name: '张建国', role: 'courier' as Role },
  { id: 'C002', name: '李明辉', role: 'courier' as Role },
  { id: 'C003', name: '王大勇', role: 'courier' as Role },
  { id: 'M001', name: '陈国强', role: 'station_manager' as Role },
]

export default function ProblemCreate() {
  const { deliveries, createProblem, currentUser, loadDeliveries } = useAppStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preDeliveryId = searchParams.get('deliveryId') || ''

  const [selectedDeliveryId, setSelectedDeliveryId] = useState(preDeliveryId)
  const [problemType, setProblemType] = useState<ProblemType>('other')
  const [description, setDescription] = useState('')
  const [responsibleId, setResponsibleId] = useState(currentUser.id)
  const [responsibleName, setResponsibleName] = useState(currentUser.name)

  const selectedDelivery = deliveries.find((d) => d.id === selectedDeliveryId)

  useState(() => {
    if (deliveries.length === 0) loadDeliveries()
  })

  const handleSubmit = async () => {
    if (!selectedDeliveryId || !selectedDelivery) return
    await createProblem({
      deliveryId: selectedDeliveryId,
      trackingNumber: selectedDelivery.trackingNumber,
      problemType,
      description,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterRole: currentUser.role,
      responsiblePersonId: responsibleId,
      responsiblePersonName: responsibleName,
    })
    navigate('/problems')
  }

  return (
    <div className="p-6 max-w-3xl">
      <Link to="/problems" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回问题件列表
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-4">新建问题件登记</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 block mb-1.5">关联派件 <span className="text-red-500">*</span></label>
            {preDeliveryId && selectedDelivery ? (
              <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-400">单号：</span><span className="font-mono">{selectedDelivery.trackingNumber}</span></div>
                  <div><span className="text-slate-400">收件人：</span>{selectedDelivery.recipientName}</div>
                  <div><span className="text-slate-400">电话：</span>{selectedDelivery.recipientPhone}</div>
                  <div><span className="text-slate-400">地址：</span>{selectedDelivery.deliveryAddress}</div>
                  <div><span className="text-slate-400">派件员：</span>{selectedDelivery.courierName}</div>
                  <div><span className="text-slate-400">驿站签收图：</span>{selectedDelivery.stationSignImage || '无'}</div>
                </div>
              </div>
            ) : (
              <select
                value={selectedDeliveryId}
                onChange={(e) => setSelectedDeliveryId(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
              >
                <option value="">选择派件记录</option>
                {deliveries
                  .filter((d) => d.status !== 'problem' && d.status !== 'returned')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.trackingNumber} - {d.recipientName} ({d.courierName})
                    </option>
                  ))}
              </select>
            )}
          </div>

          {selectedDelivery && !preDeliveryId && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">收件人：</span>{selectedDelivery.recipientName}</div>
                <div><span className="text-slate-400">电话：</span>{selectedDelivery.recipientPhone}</div>
                <div className="col-span-2"><span className="text-slate-400">地址：</span>{selectedDelivery.deliveryAddress}</div>
                <div><span className="text-slate-400">派件员：</span>{selectedDelivery.courierName}</div>
                <div><span className="text-slate-400">驿站签收图：</span>{selectedDelivery.stationSignImage || '无'}</div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-slate-600 block mb-1.5">问题类型 <span className="text-red-500">*</span></label>
            <select value={problemType} onChange={(e) => setProblemType(e.target.value as ProblemType)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm">
              {(Object.entries(PROBLEM_TYPE_LABELS) as [string, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600 block mb-1.5">问题描述 <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述问题件具体情况"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 block mb-1.5">责任人</label>
            <select
              value={responsibleId}
              onChange={(e) => {
                const p = responsiblePersons.find((r) => r.id === e.target.value)
                if (p) { setResponsibleId(p.id); setResponsibleName(p.name) }
              }}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
            >
              {responsiblePersons.map((r) => (
                <option key={r.id} value={r.id}>{r.name}（{ROLE_LABELS[r.role]}）</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <Link to="/problems" className="text-sm px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50">取消</Link>
            <button
              onClick={handleSubmit}
              disabled={!selectedDeliveryId || !description}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交登记
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
