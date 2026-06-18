import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { Button, Card } from '@/components/common';
import { ScheduleCard } from '@/components/schedule';
import { useScheduleStore } from '@/store';
import { ScheduleStatus } from '@/types';
import { ScheduleStatusConfig } from '@/constants';
import clsx from 'clsx';

export const ScheduleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { schedules, fetchSchedules, isLoading } = useScheduleStore();

  const currentStatus = searchParams.get('status') as ScheduleStatus | null;

  React.useEffect(() => {
    fetchSchedules();
  }, []);

  const filteredSchedules = currentStatus
    ? schedules.filter(s => s.status === currentStatus)
    : schedules;

  const statusFilters: { status: ScheduleStatus | null; label: string; count: number }[] = [
    { status: null, label: '全部', count: schedules.length },
    { status: 'DRAFT', label: '草稿', count: schedules.filter(s => s.status === 'DRAFT').length },
    { status: 'PENDING_CONFIRM', label: '待确认', count: schedules.filter(s => s.status === 'PENDING_CONFIRM').length },
    { status: 'APPROVED', label: '待审核', count: schedules.filter(s => s.status === 'APPROVED').length },
    { status: 'PUBLISHED', label: '已发布', count: schedules.filter(s => s.status === 'PUBLISHED').length },
    { status: 'CHANGED', label: '已变更', count: schedules.filter(s => s.status === 'CHANGED').length },
    { status: 'REJECTED', label: '已退回', count: schedules.filter(s => s.status === 'REJECTED').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">讲师排班</h1>
          <p className="text-gray-600 mt-1">管理所有社教活动的讲师排班</p>
        </div>
        <Button onClick={() => navigate('/schedules/new')}>
          <Plus className="w-4 h-4 mr-2" />
          新建排班
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          {statusFilters.map((filter) => {
            const isActive = filter.status === currentStatus;
            return (
              <button
                key={filter.label}
                onClick={() => {
                  if (filter.status) {
                    setSearchParams({ status: filter.status });
                  } else {
                    setSearchParams({});
                  }
                }}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-museum-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {filter.label} ({filter.count})
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">暂无排班数据</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
      )}
    </div>
  );
};
