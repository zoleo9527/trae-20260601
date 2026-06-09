import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, Filter, ShieldAlert } from 'lucide-react'
import { useRoleStore } from '@/store/useRoleStore'
import { useFollowUpStore } from '@/store/useFollowUpStore'
import { useWarningStore } from '@/store/useWarningStore'
import RoleSwitcher from '@/components/RoleSwitcher'
import FollowUpCard from '@/components/FollowUpCard'
import FollowUpDetail from '@/components/FollowUpDetail'
import Toast from '@/components/Toast'
import { STATUS_LABELS } from '@/types'
import { useResponsibilityEngine } from '@/hooks/useResponsibilityEngine'
import type { FollowUpStatus } from '@/types'

const STATUS_ORDER: FollowUpStatus[] = ['pending', 'in_progress', 'pending_review', 'warned', 'confirmed', 'completed']

export default function FollowUpPage() {
  const navigate = useNavigate()
  const currentRole = useRoleStore((s) => s.currentRole)
  const addToast = useRoleStore((s) => s.addToast)
  const followUps = useFollowUpStore((s) => s.followUps)
  const patients = useFollowUpStore((s) => s.patients)
  const selectedFollowUpId = useFollowUpStore((s) => s.selectedFollowUpId)
  const selectFollowUp = useFollowUpStore((s) => s.selectFollowUp)
  const warningCount = useWarningStore((s) => s.warnings.filter((w) => w.status === 'active').length)
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | 'all'>('all')
  const { detectGaps, escalate } = useResponsibilityEngine()

  useEffect(() => {
    const interval = setInterval(() => {
      escalate()
    }, 30000)
    return () => clearInterval(interval)
  }, [escalate])

  const gaps = useMemo(() => detectGaps(), [followUps, detectGaps])

  const groupedFollowUps = useMemo(() => {
    let filtered = followUps
    if (statusFilter !== 'all') {
      filtered = followUps.filter((fu) => fu.status === statusFilter)
    }
    const groups: Record<FollowUpStatus, typeof followUps> = {
      pending: [],
      in_progress: [],
      pending_review: [],
      completed: [],
      warned: [],
      confirmed: [],
    }
    for (const fu of filtered) {
      groups[fu.status].push(fu)
    }
    return groups
  }, [followUps, statusFilter])

  const selectedFollowUp = followUps.find((fu) => fu.id === selectedFollowUpId)
  const selectedPatient = selectedFollowUp
    ? patients.find((p) => p.id === selectedFollowUp.patientId)
    : null

  const handleCardClick = (id: string) => {
    selectFollowUp(selectedFollowUpId === id ? null : id)
  }

  const roleFilteredStatuses = useMemo(() => {
    switch (currentRole) {
      case 'nurse':
        return ['pending', 'in_progress'] as FollowUpStatus[]
      case 'doctor':
        return ['in_progress', 'pending_review', 'warned', 'confirmed', 'completed'] as FollowUpStatus[]
      case 'ph_specialist':
        return ['warned', 'confirmed', 'pending'] as FollowUpStatus[]
      default:
        return STATUS_ORDER
    }
  }, [currentRole])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold">慢病随访工作台</h1>
              <RoleSwitcher />
            </div>
            <button
              onClick={() => navigate('/warning')}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              指标预警中心
              {warningCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                  {warningCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-5 gap-4 mb-6">
          {(['pending', 'in_progress', 'pending_review', 'warned', 'confirmed'] as FollowUpStatus[]).map((s) => {
            const count = followUps.filter((fu) => fu.status === s).length
            const colorMap: Record<FollowUpStatus, string> = {
              pending: 'text-gray-600',
              in_progress: 'text-blue-600',
              pending_review: 'text-amber-600',
              completed: 'text-emerald-600',
              warned: 'text-red-600',
              confirmed: 'text-teal-600',
            }
            return (
              <div key={s} className="rounded-lg border bg-white p-3 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}>
                <div className="text-xs text-gray-500">{STATUS_LABELS[s]}</div>
                <div className={`text-2xl font-bold ${colorMap[s]}`}>{count}</div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 mr-2">状态筛选</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {gaps.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">责任空档检测</p>
              <ul className="mt-1 space-y-0.5">
                {gaps.slice(0, 3).map((gap) => (
                  <li key={gap.id} className="text-xs text-red-600">
                    {gap.label} — {gap.detail}
                  </li>
                ))}
                {gaps.length > 3 && (
                  <li className="text-xs text-red-400">...共 {gaps.length} 项</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {STATUS_ORDER.filter((s) => statusFilter === 'all' || statusFilter === s)
            .filter((s) => groupedFollowUps[s].length > 0)
            .map((status) => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${status === 'pending' ? 'bg-gray-400' : status === 'in_progress' ? 'bg-blue-500' : status === 'pending_review' ? 'bg-amber-500' : status === 'completed' ? 'bg-emerald-500' : status === 'confirmed' ? 'bg-teal-500' : 'bg-red-500'}`} />
                  <h3 className="text-sm font-semibold text-slate-700">
                    {STATUS_LABELS[status]}
                  </h3>
                  <span className="text-xs text-slate-400">
                    ({groupedFollowUps[status].length})
                  </span>
                  {!roleFilteredStatuses.includes(status) && (
                    <span className="text-xs text-slate-300 bg-slate-100 px-2 py-0.5 rounded">
                      非当前角色关注
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {groupedFollowUps[status].map((fu) => {
                    const patient = patients.find((p) => p.id === fu.patientId)
                    if (!patient) return null
                    return (
                      <FollowUpCard
                        key={fu.id}
                        followUp={fu}
                        patientName={patient.name}
                        diseaseType={patient.diseaseType}
                        isSelected={selectedFollowUpId === fu.id}
                        onClick={() => handleCardClick(fu.id)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {selectedFollowUp && selectedPatient && (
        <FollowUpDetail
          followUp={selectedFollowUp}
          patientName={selectedPatient.name}
          patientAge={selectedPatient.age}
          patientGender={selectedPatient.gender}
          diseaseType={selectedPatient.diseaseType}
          onClose={() => selectFollowUp(null)}
        />
      )}

      <Toast />
    </div>
  )
}
