import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, User } from 'lucide-react';
import { ScheduleStatus } from '@/types';

interface InstructorScheduleListProps {
  onViewDetail?: (id: string) => void;
}

export function InstructorScheduleList({ onViewDetail }: InstructorScheduleListProps) {
  const { schedules, currentUser } = useAppStore();

  const mySchedules = schedules.filter(
    (schedule) => schedule.instructorId === currentUser?.id
  );

  const pendingSchedules = mySchedules.filter(
    (schedule) => schedule.status === ScheduleStatus.SCHEDULED
  );

  const confirmedSchedules = mySchedules.filter(
    (schedule) => schedule.status === ScheduleStatus.CONFIRMED
  );

  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">我的排期</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          待确认: {pendingSchedules.length} | 
          已确认: {confirmedSchedules.length}
        </p>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          待确认 ({pendingSchedules.length})
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            activeTab === 'confirmed'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          已确认 ({confirmedSchedules.length})
        </button>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'pending' && (
          <>
            {pendingSchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">暂无待确认的排期</p>
              </div>
            ) : (
              pendingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => onViewDetail?.(schedule.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {schedule.trainingNeedTitle}
                    </h4>
                    <StatusBadge status={schedule.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{format(new Date(schedule.startTime), 'MM-dd HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{schedule.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>{schedule.instructorName}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-600">点击确认或拒绝排期</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'confirmed' && (
          <>
            {confirmedSchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">暂无已确认的排期</p>
              </div>
            ) : (
              confirmedSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border border-green-200 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => onViewDetail?.(schedule.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {schedule.trainingNeedTitle}
                    </h4>
                    <StatusBadge status={schedule.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{format(new Date(schedule.startTime), 'MM-dd HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{schedule.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>{schedule.instructorName}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
