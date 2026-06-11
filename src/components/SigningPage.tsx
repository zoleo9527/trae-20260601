'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  getSigningReminders,
  sendSigningReminder,
  updateReminderStatus,
  getSigningReminderById,
  getOperationLogs,
  getStatusTransitions,
  getSubscriptionMaterials,
  getHandoverChain,
} from '@/services/dataService';
import type {
  SigningReminder,
  OperationLog,
  FilterOptions,
  StatusTransition,
  SubscriptionMaterial,
  HandoverRecord,
} from '@/types';
import { formatDate, getDaysLeft } from '@/components/ListItems';
import { urgencyLabels, urgencyColors, roleLabels } from '@/data/mockData';

interface SigningPageProps {
  selectedId?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待提醒', color: 'bg-gray-100 text-gray-600' },
  reminded: { label: '已提醒', color: 'bg-primary-100 text-primary-600' },
  confirmed: { label: '已确认', color: 'bg-success-100 text-success-600' },
  delayed: { label: '已延期', color: 'bg-warning-100 text-warning-600' },
  completed: { label: '已完成', color: 'bg-success-100 text-success-600' },
};

const materialStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '未提交', color: 'bg-gray-100 text-gray-500' },
  submitted: { label: '待审核', color: 'bg-primary-100 text-primary-600' },
  verified: { label: '已通过', color: 'bg-success-100 text-success-600' },
  returned: { label: '被退回', color: 'bg-danger-100 text-danger-600' },
};

