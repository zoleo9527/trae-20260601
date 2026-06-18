import React, { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { StatusTag } from '@/components/common/StatusTag';
import { UserAvatar } from '@/components/common/UserAvatar';
import { AlertTriangle, ArrowRight, CheckCircle, Clock, FileText, Award, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FlowBoard: React.FC = () => {
  const feedbacks = useStore((state) => state.feedbacks);
  const certificates = useStore((state) => state.certificates);

  const teachers = useMemo(
    () => feedbacks.filter((f) => f.currentStep === 'teacher' && f.status !== 'completed'),
    [feedbacks]
  );

  const volunteers = useMemo(
    () => feedbacks.filter((f) => f.currentStep === 'volunteer' && f.status !== 'completed'),
    [feedbacks]
  );

  const supervisors = useMemo(
    () => feedbacks.filter((f) => f.currentStep === 'supervisor' && f.status !== 'completed'),
    [feedbacks]
  );

  const completed = useMemo(
    () => feedbacks.filter((f) => f.status === 'completed'),
    [feedbacks]
  );

  const roleLabels = {
    teacher: '社教老师',
    volunteer: '志愿者',
    supervisor: '活动主管',
  };

  const roleConfigs = {
    teacher: {
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: 'T',
      title: '社教老师',
      description: '初核反馈内容',
    },
    volunteer: {
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      headerBg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      icon: 'V',
      title: '志愿者',
      description: '整理反馈内容',
    },
    supervisor: {
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      headerBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      icon: 'S',
      title: '活动主管',
      description: '终审并发证',
    },
  };

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

  const overdueCount = useMemo(
    () => feedbacks.filter((f) => f.isOverdue && f.status !== 'completed').length,
    [feedbacks]
  );

  const totalTasks = feedbacks.length;
  const completedCount = completed.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  const certReadyCount = certificates.filter((c) => c.status === 'ready').length;
  const certIssuedCount = certificates.filter((c) => c.status === 'issued').length;

  const FlowColumn = ({ 
    role, 
    items, 
    config 
  }: { 
    role: 'teacher' | 'volunteer' | 'supervisor';
    items: typeof teachers;
    config: typeof roleConfigs.teacher;
  }) => {
    return (
      <div className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-full">
        <div className={`${config.headerBg} px-5 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
                {config.icon}
              </div>
              <div>
                <h3 className="font-semibold text-white">{config.title}</h3>
                <p className="text-white/80 text-sm">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                {items.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted text-sm">暂无待处理任务</p>
            </div>
          ) : (
            items.map((task) => (
              <Link
                key={task.id}
                to={`/feedback/${task.id}`}
                className={`p-4 rounded-lg border-l-4 ${config.borderColor} transition-all hover:shadow-md ${
                  task.isOverdue ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-text-main text-sm line-clamp-2">
                    {task.activityName}
                  </h4>
                  {task.isOverdue && (
                    <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                  <span>{task.submittedAt}</span>
                  <StatusTag
                    status={task.isOverdue ? 'overdue' : statusTypes[task.status]}
                    label={task.isOverdue ? '超时' : statusLabels[task.status]}
                    className="!px-2 !py-0.5"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={task.assigneeName} size="sm" />
                    <span className="text-xs text-text-muted">{task.assigneeName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <span className="text-xs">处理</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {task.certificateEligible && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    <Award className="w-4 h-4 text-success" />
                    <span className="text-xs text-success">可发证</span>
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-2">流转看板</h1>
          <p className="text-text-muted">查看任务在各环节的流转状态，支持接力处理</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Users className="w-5 h-5 text-text-muted" />
            <span className="text-sm text-text-muted">
              总任务: <span className="font-medium text-text-main">{totalTasks}</span>
            </span>
          </div>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <div>
              <span className="text-danger font-medium">
                有 {overdueCount} 项任务超时未处理
              </span>
              <p className="text-sm text-text-muted">请优先处理超时任务</p>
            </div>
          </div>
          <Link
            to="/feedback?filter=overdue"
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            立即处理 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-main">整体进度</h3>
          <span className="text-sm text-text-muted">
            已完成 {completedCount} / {totalTasks} 项
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all flex items-center justify-end pr-2"
            style={{ width: `${progressPercent}%` }}
          >
            {progressPercent > 10 && (
              <span className="text-xs text-white font-medium">{progressPercent}%</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{teachers.length}</p>
            <p className="text-sm text-text-muted">待初核</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{volunteers.length}</p>
            <p className="text-sm text-text-muted">待整理</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{supervisors.length}</p>
            <p className="text-sm text-text-muted">待终审</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{certReadyCount}</p>
            <p className="text-sm text-text-muted">待发证</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <FlowColumn role="teacher" items={teachers} config={roleConfigs.teacher} />
        <FlowColumn role="volunteer" items={volunteers} config={roleConfigs.volunteer} />
        <FlowColumn role="supervisor" items={supervisors} config={roleConfigs.supervisor} />

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-white">已完成</h3>
                  <p className="text-white/80 text-sm">审核通过</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                  {completed.length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100%-80px)]">
            {completed.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-text-muted text-sm">暂无已完成任务</p>
              </div>
            ) : (
              completed.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-text-main text-sm">{task.activityName}</h4>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{task.submittedAt}</span>
                    <span className="text-success">已完成</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-main flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            证书发放统计
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">
                {certificates.filter((c) => c.status === 'pending').length}
              </p>
              <p className="text-sm text-text-muted">待制作</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{certReadyCount}</p>
              <p className="text-sm text-text-muted">待发放</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{certIssuedCount}</p>
              <p className="text-sm text-text-muted">已发放</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};