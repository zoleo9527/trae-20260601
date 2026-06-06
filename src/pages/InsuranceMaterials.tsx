import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Eye,
  AlertCircle,
  MessageSquare,
  FileText,
  Send,
  Link2,
  User,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  ArrowRight,
} from 'lucide-react'
import NoteCard from '@/components/NoteCard'
import { useIncidentStore } from '@/store/useIncidentStore'
import type { MaterialStatus, IncidentNote, InsuranceMaterialWithNotes } from '@/shared/types'
import { NOTE_CATEGORY_LABELS } from '@/shared/types'

const materialStatusLabels: Record<MaterialStatus, string> = {
  pending: '待提交',
  submitted: '已提交',
  reviewed: '已审核',
  rejected: '已驳回',
}

const materialStatusColors: Record<MaterialStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const noteCategoryColors: Record<string, string> = {
  rescue: 'bg-blue-100 text-blue-700',
  medical: 'bg-red-100 text-red-700',
  insurance: 'bg-green-100 text-green-700',
  anomaly: 'bg-amber-100 text-amber-700',
}

const noteCategoryBorderStyles: Record<string, string> = {
  rescue: 'border-l-blue-500',
  medical: 'border-l-red-500',
  insurance: 'border-l-green-500',
  anomaly: 'border-l-amber-500',
}

const noteCategoryBgStyles: Record<string, string> = {
  rescue: 'bg-blue-50',
  medical: 'bg-red-50',
  insurance: 'bg-green-50',
  anomaly: 'bg-amber-50',
}

