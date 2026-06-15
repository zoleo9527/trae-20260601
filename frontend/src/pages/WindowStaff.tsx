import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileRecord, Reminder, OperatorRole } from '../types';

interface WindowStaffProps {
  user: { id: string; name: string; role: OperatorRole };
}

export const WindowStaffPage: React.FC<WindowStaffProps> = ({ user }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filesRes, remindersRes] = await Promise.all([
        api.getFiles(),
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

  const handleStartArchive = async (fileId: string) => {
    setActionLoading(true);
    try {
      await api.startArchive(fileId);
      await loadData();
      alert('归档流程已启动');
    } catch (error: any) {
      alert(error.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteArchive = async (file: FileRecord) => {
    const archiveLocation = prompt('请输入归档位置（如：档案室A区-第3排-第12格）:');
    if (!archiveLocation) return;

    const archiveReason = prompt('请输入归档原因:');
    if (!archiveReason) return;

    const archiveNote = prompt('请输入归档说明:');
    if (!archiveNote) return;

    setActionLoading(true);
    try {
      await api.completeArchive(file.id, archiveLocation, archiveReason, archiveNote);
      await loadData();
      alert('归档已完成，已自动转移至档案室等待领取');
    } catch (error: any) {
      alert(error.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferToCollection = async (fileId: string) => {
    setActionLoading(true);
    try {
      await api.transferToCollection(fileId);
      await loadData();
      alert('卷宗已转移至档案室，等待领取确认');
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
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">我的卷宗</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {files.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">暂无卷宗</div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedFile(file)}
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
                                  : file.currentStatus === 'ARCHIVED'
                                  ? 'bg-green-100 text-green-800'
                                  : file.currentStatus === 'RETURNED_FOR_CORRECTION'
                                  ? 'bg-red-100 text-red-800'
                                  : file.currentStatus === 'PENDING_COLLECTION'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {getStatusText(file.currentStatus)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            申请ID: {file.applicationId}
                          </p>
                          {file.responsiblePerson && (
                            <p className="text-xs text-gray-400 mt-1">
                              责任人: {file.responsiblePerson.operatorName} | 接收时间:{' '}
                              {new Date(file.responsiblePerson.assignedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {file.currentStatus === 'ARCHIVING' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteArchive(file);
                                }}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                完成归档
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTransferToCollection(file.id);
                                }}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                转移至领取
                              </button>
                            </>
                          )}
                          {file.currentStatus === 'PENDING_ARCHIVE' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartArchive(file.id);
                              }}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              启动归档
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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

            {selectedFile && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">卷宗详情</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">预约号</h3>
                    <p className="text-sm text-gray-900">{selectedFile.appointmentNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">申请ID</h3>
                    <p className="text-sm text-gray-900">{selectedFile.applicationId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">当前状态</h3>
                    <p className="text-sm text-gray-900">
                      {getStatusText(selectedFile.currentStatus)}
                    </p>
                  </div>
                  {selectedFile.responsibilityChain.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">责任链</h3>
                      <ul className="mt-2 space-y-2">
                        {selectedFile.responsibilityChain.map((record, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="text-gray-900">{record.operatorName}</span>
                            <span className="text-gray-500">
                              {' '}
                              - {record.role === 'WINDOW_STAFF' ? '窗口人员' : record.role === 'NOTARY' ? '公证员' : '档案员'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
