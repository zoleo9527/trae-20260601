import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, Film, Clock, MapPin, DollarSign, Search, Filter } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime, formatTime } from '@/utils/date';
import type { ScheduleStatus } from '@/types/common';

const ScheduleList: React.FC = () => {
  const { schedules } = useScheduleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | 'all'>('all');

  const filteredSchedules = schedules
    .filter((s) => {
      const matchesSearch =
        s.movieName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.hallName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusOptions: { value: ScheduleStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'active', label: '生效中' },
    { value: 'adjusting', label: '调整中' },
    { value: 'pending', label: '待审核' },
    { value: 'completed', label: '已完成' },
    { value: 'closed', label: '已关闭' },
    { value: 'cancelled', label: '已取消' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">影片排片</h1>
          <p className="text-gray-500 mt-1">管理影片排片计划，处理调整申请</p>
        </div>
        <div className="flex gap-2">
          <Link to="/schedule/batch" className="btn-secondary">
            <Layers className="w-4 h-4 mr-2" />
            批量录入
          </Link>
          <Link to="/schedule/new" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            新建排片
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索影片名称或影厅..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ScheduleStatus | 'all')}
              className="input w-40"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="card p-12 text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无排片记录</h3>
          <p className="text-gray-500 mb-4">开始创建您的第一个排片计划</p>
          <Link to="/schedule/new" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            新建排片
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map((schedule) => (
            <Link
              key={schedule.id}
              to={`/schedule/${schedule.id}`}
              className="card p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-cinema-red/10 rounded-xl flex items-center justify-center group-hover:bg-cinema-red group-hover:text-white transition-colors">
                  <Film className="w-6 h-6 text-cinema-red group-hover:text-white transition-colors" />
                </div>
                <StatusBadge type="schedule" status={schedule.status} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{schedule.movieName}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {schedule.hallName}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  <span className="text-gray-400">({schedule.duration}分钟)</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  ¥{schedule.price}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>创建于 {formatDateTime(schedule.createdAt)}</span>
                <span className="text-cinema-red group-hover:underline">查看详情 →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleList;
