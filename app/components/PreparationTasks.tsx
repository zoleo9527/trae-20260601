import type { PreparationTask, User, CostBudget } from '~/types';
import { formatDate, formatDateShort, formatMoney, getStatusLabel, getStatusColor, getCostStatus } from '~/utils/formatters';

interface PreparationTasksProps {
  tasks: PreparationTask[];
  assignees: Array<{ id: string; name: string }>;
  costBudget?: CostBudget;
  costSummary?: {
    totalEstimated: number;
    totalActual: number;
    completedCost: number;
    pendingCost: number;
  };
}

export default function PreparationTasks({ tasks, assignees, costBudget, costSummary }: PreparationTasksProps) {
  const totalCost = tasks.reduce((sum, t) => sum + t.cost, 0);
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  const getAssigneeName = (id: string): string => {
    return assignees.find(u => u.id === id)?.name || '未知';
  };

  const costStatus = costSummary && costBudget 
    ? getCostStatus(costSummary.totalActual, costBudget.estimatedBudget) 
    : { status: 'normal' as const, message: '暂无预算' };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">整备计划</h2>
            <div className="flex items-center space-x-6 mt-2 text-green-100 text-sm">
              <span>任务总数: {tasks.length} 项</span>
              <span>已完成: {completedCount} 项</span>
              <span>进行中: {inProgressCount} 项</span>
              <span>待处理: {pendingCount} 项</span>
            </div>
          </div>
          {costBudget && costSummary && (
            <div className="text-right">
              <div className="text-white">
                <div className="text-sm opacity-80">实际成本</div>
                <div className="text-2xl font-bold">{formatMoney(costSummary.totalActual)}</div>
                <div className="text-sm opacity-80">
                  预算: {formatMoney(costBudget.estimatedBudget)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {costBudget && costSummary && (
          <div className={`mb-6 rounded-lg p-4 ${
            costStatus.status === 'overrun' ? 'bg-red-50 border border-red-200' :
            costStatus.status === 'warning' ? 'bg-orange-50 border border-orange-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {costStatus.status === 'overrun' ? '⚠️' : 
                   costStatus.status === 'warning' ? '⚡' : '💰'}
                </span>
                <div>
                  <div className="font-semibold text-gray-900">成本追踪</div>
                  <div className="text-sm text-gray-600">{costStatus.message}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  已完成: {formatMoney(costSummary.completedCost)}
                </div>
                <div className="text-sm text-gray-600">
                  预计: {formatMoney(costSummary.pendingCost)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  costStatus.status === 'overrun' ? 'bg-red-500' :
                  costStatus.status === 'warning' ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min((costSummary.totalActual / costBudget.estimatedBudget) * 100, 100)}%` 
                }}
              ></div>
            </div>
            {costBudget.warningThreshold && (
              <div className="mt-2 text-xs text-gray-500">
                预警线: {costBudget.warningThreshold * 100}% ({formatMoney(costBudget.estimatedBudget * costBudget.warningThreshold)})
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">整备进度</span>
            <span className="text-sm font-medium text-gray-900">{completedCount}/{tasks.length} ({Math.round((completedCount / tasks.length) * 100)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => {
            const costDiff = task.cost - task.estimatedCost;
            const costOverrun = costDiff > 0;
            
            return (
              <div 
                key={task.id} 
                className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
                  task.status === 'completed' ? 'border-green-200 bg-green-50' :
                  task.status === 'in_progress' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      {costOverrun && task.status === 'completed' && (
                        <span className="text-xs text-red-600" title={`超出预估 ${formatMoney(costDiff)}`}>
                          ⚠️ 超预算
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">负责人:</span>
                        <span className="ml-1 text-gray-900">{getAssigneeName(task.assigneeId)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">预估:</span>
                        <span className="ml-1 text-gray-900">{formatMoney(task.estimatedCost)}</span>
                      </div>
                      <div className={costOverrun ? 'text-red-600' : 'text-gray-900'}>
                        <span className="text-gray-500">实际:</span>
                        <span className="ml-1 font-medium">{formatMoney(task.cost)}</span>
                        {costOverrun && task.status === 'completed' && (
                          <span className="text-xs ml-1">(+{formatMoney(costDiff)})</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">工时:</span>
                        <span className="ml-1 text-gray-900">{task.estimatedHours}h</span>
                        {task.actualHours > 0 && (
                          <span className="text-xs text-gray-400 ml-1">(实际: {task.actualHours}h)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="text-gray-500">
                        截止日期: {formatDateShort(new Date(task.dueDate))}
                      </div>
                      <div className="text-gray-500">
                        创建人: {task.createdByName}
                      </div>
                    </div>

                    {task.note && (
                      <div className="mt-3 p-2 bg-white rounded text-sm text-gray-600 border border-gray-200">
                        <span className="text-gray-500">备注:</span> {task.note}
                      </div>
                    )}

                    {task.completedAt && (
                      <div className="mt-3 text-xs text-green-600 flex items-center space-x-2">
                        <span>✓</span>
                        <span>完成时间: {formatDate(new Date(task.completedAt))}</span>
                      </div>
                    )}

                    {task.costHistory && task.costHistory.length > 1 && (
                      <div className="mt-3">
                        <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                          查看成本变更历史 ({task.costHistory.length}次)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>暂无整备任务</p>
          </div>
        )}
      </div>
    </div>
  );
}
