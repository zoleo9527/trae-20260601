import React, { useState, useEffect } from 'react'
import { Project, ActivityLog, TodoItem } from '../types'
import { StatusBadge, RiskBadge } from '../components/StatusBadge'
import ActivityTimeline from '../components/ActivityTimeline'

declare global {
  interface Window {
    api: any
  }
}

interface DashboardProps {
  onViewProject: (projectId: number) => void
}

const TODO_TYPE_LABELS: Record<string, string> = {
  pending_survey: '待勘查',
  survey_review: '待审核',
  wiring_confirm: '待确认布线',
  material_overuse: '材料超领'
}

const Dashboard: React.FC<DashboardProps> = ({ onViewProject }) => {
  const [stats, setStats] = useState<any>({
    pending_survey: 0,
    survey_submitted: 0,
    wiring_planned: 0,
    in_progress: 0,
    material_overuse: 0
  })
  const [riskyProjects, setRiskyProjects] = useState<Project[]>([])
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [completionDocsPending, setCompletionDocsPending] = useState<Project[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [s, risky, recent, logs, todoList, docsPending] = await Promise.all([
        window.api.getDashboardStats(),
        window.api.getRiskyProjects(),
        window.api.getRecentProjects(5),
        window.api.getActivityLogs(undefined, 10),
        window.api.getTodoList(),
        window.api.getProjects({ completion_docs_pending: true })
      ])
      setStats(s)
      setRiskyProjects(risky)
      setRecentProjects(recent)
      setActivityLogs(logs)
      setTodos(todoList || [])
      setCompletionDocsPending((docsPending || []).filter((p: Project) =>
        (p.status === 'completed' || p.status === 'in_progress') &&
        (p as any).completion_docs_status !== 'done'
      ))
    } catch (e) {
      console.error('加载数据失败', e)
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !(t as any).done } as TodoItem : t))
  }

  const formatOpenedTime = (timeStr?: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    return timeStr.slice(0, 10)
  }

  const getCompletionDocsBadge = (status?: string) => {
    if (status === 'done') {
      return <span className="completion-docs-done">已完善</span>
    }
    return <span className="completion-docs-pending">待补齐</span>
  }

  return (
    <div className="page-content">
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-title">待勘查</div>
          <div className="stat-card-value" style={{ color: '#faad14' }}>{stats.pending_survey}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📝</div>
          <div className="stat-card-title">待审核勘查</div>
          <div className="stat-card-value" style={{ color: '#1890ff' }}>{stats.survey_submitted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🔌</div>
          <div className="stat-card-title">待确认布线</div>
          <div className="stat-card-value" style={{ color: '#722ed1' }}>{stats.wiring_planned}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🔧</div>
          <div className="stat-card-title">施工中</div>
          <div className="stat-card-value" style={{ color: '#13c2c2' }}>{stats.in_progress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚠️</div>
          <div className="stat-card-title">超领预警</div>
          <div className="stat-card-value" style={{ color: '#f5222d' }}>{stats.material_overuse}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <div className="card">
            <div className="card-header">
              <span>风险项目</span>
              <span className="link text-sm">查看全部</span>
            </div>
            <div className="card-body">
              {riskyProjects.length === 0 ? (
                <div className="empty">暂无风险项目</div>
              ) : (
                riskyProjects.slice(0, 5).map(p => (
                  <div key={p.id} className="risk-item" onClick={() => onViewProject(p.id)}>
                    <RiskBadge level={p.risk_level} />
                    <div className="risk-info">
                      <div className="risk-name">{p.project_name}</div>
                      <div className="risk-desc">{p.site_address}</div>
                      {p.risk_reason && (
                        <span className="risk-reason-highlight">{p.risk_reason}</span>
                      )}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span>竣工资料待补</span>
              <span className="link text-sm">{completionDocsPending.length} 项待补齐</span>
            </div>
            <div className="card-body">
              {completionDocsPending.length === 0 ? (
                <div className="empty">暂无待补资料</div>
              ) : (
                completionDocsPending.slice(0, 5).map(p => (
                  <div key={p.id} className="risk-item" onClick={() => onViewProject(p.id)}>
                    <div className="risk-info">
                      <div className="risk-name">{p.project_name}</div>
                      <div className="risk-desc">{p.project_code} · {p.project_manager || '未分配项目经理'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {getCompletionDocsBadge((p as any).completion_docs_status)}
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span>最近变更动态</span>
            </div>
            <div className="card-body">
              <ActivityTimeline logs={activityLogs} />
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <span>待办事项</span>
              <span className="link text-sm">{todos.filter(t => !(t as any).done).length} 项待完成</span>
            </div>
            <div className="card-body">
              {todos.length === 0 ? (
                <div className="empty">暂无待办事项</div>
              ) : (
                <ul className="todo-list">
                  {todos.map(todo => (
                    <li key={todo.id} className={`todo-item ${(todo as any).done ? 'done' : ''}`}>
                      <input
                        type="checkbox"
                        className="todo-check"
                        checked={(todo as any).done}
                        onChange={() => toggleTodo(todo.id)}
                      />
                      <span className="todo-text">
                        <span className={`todo-type-tag todo-type-${todo.type}`}>
                          {TODO_TYPE_LABELS[todo.type]}
                        </span>
                        {todo.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span>最近打开</span>
            </div>
            <div className="card-body">
              {recentProjects.length === 0 ? (
                <div className="empty">暂无记录</div>
              ) : (
                recentProjects.map(p => (
                  <div
                    key={p.id}
                    className="risk-item"
                    onClick={() => onViewProject(p.id)}
                  >
                    <div className="risk-info">
                      <div className="risk-name">{p.project_name}</div>
                      <div className="risk-desc">
                        {p.project_code} · {formatOpenedTime(p.last_opened_at)}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
