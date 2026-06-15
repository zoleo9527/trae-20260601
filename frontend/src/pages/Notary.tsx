import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileRecord, Reminder, OperatorRole, OperationLog } from '../types';

interface NotaryProps {
  user: { id: string; name: string; role: OperatorRole };
}

export const NotaryPage: React.FC<NotaryProps> = ({ user }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [fileHistory, setFileHistory] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filesRes, remindersRes] = await Promise.all([
        api.getFiles(undefined, OperatorRole.NOTARY),
        api.getMyReminders(),
      ]);
      setFiles(filesRes.data);
      setReminders(remindersRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileDetails = async (file: FileRecord) => {
    setSelectedFile(file);
    try {
      const historyRes = await api.getFileHistory(file.id);
      setFileHistory(historyRes.data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  };

  const handleApproveArchive = async (file: FileRecord) => {
    const approvalNote = prompt('请输入审核意见:');
    if (!approvalNote) return;

    setActionLoading(true);
    try {
      await api.completeArchive(
        file.id,
        file,
        file.archiveInfo?.archiveLocation || '档案室A区',
        '审核通过',
        approvalNote,
        {
          notaryId: user.id,
          notaryName: user.name,
          approvalNote,
        }
      );
      await loadData();
      alert('归档审核已完成');
    } catch (error) {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrection = async (file: FileRecord) => {
    const correctionContent = prompt('请输入补正内容:');
    if (!correctionContent) return;

    setActionLoading(true);
    try {
      await api.requestCorrection(file.id, file, correctionContent);
      await loadData();
      alert('补正通知已发送');
    } catch (error) {
      alert('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeReminder = async (reminderId: string) => {
    try {
      await api.acknowledgeReminder(reminderId);
      await loadData();
    } catch (error) {
      alert('确认失败');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING_ARCHIVE: '待归档',
      ARCHIVING: '归档中',
      ARCHIVED: '已归档',
      PENDING_COLLECTION: '待领取',
      COLLECTION_CONFIRMED: '已领取',
      EXPIRED_NOT_COLLECTED: '已过期',
      RETURNED_FOR_CORRECTION: '需补正',
    };
    return statusMap[status] || status;
  };

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      START_ARCHIVE: '启动归档',
      COMPLETE_ARCHIVE: '完成归档',
      TRANSFER_TO_COLLECTION: '转移至领取',
      CONFIRM_COLLECTION: '确认领取',
      REQUEST_CORRECTION: '发起补正',
      TAKE_OVER: '接管',
      EXPIRE_WARNING: '过期提醒',
    };
    return actionMap[action] || action;
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">公证员工作台</h1>
          <p className="text-sm text-gray-600 mt-1">欢迎，{user.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">待审核卷宗</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {files.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">暂无待审核卷宗</div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-6 cursor-pointer ${
                        selectedFile?.id === file.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => loadFileDetails(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {file.appointmentNumber}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                file.currentStatus === 'ARCHIVING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : file.currentStatus === 'RETURNED_FOR_CORRECTION'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {getStatusText(file.currentStatus)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            申请ID: {file.applicationId}
                          </p>
                          {file.correctionHistory.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-red-600 font-medium">补正历史:</p>
                              {file.correctionHistory.map((correction, idx) => (
                                <p key={idx} className="text-xs text-gray-600 mt-1">
                                  • {correction.operatorName}：{correction.correctionContent}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {file.currentStatus === 'ARCHIVING' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveArchive(file);
                                }}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                审核通过
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRequestCorrection(file);
                                }}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                要求补正
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedFile && fileHistory.length > 0 && (
              <div className="bg-white shadow rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">处理历史</h2>
                </div>
                <div className="p-6">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-6">
                      {fileHistory.map((log, idx) => (
                        <div key={log.id} className="relative pl-8">
                          <div className="absolute left-2.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {getActionText(log.action)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.operatorName} |{' '}
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            {log.reason && (
                              <p className="text-sm text-gray-600 mt-1">{log.reason}</p>
                            )}
                            {log.contextSnapshot?.correctionHistory &&
                              log.contextSnapshot.correctionHistory.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-red-600">补正内容:</p>
                                  {log.contextSnapshot.correctionHistory.map((correction, cIdx) => (
                                    <p key={cIdx} className="text-xs text-gray-600">
                                      • {correction}
                                    </p>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                <h2 className="text-lg font-semibold text-gray-900">统计信息</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{files.length}</p>
                    <p className="text-sm text-gray-600">待审核卷宗</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {files.filter((f) => f.currentStatus === 'RETURNED_FOR_CORRECTION').length}
                    </p>
                    <p className="text-sm text-gray-600">需补正</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
