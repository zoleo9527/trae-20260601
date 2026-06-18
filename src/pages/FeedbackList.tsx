import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { TaskCard } from '@/components/dashboard/TaskCard';
import { Search, Filter } from 'lucide-react';

export const FeedbackList: React.FC = () => {
  const feedbacks = useStore((state) => state.feedbacks);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && f.status !== 'completed') ||
      (filter === 'completed' && f.status === 'completed') ||
      (filter === 'overdue' && f.isOverdue);

    const matchesSearch =
      f.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.assigneeName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'completed', label: '已完成' },
    { value: 'overdue', label: '超时' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main mb-2">反馈列表</h1>
        <p className="text-text-muted">查看和管理所有活动反馈</p>
      </div>

      <div className="bg-white rounded-xl p-4 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="搜索活动名称或负责人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-muted" />
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-main hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeedbacks.map((feedback) => (
          <TaskCard key={feedback.id} feedback={feedback} />
        ))}
      </div>

      {filteredFeedbacks.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-border">
          <p className="text-text-muted">没有找到匹配的任务</p>
        </div>
      )}
    </div>
  );
};
