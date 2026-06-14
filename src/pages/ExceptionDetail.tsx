import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { Timeline } from '@/components/Timeline';
import { useExceptionStore } from '@/store/useExceptionStore';
import { useStudentStore } from '@/store/useStudentStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { logOperation } from '@/store/useOperationLogStore';
import { formatDate, formatRelativeTime } from '@/utils/date';
import { ExceptionStatus } from '@/types';

const ExceptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getExceptionById, updateExceptionStatus } = useExceptionStore();
  const { getStudentById } = useStudentStore();
  const { getLogsByTarget } = useOperationLogStore();

  const [handleNote, setHandleNote] = useState('');
  const [showHandleForm, setShowHandleForm] = useState(false);

  const exception = getExceptionById(id || '');
  const student = exception?.studentId
    ? getStudentById(exception.studentId)
    : undefined;
  const logs = id ? getLogsByTarget('exception', id) : [];

  if (!exception) {
    return (
      <div className="p-12 text-center">
        <p className="text-ink-500">异常记录不存在</p>
        <button
          onClick={() => navigate('/exceptions')}
          className="mt-4 btn-secondary"
        >
          返回列表
        </button>
      </div>
    );
  }

  const handleStatusChange = (status: ExceptionStatus) => {
    updateExceptionStatus(
      id!,
      status,
      '前台教务-小王',
      handleNote || undefined
    );
    logOperation(
      'exception',
      id!,
      exception.title,
      '更新异常状态',
      '前台教务-小王',
      `异常"${exception.title}"状态更新为${status === 'processing' ? '处理中' : status === 'resolved' ? '已解决' : '待处理'}${handleNote ? `：${handleNote}` : ''}`
    );
    setShowHandleForm(false);
    setHandleNote('');
  };

  const timelineItems = logs.map((log) => ({
    id: log.id,
    type: log.type,
    targetName: log.targetName,
    action: log.action,
    operator: log.operator,
    timestamp: log.timestamp,
    details: log.details,
  }));

  const isHighPriority = exception.priority === 'high';

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/exceptions')}
        className="flex items-center gap-2 text-ink-600 hover:text-wine-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回异常列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className={cn(
            'card-base p-5',
            isHighPriority && 'border-l-4 border-l-wine-500'
          )}>
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4">
              异常信息
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center',
                  isHighPriority ? 'bg-wine-50' : 'bg-amber-50'
                )}>
                  <AlertTriangle className={cn(
                    'w-6 h-6',
                    isHighPriority ? 'text-wine-500' : 'text-amber-500'
                  )} />
                </div>
                <div>
                  <h2 className="font-medium text-ink-900">
                    {exception.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge type="exception" value={exception.status} />
                    <StatusBadge type="exceptionType" value={exception.type} />
                    <StatusBadge type="exceptionPriority" value={exception.priority} />
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-ink-500">上报人</span>
                <span className="text-ink-800">{exception.reportedBy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">上报时间</span>
                <span className="text-ink-800">
                  {formatDate(exception.reportedAt)}
                </span>
              </div>
              {exception.className && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">涉及班级</span>
                  <span className="text-ink-800">{exception.className}</span>
                </div>
              )}
              {exception.handledBy && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">处理人</span>
                  <span className="text-ink-800">{exception.handledBy}</span>
                </div>
              )}
            </div>
          </div>

          {student && (
            <div className="card-base p-5">
              <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4">
                关联学员
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
                  <span className="text-ink-500">剩余课时</span>
                  <span className="text-ink-800">
                    {student.remainingClasses} / {student.totalClasses}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">联系电话</span>
                  <span className="text-ink-800">{student.phone}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card-base p-6">
            <h2 className="font-serif text-xl font-semibold text-ink-900 mb-4">
              异常描述
            </h2>
            <p className="text-ink-700 leading-relaxed">
              {exception.description}
            </p>

            {exception.handleNote && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-emerald-800 text-sm">
                    处理说明
                  </span>
                </div>
                <p className="text-sm text-emerald-700">
                  {exception.handleNote}
                </p>
                {exception.resolvedAt && (
                  <p className="text-xs text-emerald-600 mt-2">
                    解决时间：{formatDate(exception.resolvedAt)}
                  </p>
                )}
              </div>
            )}

            {exception.status !== 'resolved' && (
              <div className="mt-6 pt-6 border-t border-cream-100">
                {!showHandleForm ? (
                  <div className="flex gap-3">
                    {exception.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange('processing')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        开始处理
                      </button>
                    )}
                    {exception.status === 'processing' && (
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

          <div className="card-base p-6">
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-ink-400" />
              操作记录
            </h3>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-ink-400">暂无操作记录</p>
                <p className="text-xs text-ink-300 mt-1">
                  异常状态变更将在此处留痕
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { cn } from '@/lib/utils';

export default ExceptionDetail;
