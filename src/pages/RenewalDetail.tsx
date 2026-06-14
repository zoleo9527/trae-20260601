import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  ChevronRight,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { Timeline } from '@/components/Timeline';
import { useRenewalStore } from '@/store/useRenewalStore';
import { useStudentStore } from '@/store/useStudentStore';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { logOperation } from '@/store/useOperationLogStore';
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/date';
import { RenewalStatus, FollowUpMethod } from '@/types';
import { cn } from '@/lib/utils';

const methodOptions: { value: FollowUpMethod; label: string; icon: typeof Phone }[] = [
  { value: 'phone', label: '电话', icon: Phone },
  { value: 'wechat', label: '微信', icon: MessageCircle },
  { value: 'in_person', label: '当面', icon: User },
  { value: 'other', label: '其他', icon: FileText },
];

const RenewalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRenewalById, updateRenewalStatus, addFollowUpRecord, syncKeyInsightsFromFeedback } = useRenewalStore();
  const { getStudentById } = useStudentStore();
  const { getFeedbackByStudentId } = useFeedbackStore();
  const { getLogsByTarget } = useOperationLogStore();

  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpContent, setFollowUpContent] = useState('');
  const [followUpMethod, setFollowUpMethod] = useState<FollowUpMethod>('phone');
  const [nextDate, setNextDate] = useState('');

  const renewal = getRenewalById(id || '');
  const student = renewal ? getStudentById(renewal.studentId) : undefined;
  const recentFeedback = renewal
    ? getFeedbackByStudentId(renewal.studentId).slice(0, 3)
    : [];
  const logs = id ? getLogsByTarget('renewal', id) : [];

  if (!renewal || !student) {
    return (
      <div className="p-12 text-center">
        <p className="text-ink-500">续费记录不存在</p>
        <button
          onClick={() => navigate('/renewal')}
          className="mt-4 btn-secondary"
        >
          返回列表
        </button>
      </div>
    );
  }

  const handleStatusChange = (status: RenewalStatus) => {
    updateRenewalStatus(id!, status);
    logOperation(
      'renewal',
      renewal.studentId,
      '更新续费状态',
      '课程顾问-小张',
      `状态更新为${
        status === 'contacted' ? '已联系' :
        status === 'negotiating' ? '洽谈中' :
        status === 'signed' ? '已续费' :
        status === 'lost' ? '已流失' : '待跟进'
      }`
    );
  };

  const handleSyncInsights = () => {
    syncKeyInsightsFromFeedback(id!);
  };

  const handleAddFollowUp = () => {
    if (!followUpContent.trim()) return;

    addFollowUpRecord(id!, {
      date: new Date().toISOString(),
      operator: '课程顾问-小张',
      method: followUpMethod,
      content: followUpContent,
      nextFollowUpDate: nextDate || undefined,
    });

    logOperation(
      'renewal',
      renewal.studentId,
      '添加跟进记录',
      '课程顾问-小张',
      `通过${methodOptions.find(m => m.value === followUpMethod)?.label}跟进：${followUpContent}`
    );

    if (renewal.status === 'pending') {
      updateRenewalStatus(id!, 'contacted');
    }

    setShowAddFollowUp(false);
    setFollowUpContent('');
    setFollowUpMethod('phone');
    setNextDate('');
  };

  const followUpTimeline = renewal.followUpRecords.map(record => ({
    id: record.id,
    type: 'renewal' as const,
    targetName: student.name,
    action: '跟进记录',
    operator: record.operator,
    timestamp: record.date,
    details: record.content,
  }));

  const allLogs = [...logs.map(log => ({
    id: log.id,
    type: log.type,
    targetName: log.targetName,
    action: log.action,
    operator: log.operator,
    timestamp: log.timestamp,
    details: log.details,
  })), ...followUpTimeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const isUrgent = renewal.remainingDays <= 7;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/renewal')}
        className="flex items-center gap-2 text-ink-600 hover:text-wine-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回续费列表
      </button>

      {/* 顶部学员概览 */}
      <div className={cn(
        'card-base p-6 relative overflow-hidden',
        isUrgent && 'border-l-4 border-l-wine-500'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} size="xl" gender={student.gender} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-semibold text-ink-900">
                  {student.name}
                </h1>
                <StatusBadge type="renewal" value={renewal.status} />
                <StatusBadge type="risk" value={renewal.riskLevel} />
              </div>
              <p className="text-ink-500 mt-1">
                {student.className} · {student.level}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-ink-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  到期：{formatDate(renewal.expirationDate)}
                </span>
                <span className={cn(
                  'flex items-center gap-1 font-medium',
                  isUrgent ? 'text-wine-600' : 'text-ink-600'
                )}>
                  <Clock className="w-4 h-4" />
                  {renewal.remainingDays} 天后到期
                </span>
                <span>
                  剩余 {student.remainingClasses} / {student.totalClasses} 课时
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-ink-500">{renewal.packageType}</p>
            <p className="font-serif text-2xl font-semibold text-wine-600 mt-1">
              ¥{renewal.packagePrice.toLocaleString()}
            </p>
            <p className="text-xs text-ink-400 mt-1">
              负责人：{renewal.assignedTo}
            </p>
          </div>
        </div>

        {/* 快捷操作 */}
        {renewal.status !== 'signed' && renewal.status !== 'lost' && (
          <div className="flex gap-2 mt-6 pt-4 border-t border-cream-100">
            <button
              onClick={() => setShowAddFollowUp(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              记录跟进
            </button>
            {renewal.status === 'pending' && (
              <button
                onClick={() => handleStatusChange('contacted')}
                className="btn-secondary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                标记已联系
              </button>
            )}
            {renewal.status === 'contacted' && (
              <button
                onClick={() => handleStatusChange('negotiating')}
                className="btn-secondary flex items-center gap-2"
              >
                转为洽谈中
              </button>
            )}
            {(renewal.status === 'negotiating' || renewal.status === 'contacted') && (
              <button
                onClick={() => handleStatusChange('signed')}
                className="btn-secondary flex items-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <CheckCircle className="w-4 h-4" />
                确认续费
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 关键信息 */}
        <div className="space-y-6">
          {/* 课堂反馈关键判断 - 核心联动功能 */}
          <div className="card-base p-5 border-l-4 border-l-gold-400">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-semibold text-ink-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-gold-500" />
                关键判断
              </h3>
              {renewal.status !== 'signed' && renewal.status !== 'lost' && (
                <button
                  onClick={handleSyncInsights}
                  className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  同步
                </button>
              )}
            </div>
            <p className="text-xs text-ink-500 mb-4">
              来自课堂反馈，辅助续费沟通
            </p>

            <div className="space-y-2">
              {renewal.keyInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2.5 bg-gold-50 rounded-lg border border-gold-100"
                >
                  <span className="w-5 h-5 rounded-full bg-gold-200 text-gold-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-ink-700">{insight}</span>
                </div>
              ))}
            </div>

            {recentFeedback.length > 0 && (
              <div className="mt-4 pt-4 border-t border-cream-100">
                <p className="text-xs text-ink-500 mb-3">最近课堂反馈</p>
                <div className="space-y-2">
                  {recentFeedback.map((fb) => (
                    <Link
                      key={fb.id}
                      to={`/feedback/${fb.id}`}
                      className="block p-2 rounded-lg hover:bg-cream-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge type="feedback" value={fb.status} />
                        <span className="text-xs text-ink-400">
                          {formatDate(fb.date)}
                        </span>
                      </div>
                      <p className="text-sm text-ink-600 mt-1.5 line-clamp-2">
                        {fb.content}
                      </p>
                    </Link>
                  ))}
                </div>
                <Link
                  to={`/student/${student.id}`}
                  className="mt-3 text-sm text-wine-600 hover:text-wine-700 flex items-center justify-center w-full"
                >
                  查看学员完整档案
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* 学员信息 */}
          <div className="card-base p-5">
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4">
              学员信息
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">家长姓名</span>
                <span className="text-ink-800">{student.parentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">联系电话</span>
                <span className="text-ink-800">{student.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">年龄</span>
                <span className="text-ink-800">{student.age} 岁</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">考级进度</span>
                <span className="text-ink-800">{student.examLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">服装尺码</span>
                <span className="text-ink-800">{student.costumeSize}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">入学时间</span>
                <span className="text-ink-800">{formatDate(student.joinDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - 跟进记录与操作日志 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 跟进记录 */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-ink-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-ink-400" />
                跟进记录
              </h3>
              {renewal.status !== 'signed' && renewal.status !== 'lost' && (
                <button
                  onClick={() => setShowAddFollowUp(true)}
                  className="btn-ghost text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              )}
            </div>

            {/* 添加跟进表单 */}
            {showAddFollowUp && (
              <div className="mb-6 p-4 bg-cream-50 rounded-lg border border-cream-200">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-medium text-ink-700">记录方式</p>
                </div>
                <div className="flex gap-2 mb-4">
                  {methodOptions.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setFollowUpMethod(method.value)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          followUpMethod === method.value
                            ? 'bg-wine-600 text-white'
                            : 'bg-white text-ink-600 border border-cream-300 hover:border-cream-400'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={followUpContent}
                  onChange={(e) => setFollowUpContent(e.target.value)}
                  placeholder="请输入跟进内容..."
                  className="input-base min-h-[80px] resize-none mb-3"
                />

                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm text-ink-500 whitespace-nowrap">
                    下次跟进：
                  </label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="input-base flex-1 max-w-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddFollowUp}
                    disabled={!followUpContent.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    保存记录
                  </button>
                  <button
                    onClick={() => {
                      setShowAddFollowUp(false);
                      setFollowUpContent('');
                    }}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 跟进记录列表 */}
            {followUpTimeline.length > 0 ? (
              <div className="space-y-4">
                {renewal.followUpRecords.map((record, index) => {
                  const methodInfo = methodOptions.find(m => m.value === record.method);
                  const MethodIcon = methodInfo?.icon || FileText;
                  return (
                    <div
                      key={record.id}
                      className="relative pl-6 pb-4 last:pb-0"
                    >
                      {index < renewal.followUpRecords.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-cream-200" />
                      )}
                      <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-gold-100 border-2 border-white shadow-sm flex items-center justify-center">
                        <MethodIcon className="w-3 h-3 text-gold-600" />
                      </div>
                      <div className="bg-cream-50/50 rounded-lg p-3 ml-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-ink-800">
                            {record.operator}
                          </span>
                          <span className="text-xs text-ink-400">
                            {formatRelativeTime(record.date)}
                          </span>
                        </div>
                        <p className="text-sm text-ink-600">{record.content}</p>
                        {record.nextFollowUpDate && (
                          <p className="text-xs text-gold-600 mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            下次跟进：{formatDate(record.nextFollowUpDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-ink-400 text-sm">暂无跟进记录</p>
              </div>
            )}
          </div>

          {/* 操作日志 */}
          <div className="card-base p-6">
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-ink-400" />
              操作记录
            </h3>
            {allLogs.length > 0 ? (
              <Timeline items={allLogs.slice(0, 10)} />
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

export default RenewalDetail;
