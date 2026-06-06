import { useStore } from '@/store'
import { PriorityBadge, RiskLevelBadge } from '@/components/Badges'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Package,
  Film,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const {
    todos,
    risks,
    inventoryItems,
    screenings,
    operationLogs,
    currentUser,
    completeTodo,
  } = useStore()

  const pendingTodos = todos.filter((t) => !t.completed)
  const openRisks = risks.filter((r) => r.status !== 'resolved')
  const pendingInventory = inventoryItems.filter((i) => i.status === 'pending' || i.status === 'in_progress')
  const activeScreenings = screenings.filter(
    (s) => s.status !== 'completed' && new Date(s.endTime) > new Date()
  )
  const recentChanges = operationLogs.slice(0, 10)

  const stats = [
    {
      label: '待办事项',
      value: pendingTodos.length,
      icon: CheckCircle2,
      color: 'text-primary-600 bg-primary-50',
      link: '/#todos',
    },
    {
      label: '风险项',
      value: openRisks.length,
      icon: AlertTriangle,
      color: 'text-danger-600 bg-danger-50',
      link: '/#risks',
    },
    {
      label: '待处理库存',
      value: pendingInventory.length,
      icon: Package,
      color: 'text-warning-600 bg-warning-50',
      link: '/inventory',
    },
    {
      label: '进行中场次',
      value: activeScreenings.length,
      icon: Film,
      color: 'text-success-600 bg-success-50',
      link: '/screenings',
    },
  ]

  const actionLabels: Record<string, string> = {
    hall_changed: '换厅',
    equipment_failure: '设备故障',
    refund_processed: '退票处理',
    inventory_status_updated: '库存状态更新',
    todo_completed: '待办完成',
    remark_added: '添加备注',
    attachment_uploaded: '上传附件',
    role_switched: '切换角色',
    screening_status_updated: '场次状态更新',
    group_ticket_redeemed: '团体票核销',
    exception_created: '创建异常',
    exception_status_updated: '异常状态更新',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {new Date().getHours() < 12 ? '上午好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}，{currentUser.name}
          </h1>
          <p className="text-gray-500 mt-1">这是今日的运营概览</p>
        </div>
        <div className="flex gap-3">
          <Link to="/inventory" className="btn-primary">
            开始库存盘点
          </Link>
          <Link to="/screenings" className="btn-secondary">
            查看今日场次
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
                查看详情
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card" id="todos">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">待办事项</h2>
                <span className="badge bg-primary-100 text-primary-600">
                  {pendingTodos.length} 项待处理
                </span>
              </div>
              <Link to="/exceptions" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                全部待办
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingTodos.slice(0, 5).map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <button
                    onClick={() => completeTodo(todo.id)}
                    className="w-5 h-5 rounded border-2 border-gray-300 hover:border-primary-500 flex items-center justify-center flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{todo.title}</p>
                      <PriorityBadge priority={todo.priority} />
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{todo.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">截止时间</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(todo.dueTime), 'HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                </div>
              ))}
              {pendingTodos.length === 0 && (
                <p className="text-center text-gray-400 py-8">暂无待办事项</p>
              )}
            </div>
          </div>

          <div className="card" id="risks">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger-600" />
                <h2 className="text-lg font-semibold text-gray-900">风险项</h2>
                <span className="badge bg-danger-100 text-danger-600">
                  {openRisks.length} 项风险
                </span>
              </div>
              <Link to="/exceptions" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                风险管控
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {openRisks.slice(0, 4).map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <RiskLevelBadge level={risk.level} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{risk.title}</p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{risk.description}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                    {risk.status === 'open' ? '待处理' : '处理中'}
                  </span>
                </div>
              ))}
              {openRisks.length === 0 && (
                <p className="text-center text-gray-400 py-8">当前无风险项</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">最近变更</h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentChanges.map((log) => (
                <div key={log.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.operatorName}</span>
                      <span className="text-gray-500"> {actionLabels[log.action] || log.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(log.timestamp), 'MM-dd HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-primary-900">快捷操作</h3>
            </div>
            <div className="space-y-2">
              <Link to="/inventory" className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">新建库存盘点</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link to="/screenings" className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">场次对账处理</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link to="/exceptions" className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">记录异常事件</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
