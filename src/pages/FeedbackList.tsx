import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Calendar,
  User,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { AddFeedbackModal } from '@/components/AddFeedbackModal';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { useStudentStore } from '@/store/useStudentStore';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/utils/date';
import { FeedbackStatus } from '@/types';

const statusFilters: { value: FeedbackStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
];

const FeedbackList: React.FC = () => {
  const navigate = useNavigate();
  const {
    filterStatus,
    searchQuery,
    setFilterStatus,
    setSearchQuery,
    getFilteredFeedback,
  } = useFeedbackStore();
  const { getStudentById } = useStudentStore();

  const [showAddModal, setShowAddModal] = useState(false);

  const feedbackList = getFilteredFeedback();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink-900">
            课堂反馈
          </h1>
          <p className="text-ink-500 mt-1">共 {feedbackList.length} 条反馈记录</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增反馈
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="card-base p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* 搜索 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="搜索学员姓名、班级、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-1">
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
        </div>
      </div>

      {/* 反馈列表 */}
      <div className="card-base overflow-hidden">
        <div className="divide-y divide-cream-100">
          {feedbackList.map((feedback, index) => {
            const student = getStudentById(feedback.studentId);
            return (
              <div
                key={feedback.id}
                className="flex items-start gap-4 p-4 hover:bg-cream-50/50 cursor-pointer transition-colors group animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => navigate(`/feedback/${feedback.id}`)}
              >
                <Avatar name={student?.name || ''} size="md" gender={student?.gender} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-ink-900">
                      {student?.name}
                    </span>
                    <StatusBadge type="feedback" value={feedback.status} />
                    <StatusBadge type="performance" value={feedback.performance} />
                  </div>
                  
                  <p className="text-sm text-ink-600 mt-1.5 line-clamp-2">
                    {feedback.content}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-ink-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {feedback.teacher}
                    </span>
                    <span className="text-xs text-ink-500">
                      {feedback.className}
                    </span>
                    <span className="text-xs text-ink-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(feedback.date)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {feedback.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-cream-100 text-ink-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-ink-400">
                    {formatRelativeTime(feedback.createdAt)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-ink-300 group-hover:text-wine-500 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        {feedbackList.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-ink-400" />
            </div>
            <p className="text-ink-500">没有找到相关反馈</p>
          </div>
        )}
      </div>

      <AddFeedbackModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default FeedbackList;