function formatDateTime(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function parseNoteIds(noteIdsStr: string | null): string[] {
  if (!noteIdsStr) return []
  try {
    const parsed = JSON.parse(noteIdsStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function buildFullReferenceChain(note: IncidentNote, allNotes: IncidentNote[]): IncidentNote[][] {
  const noteMap = new Map<string, IncidentNote>()
  allNotes.forEach((n) => noteMap.set(n.id, n))

  const chains: IncidentNote[][] = []

  const buildChainsRecursive = (currentNote: IncidentNote, currentChain: IncidentNote[]): void => {
    const newChain = [...currentChain, currentNote]

    let referencedIds: string[] = []
    if (currentNote.referenced_note_ids && Array.isArray(currentNote.referenced_note_ids)) {
      referencedIds = currentNote.referenced_note_ids
    } else if (typeof currentNote.referenced_note_ids === 'string') {
      referencedIds = parseNoteIds(currentNote.referenced_note_ids)
    }
    if (currentNote.referenced_note_id && !referencedIds.includes(currentNote.referenced_note_id)) {
      referencedIds.push(currentNote.referenced_note_id)
    }

    const validReferencedIds = referencedIds.filter((id) => noteMap.has(id))

    if (validReferencedIds.length === 0) {
      chains.push(newChain)
    } else {
      validReferencedIds.forEach((id) => {
        const parentNote = noteMap.get(id)
        if (parentNote) {
          buildChainsRecursive(parentNote, newChain)
        }
      })
    }
  }

  buildChainsRecursive(note, [])

  return chains.map((chain) => chain.reverse())
}

export default function InsuranceMaterials() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentIncident,
    insuranceMaterials,
    rescueMedicalNotes,
    loading,
    fetchInsuranceMaterials,
    fetchRescueMedicalNotes,
    fetchIncidentDetail,
    addInsuranceMaterial,
    addAnomalyExplanation,
    updateInsuranceMaterial,
  } = useIncidentStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newMaterialType, setNewMaterialType] = useState('')
  const [newMaterialNotes, setNewMaterialNotes] = useState('')
  const [newMaterialReviewer, setNewMaterialReviewer] = useState('')
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const [anomalyInput, setAnomalyInput] = useState<Record<string, string>>({})
  const [anomalyOperator, setAnomalyOperator] = useState<Record<string, string>>({})
  const [referencePreview, setReferencePreview] = useState<IncidentNote | null>(null)
  const [selectedNoteForReference, setSelectedNoteForReference] = useState<string | null>(null)
  const [selectedReferencedNoteIds, setSelectedReferencedNoteIds] = useState<string[]>([])
  const [expandedMaterialNoteId, setExpandedMaterialNoteId] = useState<string | null>(null)
  const [selectedAnomalyNoteIds, setSelectedAnomalyNoteIds] = useState<string[]>([])
  const [expandedAnomalyNoteId, setExpandedAnomalyNoteId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchIncidentDetail(id)
      fetchInsuranceMaterials(id)
      fetchRescueMedicalNotes(id)
    }
  }, [id, fetchIncidentDetail, fetchInsuranceMaterials, fetchRescueMedicalNotes])

  const materials = insuranceMaterials
  const rescueMedicalNotesList = rescueMedicalNotes

  const handleAddMaterial = () => {
    if (!newMaterialType.trim()) return
    addInsuranceMaterial(id!, {
      material_type: newMaterialType.trim(),
      notes: newMaterialNotes.trim() || undefined,
      reviewer: newMaterialReviewer.trim() || undefined,
      referenced_note_ids: selectedReferencedNoteIds.length > 0 ? selectedReferencedNoteIds : undefined,
    })
    setShowAddForm(false)
    setNewMaterialType('')
    setNewMaterialNotes('')
    setNewMaterialReviewer('')
    setSelectedReferencedNoteIds([])
  }

  const handleAddAnomaly = (materialId: string) => {
    const explanation = anomalyInput[materialId]
    const operator = anomalyOperator[materialId]
    if (!explanation?.trim() || !operator?.trim()) return
    addAnomalyExplanation(
      materialId,
      id!,
      explanation.trim(),
      operator.trim(),
      selectedAnomalyNoteIds.length > 0 ? selectedAnomalyNoteIds : undefined
    )
    setAnomalyInput((prev) => ({ ...prev, [materialId]: '' }))
    setAnomalyOperator((prev) => ({ ...prev, [materialId]: '' }))
    setSelectedAnomalyNoteIds([])
    setExpandedNoteId(null)
  }

  const handleReferenceNote = (note: IncidentNote) => {
    if (selectedReferencedNoteIds.includes(note.id)) {
      setSelectedReferencedNoteIds((prev) => prev.filter((id) => id !== note.id))
    } else {
      setSelectedReferencedNoteIds((prev) => [...prev, note.id])
    }
    setSelectedNoteForReference(note.id)
    setTimeout(() => setSelectedNoteForReference(null), 500)
  }

  const handleAnomalyNoteSelect = (note: IncidentNote) => {
    if (selectedAnomalyNoteIds.includes(note.id)) {
      setSelectedAnomalyNoteIds((prev) => prev.filter((id) => id !== note.id))
    } else {
      setSelectedAnomalyNoteIds((prev) => [...prev, note.id])
    }
  }

  const handleRemoveReferencedNote = (noteId: string) => {
    setSelectedReferencedNoteIds((prev) => prev.filter((id) => id !== noteId))
  }

  const handleRemoveAnomalyNote = (noteId: string) => {
    setSelectedAnomalyNoteIds((prev) => prev.filter((id) => id !== noteId))
  }

  const handleUpdateStatus = async (materialId: string, status: MaterialStatus) => {
    await updateInsuranceMaterial(materialId, id!, { status })
  }

  const getSelectedReferencedNotes = () => {
    return rescueMedicalNotesList.filter((note) => selectedReferencedNoteIds.includes(note.id))
  }

  const getSelectedAnomalyNotes = () => {
    return rescueMedicalNotesList.filter((note) => selectedAnomalyNoteIds.includes(note.id))
  }

  const buildReferenceChain = (material: InsuranceMaterialWithNotes) => {
    const allNotes = [...rescueMedicalNotesList, ...material.referenced_notes]
    const chains: IncidentNote[][] = []

    material.referenced_notes.forEach((note) => {
      const noteChains = buildFullReferenceChain(note, allNotes)
      chains.push(...noteChains)
    })

    return chains
  }

  const buildAnomalyReferenceChain = (material: InsuranceMaterialWithNotes) => {
    const allNotes = [...rescueMedicalNotesList]
    const chains: IncidentNote[][] = []

    material.anomaly_referenced_notes.forEach((note) => {
      const noteChains = buildFullReferenceChain(note, allNotes)
      chains.push(...noteChains)
    })

    return chains
  }

  const toggleMaterialNoteExpand = (materialId: string) => {
    setExpandedMaterialNoteId(expandedMaterialNoteId === materialId ? null : materialId)
  }

  const toggleAnomalyNoteExpand = (materialId: string) => {
    setExpandedAnomalyNoteId(expandedAnomalyNoteId === materialId ? null : materialId)
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(`/incident/${id}`)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回事件详情
      </button>

      {loading ? (
        <div className="text-center py-12 text-slate-500">加载中...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-800">保险材料管理</h1>
                <p className="text-sm text-slate-500 mt-1">
                  事件编号: {currentIncident?.incident_no || '加载中...'} 
                  {currentIncident?.injured_name && ` · 伤者: ${currentIncident.injured_name}`}
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-ice-600 text-white text-sm font-medium rounded-lg hover:bg-ice-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加材料
              </button>
            </div>

            {showAddForm && (
              <div className="mt-4 p-4 bg-ice-50 rounded-lg border border-ice-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">添加新材料</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">材料类型</label>
                    <input
                      type="text"
                      value={newMaterialType}
                      onChange={(e) => setNewMaterialType(e.target.value)}
                      placeholder="如：医疗诊断证明、现场照片等"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">审核人</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newMaterialReviewer}
                        onChange={(e) => setNewMaterialReviewer(e.target.value)}
                        placeholder="请输入审核人姓名"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">备注</label>
                    <textarea
                      value={newMaterialNotes}
                      onChange={(e) => setNewMaterialNotes(e.target.value)}
                      placeholder="材料相关说明..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">已引用的备注 ({selectedReferencedNoteIds.length})</label>
                    {getSelectedReferencedNotes().length > 0 ? (
                      <div className="space-y-2">
                        {getSelectedReferencedNotes().map((note) => (
                          <div
                            key={note.id}
                            className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${noteCategoryColors[note.category]}`}>
                                {NOTE_CATEGORY_LABELS[note.category]}
                              </span>
                              <span className="text-xs text-slate-600 truncate">{truncateText(note.content, 30)}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveReferencedNote(note.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">暂无引用备注，请从右侧救援备注列表中选择引用</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddMaterial}
                      disabled={!newMaterialType.trim()}
                      className="px-4 py-2 bg-ice-600 text-white text-sm font-medium rounded-lg hover:bg-ice-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      提交
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setNewMaterialType('')
                        setNewMaterialNotes('')
                        setNewMaterialReviewer('')
                        setSelectedReferencedNoteIds([])
                      }}
                      className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h2 className="text-base font-semibold text-slate-800">保险材料清单</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-5 py-3 font-medium text-slate-600">材料类型</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-600">状态</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-600">审核人</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-600">备注</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.length > 0 ? (
                        materials.map((m) => (
                          <>
                            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-5 py-4 font-medium text-slate-700">{m.material_type}</td>
                              <td className="px-5 py-4">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${materialStatusColors[m.status]}`}>
                                  {materialStatusLabels[m.status]}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-600">{m.reviewer || '-'}</td>
                              <td className="px-5 py-4 text-slate-600 max-w-xs truncate">{m.notes || '-'}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateStatus(m.id, 'reviewed')}
                                    disabled={m.status === 'reviewed'}
                                    className="p-1.5 text-slate-400 hover:text-green-600 transition-colors disabled:opacity-30"
                                    title="标记为已审核"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(m.id, 'submitted')}
                                    disabled={m.status === 'submitted'}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-30"
                                    title="标记为已提交"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {(m.status === 'rejected' || m.anomaly_explanation) && (
                                    <button
                                      onClick={() => setExpandedNoteId(expandedNoteId === m.id ? null : m.id)}
                                      className={`p-1.5 transition-colors ${
                                        expandedNoteId === m.id ? 'text-amber-600' : 'text-amber-400 hover:text-amber-600'
                                      }`}
                                      title="查看/添加异常说明"
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  {m.status !== 'rejected' && (
                                    <button
                                      onClick={() => {
                                        setExpandedNoteId(m.id)
                                        setSelectedAnomalyNoteIds([])
                                        if (!anomalyOperator[m.id] && currentIncident?.responsible_person) {
                                          setAnomalyOperator(prev => ({ ...prev, [m.id]: currentIncident.responsible_person || '' }))
                                        }
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                      title="标记为异常/驳回"
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  {m.referenced_notes && m.referenced_notes.length > 0 && (
                                    <button
                                      onClick={() => toggleMaterialNoteExpand(m.id)}
                                      className={`p-1.5 transition-colors ${
                                        expandedMaterialNoteId === m.id ? 'text-ice-600' : 'text-slate-400 hover:text-ice-600'
                                      }`}
                                      title="查看引用来源"
                                    >
                                      {expandedMaterialNoteId === m.id ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                  {m.anomaly_referenced_notes && m.anomaly_referenced_notes.length > 0 && (
                                    <button
                                      onClick={() => toggleAnomalyNoteExpand(m.id)}
                                      className={`p-1.5 transition-colors ${
                                        expandedAnomalyNoteId === m.id ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'
                                      }`}
                                      title="查看异常关联来源"
                                    >
                                      <Tag className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedMaterialNoteId === m.id && m.referenced_notes && m.referenced_notes.length > 0 && (
                              <tr key={`${m.id}-notes`} className="bg-slate-50">
                                <td colSpan={5} className="px-5 py-4">
                                  <div className="pl-4 border-l-2 border-ice-300">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Link2 className="w-4 h-4 text-ice-600" />
                                      <span className="text-xs font-medium text-ice-700">引用来源</span>
                                    </div>
                                    <div className="space-y-3">
                                      {m.referenced_notes.map((note) => (
                                        <div
                                          key={note.id}
                                          className="bg-white border border-slate-200 rounded-lg p-3"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <User className="w-3.5 h-3.5 text-slate-400" />
                                              <span className="text-xs font-medium text-slate-700">{note.author}</span>
                                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${noteCategoryColors[note.category]}`}>
                                                {NOTE_CATEGORY_LABELS[note.category]}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                              <Clock className="w-3 h-3" />
                                              {formatDateTime(note.created_at)}
                                            </div>
                                          </div>
                                          <p className="text-sm text-slate-600">{note.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            {expandedAnomalyNoteId === m.id && m.anomaly_referenced_notes && m.anomaly_referenced_notes.length > 0 && (
                              <tr key={`${m.id}-anomaly-notes`} className="bg-amber-50">
                                <td colSpan={5} className="px-5 py-4">
                                  <div className="pl-4 border-l-2 border-amber-300">
                                    <div className="flex items-center gap-2 mb-4">
                                      <Tag className="w-4 h-4 text-amber-600" />
                                      <span className="text-xs font-medium text-amber-700">异常关联来源</span>
                                    </div>
                                    <div className="space-y-4">
                                      {buildAnomalyReferenceChain(m).map((chain, chainIndex) => (
                                        <div key={chainIndex} className="space-y-2">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-medium text-slate-600">关联链 {chainIndex + 1}</span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex-shrink-0 px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg">
                                              <div className="flex items-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                <span className="text-xs font-medium text-amber-700">异常说明</span>
                                              </div>
                                            </div>
                                            {chain.map((note, noteIndex) => (
                                              <>
                                                <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                                <div
                                                  key={note.id}
                                                  className={`border-l-4 ${noteCategoryBorderStyles[note.category]} ${noteCategoryBgStyles[note.category]} rounded-r-lg p-3 flex-1 min-w-0`}
                                                >
                                                  <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                      <User className="w-3.5 h-3.5 text-slate-400" />
                                                      <span className="text-xs font-medium text-slate-700">{note.author}</span>
                                                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${noteCategoryColors[note.category]}`}>
                                                        {NOTE_CATEGORY_LABELS[note.category]}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                                                      <Clock className="w-3 h-3" />
                                                      {formatDateTime(note.created_at)}
                                                    </div>
                                                  </div>
                                                  <p className="text-sm text-slate-600">{note.content}</p>
                                                </div>
                                              </>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                            暂无保险材料记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {expandedNoteId && (
                <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-semibold text-slate-800">异常说明</h3>
                  </div>
                  {materials.find((m) => m.id === expandedNoteId)?.anomaly_explanation && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-sm text-amber-800">
                        现有说明: {materials.find((m) => m.id === expandedNoteId)?.anomaly_explanation}
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">操作人</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={anomalyOperator[expandedNoteId] || ''}
                          onChange={(e) =>
                            setAnomalyOperator((prev) => ({ ...prev, [expandedNoteId]: e.target.value }))
                          }
                          placeholder="请输入操作人姓名"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-2">添加异常说明</label>
                      <textarea
                        value={anomalyInput[expandedNoteId] || ''}
                        onChange={(e) =>
                          setAnomalyInput((prev) => ({ ...prev, [expandedNoteId]: e.target.value }))
                        }
                        placeholder="输入异常原因说明..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-2">
                        关联来源备注 ({selectedAnomalyNoteIds.length})
                      </label>
                      <div className="mb-3">
                        {getSelectedAnomalyNotes().length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {getSelectedAnomalyNotes().map((note) => (
                              <div
                                key={note.id}
                                className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${noteCategoryColors[note.category]}`}>
                                    {NOTE_CATEGORY_LABELS[note.category]}
                                  </span>
                                  <span className="text-xs text-slate-600 truncate">{truncateText(note.content, 30)}</span>
                                </div>
                                <button
                                  onClick={() => handleRemoveAnomalyNote(note.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mb-3">请从下方列表中选择关联的备注</p>
                        )}
                      </div>
                      <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                        {rescueMedicalNotesList.length > 0 ? (
                          rescueMedicalNotesList.map((note) => {
                            const isSelected = selectedAnomalyNoteIds.includes(note.id)
                            return (
                              <div
                                key={note.id}
                                onClick={() => handleAnomalyNoteSelect(note)}
                                className={`p-3 border-b border-slate-100 cursor-pointer transition-all last:border-b-0 ${
                                  isSelected
                                    ? 'bg-amber-50 border-l-4 border-l-amber-500'
                                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    isSelected ? 'bg-amber-500 text-white' : 'bg-slate-200'
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${noteCategoryColors[note.category]}`}>
                                        {NOTE_CATEGORY_LABELS[note.category]}
                                      </span>
                                      <span className="text-xs font-medium text-slate-700">{note.author}</span>
                                      <span className="text-xs text-slate-400">{formatDateTime(note.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2">{note.content}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="p-4 text-center text-slate-500 text-sm">暂无救援/医疗备注</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddAnomaly(expandedNoteId)}
                      disabled={!anomalyInput[expandedNoteId]?.trim() || !anomalyOperator[expandedNoteId]?.trim()}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      提交说明并标记为驳回
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-ice-600" />
                  <h2 className="text-base font-semibold text-slate-800">救援备注回看</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  展示与本事件相关的救援和医疗备注，点击引用按钮可添加到新材料中
                </p>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {rescueMedicalNotesList.length > 0 ? (
                    rescueMedicalNotesList.map((note) => {
                      const isSelected = selectedReferencedNoteIds.includes(note.id)
                      return (
                        <div
                          key={note.id}
                          className={`border rounded-lg p-3 transition-all ${
                            selectedNoteForReference === note.id
                              ? 'border-ice-400 bg-ice-50'
                              : isSelected
                              ? 'border-ice-300 bg-ice-50/50'
                              : 'border-slate-200'
                          }`}
                        >
                          <NoteCard
                            note={note}
                            onReferenceClick={(noteId) => {
                              const refNote = rescueMedicalNotesList.find((n) => n.id === noteId)
                              if (refNote) {
                                setReferencePreview(refNote)
                              }
                            }}
                          />
                          {showAddForm && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                              <Link2 className="w-3.5 h-3.5 text-slate-400" />
                              <button
                                onClick={() => handleReferenceNote(note)}
                                className={`text-xs hover:underline ${
                                  isSelected
                                    ? 'text-green-600 font-medium'
                                    : 'text-ice-600 hover:text-ice-700'
                                }`}
                              >
                                {isSelected ? '✓ 已引用' : '引用此备注'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">暂无救援/医疗备注</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-ice-600" />
                  <h2 className="text-base font-semibold text-slate-800">材料备注引用链</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  展示各材料关联备注之间的引用关系，帮助追溯信息来源
                </p>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {materials.filter((m) => m.referenced_notes && m.referenced_notes.length > 0).length > 0 ? (
                    materials
                      .filter((m) => m.referenced_notes && m.referenced_notes.length > 0)
                      .map((material) => {
                        const chains = buildReferenceChain(material)
                        return (
                          <div key={material.id} className="space-y-2">
                            <div className="text-xs font-medium text-slate-700 flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-ice-500" />
                              {material.material_type}
                            </div>
                            {chains.length > 0 ? (
                              chains.map((chain, chainIndex) => (
                                <div key={`${chainIndex}-${chain.map(n => n.id).join('-')}`} className="space-y-1 ml-2">
                                  {chain.map((note, noteIndex) => (
                                    <div key={note.id} className="text-xs text-slate-600 flex items-center gap-2">
                                      {noteIndex > 0 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          note.category === 'rescue'
                                            ? 'bg-blue-500'
                                            : note.category === 'medical'
                                            ? 'bg-red-500'
                                            : note.category === 'anomaly'
                                            ? 'bg-amber-500'
                                            : 'bg-green-500'
                                        }`}
                                      />
                                      {NOTE_CATEGORY_LABELS[note.category]}备注 #{note.id.slice(0, 8)}
                                    </div>
                                  ))}
                                </div>
                              ))
                            ) : (
                              <div className="ml-2 text-xs text-slate-400">暂无引用链</div>
                            )}
                          </div>
                        )
                      })
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-xs">暂无材料引用备注</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {referencePreview && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setReferencePreview(null)}
            >
              <div
                className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-semibold text-slate-800 mb-4">引用的备注详情</h3>
                <NoteCard note={referencePreview} />
                <button
                  onClick={() => setReferencePreview(null)}
                  className="mt-4 w-full px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
