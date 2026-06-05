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
} from 'lucide-react'
import NoteCard from '@/components/NoteCard'
import { useIncidentStore } from '@/store/useIncidentStore'
import type { MaterialStatus, IncidentNote } from '@/shared/types'
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
    })
    setShowAddForm(false)
    setNewMaterialType('')
    setNewMaterialNotes('')
    setNewMaterialReviewer('')
  }

  const handleAddAnomaly = (materialId: string) => {
    const explanation = anomalyInput[materialId]
    const operator = anomalyOperator[materialId]
    if (!explanation?.trim() || !operator?.trim()) return
    addAnomalyExplanation(materialId, id!, explanation.trim(), operator.trim())
    setAnomalyInput((prev) => ({ ...prev, [materialId]: '' }))
    setAnomalyOperator((prev) => ({ ...prev, [materialId]: '' }))
    setExpandedNoteId(null)
  }

  const handleReferenceNote = (note: IncidentNote) => {
    setSelectedNoteForReference(note.id)
    setNewMaterialNotes((prev) => {
      const refText = `[引用备注 #${note.id.slice(0, 8)}] ${note.content}`
      return prev ? `${prev}\n\n${refText}` : refText
    })
    setTimeout(() => setSelectedNoteForReference(null), 500)
  }

  const handleUpdateStatus = async (materialId: string, status: MaterialStatus) => {
    await updateInsuranceMaterial(materialId, id!, { status })
  }

  const buildReferenceChain = () => {
    const noteMap = new Map<string, IncidentNote>()
    rescueMedicalNotesList.forEach(n => noteMap.set(n.id, n))
    
    const chains: Array<{ note: IncidentNote; children: string[] }> = []
    rescueMedicalNotesList.forEach(note => {
      if (!note.referenced_note_id) {
        chains.push({ note, children: [] })
      }
    })
    
    rescueMedicalNotesList.forEach(note => {
      if (note.referenced_note_id) {
        const parent = chains.find(c => c.note.id === note.referenced_note_id)
        if (parent) {
          parent.children.push(note.id)
        }
      }
    })
    
    return chains
  }

  const referenceChains = buildReferenceChain()

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
                    <label className="block text-xs text-slate-500 mb-1">备注（可引用救援备注）</label>
                    <textarea
                      value={newMaterialNotes}
                      onChange={(e) => setNewMaterialNotes(e.target.value)}
                      placeholder="材料相关说明，可从右侧引用救援备注..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ice-500 focus:border-transparent"
                    />
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
            <div className="col-span-2">
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
                              </div>
                            </td>
                          </tr>
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
                <div className="bg-white rounded-xl border border-amber-200 shadow-sm mt-4 p-5">
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
                  <div className="space-y-3">
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
                    rescueMedicalNotesList.map((note) => (
                      <div
                        key={note.id}
                        className={`border rounded-lg p-3 transition-all ${
                          selectedNoteForReference === note.id
                            ? 'border-ice-400 bg-ice-50'
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
                              className="text-xs text-ice-600 hover:text-ice-700 hover:underline"
                            >
                              引用此备注
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">暂无救援/医疗备注</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-ice-600" />
                  <h2 className="text-base font-semibold text-slate-800">备注引用链</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  展示备注之间的引用关系，帮助追溯信息来源
                </p>
                <div className="space-y-3">
                  {referenceChains.length > 0 ? (
                    referenceChains.map((chain) => (
                      <div key={chain.note.id} className="space-y-2">
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              chain.note.category === 'rescue'
                                ? 'bg-blue-500'
                                : chain.note.category === 'medical'
                                ? 'bg-red-500'
                                : 'bg-green-500'
                            }`}
                          />
                          {NOTE_CATEGORY_LABELS[chain.note.category]}备注 #{chain.note.id.slice(0, 8)}
                        </div>
                        {chain.children.length > 0 && (
                          <div className="ml-4 border-l-2 border-slate-200 pl-3 space-y-2">
                            {chain.children.map((childId) => {
                              const childNote = rescueMedicalNotesList.find((n) => n.id === childId)
                              if (!childNote) return null
                              return (
                                <div
                                  key={childId}
                                  className="text-xs text-slate-500 flex items-center gap-2"
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      childNote.category === 'rescue'
                                        ? 'bg-blue-500'
                                        : childNote.category === 'medical'
                                        ? 'bg-red-500'
                                        : 'bg-green-500'
                                    }`}
                                  />
                                  ↳ {NOTE_CATEGORY_LABELS[childNote.category]}备注 #
                                  {childNote.id.slice(0, 8)}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-xs">暂无引用关系</div>
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
