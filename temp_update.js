const fs = require('fs');
const path = require('path');

// 修改 IncidentDetail.tsx
const incidentDetailPath = path.join(__dirname, 'src/pages/IncidentDetail.tsx');
let content = fs.readFileSync(incidentDetailPath, 'utf-8');

// 1. 添加 AlertTriangle 导入
content = content.replace(
  "  Link2,\n  Clock,\n}",
  "  Link2,\n  Clock,\n  AlertTriangle,\n}"
);

// 2. 修改 noteReferenceCount 计算逻辑
const oldCountLogic = `  const noteReferenceCount = useMemo(() => {
    const countMap = new Map<string, number>()
    materials.forEach((m) => {
      if (m.referenced_notes && m.referenced_notes.length > 0) {
        m.referenced_notes.forEach((note) => {
          countMap.set(note.id, (countMap.get(note.id) || 0) + 1)
        })
      }
    })
    return countMap
  }, [materials])`;

const newCountLogic = `  const noteReferenceCount = useMemo(() => {
    const countMap = new Map<string, number>()
    materials.forEach((m) => {
      if (m.referenced_notes && m.referenced_notes.length > 0) {
        m.referenced_notes.forEach((note) => {
          countMap.set(note.id, (countMap.get(note.id) || 0) + 1)
        })
      }
      if (m.anomaly_referenced_notes && m.anomaly_referenced_notes.length > 0) {
        m.anomaly_referenced_notes.forEach((note) => {
          countMap.set(note.id, (countMap.get(note.id) || 0) + 1)
        })
      }
    })
    return countMap
  }, [materials])`;

content = content.replace(oldCountLogic, newCountLogic);

// 3. 添加计算总引用数的函数
const toggleFunc = `  const toggleMaterialExpand = (materialId: string) => {
    setExpandedMaterialId(expandedMaterialId === materialId ? null : materialId)
  }`;

const newToggleFunc = `  const toggleMaterialExpand = (materialId: string) => {
    setExpandedMaterialId(expandedMaterialId === materialId ? null : materialId)
  }

  const getTotalReferencedNotesCount = (material: InsuranceMaterialWithNotes) => {
    let count = 0
    if (material.referenced_notes) count += material.referenced_notes.length
    if (material.anomaly_referenced_notes) count += material.anomaly_referenced_notes.length
    return count
  }`;

content = content.replace(toggleFunc, newToggleFunc);

