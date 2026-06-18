import React, { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { TaskCard } from '@/components/dashboard/TaskCard';
import { StatusTag } from '@/components/common/StatusTag';
import { UserAvatar } from '@/components/common/UserAvatar';
import { 
  FileText, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const feedbacks = useStore((state) => state.feedbacks);
  const certificates = useStore((state) => state.certificates);
  const currentUser = useStore((state) => state.currentUser);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const pending = feedbacks.filter((f) => f.status !== 'completed').length;
    const inProgress = feedbacks.filter(
      (f) => f.status === 'organized' || f.status === 'pending_approval'
    ).length;
    const completed = feedbacks.filter((f) => f.status === 'completed').length;
    const overdue = feedbacks.filter((f) => f.isOverdue && f.status !== 'completed').length;
    const certPending = certificates.filter((c) => c.status !== 'issued').length;
    const certReady = certificates.filter((c) => c.status === 'ready').length;

    const myTasks = feedbacks.filter(
      (f) => f.assigneeId === currentUser.id && f.status !== 'completed'
    ).length;

    return { total, pending, inProgress, completed, overdue, certPending, certReady, myTasks };
  }, [feedbacks, certificates, currentUser]);

  const today = format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });
  const weekDay = format(new Date(), 'EEEE', { locale: zhCN });

  const roleLabels = {
    teacher: '社教老师',
    volunteer: '志愿者',
    supervisor: '活动主管',
  };

  const roleColors = {
    teacher: 'bg-blue-500',
    volunteer: 'bg-yellow-500',
    supervisor: 'bg-green-500',
  };

  const recentCompleted = useMemo(() => {
    return feedbacks
      .filter((f) => f.status === 'completed')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
  }, [feedbacks]);

  const myPendingTasks = useMemo(() => {
    return feedbacks
      .filter((f) => f.assigneeId === currentUser.id && f.status !== 'completed')
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      });
  }, [feedbacks, currentUser]);

  const urgentTasks = useMemo(() => {
    return myPendingTasks.filter((f) => f.isOverdue);
  }, [myPendingTasks]);

  const certReadyToIssue = useMemo(() => {
    return certificates.filter((c) => c.status === 'ready').slice(0, 3);
  }, [certificates]);

  const firstOverdueTask = urgentTasks[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-text-main">今日工作</h1>
            <span className="px-3 py-1 bg-gray-100 text-sm text-text-muted rounded-full">
              {today} {weekDay}
            </span>
          </div>
          <p className="text-text-muted">
            您好，{currentUser.name}（{roleLabels[currentUser.role]}），今天有 {stats.myTasks} 项任务待处理
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UserAvatar name={currentUser.name} size="lg" />
        </div>
      </div>

      {urgentTasks.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">紧急预警</h3>
                <p className="text-white/80">
                  有 {urgentTasks.length} 项任务已超时，请优先处理
                </p>
              </div>
            </div>
            <Link
              to={firstOverdueTask ? `/feedback/${firstOverdueTask.id}` : '/feedback'}
              className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              立即处理 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentTasks.map((task) => (
              <Link
                key={task.id}
                to={`/feedback/${task.id}`}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{task.activityName}</span>
                  <StatusTag status="overdue" label="超时" />
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="w-4 h-4" />
                  <span>{task.submittedAt}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title="我的待办"
          value={stats.myTasks}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="待处理总数"
          value={stats.pending}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="进行中"
          value={stats.inProgress}
          icon={<TrendingUp className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="待发放证书"
          value={stats.certReady}
          icon={<Award className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="超时任务"
          value={stats.overdue}
          icon={<AlertCircle className="w-6 h-6" />}
          color={stats.overdue > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${roleColors[currentUser.role]} flex items-center justify-center text-white font-semibold`}>
                    {currentUser.role.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">我的待办任务</h3>
                    <p className="text-white/80 text-sm">
                      {roleLabels[currentUser.role]}环节 - {stats.myTasks} 项待处理
                    </p>
                  </div>
                </div>
                <Link
                  to="/feedback"
                  className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
                >
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="p-4">
              {myPendingTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-text-main font-medium">太棒了！暂无待处理任务</p>
                  <p className="text-sm text-text-muted mt-2">您负责的任务都已完成</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPendingTasks.slice(0, 3).map((task) => (
                    <TaskCard key={task.id} feedback={task} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-main flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                待发放证书
              </h3>
            </div>

            {certReadyToIssue.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                暂无待发放证书
              </div>
            ) : (
              <div className="space-y-3">
                {certReadyToIssue.map((cert) => {
                  const feedback = feedbacks.find((f) => f.id === cert.feedbackId);
                  return (
                    <Link
                      key={cert.id}
                      to={feedback ? `/feedback/${feedback.id}` : '/feedback'}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-text-main">{cert.recipientName}</p>
                          <p className="text-sm text-text-muted">{cert.activityName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusTag status="in_progress" label="待发放" />
                        <ArrowRight className="w-5 h-5 text-text-muted" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              任务流转进度
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">社教老师初核</span>
                  <span className="text-sm font-medium text-text-main">
                    {feedbacks.filter((f) => f.currentStep === 'teacher' && f.status !== 'completed').length} 项
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${(feedbacks.filter((f) => f.currentStep === 'teacher').length / feedbacks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">志愿者整理</span>
                  <span className="text-sm font-medium text-text-main">
                    {feedbacks.filter((f) => f.currentStep === 'volunteer' && f.status !== 'completed').length} 项
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{
                      width: `${(feedbacks.filter((f) => f.currentStep === 'volunteer').length / feedbacks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">主管终审</span>
                  <span className="text-sm font-medium text-text-main">
                    {feedbacks.filter((f) => f.currentStep === 'supervisor' && f.status !== 'completed').length} 项
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${(feedbacks.filter((f) => f.currentStep === 'supervisor').length / feedbacks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">已完成</span>
                  <span className="text-sm font-medium text-success">
                    {stats.completed} / {stats.total}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                    style={{
                      width: `${(stats.completed / stats.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              团队接力
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  T
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-main">社教老师</p>
                  <p className="text-sm text-text-muted">
                    {feedbacks.filter((f) => f.currentStep === 'teacher' && f.status !== 'completed').length} 项待初核
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                  V
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-main">志愿者</p>
                  <p className="text-sm text-text-muted">
                    {feedbacks.filter((f) => f.currentStep === 'volunteer' && f.status !== 'completed').length} 项待整理
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-main">活动主管</p>
                  <p className="text-sm text-text-muted">
                    {feedbacks.filter((f) => f.currentStep === 'supervisor' && f.status !== 'completed').length} 项待终审
                  </p>
                </div>
                <Award className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-text-main mb-4">最近完成</h3>
            {recentCompleted.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-sm">
                暂无完成记录
              </div>
            ) : (
              <div className="space-y-3">
                {recentCompleted.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-main">{task.activityName}</p>
                      <p className="text-xs text-text-muted">{task.submittedAt}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};