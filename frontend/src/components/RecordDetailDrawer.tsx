import { useState, useEffect } from 'react';
import { X, Play, CheckCircle, XCircle, Edit3, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [rejectReason, setRejectReason] = useState('');
  const [supplementNotes, setSupplementNotes] = useState('');
  const [supplementPlan, setSupplementPlan] = useState<PracticePlan>(record.practicePlan);
  const [progressValue, setProgressValue] = useState(record.practicePlan.progress);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isEditingSupplement, setIsEditingSupplement] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [record.id]);

  useEffect(() => {
    setSupplementPlan(record.practicePlan);
    setProgressValue(record.practicePlan.progress);
  }, [record.practicePlan]);

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
      setIsRejecting(false);
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
      setIsEditingSupplement(false);
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
      setIsUpdatingProgress(false);
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

  const canEditSupplement = currentRole === UserRole.TEACHER && 
    (record.status === ExamTrackStatus.REJECTED || record.status === ExamTrackStatus.SUPPLEMENTED);
  
  const canReject = currentRole === UserRole.ADMIN && 
    (record.status === ExamTrackStatus.SUBMITTED_BY_TEACHER || record.status === ExamTrackStatus.REVIEWING_BY_ADMIN);
  
  const canUpdateProgress = currentRole === UserRole.TEACHER && record.status === ExamTrackStatus.IN_PRACTICE;
  
  const canStartPractice = currentRole === UserRole.TEACHER && 
    (record.status === ExamTrackStatus.APPROVED || record.status === ExamTrackStatus.SUPPLEMENTED);
  
  const canSubmit = currentRole === UserRole.TEACHER && 
    (record.status === ExamTrackStatus.DRAFT || record.status === ExamTrackStatus.SUPPLEMENTED);
  
  const canApprove = currentRole === UserRole.ADMIN && 
    (record.status === ExamTrackStatus.SUBMITTED_BY_TEACHER || record.status === ExamTrackStatus.REVIEWING_BY_ADMIN);
  
  const canComplete = currentRole === UserRole.TEACHER && record.status === ExamTrackStatus.IN_PRACTICE;
  
  const canConfirmExam = currentRole === UserRole.ADMIN && record.status === ExamTrackStatus.COMPLETED;

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

          {canReject && (
            <div className="border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-700 mb-3">退回修改</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入退回原因..."
                className="w-full h-20 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
              />
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || loading}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                确认退回
              </button>
            </div>
          )}

          {canEditSupplement && (
            <div className="border border-purple-200 rounded-lg p-4">
              <button
                onClick={() => setIsEditingSupplement(!isEditingSupplement)}
                className="w-full flex items-center justify-between text-left mb-3"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">补充修改</span>
                </div>
                {isEditingSupplement ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {isEditingSupplement && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">补充备注</label>
                    <textarea
                      value={supplementNotes}
                      onChange={(e) => setSupplementNotes(e.target.value)}
                      placeholder="请输入补充备注..."
                      className="w-full h-20 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-2">调整练习计划</label>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">计划周期（周）</label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={supplementPlan.durationWeeks}
                          onChange={(e) => handlePlanChange('durationWeeks', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                        <input
                          type="date"
                          value={supplementPlan.startDate.split('T')[0]}
                          onChange={(e) => handlePlanChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                        <input
                          type="date"
                          value={supplementPlan.endDate.split('T')[0]}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">本周重点</label>
                        <input
                          type="text"
                          value={supplementPlan.weeklyFocus}
                          onChange={(e) => setSupplementPlan({ ...supplementPlan, weeklyFocus: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-3">
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
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSupplement}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    保存修改
                  </button>
                </div>
              )}
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

              {canUpdateProgress && (
                <div className="border-t border-blue-100 pt-4">
                  <button
                    onClick={() => setIsUpdatingProgress(!isUpdatingProgress)}
                    className="w-full flex items-center justify-between text-left mb-2"
                  >
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm text-gray-500">练习进度</span>
                      <span className="text-sm font-medium text-gray-700">{record.practicePlan.progress}%</span>
                    </div>
                    {isUpdatingProgress ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${record.practicePlan.progress}%` }}
                    />
                  </div>
                  
                  {isUpdatingProgress && (
                    <div className="mt-3 space-y-3">
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
                      <button
                        onClick={handleUpdateProgress}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        更新进度
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!canUpdateProgress && (
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
              )}
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

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                提交审核
              </button>
            )}
            {canStartPractice && (
              <button
                onClick={handleStartPractice}
                disabled={loading}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                开始练习
              </button>
            )}
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                标记完成
              </button>
            )}
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                审核通过
              </button>
            )}
            {canConfirmExam && (
              <>
                <button
                  onClick={() => handleConfirmExam(true)}
                  disabled={loading}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  确认通过
                </button>
                <button
                  onClick={() => handleConfirmExam(false)}
                  disabled={loading}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  确认未通过
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
