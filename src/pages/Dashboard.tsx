import { AlertTriangle, Soup, ClipboardList, Gift, CheckCircle } from 'lucide-react';
import { StatsCard } from '@/components/common/StatsCard';
import { useStats, useRoleTodos } from '@/store/selectors';
import { useStore } from '@/store/store';
import type { TodoItem } from '@/types';

export const Dashboard = () => {
  const stats = useStats();
  const todos = useRoleTodos();
  const { selectedRole, completeTodo } = useStore();
  
  const pendingTodos = todos.filter(t => !t.completed).slice(0, 5);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLabel = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return '紧急';
      case 'medium': return '中等';
      case 'low': return '一般';
    }
  };

  const roleStats: Record<string, { title: string; highlight: string[] }> = {
    '前厅经理': {
      title: '前厅经理看板',
      highlight: ['pendingOrders', 'activeSoldOut'],
    },
    '后厨主管': {
      title: '后厨主管看板',
      highlight: ['lowStockCount', 'activeSoldOut'],
    },
    '收银': {
      title: '收银看板',
      highlight: ['pendingGroupBuy', 'pendingOrders'],
    },
    '管理员': {
      title: '管理员看板',
      highlight: ['pendingTodos', 'activeSoldOut'],
    },
  };

  const currentRoleStats = roleStats[selectedRole];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{currentRoleStats.title}</h2>
        <p className="text-gray-500 mt-1">今日工作概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard
          title="待处理待办"
          value={stats.pendingTodos}
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard
          title="锅底库存不足"
          value={stats.lowStockCount}
          icon={Soup}
          color="red"
        />
        <StatsCard
          title="沽清提醒"
          value={stats.activeSoldOut}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatsCard
          title="进行中订单"
          value={stats.pendingOrders}
          icon={ClipboardList}
          color="green"
        />
        <StatsCard
          title="待核销团购"
          value={stats.pendingGroupBuy}
          icon={Gift}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">我的待办事项</h3>
            <span className="text-sm text-gray-500">{pendingTodos.length} 项待处理</span>
          </div>
          <div className="space-y-3">
            {pendingTodos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无待办事项</p>
              </div>
            ) : (
              pendingTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <button
                    onClick={() => completeTodo(todo.id)}
                    className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-500 transition-colors"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{todo.title}</p>
                    <p className="text-xs text-gray-500">{formatTime(todo.createdAt)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                    {getPriorityLabel(todo.priority)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">快速操作</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="font-medium text-gray-800">报告沽清</p>
              <p className="text-xs text-gray-500">登记缺货商品</p>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                <Soup className="h-5 w-5 text-orange-600" />
              </div>
              <p className="font-medium text-gray-800">锅底备料</p>
              <p className="text-xs text-gray-500">补充锅底库存</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <p className="font-medium text-gray-800">新建订单</p>
              <p className="text-xs text-gray-500">快速开单</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <p className="font-medium text-gray-800">团购核销</p>
              <p className="text-xs text-gray-500">验证团购券</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
