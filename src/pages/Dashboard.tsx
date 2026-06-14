import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Clock,
  AlertCircle,
  UserX,
  FileWarning,
  AlertOctagon,
} from 'lucide-react';
import { DataCard } from '@/components/DataCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { Timeline } from '@/components/Timeline';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { useRenewalStore } from '@/store/useRenewalStore';
import { useStudentStore } from '@/store/useStudentStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { useExceptionStore } from '@/store/useExceptionStore';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/utils/date';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getPendingCount: getFeedbackPending, feedbackList } = useFeedbackStore();
  const {
    getPendingCount: getRenewalPending,
    getHighRiskCount,
    getSignedCount,
    renewalList,
    getFilteredRenewals,
  } = useRenewalStore();
  const { students, getStudentById } = useStudentStore();
  const { getRecentLogs } = useOperationLogStore();
  const { getPendingCount: getExceptionPending, getHighPriorityCount, exceptionList } = useExceptionStore();

  const pendingFeedback = feedbackList
    .filter(f => f.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const highRiskRenewals = renewalList
    .filter(r => r.riskLevel === 'high' && r.status !== 'signed' && r.status !== 'lost')
    .sort((a, b) => a.remainingDays - b.remainingDays)
    .slice(0, 3);

  const highPriorityExceptions = exceptionList
    .filter(e => e.priority === 'high' && e.status !== 'resolved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentLogs = getRecentLogs(8).map(log => ({
    ...log,
    onClick: () => {
      if (log.type === 'feedback') {
        navigate(`/feedback/${log.targetId}`);
      } else if (log.type === 'renewal') {
        navigate(`/renewal/${log.targetId}`);
      } else if (log.type === 'student') {
        navigate(`/student/${log.targetId}`);
      }
    },
  }));

  const signedCount = getSignedCount();
  const totalRenewals = renewalList.length;
  const renewalRate = totalRenewals > 0 ? Math.round((signedCount / totalRenewals) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">
          总览
        </h1>
        <p className="text-ink-500 mt-1">欢迎回来，今天是 {formatDate(new Date().toISOString(), 'yyyy年M月d日 EEEE')}</p>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="待处理反馈"
          value={getFeedbackPending()}
          subtitle="较昨日 +2"
          icon={<MessageSquare className="w-5 h-5 text-wine-600" />}
          accentColor="wine"
          onClick={() => navigate('/feedback')}
        />
        <DataCard
          title="待跟进续费"
          value={getRenewalPending()}
          subtitle="7天内到期 5人"
          icon={<RefreshCw className="w-5 h-5 text-gold-600" />}
          accentColor="gold"
          onClick={() => navigate('/renewal')}
        />
        <DataCard
          title="待处理异常"
          value={getExceptionPending()}
          subtitle={`高优先级 ${getHighPriorityCount()} 项`}
          trend={{ value: 1, isPositive: false }}
          icon={<AlertOctagon className="w-5 h-5 text-rose-600" />}
          accentColor="rose"
          onClick={() => navigate('/exceptions')}
        />
        <DataCard
          title="本月续费率"
          value={`${renewalRate}%`}
          subtitle={`已续费 ${signedCount} / ${totalRenewals} 人`}
          trend={{ value: 5, isPositive: true }}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
          onClick={() => navigate('/renewal')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 待处理事项 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 待处理反馈 */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-ink-900">待处理反馈</h2>
                <span className="tag bg-amber-100 text-amber-700">
                  {getFeedbackPending()} 条
                </span>
              </div>
              <button
                onClick={() => navigate('/feedback')}
                className="text-sm text-wine-600 hover:text-wine-700 flex items-center gap-0.5 transition-colors"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {pendingFeedback.map((feedback, index) => {
                const student = getStudentById(feedback.studentId);
                return (
                  <div
                    key={feedback.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-cream-50 cursor-pointer transition-colors group"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/feedback/${feedback.id}`)}
                  >
                    <Avatar name={student?.name || ''} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-800 text-sm">
                          {student?.name}
                        </span>
                        <StatusBadge type="feedback" value={feedback.status} />
                      </div>
                      <p className="text-sm text-ink-600 mt-0.5 line-clamp-1">
                        {feedback.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-ink-400">
                          {feedback.className} · {feedback.teacher}
                        </span>
                        <span className="text-xs text-ink-400">
                          {formatRelativeTime(feedback.createdAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {feedback.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 bg-cream-100 text-ink-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-wine-500 transition-colors mt-2" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 风险预警 */}
          <div className="card-base p-5 border-l-4 border-l-wine-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-wine-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-wine-600" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-ink-900">风险预警</h2>
                <span className="tag bg-wine-100 text-wine-700">
                  {getHighRiskCount()} 人
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {highRiskRenewals.map((renewal, index) => {
                const student = getStudentById(renewal.studentId);
                return (
                  <div
                    key={renewal.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-wine-50/50 hover:bg-wine-50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/renewal/${renewal.id}`)}
                  >
                    <Avatar name={student?.name || ''} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-800">
                          {student?.name}
                        </span>
                        <StatusBadge type="risk" value={renewal.riskLevel} />
                        <StatusBadge type="renewal" value={renewal.status} />
                      </div>
                      <p className="text-sm text-ink-600 mt-0.5">
                        {student?.className}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-wine-600 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {renewal.remainingDays} 天后到期
                        </span>
                        <span className="text-xs text-ink-500">
                          剩余 {student?.remainingClasses} 课时
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {renewal.keyInsights.slice(0, 2).map(insight => (
                          <span
                            key={insight}
                            className="text-xs px-1.5 py-0.5 bg-wine-100/60 text-wine-700 rounded"
                          >
                            {insight}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-wine-300 group-hover:text-wine-600 transition-colors" />
                  </div>
                );
              })}

              {/* 系统风险提示 */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileWarning className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    考级报名提醒
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    张梓涵、郑浩然 尚未提交六级考级报名材料，请尽快确认
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 异常预警 */}
          <div className="card-base p-5 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-ink-900">异常预警</h2>
                <span className="tag bg-rose-100 text-rose-700">
                  {getHighPriorityCount()} 项
                </span>
              </div>
              <button
                onClick={() => navigate('/exceptions')}
                className="text-sm text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {highPriorityExceptions.map((exception, index) => {
                const student = exception.studentId
                  ? getStudentById(exception.studentId)
                  : undefined;
                return (
                  <div
                    key={exception.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/exception/${exception.id}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink-800 text-sm">
                          {exception.title}
                        </span>
                        <StatusBadge type="exceptionType" value={exception.type} />
                        <StatusBadge type="exception" value={exception.status} />
                      </div>
                      <p className="text-xs text-ink-600 mt-1 line-clamp-2">
                        {exception.description}
                      </p>
                      {student && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar name={student.name} size="xs" gender={student.gender} />
                          <span className="text-xs text-ink-500">
                            {student.name} · {student.className}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-rose-600 transition-colors mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 最近变更 */}
        <div className="card-base p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-ink-900">最近变更</h2>
          </div>

          <Timeline items={recentLogs} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