export default function SigningPage({ selectedId }: SigningPageProps) {
  const { currentUser, refreshTrigger, triggerRefresh } = useApp();
  const [reminders, setReminders] = useState<SigningReminder[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({});
  const [selectedReminder, setSelectedReminder] = useState<SigningReminder | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [transitions, setTransitions] = useState<StatusTransition[]>([]);
  const [materials, setMaterials] = useState<SubscriptionMaterial[]>([]);
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'timeline' | 'chain'>('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser, refreshTrigger, filter]);

  useEffect(() => {
    if (selectedId) {
      const match = reminders.find((r) => r.id === selectedId);
      if (match && match.id !== selectedReminder?.id) {
        setSelectedReminder(match);
        setActiveDetailTab('info');
      }
    }
  }, [selectedId, reminders]);

  useEffect(() => {
    if (selectedReminder) {
      loadDetailData(selectedReminder.id, selectedReminder.subscriptionId);
    }
  }, [selectedReminder, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    let data = await getSigningReminders(filter);

    if (currentUser.role === 'consultant') {
      data = data.filter((r) => r.assignedTo === currentUser.id);
    } else if (currentUser.role === 'controller') {
      data = data.filter((r) => r.assignedRole === 'controller');
    }

    setReminders(data);
    if (data.length > 0) {
      if (!selectedReminder || !data.find((r) => r.id === selectedReminder.id)) {
        setSelectedReminder(data[0]);
      } else {
        const updated = data.find((r) => r.id === selectedReminder.id);
        if (updated) setSelectedReminder(updated);
      }
    } else {
      setSelectedReminder(null);
    }
    setLoading(false);
  };

  const loadDetailData = async (reminderId: string, subscriptionId: string) => {
    const [logData, transitionData, materialData, chainData] = await Promise.all([
      getOperationLogs(subscriptionId),
      getStatusTransitions(subscriptionId),
      getSubscriptionMaterials(subscriptionId),
      getHandoverChain(subscriptionId, 'subscription'),
    ]);
    const reminderLogs = logData.filter(
      (l) => l.targetId === reminderId || l.targetId === subscriptionId
    );
    setLogs(reminderLogs);
    setTransitions(transitionData);
    setMaterials(materialData);
    setHandovers(chainData.handovers);
  };

  const refreshAfterAction = async () => {
    await loadData();
    if (selectedReminder) {
      await loadDetailData(selectedReminder.id, selectedReminder.subscriptionId);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedReminder) return;

    await sendSigningReminder(selectedReminder.id, {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
    });

    await refreshAfterAction();
  };

  const handleMarkDelayed = async () => {
    if (!selectedReminder || !delayReason.trim()) {
      alert('请填写延期原因');
      return;
    }

    await updateReminderStatus(
      selectedReminder.id,
      'delayed',
      delayReason,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      }
    );

    setShowDelayModal(false);
    setDelayReason('');
    await refreshAfterAction();
  };

  const handleMarkCompleted = async () => {
    if (!selectedReminder) return;

    await updateReminderStatus(
      selectedReminder.id,
      'completed',
      undefined,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      }
    );

    await refreshAfterAction();
  };

  const criticalCount = reminders.filter((r) => r.urgency === 'critical').length;
  const modifiedCount = reminders.filter((r) => r.materialModified).length;
  const returnedMaterials = materials.filter((m) => m.status === 'returned').length;

  return (
    <div className="flex gap-4 h-[calc(100vh-64px)]">
      <div className="w-96 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">签约提醒</h3>
            <div className="flex gap-1">
              {criticalCount > 0 && (
                <span className="text-xs px-2 py-1 bg-danger-100 text-danger-600 rounded-full animate-blink">
                  {criticalCount} 危急
                </span>
              )}
              {modifiedCount > 0 && (
                <span className="text-xs px-2 py-1 bg-warning-100 text-warning-600 rounded-full">
                  {modifiedCount} 资料已变
                </span>
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="搜索客户/房号/认购号..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filter.keyword || ''}
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
          />
          <div className="flex gap-2 mt-2">
            <select
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600"
              value={filter.status || 'all'}
              onChange={(e) =>
                setFilter({ ...filter, status: e.target.value })
              }
            >
              <option value="all">全部状态</option>
              <option value="pending">待提醒</option>
              <option value="reminded">已提醒</option>
              <option value="delayed">已延期</option>
              <option value="completed">已完成</option>
            </select>
            <select
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600"
              value={filter.urgency || 'all'}
              onChange={(e) =>
                setFilter({ ...filter, urgency: e.target.value })
              }
            >
              <option value="all">全部紧急度</option>
              <option value="critical">危急</option>
              <option value="urgent">紧急</option>
              <option value="normal">正常</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : reminders.length > 0 ? (
            reminders.map((reminder) => {
              const daysInfo = getDaysLeft(reminder.signDeadline);
              return (
                <div
                  key={reminder.id}
                  onClick={() => setSelectedReminder(reminder)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all border ${
                    selectedReminder?.id === reminder.id
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${
                    reminder.urgency === 'critical'
                      ? 'border-l-4 border-l-danger-500 animate-pulse-border'
                      : reminder.urgency === 'urgent'
                      ? 'border-l-4 border-l-warning-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {reminder.customerName}
                        </span>
                        {reminder.materialModified && (
                          <span className="text-xs px-1.5 py-0.5 bg-danger-100 text-danger-600 rounded animate-blink">
                            资料已变
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {reminder.unitNo}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-medium ${daysInfo.color}`}
                      >
                        {daysInfo.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        已提醒 {reminder.reminderCount} 次
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        urgencyColors[reminder.urgency]
                      }`}
                    >
                      {urgencyLabels[reminder.urgency]}
                    </span>
                    {reminder.materialReady ? (
                      <span className="text-xs text-success-600">✓ 资料齐全</span>
                    ) : (
                      <span className="text-xs text-danger-600">✗ 资料不齐</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">⏰</div>
              <div>暂无签约提醒</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {selectedReminder ? (
          <>
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedReminder.customerName}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded text-sm ${
                        statusLabels[selectedReminder.status]?.color
                      }`}
                    >
                      {statusLabels[selectedReminder.status]?.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-sm ${
                        urgencyColors[selectedReminder.urgency]
                      }`}
                    >
                      {urgencyLabels[selectedReminder.urgency]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedReminder.subscriptionNo} ·{' '}
                    {selectedReminder.unitNo}
                  </p>
                </div>
              </div>

              {selectedReminder.materialModified && (
                <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg animate-pulse-border">
                  <div className="flex items-center gap-3">
                    <span className="text-danger-500 text-xl">⚠️</span>
                    <div className="flex-1">
                      <div className="font-medium text-danger-700">
                        认购资料已变更，需重新确认
                      </div>
                      <p className="text-sm text-danger-600 mt-0.5">
                        资料最后变更时间:{' '}
                        {selectedReminder.lastMaterialChangeAt
                          ? formatDate(selectedReminder.lastMaterialChangeAt)
                          : '未知'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveDetailTab('timeline')}
                      className="text-sm text-danger-600 hover:text-danger-700 font-medium"
                    >
                      查看变更 →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex border-b border-gray-100 px-5">
              <button
                onClick={() => setActiveDetailTab('info')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeDetailTab === 'info'
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                基本信息
                {activeDetailTab === 'info' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveDetailTab('timeline')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeDetailTab === 'timeline'
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                操作轨迹
                {transitions.length > 0 && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {transitions.length}
                  </span>
                )}
                {activeDetailTab === 'timeline' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveDetailTab('chain')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeDetailTab === 'chain'
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                交接链路
                {handovers.length > 0 && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {handovers.length}
                  </span>
                )}
                {activeDetailTab === 'chain' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
              {activeDetailTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">客户电话</div>
                      <div className="font-medium text-gray-800 mt-1">
                        {selectedReminder.phone}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">签约截止</div>
                      <div
                        className={`font-medium mt-1 ${
                          getDaysLeft(selectedReminder.signDeadline).color
                        }`}
                      >
                        {getDaysLeft(selectedReminder.signDeadline).label}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(selectedReminder.signDeadline)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">提醒次数</div>
                      <div className="font-medium text-gray-800 mt-1">
                        {selectedReminder.reminderCount} 次
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">资料状态</div>
                      <div
                        className={`font-medium mt-1 ${
                          selectedReminder.materialReady
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }`}
                      >
                        {selectedReminder.materialReady ? '资料齐全' : '资料不齐全'}
                      </div>
                    </div>
                  </div>

                  {selectedReminder.delayReason && (
                    <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                      <div className="text-sm font-medium text-warning-700">
                        延期原因
                      </div>
                      <p className="text-sm text-warning-600 mt-1">
                        {selectedReminder.delayReason}
                      </p>
                      {selectedReminder.delayDays && (
                        <p className="text-xs text-warning-500 mt-2">
                          预计延期 {selectedReminder.delayDays} 天
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      责任分配
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-500">对接顾问</div>
                        <div className="text-sm font-medium text-blue-700 mt-1">
                          {selectedReminder.lastReminderBy || '未分配'}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-xs text-purple-500">负责角色</div>
                        <div className="text-sm font-medium text-purple-700 mt-1">
                          {roleLabels[selectedReminder.assignedRole]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedReminder.lastReminderAt && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">最近一次提醒</div>
                      <div className="text-sm font-medium text-gray-700 mt-1">
                        {formatDate(selectedReminder.lastReminderAt)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        提醒人: {selectedReminder.lastReminderBy}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      资料明细
                      {returnedMaterials > 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-danger-100 text-danger-600 rounded">
                          {returnedMaterials} 份被退回
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {materials.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-lg border flex items-center justify-between ${
                            m.status === 'returned'
                              ? 'border-danger-200 bg-danger-50'
                              : m.status === 'verified'
                              ? 'border-success-200 bg-success-50'
                              : m.status === 'submitted'
                              ? 'border-primary-200 bg-primary-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📄</span>
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {m.name}
                              </div>
                              {m.returnedReason && (
                                <div className="text-xs text-danger-600 mt-0.5">
                                  退回原因: {m.returnedReason}
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              materialStatusLabels[m.status]?.color
                            }`}
                          >
                            {materialStatusLabels[m.status]?.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'timeline' && (
                <div className="space-y-4">
                  {transitions.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gray-200"></div>
                      {transitions.map((t, idx) => (
                        <div key={t.id} className="relative pl-8 pb-5">
                          <div
                            className={`absolute left-0 w-5 h-5 rounded-full border-2 border-white ${
                              idx === 0
                                ? 'bg-primary-500 ring-2 ring-primary-200'
                                : 'bg-gray-300'
                            }`}
                          ></div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">
                                {t.fromStatus} → {t.toStatus}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(t.timestamp)}
                              </span>
                            </div>
                            {t.reason && (
                              <p className="text-sm text-gray-600 mt-1">
                                原因: {t.reason}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              操作人: {t.operatorName} ({roleLabels[t.operatorRole]})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-3xl mb-2">📝</div>
                      <div>暂无状态变更记录</div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      操作日志
                    </h4>
                    {logs.length > 0 ? (
                      <div className="space-y-2">
                        {logs.slice(0, 5).map((log) => (
                          <div
                            key={log.id}
                            className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                  {log.action}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDate(log.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {log.detail}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                操作人: {log.operatorName} (
                                {roleLabels[log.operatorRole]})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        暂无操作日志
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'chain' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    交接链路总览
                  </h4>
                  <div className="flex items-center justify-between mb-6 px-2">
                    {['来访登记', '客户跟进', '认购单', '认购资料', '签约提醒'].map(
                      (stage, idx) => (
                        <div key={stage} className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              idx <= 3
                                ? 'bg-primary-100 text-primary-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          {idx < 4 && (
                            <div
                              className={`w-12 md:w-16 h-0.5 ${
                                idx < 3 ? 'bg-primary-200' : 'bg-gray-200'
                              }`}
                            ></div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {handovers.length > 0 ? (
                    <div className="space-y-3">
                      {handovers.map((h) => (
                        <div
                          key={h.id}
                          className={`p-4 rounded-lg border ${
                            h.status === 'blocked'
                              ? 'border-danger-200 bg-danger-50'
                              : h.status === 'delayed'
                              ? 'border-warning-200 bg-warning-50'
                              : h.status === 'completed'
                              ? 'border-success-200 bg-success-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">
                                {h.fromPerson}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium text-gray-800">
                                {h.toPerson}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  h.status === 'blocked'
                                    ? 'bg-danger-100 text-danger-600'
                                    : h.status === 'delayed'
                                    ? 'bg-warning-100 text-warning-600'
                                    : h.status === 'completed'
                                    ? 'bg-success-100 text-success-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {h.status === 'blocked'
                                  ? '阻塞'
                                  : h.status === 'delayed'
                                  ? '延误'
                                  : h.status === 'completed'
                                  ? '完成'
                                  : '进行中'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(h.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{h.remark}</p>
                          {h.deadline && (
                            <p className="text-xs text-gray-500 mt-2">
                              交接截止: {formatDate(h.deadline)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-3xl mb-2">🔗</div>
                      <div>暂无交接记录</div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 text-xl">💡</span>
                      <div>
                        <div className="font-medium text-blue-700">
                          责任界定说明
                        </div>
                        <ul className="text-sm text-blue-600 mt-2 space-y-1">
                          <li>• 置业顾问负责客户对接、资料收集、签约提醒</li>
                          <li>• 销控专员负责资料审核、认购单确认</li>
                          <li>• 案场经理负责异常处理、流程监督</li>
                          <li>
                            • 资料变更自动触发签约提醒标记，确保双方同步感知
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                {selectedReminder.status !== 'completed' && (
                  <button
                    onClick={handleSendReminder}
                    className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    发送签约提醒
                  </button>
                )}
                {selectedReminder.status !== 'delayed' &&
                  selectedReminder.status !== 'completed' && (
                    <button
                      onClick={() => setShowDelayModal(true)}
                      className="px-4 py-3 bg-warning-500 text-white rounded-lg font-medium hover:bg-warning-600 transition-colors"
                    >
                      申请延期
                    </button>
                  )}
                {selectedReminder.status !== 'completed' && (
                  <button
                    onClick={handleMarkCompleted}
                    className="px-4 py-3 bg-success-500 text-white rounded-lg font-medium hover:bg-success-600 transition-colors"
                  >
                    标记完成
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">⏰</div>
              <p>选择签约提醒查看详情</p>
            </div>
          </div>
        )}
      </div>

      {showDelayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              申请延期
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                延期原因 *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warning-500"
                rows={4}
                placeholder="请说明延期原因..."
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
              />
            </div>
            <div className="p-3 bg-warning-50 rounded-lg mt-4">
              <p className="text-sm text-warning-600">
                ⚠️ 申请延期后，签约提醒状态会更新，相关人员会收到通知。
                延期需要案场经理审批。
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDelayModal(false);
                  setDelayReason('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMarkDelayed}
                className="px-4 py-2 bg-warning-500 text-white rounded-lg text-sm hover:bg-warning-600 transition-colors"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
