import React from 'react';
import { ActivitySchedule } from '@/types';
import { FileText, Clock, User } from 'lucide-react';
import dayjs from 'dayjs';

interface ScheduleChangeHistoryProps {
  changes: ActivitySchedule['changeHistory'];
}

export const ScheduleChangeHistory: React.FC<ScheduleChangeHistoryProps> = ({
  changes,
}) => {
  if (!changes || changes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>暂无变更记录</p>
      </div>
    );
  }

  const fieldLabels: Record<string, string> = {
    lecturerId: '讲师',
    lecturerName: '讲师姓名',
    lecturerPhone: '讲师电话',
    lecturerEmail: '讲师邮箱',
    scheduledAt: '计划时间',
    location: '活动地点',
    expectedParticipants: '预计参与人数',
  };

  return (
    <div className="space-y-4">
      {changes.map((change) => (
        <div
          key={change.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">
                {fieldLabels[change.field] || change.field}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {dayjs(change.changedAt).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>

          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 line-through">
                {change.oldValue}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-green-600 font-medium">
                {change.newValue}
              </span>
            </div>

            {change.reason && (
              <p className="text-xs text-gray-500 mt-2">
                变更原因：{change.reason}
              </p>
            )}

            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <User className="w-3 h-3" />
              <span>{change.changedByName}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
