import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileRecord, Reminder, OperatorRole, CollectionContext, HandoverRecord, ImperfectScenario } from '../types';

interface ArchiveKeeperProps {
  user: { id: string; name: string; role: OperatorRole };
}

export const ArchiveKeeperPage: React.FC<ArchiveKeeperProps> = ({ user }) => {
  const [pendingFiles, setPendingFiles] = useState<Array<{
    file: FileRecord;
    handover: HandoverRecord | undefined;
    collectionContext: CollectionContext | null;
  }>>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [scenarios, setScenarios] = useState<ImperfectScenario[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [selectedContext, setSelectedContext] = useState<CollectionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [handoverRes, remindersRes, scenariosRes] = await Promise.all([
        api.getPendingHandovers(),
        api.getMyReminders(),
        api.getImperfectScenarios(),
      ]);
      setPendingFiles(handoverRes.data);
      setReminders(remindersRes.data);
      setScenarios(scenariosRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (item: { file: FileRecord; handover: HandoverRecord | undefined; collectionContext: CollectionContext | null }) => {
    setSelectedFile(item.file);
    setSelectedContext(item.collectionContext);
  };

  const handleConfirmCollection = async (fileId: string) => {
    const collectorName = prompt('请输入领取人姓名:');
    if (!collectorName) return;

    const collectorId = prompt('请输入领取人身份证号:') || '';

    const collectionNote = prompt('请输入领取备注:') || '';

    setActionLoading(true);
    try {
      await api.confirmCollection(fileId, collectorName, collectorId, collectionNote);
      await loadData();
      setSelectedFile(null);
      setSelectedContext(null);
      alert('领取确认已完成');
    } catch (error: any) {
      alert(error.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeReminder = async (reminderId: string) => {
    try {
      await api.acknowledgeReminder(reminderId);
      await loadData();
    } catch (error: any) {
      alert(error.message || '确认失败');
    }
  };

  const handleAcknowledgeHandover = async (handoverId: string) => {
    try {
      await api.acknowledgeHandover(handoverId);
      await loadData();
      alert('交接已确认');
    } catch (error: any) {
      alert(error.message || '确认失败');
    }
  };

  const handleTriggerScenario = async (scenarioId: string) => {
    try {
      await api.triggerScenarioReminder(scenarioId);
      await loadData();
      alert('提醒已触发');
    } catch (error: any) {
      alert(error.message || '触发失败');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING_COLLECTION: '待领取',
      COLLECTION_CONFIRMED: '已领取',
      EXPIRED_NOT_COLLECTED: '已过期',
    };
    return statusMap[status] || status;
  };

  const getPriorityClass = (priority: string) => {
    const classMap: Record<string, string> = {
      URGENT: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return classMap[priority] || '';
  };

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  待领取卷宗 ({pendingFiles.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingFiles.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">暂无待领取卷宗</div>
                ) : (
                  pendingFiles.map((item) => (
                    <div
                      key={item.file.id}
                      className={`p-6 cursor-pointer ${
                        selectedFile?.id === item.file.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleViewDetails(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.file.appointmentNumber}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.file.currentStatus === 'PENDING_COLLECTION'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {getStatusText(item.file.currentStatus)}
                            </span>
                            {item.handover && !item.handover.acknowledged && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                待确认交接
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            申请ID: {item.file.applicationId}
                          </p>
                          {item.file.archiveInfo && (
                            <p className="text-xs text-gray-600 mt-1">
                              存放位置: {item.file.archiveInfo.archiveLocation}
                            </p>
                          )}
                          {item.file.expiresAt && (
                            <p className="text-xs text-red-600 mt-1">
                              领取期限: {new Date(item.file.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {item.handover && !item.handover.acknowledged && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledgeHandover(item.handover!.handoverId);
                              }}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              确认交接
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmCollection(item.file.id);
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            确认领取
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedFile && selectedContext && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">领取详情</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">预约号</h3>
                      <p className="text-sm text-gray-900">{selectedFile.appointmentNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">申请ID</h3>
                      <p className="text-sm text-gray-900">{selectedFile.applicationId}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">归档信息</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm">
                        <span className="text-gray-600">存放位置:</span>{' '}
                        <span className="text-gray-900">{selectedContext.archiveContext.archiveLocation}</span>
                      </p>
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">归档原因:</span>{' '}
                        <span className="text-gray-900">{selectedContext.archiveContext.archiveReason}</span>
                      </p>
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">归档说明:</span>{' '}
                        <span className="text-gray-900">{selectedContext.archiveContext.archiveNote}</span>
                      </p>
                      {selectedContext.archiveContext.notarialApproval && (
                        <p className="text-sm mt-2">
                          <span className="text-gray-600">公证审核:</span>{' '}
                          <span className="text-gray-900">
                            {selectedContext.archiveContext.notarialApproval.notaryName} -{' '}
                            {selectedContext.archiveContext.notarialApproval.approvalNote}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">交接信息</h3>
                    <div className="bg-purple-50 p-4 rounded">
                      <p className="text-sm">
                        <span className="text-gray-600">移交人:</span>{' '}
                        <span className="text-gray-900">
                          {selectedContext.handoverRecord.fromOperatorName}
                        </span>
                      </p>
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">接收人:</span>{' '}
                        <span className="text-gray-900">
                          {selectedContext.handoverRecord.toOperatorName}
                        </span>
                      </p>
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">交接原因:</span>{' '}
                        <span className="text-gray-900">{selectedContext.handoverRecord.handoverReason}</span>
                      </p>
                      {selectedContext.handoverRecord.handoverContext.correctionHistory &&
                        selectedContext.handoverRecord.handoverContext.correctionHistory.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-red-600 font-medium">历史补正:</p>
                            {selectedContext.handoverRecord.handoverContext.correctionHistory.map(
                              (correction, idx) => (
                                <p key={idx} className="text-sm text-gray-600 mt-1">
                                  • {correction}
                                </p>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">责任链</h3>
                    <div className="space-y-2">
                      {selectedContext.responsibilityChain.map((record, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                          <span className="text-gray-900">{record.operatorName}</span>
                          <span className="text-gray-500 ml-2">
                            ({record.role === 'WINDOW_STAFF' ? '窗口人员' : record.role === 'NOTARY' ? '公证员' : '档案员'})
                          </span>
                          {record.handoverReason && (
                            <span className="text-xs text-gray-400 ml-2">
                              - {record.handoverReason}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedContext.pendingCorrections && selectedContext.pendingCorrections.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-600 mb-2">待处理补正</h3>
                      <ul className="space-y-1">
                        {selectedContext.pendingCorrections.map((correction, idx) => (
                          <li key={idx} className="text-sm text-red-700">
                            • {correction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  待处理提醒 ({reminders.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {reminders.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">暂无提醒</div>
                ) : (
                  reminders.map((reminder) => (
                    <div key={reminder.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityClass(
                                reminder.priority
                              )}`}
                            >
                              {reminder.priority === 'URGENT'
                                ? '紧急'
                                : reminder.priority === 'HIGH'
                                ? '高'
                                : reminder.priority === 'MEDIUM'
                                ? '中'
                                : '低'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(reminder.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mt-2">{reminder.message}</p>
                          {reminder.actionRequired && (
                            <p className="text-xs text-orange-600 mt-1">
                              需要操作: {reminder.actionRequired}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAcknowledgeReminder(reminder.id)}
                          className="ml-3 text-sm text-blue-600 hover:text-blue-800"
                        >
                          确认
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">测试场景</h2>
                <p className="text-xs text-gray-500 mt-1">点击按钮触发流程断裂场景的提醒</p>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {scenarios.map((scenario) => (
                  <div key={scenario.scenarioId} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">{scenario.scenario}</h3>
                      <button
                        onClick={() => handleTriggerScenario(scenario.scenarioId)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        触发提醒
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>
                    <div className="bg-yellow-50 p-2 rounded">
                      <p className="text-xs text-yellow-800">
                        <span className="font-medium">问题:</span> {scenario.issue}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        <span className="font-medium">缺失:</span> {scenario.missingAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