// 4. 修改材料列表部分，使用总引用数并添加 anomaly_referenced_notes 展示
const oldMaterialMap = `                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="border border-slate-200 rounded-lg overflow-hidden"
                      >
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleMaterialExpand(material.id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-ice-50 rounded-lg">
                              <FileText className="w-5 h-5 text-ice-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-medium text-slate-800">{material.material_type}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${materialStatusColors[material.status]}`}>
                                  {materialStatusLabels[material.status]}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  审核人: {material.reviewer || '未分配'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDateTime(material.created_at)}
                                </span>
                                {material.referenced_notes && material.referenced_notes.length > 0 && (
                                  <span className="flex items-center gap-1 text-ice-600">
                                    <Link2 className="w-3 h-3" />
                                    引用 {material.referenced_notes.length} 条备注
                                  </span>
                                )}
                              </div>
                            </div>
                            <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                              {expandedMaterialId === material.id ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        {expandedMaterialId === material.id && material.referenced_notes && material.referenced_notes.length > 0 && (
                          <div className="border-t border-slate-200 bg-slate-50 p-4">
                            <div className="pl-4 border-l-2 border-ice-300">
                              <div className="flex items-center gap-2 mb-3">
                                <Link2 className="w-4 h-4 text-ice-600" />
                                <span className="text-xs font-medium text-ice-700">引用来源备注</span>
                              </div>
                              <div className="space-y-3">
                                {material.referenced_notes.map((note, noteIndex) => (
                                  <div key={note.id} className="relative">
                                    {noteIndex > 0 && (
                                      <div className="absolute -top-3 left-4 w-0.5 h-3 bg-slate-300" />
                                    )}
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
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
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}`;

const newMaterialMap = `                    {materials.map((material) => {
                      const totalNotes = getTotalReferencedNotesCount(material)
                      return (
                        <div
                          key={material.id}
                          className="border border-slate-200 rounded-lg overflow-hidden"
                        >
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleMaterialExpand(material.id)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 bg-ice-50 rounded-lg">
                                <FileText className="w-5 h-5 text-ice-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm font-medium text-slate-800">{material.material_type}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${materialStatusColors[material.status]}`}>
                                    {materialStatusLabels[material.status]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    审核人: {material.reviewer || '未分配'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDateTime(material.created_at)}
                                  </span>
                                  {totalNotes > 0 && (
                                    <span className="flex items-center gap-1 text-ice-600">
                                      <Link2 className="w-3 h-3" />
                                      引用 {totalNotes} 条备注
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                {expandedMaterialId === material.id ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                          {expandedMaterialId === material.id && (
                            <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                              {material.referenced_notes && material.referenced_notes.length > 0 && (
                                <div className="pl-4 border-l-2 border-ice-300">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Link2 className="w-4 h-4 text-ice-600" />
                                    <span className="text-xs font-medium text-ice-700">引用来源备注</span>
                                  </div>
                                  <div className="space-y-3">
                                    {material.referenced_notes.map((note, noteIndex) => (
                                      <div key={note.id} className="relative">
                                        {noteIndex > 0 && (
                                          <div className="absolute -top-3 left-4 w-0.5 h-3 bg-slate-300" />
                                        )}
                                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
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
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {material.anomaly_referenced_notes && material.anomaly_referenced_notes.length > 0 && (
                                <div className="pl-4 border-l-2 border-amber-300">
                                  <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-medium text-amber-700">异常说明引用备注</span>
                                  </div>
                                  <div className="space-y-3">
                                    {material.anomaly_referenced_notes.map((note, noteIndex) => (
                                      <div key={note.id} className="relative">
                                        {noteIndex > 0 && (
                                          <div className="absolute -top-3 left-4 w-0.5 h-3 bg-slate-300" />
                                        )}
                                        <div className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm bg-amber-50">
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
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}`;

content = content.replace(oldMaterialMap, newMaterialMap);

fs.writeFileSync(incidentDetailPath, content, 'utf-8');
console.log('✅ IncidentDetail.tsx 更新成功');

// 修改 API 层的 incidents.ts
const apiPath = path.join(__dirname, 'api/routes/incidents.ts');
let apiContent = fs.readFileSync(apiPath, 'utf-8');

const oldInterface = `interface InsuranceMaterialWithNotes extends Record<string, unknown> {
  referenced_notes: IncidentNote[]
}`;

const newInterface = `interface InsuranceMaterialWithNotes extends Record<string, unknown> {
  referenced_notes: IncidentNote[]
  anomaly_referenced_notes: IncidentNote[]
}`;

apiContent = apiContent.replace(oldInterface, newInterface);

const oldGetMaterial = `function getMaterialWithNotes(material: Record<string, unknown>): InsuranceMaterialWithNotes {
  const noteIdsStr = material.referenced_note_ids as string | null
  let noteIds: string[] = []
  
  if (noteIdsStr) {
    try {
      noteIds = JSON.parse(noteIdsStr)
    } catch {
      noteIds = []
    }
  }
  
  let referencedNotes: IncidentNote[] = []
  if (noteIds.length > 0) {
    const placeholders = noteIds.map(() => '?').join(',')
    referencedNotes = db.prepare(
      \`SELECT * FROM incident_notes WHERE id IN (\${placeholders})\`
    ).all(...noteIds) as IncidentNote[]
  }
  
  return {
    ...material,
    referenced_notes: referencedNotes
  }
}`;

const newGetMaterial = `function getMaterialWithNotes(material: Record<string, unknown>): InsuranceMaterialWithNotes {
  const noteIdsStr = material.referenced_note_ids as string | null
  let noteIds: string[] = []
  
  if (noteIdsStr) {
    try {
      noteIds = JSON.parse(noteIdsStr)
    } catch {
      noteIds = []
    }
  }
  
  let referencedNotes: IncidentNote[] = []
  if (noteIds.length > 0) {
    const placeholders = noteIds.map(() => '?').join(',')
    referencedNotes = db.prepare(
      \`SELECT * FROM incident_notes WHERE id IN (\${placeholders})\`
    ).all(...noteIds) as IncidentNote[]
  }

  const anomalyNoteIdsStr = material.anomaly_referenced_note_ids as string | null
  let anomalyNoteIds: string[] = []
  
  if (anomalyNoteIdsStr) {
    try {
      anomalyNoteIds = JSON.parse(anomalyNoteIdsStr)
    } catch {
      anomalyNoteIds = []
    }
  }
  
  let anomalyReferencedNotes: IncidentNote[] = []
  if (anomalyNoteIds.length > 0) {
    const placeholders = anomalyNoteIds.map(() => '?').join(',')
    anomalyReferencedNotes = db.prepare(
      \`SELECT * FROM incident_notes WHERE id IN (\${placeholders})\`
    ).all(...anomalyNoteIds) as IncidentNote[]
  }
  
  return {
    ...material,
    referenced_notes: referencedNotes,
    anomaly_referenced_notes: anomalyReferencedNotes
  }
}`;

apiContent = apiContent.replace(oldGetMaterial, newGetMaterial);

fs.writeFileSync(apiPath, apiContent, 'utf-8');
console.log('✅ api/routes/incidents.ts 更新成功');

console.log('\n🎉 所有文件更新完成！');
