import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Tag,
 User,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { AddExceptionModal } from '@/components/AddExceptionModal';
import { useExceptionStore } from '@/store/useExceptionStore';
import { useStudentStore } from '@/store/useStudentStore';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/utils/date';
import { ExceptionStatus, ExceptionType } from '@/types';

const statusFilters: { value: ExceptionStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
];

const typeFilters: { value: ExceptionType | 'all'; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'exam', label: '考级相关' },
  { value: 'costume', label: '服装相关' },
  { value: 'schedule', label: '调课考勤' },
  { value: 'other', label: '其他' },
];

const ExceptionList: React.FC = () => {
  const navigate = useNavigate();
  const {
    filterStatus,
    filterType,
    searchQuery,
    setFilterStatus,
    setFilterType,
    setSearchQuery,
    getFilteredExceptions,
  } = useExceptionStore();
  const { getStudentById } = useStudentStore();

  const [showAddModal, setShowAddModal] = useState(false);

  const exceptionList = getFilteredExceptions();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink-900">
            异常管理
          </h1>
          <p className="text-ink-500 mt-1">共 {exceptionList.length} 条异常记录</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          登记异常
        </button>
      </div>

      <div className="card-base p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="搜索异常标题、描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-4 h-4 text-ink-400 mr-1" />
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  filterStatus === filter.value
                    ? 'bg-wine-100 text-wine-700'
                    : 'text-ink-600 hover:bg-cream-100'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {typeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  filterType === filter.value
                    ? 'bg-gold-100 text-gold-700'
                    : 'text-ink-600 hover:bg-cream-100'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <div className="divide-y divide-cream-100">
          {exceptionList.map((exception, index) => {
            const student = exception.studentId
              ? getStudentById(exception.studentId)
              : undefined;
            return (
              <div
                key={exception.id}
                className="flex items-start gap-4 p-4 hover:bg-cream-50/50 cursor-pointer transition-colors group animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => navigate(`/exception/${exception.id}`)}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  exception.priority === 'high' && 'bg-wine-50',
                  exception.priority === 'medium' && 'bg-amber-50',
                  exception.priority === 'low' && 'bg-emerald-50',
                )}>
                  <AlertTriangle className={cn(
                    'w-5 h-5',
                    exception.priority === 'high' && 'text-wine-500',
                    exception.priority === 'medium' && 'text-amber-500',
                    exception.priority === 'low' && 'text-emerald-500',
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-ink-900">
                      {exception.title}
                    </span>
                    <StatusBadge type="exception" value={exception.status} />
                    <StatusBadge type="exceptionType" value={exception.type} />
                    <StatusBadge type="exceptionPriority" value={exception.priority} />
                  </div>

                  <p className="text-sm text-ink-600 mt-1.5 line-clamp-2">
                    {exception.description}
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-ink-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {exception.reportedBy}
                    </span>
                    <span className="text-xs text-ink-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(exception.reportedAt)}
                    </span>
                    {exception.className && (
                      <span className="text-xs text-ink-500">
                        {exception.className}
                      </span>
                    )}
                  </div>

                  {student && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar name={student.name} size="xs" gender={student.gender} />
                      <span className="text-xs text-ink-500">
                        关联学员：{student.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-ink-400">
                    {formatRelativeTime(exception.updatedAt)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-wine-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        {exceptionList.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-ink-400" />
            </div>
            <p className="text-ink-500">没有找到相关异常记录</p>
          </div>
        )}
      </div>

      <AddExceptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(newId) => navigate(`/exception/${newId}`)}
      />
    </div>
  );
};

export default ExceptionList;
