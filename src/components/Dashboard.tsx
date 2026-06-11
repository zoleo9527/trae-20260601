'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  getDashboardStats,
  getSigningReminders,
  getSubscriptions,
  getDashboardAlerts,
  getTodoItems,
  getHandoverRecords,
  getRoleWorkloads,
  updateTodoStatus,
} from '@/services/dataService';
import StatCard from '@/components/StatCard';
import { ReminderItem, SubscriptionItem, formatDate, getDaysLeft } from '@/components/ListItems';
import type {
  SigningReminder,
  Subscription,
  DashboardAlert,
  TodoItem,
  HandoverRecord,
  RoleWorkload,
} from '@/types';
import {
  todoTypeLabels,
  todoPriorityColors,
  handoverStatusLabels,
  handoverStatusColors,
  stageLabels,
} from '@/data/mockData';

interface DashboardProps {
  onNavigate: (tab: string, id?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { currentUser, refreshTrigger, triggerRefresh } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [workloads, setWorkloads] = useState<RoleWorkload[]>([]);
  const [urgentReminders, setUrgentReminders] = useState<SigningReminder[]>([]);
  const [problemSubscriptions, setProblemSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'handovers' | 'problems'>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [s, alertList, todoList, handoverList, workloadList, reminders, subs] =
        await Promise.all([
          getDashboardStats(currentUser.role, currentUser.id),
          getDashboardAlerts(currentUser.role, currentUser.id),
          getTodoItems(currentUser.role, currentUser.id, 'pending'),
          getHandoverRecords(currentUser.role, currentUser.id),
          getRoleWorkloads(),
          getSigningReminders(),
          getSubscriptions(),
        ]);
      setStats(s);
      setAlerts(alertList);
      setTodos(todoList.slice(0, 8));
      setHandovers(handoverList.slice(0, 6));
      setWorkloads(workloadList);

      let filteredReminders = reminders;
      let filteredSubs = subs;

      if (currentUser.role === 'consultant') {
        filteredReminders = reminders.filter((r) => r.assignedTo === currentUser.id);
        filteredSubs = subs.filter((s) => s.consultantId === currentUser.id);
      } else if (currentUser.role === 'controller') {
        filteredReminders = reminders.filter((r) => r.assignedRole === 'controller');
        filteredSubs = subs.filter((s) => s.controllerId === currentUser.id);
      }

      const urgent = filteredReminders
        .filter((r) => r.urgency === 'critical' || r.urgency === 'urgent')
        .slice(0, 5);
      setUrgentReminders(urgent);

      const problems = filteredSubs
        .filter((s) => s.materialStatus === 'returned' || s.modifiedCount > 0)
        .slice(0, 5);
      setProblemSubscriptions(problems);

      setLoading(false);
    };

    loadData();
  }, [currentUser, refreshTrigger]);

  const handleCompleteTodo = async (todoId: string) => {
    await updateTodoStatus(
      todoId,
      'completed',
      { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    );
    triggerRefresh();
  };

  const criticalAlertCount = alerts.filter((a) => a.type === 'critical').length;
  const warningAlertCount = alerts.filter((a) => a.type === 'warning').length;

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                alert.type === 'critical'
                  ? 'bg-danger-50 border border-danger-200 animate-pulse-border'
                  : alert.type === 'warning'
                  ? 'bg-warning-50 border border-warning-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <span className="text-2xl flex-shrink-0">
                {alert.type === 'critical'
                  ? '🚨'
                  : alert.type === 'warning'
                  ? '⚠️'
                  : 'ℹ️'}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-semibold ${
                    alert.type === 'critical'
                      ? 'text-danger-700'
                      : alert.type === 'warning'
                      ? 'text-warning-700'
                      : 'text-blue-700'
                  }`}
                >
                  {alert.title}
                </div>
                <div
                  className={`text-sm ${
                    alert.type === 'critical'
                      ? 'text-danger-600'
                      : alert.type === 'warning'
                      ? 'text-warning-600'
                      : 'text-blue-600'
                  }`}
                >
                  {alert.description}
                </div>
              </div>
              {alert.actionText && alert.actionTarget && (
                <button
                  onClick={() => onNavigate(alert.actionTarget!)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                    alert.type === 'critical'
                      ? 'bg-danger-500 text-white hover:bg-danger-600'
                      : alert.type === 'warning'
                      ? 'bg-warning-500 text-white hover:bg-warning-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {alert.actionText}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="待办事项"
          value={stats.pendingTodoCount || 0}
          icon="📋"
          variant="default"
          subtitle="需处理"
        />
        <StatCard
          title="高优先级"
          value={stats.highPriorityTodos || 0}
          icon="🔥"
          variant="danger"
          pulse={stats.highPriorityTodos > 0}
          subtitle="紧急处理"
        />
        <StatCard
          title="交接问题"
          value={stats.blockedHandovers || 0}
          icon="🔄"
          variant="warning"
          subtitle="阻塞/延误"
        />
        <StatCard
          title="危急签约"
          value={stats.criticalCount}
          icon="⏰"
          variant="danger"
          pulse={stats.criticalCount > 0}
          subtitle="24小时内"
        />
        <StatCard
          title="资料问题"
          value={stats.materialIssues}
          icon="📁"
          variant="warning"
          subtitle="被退回"
        />
        <StatCard
          title="已改认购"
          value={stats.modifiedSubs}
          icon="✏️"
          variant="warning"
          subtitle="需关注"
        />
      </div>

      {currentUser.role === 'manager' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">各角色工作量</h3>
          <div className="grid grid-cols-3 gap-4">
            {workloads.map((wl) => (
              <div
                key={wl.role}
                className={`p-4 rounded-lg border ${
                  wl.overdueCount > 0
                    ? 'border-danger-200 bg-danger-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{wl.roleName}</span>
                  {wl.overdueCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-danger-100 text-danger-600 rounded">
                      {wl.overdueCount} 逾期
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {wl.pendingCount}
                    </div>
                    <div className="text-xs text-gray-500">待处理</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-success-600">
                      {wl.todayCompleted}
                    </div>
                    <div className="text-xs text-gray-500">今日完成</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('todos')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'todos'
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            我的待办
            {todos.length > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-danger-100 text-danger-600 rounded-full">
                {todos.length}
              </span>
            )}
            {activeTab === 'todos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('handovers')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'handovers'
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            交接状态
            {handovers.filter((h) => h.status === 'blocked' || h.status === 'delayed')
              .length > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-warning-100 text-warning-600 rounded-full">
                {
                  handovers.filter(
                    (h) => h.status === 'blocked' || h.status === 'delayed'
                  ).length
                }
              </span>
            )}
            {activeTab === 'handovers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'problems'
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            问题清单
            {activeTab === 'problems' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
            )}
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'todos' && (
            <div>
              {todos.length > 0 ? (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-3 rounded-lg border transition-all ${
                        todo.priority === 'high'
                          ? 'border-danger-200 bg-danger-50'
                          : todo.priority === 'medium'
                          ? 'border-warning-200 bg-warning-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleCompleteTodo(todo.id)}
                          className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5 hover:border-primary-500 transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {todo.title}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                todoPriorityColors[todo.priority]
                              }`}
                            >
                              {todo.priority === 'high'
                                ? '高'
                                : todo.priority === 'medium'
                                ? '中'
                                : '低'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{todoTypeLabels[todo.type]}</span>
                            {todo.dueAt && (
                              <span
                                className={
                                  new Date(todo.dueAt) < new Date()
                                    ? 'text-danger-600'
                                    : ''
                                }
                              >
                                截止: {formatDate(todo.dueAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">✅</div>
                  <div>暂无待办事项</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'handovers' && (
            <div>
              {handovers.length > 0 ? (
                <div className="space-y-3">
                  {handovers.map((handover) => (
                    <div
                      key={handover.id}
                      className={`p-3 rounded-lg border ${
                        handover.status === 'blocked'
                          ? 'border-danger-200 bg-danger-50'
                          : handover.status === 'delayed'
                          ? 'border-warning-200 bg-warning-50'
                          : handover.status === 'completed'
                          ? 'border-success-200 bg-success-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {stageLabels[handover.fromStage]} →{' '}
                            {stageLabels[handover.toStage]}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              handoverStatusColors[handover.status]
                            }`}
                          >
                            {handoverStatusLabels[handover.status]}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {handover.targetName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {handover.fromPerson} → {handover.toPerson}
                        </span>
                        {handover.deadline && (
                          <span
                            className={
                              new Date(handover.deadline) < new Date()
                                ? 'text-danger-600'
                                : 'text-gray-500'
                            }
                          >
                            截止: {formatDate(handover.deadline)}
                          </span>
                        )}
                      </div>
                      {handover.remark && (
                        <p className="text-xs text-gray-600 mt-2">{handover.remark}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">🔄</div>
                  <div>暂无交接记录</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'problems' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">紧急签约提醒</h4>
                  <button
                    onClick={() => onNavigate('signing')}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    查看全部 →
                  </button>
                </div>
                {urgentReminders.length > 0 ? (
                  <div className="space-y-1">
                    {urgentReminders.map((reminder) => (
                      <ReminderItem
                        key={reminder.id}
                        reminder={reminder}
                        onAction={(id) => onNavigate('signing', id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-sm">暂无紧急提醒</div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">问题认购单</h4>
                  <button
                    onClick={() => onNavigate('subscriptions')}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    查看全部 →
                  </button>
                </div>
                {problemSubscriptions.length > 0 ? (
                  <div className="space-y-1">
                    {problemSubscriptions.map((sub) => (
                      <SubscriptionItem
                        key={sub.id}
                        subscription={sub}
                        onAction={(id) => onNavigate('subscriptions', id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">📋</div>
                    <div className="text-sm">暂无问题认购单</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">现场压力指数</h3>
            <p className="text-gray-400 text-sm mt-1">
              基于待办量、逾期率、资料退回率综合计算
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-warning-400">
              {Math.min(
                100,
                Math.round(
                  (stats.pendingTodoCount || 0) * 10 +
                    stats.criticalCount * 15 +
                    stats.materialIssues * 8 +
                    stats.blockedHandovers * 12
                )
              )}
              <span className="text-lg text-gray-400"> / 100</span>
            </div>
            <div className="text-sm text-warning-300 mt-1">
              {(stats.pendingTodoCount || 0) + stats.criticalCount + stats.materialIssues > 5
                ? '压力较大，需优先处理高危项'
                : '压力正常，保持节奏'}
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              Math.min(
                100,
                Math.round(
                  (stats.pendingTodoCount || 0) * 10 +
                    stats.criticalCount * 15 +
                    stats.materialIssues * 8 +
                    stats.blockedHandovers * 12
                )
              ) > 70
                ? 'bg-danger-500'
                : Math.min(
                    100,
                    Math.round(
                      (stats.pendingTodoCount || 0) * 10 +
                        stats.criticalCount * 15 +
                        stats.materialIssues * 8 +
                        stats.blockedHandovers * 12
                    )
                  ) > 40
                ? 'bg-warning-500'
                : 'bg-success-500'
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.round(
                  (stats.pendingTodoCount || 0) * 10 +
                    stats.criticalCount * 15 +
                    stats.materialIssues * 8 +
                    stats.blockedHandovers * 12
                )
              )}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
