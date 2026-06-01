import CareTimeline from '@/components/CareTimeline'
import CommunicationLog from '@/components/CommunicationLog'
import OrderList from '@/components/OrderList'
import RoleSwitcher from '@/components/RoleSwitcher'
import { useStore } from '@/store'
import type { CareRecord, Patient } from '@/types'
import { AlertTriangle, ArrowLeft, ClipboardList, FileText, MessageSquare, Minus, Phone, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type Tab = 'timeline' | 'orders' | 'communications'

const trendConfig = {
  improving: { icon: <TrendingUp size={16} />, label: '好转', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  stable: { icon: <Minus size={16} />, label: '稳定', color: 'text-slate-500', bg: 'bg-slate-50' },
  worsening: { icon: <TrendingDown size={16} />, label: '加重', color: 'text-red-600', bg: 'bg-red-50' },
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role, careRecords, fetchCareRecords, orders, fetchOrders, communications, fetchCommunications, updateCareRecord } = useStore()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('timeline')
  const [careFilter, setCareFilter] = useState<string>('all')

  useEffect(() => {
    if (!id) return
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setPatient(json.data) })
    fetchCareRecords(Number(id))
    fetchOrders(Number(id))
    fetchCommunications(Number(id))
  }, [id, fetchCareRecords, fetchOrders, fetchCommunications])

  const handleCompleteTask = async (record: CareRecord) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    await updateCareRecord(record.id, {
      status: 'completed',
      executed_at: now,
      executed_by: role === 'nurse' ? '护士小刘' : '陈医生',
    } as Partial<CareRecord>)
    fetchCareRecords(Number(id))
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-slate-400">加载中...</div>
      </div>
    )
  }

  const trend = patient.condition_trend ? trendConfig[patient.condition_trend] : null
  const abnormalRecords = careRecords.filter((r) => r.is_abnormal)

  const filteredCareRecords = careFilter === 'all'
    ? careRecords
    : careRecords.filter((r) => r.type === careFilter)

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'timeline', label: '护理时间线', icon: <FileText size={14} />, count: careRecords.length },
    { key: 'orders', label: '医嘱列表', icon: <ClipboardList size={14} />, count: orders.length },
    { key: 'communications', label: '沟通记录', icon: <MessageSquare size={14} />, count: communications.length },
  ]

  const careTypes = ['all', 'medication', 'dressing', 'feeding', 'iv_fluid', 'observation', 'vitals']
  const careTypeLabels: Record<string, string> = {
    all: '全部', medication: '用药', dressing: '换药', feeding: '喂食',
    iv_fluid: '输液', observation: '观察', vitals: '体征',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回列表
        </button>
        <RoleSwitcher />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
              {patient.species === '猫' ? '🐱' : patient.species === '狗' ? '🐶' : patient.species === '兔' ? '🐰' : '🐾'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{patient.name}</h1>
              <p className="text-sm text-slate-500">{patient.breed} · {patient.age} · {patient.species}</p>
            </div>
          </div>
          <span className="text-sm font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
            {patient.cage_number}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400">诊断</span>
            <p className="text-sm font-medium text-slate-700">{patient.diagnosis}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">入院日期</span>
            <p className="text-sm font-mono text-slate-700">{patient.admit_date}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">主人</span>
            <p className="text-sm text-slate-700">{patient.owner_name}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">联系电话</span>
            <p className="text-sm font-mono text-slate-700 flex items-center gap-1">
              <Phone size={12} />{patient.owner_phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {trend && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${trend.bg} ${trend.color} border border-current/10`}>
              {trend.icon}
              病情{trend.label}
            </span>
          )}
          {abnormalRecords.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-vet-amber-light text-amber-700 border border-amber-200">
              <AlertTriangle size={12} />
              {abnormalRecords.length}项异常记录
            </span>
          )}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            patient.status === 'hospitalized' ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-500'
          }`}>
            {patient.status === 'hospitalized' ? '住院中' : '已出院'}
          </span>
        </div>
      </div>

      {role === 'nurse' && (
        <div className="bg-vet-sky-light border border-vet-sky/20 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-vet-sky-dark mb-2">待执行护理任务</h3>
          <div className="space-y-2">
            {careRecords.filter((r) => r.status === 'pending').map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-slate-700">{r.content}</span>
                  <span className="text-xs text-slate-400 ml-2 font-mono">{r.scheduled_at}</span>
                </div>
                <button
                  onClick={() => handleCompleteTask(r)}
                  className="px-3 py-1 text-xs font-medium bg-vet-sky text-white rounded-lg hover:bg-vet-sky-dark transition-colors"
                >
                  完成
                </button>
              </div>
            ))}
            {careRecords.filter((r) => r.status === 'pending').length === 0 && (
              <p className="text-sm text-slate-500">暂无待执行任务</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-vet-teal text-vet-teal'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div>
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {careTypes.map((t) => (
              <button
                key={t}
                onClick={() => setCareFilter(t)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  careFilter === t
                    ? 'bg-vet-teal text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {careTypeLabels[t]}
              </button>
            ))}
          </div>
          <CareTimeline records={filteredCareRecords} />
        </div>
      )}

      {activeTab === 'orders' && <OrderList orders={orders} />}
      {activeTab === 'communications' && <CommunicationLog communications={communications} />}
    </div>
  )
}
