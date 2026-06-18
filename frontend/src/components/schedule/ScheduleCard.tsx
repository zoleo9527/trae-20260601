import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, User } from 'lucide-react';
import { Card, StatusTag } from '../common';
import { ActivitySchedule } from '@/types';
import clsx from 'clsx';
import dayjs from 'dayjs';

interface ScheduleCardProps {
  schedule: ActivitySchedule;
  showMaterialStatus?: boolean;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  showMaterialStatus = true,
}) => {
  const navigate = useNavigate();

  const participantTypeLabels = {
    STUDENT: '学生',
    ADULT: '成人',
    FAMILY: '亲子',
  };

  const statusTypeMap = {
    DRAFT: 'schedule',
    PENDING_CONFIRM: 'schedule',
    APPROVED: 'schedule',
    PUBLISHED: 'schedule',
    CHANGED: 'schedule',
    REJECTED: 'schedule',
  } as const;

  return (
    <Card
      hover
      onClick={() => navigate(`/schedules/${schedule.id}`)}
      className="p-0 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {schedule.courseName}
            </h3>
            <p className="text-sm text-gray-500">课程ID: {schedule.courseId}</p>
          </div>
          <StatusTag
            status={schedule.status}
            type={statusTypeMap[schedule.status]}
          />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{dayjs(schedule.scheduledAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{schedule.location}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{schedule.expectedParticipants}人</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                {participantTypeLabels[schedule.participantType]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{schedule.lecturerName}</span>
          </div>
        </div>

        {showMaterialStatus && schedule.materialStatus && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">物料状态</span>
              <StatusTag status={schedule.materialStatus} type="material" size="sm" />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>创建人: {schedule.createdByName}</span>
          <span>更新: {dayjs(schedule.updatedAt).fromNow()}</span>
        </div>
      </div>
    </Card>
  );
};
