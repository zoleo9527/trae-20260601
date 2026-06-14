import { useState, useEffect } from 'react';
import { X, Play, CheckCircle, XCircle, Edit3, FileText, AlertCircle } from 'lucide-react';
import { ExamTrackRecord, ExamTrackStatus, UserRole, OperationLog, OperationType, PracticePlan } from '../types';
import { getStatusLabel, getStatusColor, formatDate, getTrackTypeLabel, getDayOfWeekLabel, getRoleLabel, getOperationLabel } from '../utils';
import { api } from '../api';

interface RecordDetailDrawerProps {
  record: ExamTrackRecord;
  currentRole: UserRole;
  onClose: () => void;
}

export const RecordDetailDrawer = ({ record, currentRole, onClose }: RecordDetailDrawerProps) => {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [supplementNotes, setSupplementNotes] = useState('');
  const [supplementPlan, setSupplementPlan] = useState<PracticePlan>(record.practicePlan);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState(record.practicePlan.progress);

  useEffect(() => {
    fetchLogs();
  }, [record.id]);

  const fetchLogs = async () => {
    try {
      const data = await api.examTracks.logs(record.id);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const calculateEndDate = (startDate: string, durationWeeks: number): string => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + durationWeeks * 7);
    return date.toISOString().split('T')[0];
  };

  const handlePlanChange = (field: string, value: number | string) => {
    const newPlan = { ...supplementPlan, [field]: value };
    
    if (field === 'startDate' || field === 'durationWeeks') {
      const startDate = newPlan.startDate || new Date().toISOString().split('T')[0];
      newPlan.endDate = calculateEndDate(startDate, newPlan.durationWeeks);
    }
    
    setSupplementPlan(newPlan);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.examTracks.submit(record.id);
      onClose();
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await api.examTracks.approve(record.id);
      onClose();
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setLoading(true);
      await api.examTracks.reject(record.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      onClose();
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplement = async () => {
    try {
      setLoading(true);
      await api.examTracks.supplement(record.id, { 
        supplementNotes,
        practicePlan: supplementPlan 
      });
      setShowSupplementModal(false);
      setSupplementNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to supplement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async () => {
    try {
      setLoading(true);
      await api.examTracks.startPractice(record.id);
      onClose();
    } catch (error) {
      console.error('Failed to start practice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    try {
      setLoading(true);
      await api.examTracks.updateProgress(record.id, progressValue);
      setShowProgressModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await api.examTracks.complete(record.id);
      onClose();
    } catch (error) {
      console.error('Failed to complete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExam = async (passed: boolean) => {
    try {
      setLoading(true);
      await api.examTracks.confirmExam(record.id, passed);
      onClose();
    } catch (error) {
      console.error('Failed to confirm exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = () => {
    const actions: { label: string; action: () => void; icon: typeof CheckCircle; disabled?: boolean }[] = [];
    
    if (currentRole === UserRole.TEACHER) {
      if (record.status === ExamTrackStatus.DRAFT) {
        actions.push({ label: '提交审核', action: handleSubmit, icon: CheckCircle });
      }
      if (record.status === ExamTrackStatus.REJECTED) {
        actions.push({ label: '补充修改', action: () => setShowSupplementModal(true), icon: Edit3 });
      }
      if (record.status === ExamTrackStatus.APPROVED) {
        actions.push({ label: '开始练习', action: handleStartPractice, icon: Play });
      }
      if (record.status === ExamTrackStatus.IN_PRACTICE) {
        actions.push({ label: '更新进度', action: () => setShowProgressModal(true), icon: Edit3 });
        actions.push({ label: '标记完成', action: handleComplete, icon: CheckCircle });
      }
      if (record.status === ExamTrackStatus.SUPPLEMENTED) {
        actions.push({ label: '重新提交审核', action: handleSubmit, icon: CheckCircle });
        actions.push({ label: '开始练习', action: handleStartPractice, icon: Play });
      }
    }
    
    if (currentRole === UserRole.ADMIN) {
      if (record.status === ExamTrackStatus.SUBMITTED_BY_TEACHER || record.status === ExamTrackStatus.REVIEWING_BY_ADMIN) {
        actions.push({ label: '审核通过', action: handleApprove, icon: CheckCircle });
        actions.push({ label: '退回修改', action: () => setShowRejectModal(true), icon: XCircle });
      }
      if (record.status === ExamTrackStatus.COMPLETED) {
        actions.push({ label: '确认考级通过', action: () => handleConfirmExam(true), icon: CheckCircle });
        actions.push({ label: '确认考级未通过', action: () => handleConfirmExam(false), icon: XCircle });
      }
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">记录详情</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">{record.studentName}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                {getStatusLabel(record.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">乐器</div>
              <div className="font-medium text-gray-900">{record.instrument}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">考级级别</div>
              <div className="font-medium text-gray-900">{record.examLevel}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">曲目名称</div>
              <div className="font-medium text-gray-900">{record.trackName}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">曲目类型</div>
              <div className={`font-medium ${record.trackType === 'required' ? 'text-green-700' : 'text-gray-700'}`}>
                {getTrackTypeLabel(record.trackType)}
              </div>
            </div>
          </div>

          {record.rejectReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">退回原因</span>
              </div>
              <p className="text-gray-700">{record.rejectReason}</p>
            </div>
          )}

          {record.supplementNotes && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">补充备注</span>
              </div>
              <p className="text-gray-700">{record.supplementNotes}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">练习计划</h3>
            <div className="bg-blue-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">计划周期</div>
                  <div className="font-medium text-gray-900">{record.practicePlan.durationWeeks} 周</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">时间范围</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(record.practicePlan.startDate)} - {formatDate(record.practicePlan.endDate)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">本周重点</div>
                <div className="font-medium text-gray-900">{record.practicePlan.weeklyFocus}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">每日练习目标</div>
                <div className="grid grid-cols-7 gap-2">
                  {record.practicePlan.dailyGoals.map((goal) => (
                    <div key={goal.dayOfWeek} className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs font-medium text-gray-700 mb-1">周{getDayOfWeekLabel(goal.dayOfWeek)}</div>
                      <div className="text-sm font-semibold text-blue-600">{goal.durationMinutes}分钟</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">练习进度</span>
                  <span className="text-sm font-medium text-gray-700">{record.practicePlan.progress}%</span>
                </div>
                <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${record.practicePlan.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">操作日志</h3>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">暂无操作日志</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
                      {log.operatorName.charAt(0)}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{log.operatorName}</span>
                        <span className="text-xs text-gray-500">({getRoleLabel(log.operatorRole)})</span>
                        <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {getOperationLabel(log.operationType)}
                        {log.previousStatus && log.newStatus && (
                          <span className="ml-2">
                            ({getStatusLabel(log.previousStatus)} → {getStatusLabel(log.newStatus)})
                          </span>
                        )}
                      </div>
                      {log.comment && (
                        <div className="text-sm text-gray-500 mt-1">{log.comment}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {availableActions.length > 0 && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {availableActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={loading || action.disabled}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: action.icon === XCircle ? '#fee2e2' : '#eff6ff',
                    color: action.icon === XCircle ? '#dc2626' : '#2563eb',
                  }}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回修改</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入退回原因..."
              className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}

      {showSupplementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">补充修改</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">补充备注</label>
                <textarea
                  value={supplementNotes}
                  onChange={(e) => setSupplementNotes(e.target.value)}
                  placeholder="请输入补充备注..."
                  className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">更新练习计划</label>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">计划周期（周）</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={supplementPlan.durationWeeks}
                      onChange={(e) => handlePlanChange('durationWeeks', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                    <input
                      type="date"
                      value={supplementPlan.startDate.split('T')[0]}
                      onChange={(e) => handlePlanChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                    <input
                      type="date"
                      value={supplementPlan.endDate.split('T')[0]}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">本周重点</label>
                    <input
                      type="text"
                      value={supplementPlan.weeklyFocus}
                      onChange={(e) => setSupplementPlan({ ...supplementPlan, weeklyFocus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">每日练习目标（分钟）</label>
                  <div className="grid grid-cols-7 gap-2">
                    {supplementPlan.dailyGoals.map((goal, index) => (
                      <div key={goal.dayOfWeek} className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-500 mb-1">周{['日', '一', '二', '三', '四', '五', '六'][index]}</div>
                        <input
                          type="number"
                          min="10"
                          max="180"
                          value={goal.durationMinutes}
                          onChange={(e) => {
                            const newGoals = [...supplementPlan.dailyGoals];
                            newGoals[index] = { ...goal, durationMinutes: Number(e.target.value) };
                            setSupplementPlan({ ...supplementPlan, dailyGoals: newGoals });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSupplementModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSupplement}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50"
              >
                确认补充
              </button>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">更新练习进度</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="w-12 text-center font-medium text-gray-900">{progressValue}%</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateProgress}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  确认更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
