import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { TodoList } from '@/components/dashboard/TodoList'
import { RiskAlerts } from '@/components/dashboard/RiskAlerts'
import { RecentChanges } from '@/components/dashboard/RecentChanges'

const todoItems = [
  {
    id: '1',
    title: '处理寄存单 #DEP-20240615-A3F2',
    description: '威士忌 × 2，啤酒 × 6',
    priority: 'high' as const,
    dueTime: '今天 22:00',
  },
  {
    id: '2',
    title: '批量核销 5 个寄存单',
    description: '客户：王先生，订台 #A123',
    priority: 'medium' as const,
    dueTime: '今天 23:00',
  },
  {
    id: '3',
    title: '检查即将过期的寄存',
    description: '3 个寄存单将在明天过期',
    priority: 'low' as const,
  },
]

const riskItems = [
  {
    id: '1',
    type: 'expiry' as const,
    title: '寄存超期未取',
    description: '有 5 个寄存单超过 30 天未取完',
    severity: 'high' as const,
    count: 5,
  },
  {
    id: '2',
    type: 'anomaly' as const,
    title: '异常核销记录',
    description: '寄存单 #DEP-20240610-B2C1 在 24h 内核销 8 次',
    severity: 'medium' as const,
    count: 8,
  },
  {
    id: '3',
    type: 'inventory' as const,
    title: '库存预警',
    description: '威士忌寄存总量超过阈值 100 瓶',
    severity: 'low' as const,
    count: 124,
  },
]

const recentItems = [
  {
    id: '1',
    type: 'deposit' as const,
    title: '新建寄存 #DEP-20240616-C4D5',
    description: '客户：李女士，订台 #C205',
    time: '2 分钟前',
    status: 'pending' as const,
  },
  {
    id: '2',
    type: 'redeem' as const,
    title: '核销寄存 #DEP-20240615-A3F2',
    description: '威士忌 × 1，操作人：小李',
    time: '15 分钟前',
    status: 'success' as const,
  },
  {
    id: '3',
    type: 'booking' as const,
    title: '新建订台 #C206',
    description: '客户：张先生，A区 03 台',
    time: '1 小时前',
    status: 'pending' as const,
  },
  {
    id: '4',
    type: 'expiry' as const,
    title: '寄存单 #DEP-20240601-X1Y2 已过期',
    description: '威士忌 × 3 未取完',
    time: '3 小时前',
    status: 'danger' as const,
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header title="首页仪表盘" subtitle="酒吧运营管理系统" />

      <div className="p-8 space-y-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="今日新增寄存"
            value={23}
            change="+12%"
            changeType="increase"
            icon="deposit"
            color="cyan"
          />
          <StatCard
            title="今日核销"
            value={45}
            change="+8%"
            changeType="increase"
            icon="redeem"
            color="gold"
          />
          <StatCard
            title="风险项"
            value={3}
            change="-2"
            changeType="decrease"
            icon="risk"
            color="red"
          />
          <StatCard
            title="本月营收"
            value="¥12.8万"
            change="+15%"
            changeType="increase"
            icon="trend"
            color="green"
          />
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 待办事项 - 占用 2 列 */}
          <div className="lg:col-span-2">
            <TodoList items={todoItems} />
          </div>

          {/* 风险预警 */}
          <div>
            <RiskAlerts items={riskItems} />
          </div>
        </div>

        {/* 最近变更 */}
        <div className="grid grid-cols-1">
          <RecentChanges items={recentItems} />
        </div>
      </div>
    </div>
  )
}