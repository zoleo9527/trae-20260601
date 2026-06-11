import React, { useState, useEffect } from 'react'
import { Project, STATUS_LABELS } from '../types'
import { StatusBadge, RiskBadge } from '../components/StatusBadge'

declare global {
  interface Window {
    api: any
  }
}

interface ProjectListProps {
  onViewProject: (projectId: number) => void
}

const quickFilters = [
  { key: 'all', label: '全部', hint: '显示所有项目' },
  { key: 'pending', label: '待处理', hint: '待勘查+待审核勘查' },
  { key: 'risky', label: '有风险', hint: '存在风险标记项目' },
  { key: 'overuse', label: '材料超领', hint: '材料使用超预算' },
  { key: 'docs_pending', label: '竣工待补', hint: '竣工资料待完善' },
  { key: 'recent', label: '最近打开', hint: '最近访问的项目' },
]

const ProjectList: React.FC<ProjectListProps> = ({ onViewProject }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [quickFilter, setQuickFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({
    project_name: '',
    project_code: '',
    client_name: '',
    site_address: '',
    project_manager: '',
    priority: 'normal',
    description: '',
  })

  useEffect(() => {
    loadProjects()
  }, [quickFilter, statusFilter, keyword])

  const loadProjects = async () => {
    try {
      let filters: any = {}
      
      if (statusFilter) {
        filters.status = statusFilter
      }
      if (keyword) {
        filters.keyword = keyword
      }
      if (quickFilter === 'risky') {
        filters.risk = 'yes'
      }
      if (quickFilter === 'pending') {
        filters.status_in = ['pending_survey', 'survey_submitted']
      }
      if (quickFilter === 'overuse') {
        filters.material_overuse = true
      }
      if (quickFilter === 'docs_pending') {
        filters.completion_docs_pending = true
      }

      let data
      if (quickFilter === 'recent') {
        data = await window.api.getRecentProjects(20)
      } else {
        data = await window.api.getProjects(filters)
      }
      setProjects(data || [])
    } catch (e) {
      console.error('加载项目失败', e)
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.project_name) return
    try {
      await window.api.createProject(newProject)
      setShowModal(false)
      setNewProject({
        project_name: '',
        project_code: '',
        client_name: '',
        site_address: '',
        project_manager: '',
        priority: 'normal',
        description: '',
      })
      loadProjects()
    } catch (e) {
      console.error('创建项目失败', e)
    }
  }

  const handleRowClick = async (project: Project) => {
    await window.api.updateLastOpened(project.id)
    onViewProject(project.id)
  }

  const getCompletionDocsBadge = (status?: string) => {
    if (status === 'done') {
      return <span className="completion-docs-done">已完善</span>
    }
    return <span className="completion-docs-pending">待补齐</span>
  }

  return (
    <>
      <div className="page-header">
        <div className="flex-between">
          <div className="page-title">项目管理</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新建项目
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="filter-bar">
          <div className="filter-tabs">
            {quickFilters.map(f => (
              <div
                key={f.key}
                className={`filter-tab ${quickFilter === f.key ? 'active' : ''}`}
                onClick={() => setQuickFilter(f.key)}
              >
                <div>{f.label}</div>
                <div className="quick-filter-hint">{f.hint}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}></div>
          <select
            className="form-select"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="搜索项目名称/编号/客户/地址/项目经理"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>项目编号</th>
                <th>项目名称</th>
                <th>客户</th>
                <th>项目经理</th>
                <th>施工班组</th>
                <th>资料员</th>
                <th>状态</th>
                <th>风险等级</th>
                <th>竣工资料状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={11}><div className="empty">暂无项目数据</div></td>
                </tr>
              ) : (
                projects.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(p)}>
                    <td>{p.project_code || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{p.project_name}</td>
                    <td>{p.client_name || '-'}</td>
                    <td>{p.project_manager || '-'}</td>
                    <td>{(p as any).construction_team || '-'}</td>
                    <td>{(p as any).document_controller || '-'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td><RiskBadge level={p.risk_level} /></td>
                    <td>{getCompletionDocsBadge((p as any).completion_docs_status)}</td>
                    <td className="text-muted text-sm">{p.created_at?.slice(0, 10)}</td>
                    <td>
                      <span className="link text-sm">查看详情</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>新建项目</span>
              <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="form-item">
                <label className="form-label">项目名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.project_name}
                  onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                  placeholder="请输入项目名称"
                />
              </div>
              <div className="form-item" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">项目编号</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProject.project_code}
                    onChange={(e) => setNewProject({ ...newProject, project_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">优先级</label>
                  <select
                    className="form-select"
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                  >
                    <option value="low">低</option>
                    <option value="normal">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="form-item">
                <label className="form-label">客户名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label className="form-label">工地地址</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.site_address}
                  onChange={(e) => setNewProject({ ...newProject, site_address: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label className="form-label">项目经理</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.project_manager}
                  onChange={(e) => setNewProject({ ...newProject, project_manager: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label className="form-label">项目描述</label>
                <textarea
                  className="form-textarea"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateProject}>创建</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectList
