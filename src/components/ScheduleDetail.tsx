import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Timeline } from './Timeline';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { X, Calendar, MapPin, User, Clock, CheckCircle, XCircle, History } from 'lucide-react';
import { ScheduleStatus, EnrollmentStatus } from '@/types';

interface ScheduleDetailProps {
  scheduleId: string;
  onClose: () => void;
  onShowTimeline?: () => void;
  onActionComplete?: () => void;
}

export function ScheduleDetail({ scheduleId, onClose, onShowTimeline, onActionComplete }: ScheduleDetailProps) {
  const { schedules, timelineLogs, currentUser, enrollments, actions } = useAppStore();
  const schedule = schedules.find(s => s.id === scheduleId);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showEnrollmentHistory, setShowEnrollmentHistory] = useState(false);

  if (!schedule) {
    return (
      <div className="p-6 text-center text-gray-500">
        排期不存在
      </div>
    );
  }

  const scheduleLogs = timelineLogs.filter(
    (log) => log.entityType === 'schedule' && log.entityId === schedule.id
  );

  const trainingNeedLogs = timelineLogs.filter(
    (log) => log.entityType === 'training_need' && log.entityId === schedule.trainingNeedId
  );

  const relatedLogs = [...scheduleLogs, ...trainingNeedLogs];

  const relatedEnrollments = enrollments.filter((e) => e.scheduleId === schedule.id);

  const canConfirm = currentUser?.role === 'instructor' && schedule.status === ScheduleStatus.SCHEDULED;
  const canReject = currentUser?.role === 'instructor' && schedule.status === ScheduleStatus.SCHEDULED;

  const handleConfirm = () => {
    actions.confirmSchedule(scheduleId, true);
    setShowConfirmModal(false);
    onActionComplete?.();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }
    actions.confirmSchedule(scheduleId, false, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
    onActionComplete?.();
  };

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">排期详情</h2>
          {onShowTimeline && (
            <button
              onClick={onShowTimeline}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <History className="w-4 h-4" />
              查看完整时间线
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {schedule.trainingNeedTitle}
            </h3>
            <StatusBadge status={schedule.status} />
          </div>
          {currentUser?.role === 'instructor' && schedule.status === ScheduleStatus.SCHEDULED && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                确认排期
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                拒绝
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">讲师</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{schedule.instructorName}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">地点</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{schedule.location}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">日期</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {format(new Date(schedule.startTime), 'yyyy年MM月dd日')}
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">时间</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {format(new Date(schedule.startTime), 'HH:mm')} - {format(new Date(schedule.endTime), 'HH:mm')}
            </p>
          </div>
        </div>

        {relatedEnrollments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">报名状态</h4>
              <button
                onClick={() => setShowEnrollmentHistory(!showEnrollmentHistory)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showEnrollmentHistory ? '收起' : '查看详情'}
              </button>
            </div>
            <div className="space-y-2">
              {relatedEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all',
                    enrollment.status === EnrollmentStatus.CONFIRMED
                      ? 'border-green-200 bg-gradient-to-r from-green-50 to-white'
                      : enrollment.status === EnrollmentStatus.PENDING
                      ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-white'
                      : 'border-red-200 bg-gradient-to-r from-red-50 to-white'
                  )}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {enrollment.departmentName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {enrollment.studentList.length}人
                    </span>
                    <StatusBadge status={enrollment.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">状态时间线</h4>
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-100">
            <Timeline logs={relatedLogs} />
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认排期</h3>
            <p className="text-sm text-gray-600 mb-4">
              确认后，系统将自动通知相关部门负责人开始学员报名流程。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">拒绝排期</h3>
            <p className="text-sm text-gray-600 mb-4">
              请输入拒绝原因，培训经理将重新安排。
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
