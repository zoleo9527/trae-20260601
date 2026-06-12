import { FileTextOutlined, AlertOutlined, ClockCircleOutlined, CheckCircleOutlined, AlertCircleOutlined } from '@ant-design/icons'
import { Card, Row, Col, Statistic } from 'antd'
import { Task, UserRole } from '@/types'
import { taskTypeLabels, statusLabels } from '@/data/mockData'

interface DashboardProps {
  userRole: UserRole
  todayTasks: Task[]
  stats: Record<string, number>
  onViewAsset: (assetId: string) => void
}

const roleTaskTypes: Record<UserRole, string[]> = {
  project_manager: ['asset_entry', 'document_supplement'],
  reviewer: ['document_review', 'qualification_dispute'],
  finance: ['deposit_refund'],
}

export function Dashboard({ userRole, todayTasks, stats, onViewAsset }: DashboardProps) {
  const relevantTasks = todayTasks.filter(t => roleTaskTypes[userRole].includes(t.type))
  
  const highPriorityCount = relevantTasks.filter(t => t.priority === 'high').length
  const pendingCount = relevantTasks.filter(t => t.status === 'pending').length
  const processingCount = relevantTasks.filter(t => t.status === 'processing').length

  return (
    <div className="dashboard">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理任务"
              value={relevantTasks.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="高优先级"
              value={highPriorityCount}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理"
              value={pendingCount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="处理中"
              value={processingCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="dashboard-section">
        <h3 className="section-title">今日待办</h3>
        <div className="task-list">
          {relevantTasks.length > 0 ? (
            relevantTasks.map(task => (
              <div 
                key={task.id} 
                className={`task-item ${task.priority}`}
                onClick={() => onViewAsset(task.assetId, true)}
              >
                <div className="task-header">
                  <span className="task-type">{taskTypeLabels[task.type]}</span>
                  <span className={`priority-badge ${task.priority}`}>
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <div className="task-info">
                  <span className="task-name">{task.assetName}</span>
                  <span className="task-code">{task.assetCode}</span>
                </div>
                {task.relatedIssue && (
                  <div className="task-issue">
                    <AlertCircleOutlined />
                    <span>{task.relatedIssue}</span>
                  </div>
                )}
                <div className="task-footer">
                  <span className={`status ${task.status}`}>
                    {task.status === 'pending' ? '待处理' : '处理中'}
                  </span>
                  <span className="task-time">{task.createdAt}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <CheckCircleOutlined />
              <p>今日暂无待办任务</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">标的状态统计</h3>
        <Row gutter={12}>
          {Object.entries(stats).map(([status, count]) => (
            <Col span={4} key={status}>
              <Card className={`status-card ${status}`}>
                <div className="status-icon">{statusIcons[status]}</div>
                <div className="status-info">
                  <span className="status-count">{count}</span>
                  <span className="status-label">{statusLabels[status]}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}

const statusIcons: Record<string, string> = {
  pending_entry: '📋',
  entry_completed: '✅',
  pending_review: '🔍',
  review_approved: '✓',
  review_rejected: '✗',
  pending_finance: '💰',
  finance_approved: '✓',
  finance_rejected: '✗',
  completed: '🎉',
}
