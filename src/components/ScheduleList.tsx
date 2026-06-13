import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Plus, Calendar, MapPin, User } from 'lucide-react';
import { ScheduleStatus } from '@/types';

interface ScheduleListProps {
  onViewDetail?: (id: string) => void;
  onCreateSchedule?: () => void;
}

export function ScheduleList({ onViewDetail, onCreateSchedule }: ScheduleListProps) {
  const { schedules } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredSchedules = schedules.filter((schedule) => {
    if (filterStatus === 'all') return true;
    return schedule.status === filterStatus;
  });

  const getStatusCounts = () => {
    return {
      all: schedules.length,
      [ScheduleStatus.SCHEDULED]: schedules.filter((s) => s.status === ScheduleStatus.SCHEDULED).length,
      [ScheduleStatus.CONFIRMED]: schedules.filter((s) => s.status === ScheduleStatus.CONFIRMED).length,
      [ScheduleStatus.REJECTED]: schedules.filter((s) => s.status === ScheduleStatus.REJECTED).length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">讲师排期</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            待确认: {counts[ScheduleStatus.SCHEDULED]} | 
            已确认: {counts[ScheduleStatus.CONFIRMED]}
          </p>
        </div>
        <button
          onClick={onCreateSchedule}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          新建排期
        </button>
      </div>

      <div className="px-4 py-2 border-b border-gray-100 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterStatus('all')}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          全部 ({counts.all})
        </button>
        <button
          onClick={() => setFilterStatus(ScheduleStatus.SCHEDULED)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
            filterStatus === ScheduleStatus.SCHEDULED
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          待确认 ({counts[ScheduleStatus.SCHEDULED]})
        </button>
        <button
          onClick={() => setFilterStatus(ScheduleStatus.CONFIRMED)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
            filterStatus === ScheduleStatus.CONFIRMED
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          已确认 ({counts[ScheduleStatus.CONFIRMED]})
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredSchedules.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">暂无排期数据</p>
          </div>
        ) : (
          filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewDetail?.(schedule.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {schedule.trainingNeedTitle}
                  </h4>
                  <StatusBadge status={schedule.status} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <span>{schedule.instructorName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>{format(new Date(schedule.startTime), 'MM-dd HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{schedule.location}</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                参与部门: {schedule.participantDepartments.length}个
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
