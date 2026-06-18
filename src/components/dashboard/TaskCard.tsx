import React from 'react';
import { Link } from 'react-router-dom';
import { Feedback } from '@/types';
import { StatusTag } from '@/components/common/StatusTag';
import { UserAvatar } from '@/components/common/UserAvatar';
import { ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskCardProps {
  feedback: Feedback;
}

const statusLabels = {
  pending_review: '待初核',
  organized: '已整理',
  pending_approval: '待终审',
  completed: '已完成',
};

const statusTypes = {
  pending_review: 'pending' as const,
  organized: 'in_progress' as const,
  pending_approval: 'in_progress' as const,
  completed: 'completed' as const,
};

export const TaskCard: React.FC<TaskCardProps> = ({ feedback }) => {
  const roleLabels = {
    teacher: '社教老师',
    volunteer: '志愿者',
    supervisor: '活动主管',
  };

  return (
    <Link
      to={`/feedback/${feedback.id}`}
      className={`block bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-lg hover:border-primary group ${
        feedback.isOverdue ? 'border-red-200' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {feedback.isOverdue && (
              <AlertTriangle className="w-4 h-4 text-danger" />
            )}
            <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">
              {feedback.activityName}
            </h3>
          </div>
          <p className="text-sm text-text-muted">
            提交时间：{format(new Date(feedback.submittedAt), 'MM/dd HH:mm', { locale: zhCN })}
          </p>
        </div>
        <StatusTag
          status={feedback.isOverdue ? 'overdue' : statusTypes[feedback.status]}
          label={feedback.isOverdue ? '超时' : statusLabels[feedback.status]}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserAvatar name={feedback.assigneeName} size="sm" />
            <div>
              <p className="text-xs text-text-muted">当前负责人</p>
              <p className="text-sm font-medium text-text-main">{feedback.assigneeName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Clock className="w-4 h-4" />
            <span>{roleLabels[feedback.currentStep]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
          <span className="text-sm font-medium">处理</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">
            评分：<span className="font-medium text-text-main">{feedback.content.ratings}</span>
          </span>
          <span className="text-text-muted">
            反馈：<span className="font-medium text-text-main">{feedback.content.comments.length}条</span>
          </span>
          <span className={`font-medium ${
            feedback.certificateEligible ? 'text-success' : 'text-danger'
          }`}>
            {feedback.certificateEligible ? '✓ 可发证' : '✗ 暂不发证'}
          </span>
        </div>
      </div>
    </Link>
  );
};
