import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  MessageSquare,
  Edit3,
  ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { Timeline } from '@/components/Timeline';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { useStudentStore } from '@/store/useStudentStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { logOperation } from '@/store/useOperationLogStore';
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/date';
import { FeedbackStatus } from '@/types';

const FeedbackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getFeedbackById, updateFeedbackStatus } = useFeedbackStore();
  const { getStudentById, students } = useStudentStore();
  const { getLogsByTarget } = useOperationLogStore();

  const [handleNote, setHandleNote] = useState('');
  const [showHandleForm, setShowHandleForm] = useState(false);

  const feedback = getFeedbackById(id || '');
  const student = feedback ? getStudentById(feedback.studentId) : undefined;
  const logs = id ? getLogsByTarget('feedback', id) : [];

  const studentFeedback = feedback
    ? useFeedbackStore.getState().getFeedbackByStudentId(feedback.studentId)
    : [];

  if (!feedback || !student) {
    return (
      <div className="p-12 text-center">
        <p className="text-ink-500">反馈不存在</p>
        <button
          onClick={() => navigate('/feedback')}
          className="mt-4 btn-secondary"
        >
          返回列表
        </button>
      </div>
    );
  }

  const handleStatusChange = (status: FeedbackStatus) => {
    updateFeedbackStatus(id!, status, '课程顾问-小张', handleNote || undefined);
    logOperation(
      'feedback',
      id!,
      student.name,
      '更新反馈状态',
      '课程顾问-小张',
      `状态更新为${status === 'processing' ? '处理中' : status === 'resolved' ? '已解决' : '待处理'}${handleNote ? `：${handleNote}` : ''}`
    );
    setShowHandleForm(false);
    setHandleNote('');
  };

  const timelineItems = logs.map(log => ({
    id: log.id,
    type: log.type,
    targetName: log.targetName,
    action: log.action,
    operator: log.operator,
    timestamp: log.timestamp,
    details: log.details,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/feedback')}
        className="flex items-center gap-2 text-ink-600 hover:text-wine-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回反馈列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 学员信息 */}
        <div className="space-y-6">
          {/* 学员卡片 */}
          <div className="card-base p-5">
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4">
              学员信息
            </h3>
            <Link
              to={`/student/${student.id}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-cream-50 transition-colors"
            >
              <Avatar name={student.name} size="lg" gender={student.gender} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900">{student.name}</p>
                <p className="text-sm text-ink-500">{student.className}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400" />
            </Link>

            <div className="mt-4 space-y-3 pt-4 border-t border-cream-100">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">级别</span>
                <span className="text-ink-800">{student.level}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">考级进度</span>
                <span className="text-ink-800">{student.examLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">剩余课时</span>
                <span className="text-ink-800">
                  {student.remainingClasses} / {student.totalClasses}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">服装尺码</span>
                <span className="text-ink-800">{student.costumeSize}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">家长姓名</span>
                <span className="text-ink-800">{student.parentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">联系电话</span>
                <span className="text-ink-800">{student.phone}</span>
              </div>
            </div>
          </div>

          {/* 历史反馈 */}
          <div className="card-base p-5">
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4">
              历史反馈
            </h3>
            <div className="space-y-3">
              {studentFeedback.slice(0, 5).map((fb) => (
                <div
                  key={fb.id}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-colors',
                    fb.id === id
                      ? 'bg-wine-50 border border-wine-100'
                      : 'hover:bg-cream-50'
                  )}
                  onClick={() => navigate(`/feedback/${fb.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge type="feedback" value={fb.status} />
                    <span className="text-xs text-ink-400">
                      {formatDate(fb.date)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-600 mt-2 line-clamp-2">
                    {fb.content}
                  </p>
                </div>
              ))}
            </div>
            <Link
              to={`/student/${student.id}`}
              className="mt-4 text-sm text-wine-600 hover:text-wine-700 flex items-center justify-center w-full"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 右侧 - 反馈详情 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 反馈内容 */}
          <div className="card-base p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-xl font-semibold text-ink-900">
                    课堂反馈详情
                  </h2>
                  <StatusBadge type="feedback" value={feedback.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-ink-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(feedback.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {feedback.teacher}
                  </span>
                  <span>{feedback.className}</span>
                </div>
              </div>
              <StatusBadge type="performance" value={feedback.performance} />
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {feedback.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gold-50 text-gold-700 rounded-full text-sm border border-gold-100"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* 反馈内容 */}
            <div className="prose prose-sm max-w-none">
              <p className="text-ink-700 leading-relaxed text-base">
                {feedback.content}
              </p>
            </div>

            {/* 处理说明 */}
            {feedback.handleNote && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-800 text-sm">
                    处理说明
                  </span>
                </div>
                <p className="text-sm text-emerald-700">{feedback.handleNote}</p>
                <p className="text-xs text-emerald-600 mt-2">
                  处理人：{feedback.handledBy}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            {feedback.status !== 'resolved' && (
              <div className="mt-6 pt-6 border-t border-cream-100">
                {!showHandleForm ? (
                  <div className="flex gap-3">
                    {feedback.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange('processing')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        开始处理
                      </button>
                    )}
                    {feedback.status === 'processing' && (
                      <button
                        onClick={() => setShowHandleForm(true)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        标记已解决
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={handleNote}
                      onChange={(e) => setHandleNote(e.target.value)}
                      placeholder="请输入处理说明..."
                      className="input-base min-h-[80px] resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusChange('resolved')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        确认解决
                      </button>
                      <button
                        onClick={() => setShowHandleForm(false)}
                        className="btn-secondary"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 操作日志（留痕） */}
          <div className="card-base p-6">
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-ink-400" />
              操作记录
            </h3>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <p className="text-sm text-ink-400 text-center py-8">
                暂无操作记录
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { cn } from '@/lib/utils';

export default FeedbackDetail;
