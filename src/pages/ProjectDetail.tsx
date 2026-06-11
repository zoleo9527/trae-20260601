import React, { useState, useEffect } from 'react'
import { Project, Survey, WiringPlan, Material, ProjectMaterial, MaterialUsageRecord, ActivityLog, STEPS, STATUS_LABELS, SURVEY_STATUS_LABELS } from '../types'
import { StatusBadge, RiskBadge } from '../components/StatusBadge'
import ActivityTimeline from '../components/ActivityTimeline'

declare global {
  interface Window {
    api: any
  }
}

interface ProjectDetailProps {
  projectId: number
  onBack: () => void
}

type CableRouteSegment = {
  from: string
  to: string
  method: string
  length?: number
  notes?: string
}

type ExistingLine = {
  location: string
  type: string
  condition: string
  notes?: string
}

type DifficultyPoint = {
  location: string
  description: string
  solution?: string
}

type PlannedMaterial = {
  material_id: number
  material_name?: string
  spec?: string
  unit?: string
  quantity: number
  notes?: string
}


function safeJsonParse<T = any>(val: any, fallback: T): T {
  if (val == null || val === '') return fallback
  if (typeof val !== 'string') return val as T
  try { return JSON.parse(val) as T } catch (e) { return fallback }
}

function normalizePlannedMaterialItem(item: any): PlannedMaterial {
  const material_id = Number(item?.material_id ?? item?.id ?? 0)
  const quantity = Number(item?.quantity ?? item?.planned_qty ?? item?.qty ?? 0)
  return {
    material_id,
    material_name: item?.material_name || '',
    spec: item?.spec || '',
    unit: item?.unit || '',
    quantity,
    notes: item?.notes || ''
  }
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState('survey')
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [wiringPlans, setWiringPlans] = useState<WiringPlan[]>([])
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterial[]>([])
  const [usageRecords, setUsageRecords] = useState<MaterialUsageRecord[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [allMaterials, setAllMaterials] = useState<Material[]>([])

  const [surveyForm, setSurveyForm] = useState<{
    survey_date: string
    surveyor: string
    site_condition: string
    power_environment: string
    equipment_position: string
    ground_condition: string
    remarks: string
    cable_route_structured: CableRouteSegment[]
    existing_lines: ExistingLine[]
    difficulty_points: DifficultyPoint[]
    submitted_by: string
    confirmed_by: string
  }>({
    survey_date: '',
    surveyor: '',
    site_condition: '',
    power_environment: '',
    equipment_position: '',
    ground_condition: '',
    remarks: '',
    cable_route_structured: [{ from: '', to: '', method: '', length: undefined, notes: '' }],
    existing_lines: [{ location: '', type: '', condition: '', notes: '' }],
    difficulty_points: [{ location: '', description: '', solution: '' }],
    submitted_by: '当前用户',
    confirmed_by: ''
  })

  const [wiringForm, setWiringForm] = useState<{
    plan_version: string
    work_face: string
    previous_conclusion: string
    wiring_method: string
    cable_spec: string
    cable_length: number | ''
    conduit_spec: string
    conduit_length: number | ''
    remarks: string
    planned_materials: PlannedMaterial[]
    created_by: string
    confirmed_by: string
  }>({
    plan_version: '',
    work_face: '',
    previous_conclusion: '',
    wiring_method: '',
    cable_spec: '',
    cable_length: '',
    conduit_spec: '',
    conduit_length: '',
    remarks: '',
    planned_materials: [{ material_id: 0, material_name: '', spec: '', unit: '', quantity: 0, notes: '' }],
    created_by: '当前用户',
    confirmed_by: ''
  })
  const [showWiringForm, setShowWiringForm] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null)

  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [materialForm, setMaterialForm] = useState<{
    material_id: number | ''
    quantity: number | ''
    usage_type: string
    work_face: string
    operator: string
    remarks: string
  }>({
    material_id: '',
    quantity: '',
    usage_type: '领出',
    work_face: '',
    operator: '',
    remarks: ''
  })
  const [overrunWarning, setOverrunWarning] = useState<string | null>(null)

  useEffect(() => {
    loadProjectData()
  }, [projectId, activeTab])

  const loadProjectData = async () => {
    try {
      const p = await window.api.getProjectById(projectId)
      setProject(p)

      if (activeTab === 'survey') {
        const s = await window.api.getSurveyByProjectId(projectId)
        setSurvey(s)
        if (s) {
          s.cable_route_structured = safeJsonParse(s.cable_route_structured, [{ from: '', to: '', method: '', length: undefined, notes: '' }])
          s.existing_lines = safeJsonParse(s.existing_lines, [{ location: '', type: '', condition: '', notes: '' }])
          s.difficulty_points = safeJsonParse(s.difficulty_points, [{ location: '', description: '', solution: '' }])
          setSurveyForm({
            survey_date: s.survey_date || '',
            surveyor: s.surveyor || '',
            site_condition: s.site_condition || '',
            power_environment: s.power_environment || '',
            equipment_position: s.equipment_position || '',
            ground_condition: s.ground_condition || '',
            remarks: s.remarks || '',
            cable_route_structured: Array.isArray(s.cable_route_structured) && s.cable_route_structured.length > 0
              ? s.cable_route_structured
              : [{ from: '', to: '', method: '', length: undefined, notes: '' }],
            existing_lines: Array.isArray(s.existing_lines) && s.existing_lines.length > 0
              ? s.existing_lines
              : [{ location: '', type: '', condition: '', notes: '' }],
            difficulty_points: Array.isArray(s.difficulty_points) && s.difficulty_points.length > 0
              ? s.difficulty_points
              : [{ location: '', description: '', solution: '' }],
            submitted_by: s.submitted_by || '当前用户',
            confirmed_by: s.confirmed_by || ''
          })
        }
      } else if (activeTab === 'wiring') {
        const [plans, s, mats] = await Promise.all([
          window.api.getWiringPlansByProjectId(projectId),
          window.api.getSurveyByProjectId(projectId),
          window.api.getMaterials ? window.api.getMaterials() : []
        ])
        const parsedPlans = (plans || []).map((p: any) => ({
          ...p,
          planned_materials: safeJsonParse<any[]>(p.planned_materials, [])
            .map((item: any) => normalizePlannedMaterialItem(item))
            .filter((pm: PlannedMaterial) => pm.material_id > 0)
        }))
        setWiringPlans(parsedPlans)
        setSurvey(s)
        setAllMaterials(mats || [])
      } else if (activeTab === 'materials') {
        const [m, u, mats] = await Promise.all([
          window.api.getProjectMaterials(projectId),
          window.api.getMaterialUsageByProjectId(projectId),
          window.api.getMaterials ? window.api.getMaterials() : []
        ])
        setProjectMaterials(m || [])
        setUsageRecords(u || [])
        setAllMaterials(mats || [])
      } else if (activeTab === 'logs') {
        const logs = await window.api.getActivityLogs(projectId, 50)
        setActivityLogs(logs)
      }
    } catch (e) {
      console.error('加载项目数据失败', e)
    }
  }

  const handleSaveSurvey = async () => {
    try {
      await window.api.saveSurvey(projectId, { ...surveyForm, status: 'draft' })
      alert('保存草稿成功')
      loadProjectData()
    } catch (e) {
      console.error('保存失败', e)
    }
  }

  const handleSubmitSurvey = async () => {
    try {
      await window.api.saveSurvey(projectId, { ...surveyForm, status: 'submitted', submitted_by: surveyForm.submitted_by })
      if (window.api.submitSurvey) {
        await window.api.submitSurvey(projectId)
      }
      alert('提交审核成功')
      loadProjectData()
    } catch (e) {
      console.error('提交失败', e)
    }
  }

  const handleApproveSurvey = async () => {
    try {
      await window.api.saveSurvey(projectId, { ...surveyForm, status: 'approved', confirmed_by: surveyForm.confirmed_by })
      if (window.api.approveSurvey) {
        await window.api.approveSurvey(projectId)
      }
      alert('审核通过成功')
      loadProjectData()
    } catch (e) {
      console.error('审核失败', e)
    }
  }

  const addRouteSegment = () => {
    setSurveyForm({
      ...surveyForm,
      cable_route_structured: [...surveyForm.cable_route_structured, { from: '', to: '', method: '', length: undefined, notes: '' }]
    })
  }

  const updateRouteSegment = (idx: number, field: keyof CableRouteSegment, value: any) => {
    const newSegments = [...surveyForm.cable_route_structured]
    newSegments[idx] = { ...newSegments[idx], [field]: value }
    setSurveyForm({ ...surveyForm, cable_route_structured: newSegments })
  }

  const removeRouteSegment = (idx: number) => {
    if (surveyForm.cable_route_structured.length <= 1) return
    const newSegments = surveyForm.cable_route_structured.filter((_, i) => i !== idx)
    setSurveyForm({ ...surveyForm, cable_route_structured: newSegments })
  }

  const addExistingLine = () => {
    setSurveyForm({
      ...surveyForm,
      existing_lines: [...surveyForm.existing_lines, { location: '', type: '', condition: '', notes: '' }]
    })
  }

  const updateExistingLine = (idx: number, field: keyof ExistingLine, value: any) => {
    const newLines = [...surveyForm.existing_lines]
    newLines[idx] = { ...newLines[idx], [field]: value }
    setSurveyForm({ ...surveyForm, existing_lines: newLines })
  }

  const removeExistingLine = (idx: number) => {
    if (surveyForm.existing_lines.length <= 1) return
    const newLines = surveyForm.existing_lines.filter((_, i) => i !== idx)
    setSurveyForm({ ...surveyForm, existing_lines: newLines })
  }

  const addDifficultyPoint = () => {
    setSurveyForm({
      ...surveyForm,
      difficulty_points: [...surveyForm.difficulty_points, { location: '', description: '', solution: '' }]
    })
  }

  const updateDifficultyPoint = (idx: number, field: keyof DifficultyPoint, value: any) => {
    const newPoints = [...surveyForm.difficulty_points]
    newPoints[idx] = { ...newPoints[idx], [field]: value }
    setSurveyForm({ ...surveyForm, difficulty_points: newPoints })
  }

  const removeDifficultyPoint = (idx: number) => {
    if (surveyForm.difficulty_points.length <= 1) return
    const newPoints = surveyForm.difficulty_points.filter((_, i) => i !== idx)
    setSurveyForm({ ...surveyForm, difficulty_points: newPoints })
  }

  const openNewWiringForm = () => {
    setEditingPlanId(null)
    setWiringForm({
      plan_version: '',
      work_face: '',
      previous_conclusion: survey ? `${survey.site_condition || ''} ${survey.power_environment || ''}`.trim() : '',
      wiring_method: '',
      cable_spec: '',
      cable_length: '',
      conduit_spec: '',
      conduit_length: '',
      remarks: '',
      planned_materials: [{ material_id: 0, material_name: '', spec: '', unit: '', quantity: 0, notes: '' }],
      created_by: '当前用户',
      confirmed_by: ''
    })
    setShowWiringForm(true)
  }

  const openEditWiringForm = (plan: WiringPlan) => {
    setEditingPlanId(plan.id)
    setWiringForm({
      plan_version: plan.plan_version || '',
      work_face: plan.work_face || '',
      previous_conclusion: plan.previous_conclusion || '',
      wiring_method: plan.wiring_method || '',
      cable_spec: plan.cable_spec || '',
      cable_length: plan.cable_length ?? '',
      conduit_spec: plan.conduit_spec || '',
      conduit_length: plan.conduit_length ?? '',
      remarks: plan.remarks || '',
      planned_materials: (() => {
        const parsed = safeJsonParse<any[]>(plan.planned_materials, [])
          .map((item: any) => normalizePlannedMaterialItem(item))
        return Array.isArray(parsed) && parsed.length > 0
          ? parsed
          : [{ material_id: 0, material_name: '', spec: '', unit: '', quantity: 0, notes: '' }]
      })(),
      created_by: plan.created_by || '当前用户',
      confirmed_by: plan.confirmed_by || ''
    })
    setShowWiringForm(true)
  }

  const handleSaveWiringPlan = async () => {
    try {
      const planData: any = {
        ...wiringForm,
        cable_length: wiringForm.cable_length === '' ? undefined : Number(wiringForm.cable_length),
        conduit_length: wiringForm.conduit_length === '' ? undefined : Number(wiringForm.conduit_length),
        planned_materials: wiringForm.planned_materials.filter(pm => pm.material_id > 0 || pm.material_name)
      }
      if (editingPlanId) {
        planData.id = editingPlanId
      }
      await window.api.saveWiringPlan(projectId, planData)
      setShowWiringForm(false)
      setEditingPlanId(null)
      loadProjectData()
      alert('保存成功')
    } catch (e) {
      console.error('保存失败', e)
    }
  }

  const handleConfirmWiringPlan = async (planId: number) => {
    try {
      if (window.api.confirmWiringPlan) {
        await window.api.confirmWiringPlan(projectId, planId)
      }
      alert('已确认')
      loadProjectData()
    } catch (e) {
      console.error('确认失败', e)
    }
  }

  const addPlannedMaterial = () => {
    setWiringForm({
      ...wiringForm,
      planned_materials: [...wiringForm.planned_materials, { material_id: 0, material_name: '', spec: '', unit: '', quantity: 0, notes: '' }]
    })
  }

  const updatePlannedMaterial = (idx: number, field: keyof PlannedMaterial, value: any) => {
    const newMaterials = [...wiringForm.planned_materials]
    if (field === 'material_id' && value) {
      const mat = allMaterials.find(m => m.id === Number(value))
      if (mat) {
        newMaterials[idx] = {
          ...newMaterials[idx],
          material_id: Number(value),
          material_name: mat.material_name,
          spec: mat.spec,
          unit: mat.unit
        }
      } else {
        newMaterials[idx] = { ...newMaterials[idx], material_id: Number(value) }
      }
    } else {
      newMaterials[idx] = { ...newMaterials[idx], [field]: value }
    }
    setWiringForm({ ...wiringForm, planned_materials: newMaterials })
  }

  const removePlannedMaterial = (idx: number) => {
    if (wiringForm.planned_materials.length <= 1) return
    const newMaterials = wiringForm.planned_materials.filter((_, i) => i !== idx)
    setWiringForm({ ...wiringForm, planned_materials: newMaterials })
  }

  const openMaterialForm = () => {
    setMaterialForm({
      material_id: '',
      quantity: '',
      usage_type: '领出',
      work_face: '',
      operator: '',
      remarks: ''
    })
    setOverrunWarning(null)
    setShowMaterialForm(true)
  }

  const checkOverrun = (materialId: number, quantity: number, usageType: string): string | null => {
    if (usageType !== '领出') return null
    const pm = projectMaterials.find(m => m.material_id === materialId)
    if (!pm || !pm.planned_qty) return null
    const used = pm.used_qty || 0
    if (used + quantity > pm.planned_qty) {
      const over = used + quantity - pm.planned_qty
      return `警告：材料【${pm.material_name}】计划用量 ${pm.planned_qty}${pm.unit || ''}，已用 ${used}${pm.unit || ''}，本次领用 ${quantity}${pm.unit || ''}，将超领 ${over}${pm.unit || ''}！`
    }
    return null
  }

  const handleMaterialFormChange = (field: keyof typeof materialForm, value: any) => {
    const newForm = { ...materialForm, [field]: value }
    setMaterialForm(newForm)
    if (newForm.material_id && newForm.quantity && newForm.usage_type) {
      const warning = checkOverrun(Number(newForm.material_id), Number(newForm.quantity), newForm.usage_type)
      setOverrunWarning(warning)
    } else {
      setOverrunWarning(null)
    }
  }

  const handleAddMaterialUsage = async () => {
    if (!materialForm.material_id || !materialForm.quantity) {
      alert('请选择材料并填写数量')
      return
    }
    try {
      const mat = allMaterials.find(m => m.id === Number(materialForm.material_id))
      const pm = projectMaterials.find(m => m.material_id === Number(materialForm.material_id))
      const isOverrun = materialForm.usage_type === '领出' && !!checkOverrun(
        Number(materialForm.material_id),
        Number(materialForm.quantity),
        materialForm.usage_type
      )
      const data: any = {
        ...materialForm,
        material_id: Number(materialForm.material_id),
        quantity: Number(materialForm.quantity),
        material_name: mat?.material_name,
        spec: mat?.spec,
        unit: mat?.unit,
        is_overrun: isOverrun ? 1 : 0
      }
      if (overrunWarning) {
        if (!window.confirm(`${overrunWarning}\n确认继续提交？`)) {
          return
        }
      }
      await window.api.addMaterialUsage(projectId, data)
      setShowMaterialForm(false)
      setOverrunWarning(null)
      loadProjectData()
    } catch (e) {
      console.error('添加失败', e)
    }
  }

  const handleStartConstruction = async () => {
    try {
      if (window.api.startConstruction) {
        await window.api.startConstruction(projectId)
      }
      alert('已开始施工')
      loadProjectData()
    } catch (e) {
      console.error('操作失败', e)
    }
  }

  const handleCompleteProject = async () => {
    try {
      if (window.api.completeProject) {
        await window.api.completeProject(projectId)
      }
      alert('项目已完成')
      loadProjectData()
    } catch (e) {
      console.error('操作失败', e)
    }
  }

  const getCurrentStepIndex = () => {
    if (!project) return 0
    return STEPS.findIndex(s => s.key === project.status)
  }

  const getSurveyStatusStep = () => {
    if (!survey) return 0
    if (survey.status === 'approved') return 3
    if (survey.status === 'submitted') return 2
    return 1
  }

  const getCompletionDocsBadge = (status?: string) => {
    if (status === 'completed') {
      return <span className="completion-docs-done">已完善</span>
    }
    if (status === 'in_progress') {
      return <span className="completion-docs-pending">进行中</span>
    }
    return <span className="completion-docs-pending">待补齐</span>
  }

  if (!project) {
    return <div className="page-content"><div className="empty">加载中...</div></div>
  }

  const currentStepIndex = getCurrentStepIndex()
  const surveyStatusStep = getSurveyStatusStep()

  return (
    <>
      <div className="project-header">
        <div className="flex-between mb-8">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="link" onClick={onBack}>← 返回</span>
            <div className="project-title" style={{ margin: 0 }}>
              {project.project_name}
              <StatusBadge status={project.status} />
              <RiskBadge level={project.risk_level} />
            </div>
          </div>
          <div className="flex gap-8">
            {project.status === 'wiring_planned' && (
              <button className="btn btn-primary" onClick={handleStartConstruction}>
                开始施工
              </button>
            )}
            {project.status === 'in_progress' && (
              <button className="btn btn-primary" onClick={handleCompleteProject}>
                完成验收
              </button>
            )}
          </div>
        </div>
        <div className="project-meta">
          <span>项目编号：{project.project_code || '-'}</span>
          <span>客户：{project.client_name || '-'}</span>
          <span>地址：{project.site_address || '-'}</span>
          <span>项目经理：{project.project_manager || '-'}</span>
          <span>施工班组：{project.construction_team || '-'}</span>
          <span>资料员：{project.document_staff || '-'}</span>
          <span>竣工资料：{getCompletionDocsBadge(project.completion_docs_status)}</span>
        </div>
      </div>

      <div className="steps">
        {STEPS.map((step, idx) => (
          <div
            key={step.key}
            className={`step-item ${idx < currentStepIndex ? 'done' : ''} ${idx === currentStepIndex ? 'active' : ''}`}
          >
            <div className="step-icon">{idx < currentStepIndex ? '✓' : idx + 1}</div>
            <div className="step-label">{step.label}</div>
            <div className="step-desc">{step.description}</div>
          </div>
        ))}
      </div>

      <div className="page-content">
        <div className="tabs">
          <div className={`tab-item ${activeTab === 'survey' ? 'active' : ''}`} onClick={() => setActiveTab('survey')}>
            现场勘查
          </div>
          <div className={`tab-item ${activeTab === 'wiring' ? 'active' : ''}`} onClick={() => setActiveTab('wiring')}>
            布线计划
          </div>
          <div className={`tab-item ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
            材料管理
          </div>
          <div className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            操作记录
          </div>
        </div>

        {activeTab === 'survey' && (
          <div className="card">
            <div className="card-header">
              <span>现场勘查记录</span>
              <div className="flex gap-8">
                {survey?.status === 'submitted' && (
                  <button className="btn btn-primary btn-sm" onClick={handleApproveSurvey}>
                    审核通过
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="status-flow" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                padding: '12px 16px',
                background: '#fafafa',
                borderRadius: 4
              }}>
                {['草稿', '已提交', '已审核通过'].map((label, idx) => (
                  <React.Fragment key={label}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 13,
                      background: surveyStatusStep > idx ? '#f6ffed' : surveyStatusStep === idx + 1 ? '#e6f7ff' : '#f0f0f0',
                      color: surveyStatusStep > idx ? '#52c41a' : surveyStatusStep === idx + 1 ? '#1890ff' : '#8c8c8c',
                      fontWeight: surveyStatusStep === idx + 1 ? 500 : 400
                    }}>
                      <span style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: surveyStatusStep > idx ? '#52c41a' : surveyStatusStep === idx + 1 ? '#1890ff' : '#bfbfbf',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11
                      }}>
                        {surveyStatusStep > idx ? '✓' : idx + 1}
                      </span>
                      {label}
                    </span>
                    {idx < 2 && (
                      <span style={{ flex: 1, height: 2, background: surveyStatusStep > idx ? '#52c41a' : '#f0f0f0' }}></span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="trace-info" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 20,
                padding: '12px 16px',
                background: '#fafafa',
                borderRadius: 4,
                fontSize: 13
              }}>
                <div>
                  <div className="text-muted text-xs mb-4">勘查人</div>
                  <div>{survey?.surveyor || surveyForm.surveyor || <span className="text-muted">待处理</span>}</div>
                </div>
                <div>
                  <div className="text-muted text-xs mb-4">提交人</div>
                  <div>
                    {survey?.submitted_by
                      ? <span>{survey.submitted_by} <span className="text-muted text-xs">({survey.submitted_at?.slice(0, 16) || ''})</span></span>
                      : <span className="text-muted">待处理</span>}
                  </div>
                </div>
                <div>
                  <div className="text-muted text-xs mb-4">审核人</div>
                  <div>
                    {survey?.confirmed_by
                      ? <span>{survey.confirmed_by} <span className="text-muted text-xs">({survey.confirmed_at?.slice(0, 16) || ''})</span></span>
                      : <span className="text-muted">待处理</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-item">
                  <label className="form-label">勘查日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={surveyForm.survey_date}
                    onChange={(e) => setSurveyForm({ ...surveyForm, survey_date: e.target.value })}
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">勘查人</label>
                  <input
                    type="text"
                    className="form-input"
                    value={surveyForm.surveyor}
                    onChange={(e) => setSurveyForm({ ...surveyForm, surveyor: e.target.value })}
                  />
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <span>线缆走向（分段描述）</span>
                  <button className="btn btn-sm" onClick={addRouteSegment}>+ 添加分段</button>
                </div>
                <div className="card-body">
                  {surveyForm.cable_route_structured.map((seg, idx) => (
                    <div key={idx} className="route-segment" style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 4,
                      padding: 12,
                      marginBottom: idx < surveyForm.cable_route_structured.length - 1 ? 12 : 0,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          background: '#1890ff',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12
                        }}>第{idx + 1}段</span>
                        {idx > 0 && <span style={{ color: '#1890ff', fontSize: 16 }}>→</span>}
                        {surveyForm.cable_route_structured.length > 1 && (
                          <span
                            className="link text-sm"
                            style={{ marginLeft: 'auto', color: '#f5222d' }}
                            onClick={() => removeRouteSegment(idx)}
                          >
                            删除
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">起点</label>
                          <input
                            type="text"
                            className="form-input"
                            value={seg.from}
                            onChange={(e) => updateRouteSegment(idx, 'from', e.target.value)}
                            placeholder="起点位置"
                          />
                        </div>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">终点</label>
                          <input
                            type="text"
                            className="form-input"
                            value={seg.to}
                            onChange={(e) => updateRouteSegment(idx, 'to', e.target.value)}
                            placeholder="终点位置"
                          />
                        </div>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">布线方式</label>
                          <input
                            type="text"
                            className="form-input"
                            value={seg.method}
                            onChange={(e) => updateRouteSegment(idx, 'method', e.target.value)}
                            placeholder="如：桥架/穿管/地埋等"
                          />
                        </div>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">长度（米）</label>
                          <input
                            type="number"
                            className="form-input"
                            value={seg.length ?? ''}
                            onChange={(e) => updateRouteSegment(idx, 'length', e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </div>
                      </div>
                      <div className="form-item" style={{ marginBottom: 0 }}>
                        <label className="form-label">备注</label>
                        <input
                          type="text"
                          className="form-input"
                          value={seg.notes || ''}
                          onChange={(e) => updateRouteSegment(idx, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-item">
                  <label className="form-label">现场环境</label>
                  <textarea
                    className="form-textarea"
                    value={surveyForm.site_condition}
                    onChange={(e) => setSurveyForm({ ...surveyForm, site_condition: e.target.value })}
                    placeholder="描述现场整体环境情况"
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">供电环境</label>
                  <textarea
                    className="form-textarea"
                    value={surveyForm.power_environment}
                    onChange={(e) => setSurveyForm({ ...surveyForm, power_environment: e.target.value })}
                    placeholder="描述供电情况、配电位置等"
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">设备位置</label>
                  <textarea
                    className="form-textarea"
                    value={surveyForm.equipment_position}
                    onChange={(e) => setSurveyForm({ ...surveyForm, equipment_position: e.target.value })}
                    placeholder="描述主要设备的安装位置"
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">地面情况</label>
                  <textarea
                    className="form-textarea"
                    value={surveyForm.ground_condition}
                    onChange={(e) => setSurveyForm({ ...surveyForm, ground_condition: e.target.value })}
                    placeholder="描述地面材质、是否可开槽等"
                  />
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16, marginTop: 16 }}>
                <div className="card-header">
                  <span>既有线路情况</span>
                  <button className="btn btn-sm" onClick={addExistingLine}>+ 添加线路</button>
                </div>
                <div className="card-body">
                  {surveyForm.existing_lines.map((line, idx) => (
                    <div key={idx} style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 4,
                      padding: 12,
                      marginBottom: idx < surveyForm.existing_lines.length - 1 ? 12 : 0,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          background: '#722ed1',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12
                        }}>线路{idx + 1}</span>
                        {surveyForm.existing_lines.length > 1 && (
                          <span
                            className="link text-sm"
                            style={{ marginLeft: 'auto', color: '#f5222d' }}
                            onClick={() => removeExistingLine(idx)}
                          >
                            删除
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">位置</label>
                          <input
                            type="text"
                            className="form-input"
                            value={line.location}
                            onChange={(e) => updateExistingLine(idx, 'location', e.target.value)}
                          />
                        </div>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">类型</label>
                          <input
                            type="text"
                            className="form-input"
                            value={line.type}
                            onChange={(e) => updateExistingLine(idx, 'type', e.target.value)}
                          />
                        </div>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">状况</label>
                          <input
                            type="text"
                            className="form-input"
                            value={line.condition}
                            onChange={(e) => updateExistingLine(idx, 'condition', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-item" style={{ marginBottom: 0 }}>
                        <label className="form-label">备注</label>
                        <input
                          type="text"
                          className="form-input"
                          value={line.notes || ''}
                          onChange={(e) => updateExistingLine(idx, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <span>施工难点与解决方案</span>
                  <button className="btn btn-sm" onClick={addDifficultyPoint}>+ 添加难点</button>
                </div>
                <div className="card-body">
                  {surveyForm.difficulty_points.map((point, idx) => (
                    <div key={idx} style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 4,
                      padding: 12,
                      marginBottom: idx < surveyForm.difficulty_points.length - 1 ? 12 : 0,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          background: '#faad14',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12
                        }}>难点{idx + 1}</span>
                        {surveyForm.difficulty_points.length > 1 && (
                          <span
                            className="link text-sm"
                            style={{ marginLeft: 'auto', color: '#f5222d' }}
                            onClick={() => removeDifficultyPoint(idx)}
                          >
                            删除
                          </span>
                        )}
                      </div>
                      <div className="form-item" style={{ marginBottom: 8 }}>
                        <label className="form-label">位置</label>
                        <input
                          type="text"
                          className="form-input"
                          value={point.location}
                          onChange={(e) => updateDifficultyPoint(idx, 'location', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">难点描述</label>
                          <textarea
                            className="form-textarea"
                            style={{ minHeight: 60 }}
                            value={point.description}
                            onChange={(e) => updateDifficultyPoint(idx, 'description', e.target.value)}
                          />
                        </div>
                        <div className="form-item" style={{ marginBottom: 8 }}>
                          <label className="form-label">解决方案</label>
                          <textarea
                            className="form-textarea"
                            style={{ minHeight: 60 }}
                            value={point.solution || ''}
                            onChange={(e) => updateDifficultyPoint(idx, 'solution', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-item">
                <label className="form-label">备注说明</label>
                <textarea
                  className="form-textarea"
                  value={surveyForm.remarks}
                  onChange={(e) => setSurveyForm({ ...surveyForm, remarks: e.target.value })}
                />
              </div>

              {survey?.status === 'submitted' && (
                <div className="form-item">
                  <label className="form-label">审核人</label>
                  <input
                    type="text"
                    className="form-input"
                    value={surveyForm.confirmed_by}
                    onChange={(e) => setSurveyForm({ ...surveyForm, confirmed_by: e.target.value })}
                    placeholder="请输入审核人"
                  />
                </div>
              )}

              <div className="flex gap-8" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn" onClick={handleSaveSurvey}>保存草稿</button>
                {survey?.status !== 'approved' && (
                  <button
                    className="btn btn-primary"
                    onClick={survey?.status === 'submitted' ? handleApproveSurvey : handleSubmitSurvey}
                  >
                    {survey?.status === 'submitted' ? '审核通过' : '提交审核'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wiring' && (
          <>
            <div className="card">
              <div className="card-header">
                <span>布线计划列表</span>
                <button className="btn btn-primary btn-sm" onClick={openNewWiringForm}>
                  + 新建计划
                </button>
              </div>
              <div className="card-body">
                {wiringPlans.length === 0 ? (
                  <div className="empty">暂无布线计划</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>版本</th>
                        <th>工作面</th>
                        <th>状态</th>
                        <th>创建人</th>
                        <th>确认人</th>
                        <th>确认时间</th>
                        <th>创建时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wiringPlans.map(plan => (
                        <React.Fragment key={plan.id}>
                          <tr>
                            <td>{plan.plan_version}</td>
                            <td>{plan.work_face || '-'}</td>
                            <td>
                              <span className="badge" style={{
                                background: plan.status === 'confirmed' ? '#f6ffed' : '#f0f0f0',
                                color: plan.status === 'confirmed' ? '#52c41a' : '#595959'
                              }}>
                                {plan.status === 'confirmed' ? '已确认' : '草稿'}
                              </span>
                            </td>
                            <td>{plan.created_by || '-'}</td>
                            <td>{plan.confirmed_by || '-'}</td>
                            <td className="text-muted text-sm">{plan.confirmed_at?.slice(0, 16) || '-'}</td>
                            <td className="text-muted text-sm">{plan.created_at?.slice(0, 10)}</td>
                            <td>
                              <span className="link text-sm" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}>
                                {expandedPlanId === plan.id ? '收起' : '详情'}
                              </span>
                              {plan.status !== 'confirmed' && (
                                <>
                                  <span style={{ margin: '0 8px', color: '#e8e8e8' }}>|</span>
                                  <span className="link text-sm" onClick={() => openEditWiringForm(plan)}>编辑</span>
                                  <span style={{ margin: '0 8px', color: '#e8e8e8' }}>|</span>
                                  <span className="link text-sm" onClick={() => handleConfirmWiringPlan(plan.id)}>确认</span>
                                </>
                              )}
                            </td>
                          </tr>
                          {expandedPlanId === plan.id && (
                            <tr>
                              <td colSpan={8} style={{ background: '#fafafa', padding: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                  <div>
                                    <div className="text-sm text-muted mb-4">上一环节勘查结论</div>
                                    <div>{plan.previous_conclusion || '-'}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted mb-4">布线方式</div>
                                    <div>{plan.wiring_method || '-'}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted mb-4">线缆规格 / 长度</div>
                                    <div>{plan.cable_spec || '-'} / {plan.cable_length || '-'} 米</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted mb-4">管材规格 / 长度</div>
                                    <div>{plan.conduit_spec || '-'} / {plan.conduit_length || '-'} 米</div>
                                  </div>
                                  <div style={{ gridColumn: 'span 2' }}>
                                    <div className="text-sm text-muted mb-4">计划用料清单</div>
                                    {Array.isArray(plan.planned_materials) && plan.planned_materials.length > 0 ? (
                                      <table style={{ background: '#fff' }}>
                                        <thead>
                                          <tr>
                                            <th>材料名</th>
                                            <th>规格</th>
                                            <th>单位</th>
                                            <th>数量</th>
                                            <th>备注</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {plan.planned_materials.map((pm, i) => (
                                            <tr key={i}>
                                              <td>{pm.material_name || '-'}</td>
                                              <td>{pm.spec || '-'}</td>
                                              <td>{pm.unit || '-'}</td>
                                              <td>{pm.quantity}</td>
                                              <td>{pm.notes || '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div className="text-muted">无</div>
                                    )}
                                  </div>
                                  <div style={{ gridColumn: 'span 2' }}>
                                    <div className="text-sm text-muted mb-4">备注</div>
                                    <div>{plan.remarks || '-'}</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'materials' && (
          <>
            <div className="card">
              <div className="card-header">
                <span>项目材料清单</span>
                <button className="btn btn-primary btn-sm" onClick={openMaterialForm}>
                  + 材料领用/退还
                </button>
              </div>
              <div className="card-body">
                {projectMaterials.length === 0 ? (
                  <div className="empty">暂无材料数据</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>材料名</th>
                        <th>规格</th>
                        <th>单位</th>
                        <th>计划量</th>
                        <th>实际用量</th>
                        <th>差额</th>
                        <th>超领标记</th>
                        <th>超领原因</th>
                        <th>超领审批人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectMaterials.map(m => {
                        const planned = m.planned_qty || 0
                        const used = m.used_qty || 0
                        const diff = used - planned
                        const isOverrun = used > planned
                        return (
                          <tr key={m.id}>
                            <td>{m.material_name}</td>
                            <td className="text-muted">{m.spec || '-'}</td>
                            <td>{m.unit || '-'}</td>
                            <td>{planned}</td>
                            <td style={{ color: isOverrun ? '#f5222d' : 'inherit' }}>{used}</td>
                            <td className={diff < 0 ? 'diff-negative' : diff > 0 ? 'diff-positive' : ''} style={{
                              color: diff < 0 ? '#52c41a' : diff > 0 ? '#f5222d' : 'inherit',
                              fontWeight: diff !== 0 ? 500 : 400
                            }}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td>
                              {m.is_overrun ? (
                                <span className="overrun-warning" style={{
                                  background: '#fff1f0',
                                  color: '#cf1322',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 12,
                                  display: 'inline-block'
                                }}>⚠️ 超领</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>{m.overrun_reason || '-'}</td>
                            <td>{m.overrun_approved_by || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span>材料领用记录</span>
              </div>
              <div className="card-body">
                {usageRecords.length === 0 ? (
                  <div className="empty">暂无领用记录</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>材料名</th>
                        <th>数量</th>
                        <th>类型</th>
                        <th>工作面</th>
                        <th>操作人</th>
                        <th>审批人</th>
                        <th>是否超领</th>
                        <th>备注</th>
                        <th>时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageRecords.map(r => (
                        <tr key={r.id}>
                          <td>{r.material_name}</td>
                          <td>{r.quantity} {r.unit || ''}</td>
                          <td>
                            <span className="badge" style={{
                              background: r.usage_type === '领出' ? '#e6f7ff' : '#f6ffed',
                              color: r.usage_type === '领出' ? '#1890ff' : '#52c41a'
                            }}>
                              {r.usage_type || '-'}
                            </span>
                          </td>
                          <td>{r.work_face || '-'}</td>
                          <td>{r.operator || '-'}</td>
                          <td>{r.approver || '-'}</td>
                          <td>
                            {r.is_overrun ? (
                              <span className="overrun-warning" style={{
                                background: '#fff1f0',
                                color: '#cf1322',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 12,
                                display: 'inline-block'
                              }}>是</span>
                            ) : (
                              <span className="text-muted">否</span>
                            )}
                          </td>
                          <td>{r.remarks || '-'}</td>
                          <td className="text-muted text-sm">{r.created_at?.slice(0, 16)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'logs' && (
          <div className="card">
            <div className="card-header">
              <span>操作记录</span>
            </div>
            <div className="card-body">
              <ActivityTimeline logs={activityLogs} />
            </div>
          </div>
        )}
      </div>

      {showWiringForm && (
        <div className="modal-overlay" onClick={() => setShowWiringForm(false)}>
          <div className="modal" style={{ width: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{editingPlanId ? '编辑布线计划' : '新建布线计划'}</span>
              <span className="modal-close" onClick={() => setShowWiringForm(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="work-area">
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <span>上一环节勘查结论（来自最新勘查）</span>
                  </div>
                  <div className="card-body">
                    <textarea
                      className="form-textarea"
                      value={wiringForm.previous_conclusion}
                      onChange={(e) => setWiringForm({ ...wiringForm, previous_conclusion: e.target.value })}
                      readOnly={!!survey}
                      style={{ background: !!survey ? '#fafafa' : '#fff', marginBottom: 0 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">工作面</label>
                    <input
                      type="text"
                      className="form-input"
                      value={wiringForm.work_face}
                      onChange={(e) => setWiringForm({ ...wiringForm, work_face: e.target.value })}
                      placeholder="如：一层东区、弱电井等"
                    />
                  </div>
                  <div>
                    <label className="form-label">版本号</label>
                    <input
                      type="text"
                      className="form-input"
                      value={wiringForm.plan_version}
                      onChange={(e) => setWiringForm({ ...wiringForm, plan_version: e.target.value })}
                      placeholder="如：V1.0"
                    />
                  </div>
                </div>

                <div className="form-item">
                  <label className="form-label">布线方式</label>
                  <input
                    type="text"
                    className="form-input"
                    value={wiringForm.wiring_method}
                    onChange={(e) => setWiringForm({ ...wiringForm, wiring_method: e.target.value })}
                    placeholder="如：沿桥架敷设、穿PVC管暗敷等"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">线缆规格</label>
                    <input
                      type="text"
                      className="form-input"
                      value={wiringForm.cable_spec}
                      onChange={(e) => setWiringForm({ ...wiringForm, cable_spec: e.target.value })}
                      placeholder="如：CAT6 UTP、RVV 2x1.5 等"
                    />
                  </div>
                  <div>
                    <label className="form-label">线缆长度（米）</label>
                    <input
                      type="number"
                      className="form-input"
                      value={wiringForm.cable_length}
                      onChange={(e) => setWiringForm({ ...wiringForm, cable_length: e.target.value ? Number(e.target.value) : '' })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">管材规格</label>
                    <input
                      type="text"
                      className="form-input"
                      value={wiringForm.conduit_spec}
                      onChange={(e) => setWiringForm({ ...wiringForm, conduit_spec: e.target.value })}
                      placeholder="如：PVC Φ25、桥架 100x50 等"
                    />
                  </div>
                  <div>
                    <label className="form-label">管材长度（米）</label>
                    <input
                      type="number"
                      className="form-input"
                      value={wiringForm.conduit_length}
                      onChange={(e) => setWiringForm({ ...wiringForm, conduit_length: e.target.value ? Number(e.target.value) : '' })}
                    />
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <span>计划用料清单</span>
                    <button className="btn btn-sm" onClick={addPlannedMaterial}>+ 添加材料</button>
                  </div>
                  <div className="card-body">
                    {wiringForm.planned_materials.map((pm, idx) => (
                      <div key={idx} style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 4,
                        padding: 12,
                        marginBottom: idx < wiringForm.planned_materials.length - 1 ? 12 : 0
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{
                            background: '#13c2c2',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12
                          }}>材料{idx + 1}</span>
                          {wiringForm.planned_materials.length > 1 && (
                            <span
                              className="link text-sm"
                              style={{ marginLeft: 'auto', color: '#f5222d' }}
                              onClick={() => removePlannedMaterial(idx)}
                            >
                              删除
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                          <div className="form-item" style={{ marginBottom: 8 }}>
                            <label className="form-label">材料</label>
                            <select
                              className="form-select"
                              value={pm.material_id || ''}
                              onChange={(e) => updatePlannedMaterial(idx, 'material_id', e.target.value)}
                            >
                              <option value="">请选择材料</option>
                              {allMaterials.map(m => (
                                <option key={m.id} value={m.id}>{m.material_name} ({m.spec || '-'})</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-item" style={{ marginBottom: 8 }}>
                            <label className="form-label">数量</label>
                            <input
                              type="number"
                              className="form-input"
                              value={pm.quantity || ''}
                              onChange={(e) => updatePlannedMaterial(idx, 'quantity', Number(e.target.value) || 0)}
                            />
                          </div>
                          <div className="form-item" style={{ marginBottom: 8 }}>
                            <label className="form-label">单位</label>
                            <input
                              type="text"
                              className="form-input"
                              value={pm.unit || ''}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="form-item" style={{ marginBottom: 0 }}>
                          <label className="form-label">备注</label>
                          <input
                            type="text"
                            className="form-input"
                            value={pm.notes || ''}
                            onChange={(e) => updatePlannedMaterial(idx, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-item">
                  <label className="form-label">备注</label>
                  <textarea
                    className="form-textarea"
                    value={wiringForm.remarks}
                    onChange={(e) => setWiringForm({ ...wiringForm, remarks: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#8c8c8c' }}>
                  <div>创建人：{wiringForm.created_by}</div>
                  <div>确认人：{wiringForm.confirmed_by || '待确认'}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowWiringForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveWiringPlan}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showMaterialForm && (
        <div className="modal-overlay" onClick={() => setShowMaterialForm(false)}>
          <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>材料领用/退还</span>
              <span className="modal-close" onClick={() => setShowMaterialForm(false)}>×</span>
            </div>
            <div className="modal-body">
              {overrunWarning && (
                <div className="overrun-warning" style={{
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  color: '#cf1322',
                  padding: '10px 12px',
                  borderRadius: 4,
                  marginBottom: 16,
                  fontSize: 13
                }}>
                  ⚠️ {overrunWarning}
                </div>
              )}
              <div className="form-item">
                <label className="form-label">材料</label>
                <select
                  className="form-select"
                  value={materialForm.material_id}
                  onChange={(e) => handleMaterialFormChange('material_id', e.target.value)}
                >
                  <option value="">请选择材料</option>
                  {projectMaterials.map(m => (
                    <option key={m.material_id} value={m.material_id}>
                      {m.material_name} ({m.spec || '-'}) [计划:{m.planned_qty} 已用:{m.used_qty || 0}]
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-item">
                  <label className="form-label">类型</label>
                  <select
                    className="form-select"
                    value={materialForm.usage_type}
                    onChange={(e) => handleMaterialFormChange('usage_type', e.target.value)}
                  >
                    <option value="领出">领出</option>
                    <option value="退还">退还</option>
                  </select>
                </div>
                <div className="form-item">
                  <label className="form-label">数量</label>
                  <input
                    type="number"
                    className="form-input"
                    value={materialForm.quantity}
                    onChange={(e) => handleMaterialFormChange('quantity', e.target.value)}
                    placeholder="请输入数量"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-item">
                  <label className="form-label">工作面</label>
                  <input
                    type="text"
                    className="form-input"
                    value={materialForm.work_face}
                    onChange={(e) => handleMaterialFormChange('work_face', e.target.value)}
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">操作人</label>
                  <input
                    type="text"
                    className="form-input"
                    value={materialForm.operator}
                    onChange={(e) => handleMaterialFormChange('operator', e.target.value)}
                    placeholder="请输入操作人"
                  />
                </div>
              </div>
              <div className="form-item">
                <label className="form-label">备注</label>
                <input
                  type="text"
                  className="form-input"
                  value={materialForm.remarks}
                  onChange={(e) => handleMaterialFormChange('remarks', e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowMaterialForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddMaterialUsage}>
                {overrunWarning ? '确认超领提交' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectDetail
