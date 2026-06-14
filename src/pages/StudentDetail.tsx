import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Calendar,
  Award,
  Shirt,
  BookOpen,
  Clock,
  ChevronRight,
  User,
  BarChart3,
  Plus,
  AlertTriangle,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { Timeline } from '@/components/Timeline';
import { AddFeedbackModal } from '@/components/AddFeedbackModal';
import { AddExceptionModal } from '@/components/AddExceptionModal';
import { useStudentStore } from '@/store/useStudentStore';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { useRenewalStore } from '@/store/useRenewalStore';
import { useExceptionStore } from '@/store/useExceptionStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { formatDate, formatRelativeTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { LogType } from '@/types';

type TabType = 'feedback' | 'renewal' | 'exam' | 'costume';
type LogFilterType = LogType | 'all';

const tabOptions: { value: TabType; label: string; icon: typeof BookOpen }[] = [
  { value: 'feedback', label: '课堂反馈', icon: BookOpen },
  { value: 'renewal', label: '续费记录', icon: BarChart3 },
  { value: 'exam', label: '考级进度', icon: Award },
  { value: 'costume', label: '服装尺码', icon: Shirt },
];

const logFilterOptions: { value: LogFilterType; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: 'text-ink-600 bg-ink-50' },
  { value: 'feedback', label: '课堂反馈', color: 'text-sky-600 bg-sky-50' },
  { value: 'renewal', label: '续费跟进', color: 'text-gold-600 bg-gold-50' },
  { value: 'exception', label: '异常处理', color: 'text-rose-600 bg-rose-50' },
  { value: 'student', label: '学员管理', color: 'text-emerald-600 bg-emerald-50' },
];

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudentById } = useStudentStore();
  const { getFeedbackByStudentId } = useFeedbackStore();
  const { getRenewalByStudentId } = useRenewalStore();
  const { getExceptionsByStudentId } = useExceptionStore();
  const { getLogsByTarget } = useOperationLogStore();

  const [activeTab, setActiveTab] = useState<TabType>('feedback');
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [showAddException, setShowAddException] = useState(false);
  const [logFilter, setLogFilter] = useState<LogFilterType>('all');
  const [showAllLogs, setShowAllLogs] = useState(false);

  const { getFeedbackById } = useFeedbackStore();
  const { getExceptionById } = useExceptionStore();

  const student = getStudentById(id || '');
  const feedbackList = id ? getFeedbackByStudentId(id) : [];
  const renewal = id ? getRenewalByStudentId(id) : undefined;
  const exceptions = id ? getExceptionsByStudentId(id) : [];

  // 聚合该学员相关的所有日志：feedback、renewal、exception、student
  const getStudentRelatedLogs = () => {
    if (!id) return [];
    const all: ReturnType<typeof getLogsByTarget> = [];
    
    // student 自身的日志
    all.push(...getLogsByTarget('student', id));
    
    // 所有 feedback 的日志
    feedbackList.forEach(fb => {
      all.push(...getLogsByTarget('feedback', fb.id));
    });
    
    // renewal 的日志
    if (renewal) {
      all.push(...getLogsByTarget('renewal', renewal.id));
    }
    
    // 所有 exception 的日志
    exceptions.forEach(ex => {
      all.push(...getLogsByTarget('exception', ex.id));
    });
    
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const logs = getStudentRelatedLogs();

  if (!student) {
    return (
      <div className="p-12 text-center">
        <p className="text-ink-500">学员不存在</p>
        <button
          onClick={() => navigate('/students')}
          className="mt-4 btn-secondary"
        >
          返回列表
        </button>
      </div>
    );
  }

  const progress = (student.remainingClasses / student.totalClasses) * 100;
  const isLow = progress < 20;

  const feedbackTimeline = feedbackList.map((fb) => ({
    id: fb.id,
    type: 'feedback' as const,
    targetName: student.name,
    action: '课堂反馈',
    operator: fb.teacher,
    timestamp: fb.date,
    details: fb.content,
    onClick: () => navigate(`/feedback/${fb.id}`),
  }));

  // 判断业务对象的状态标记
  const getStatusFlags = (log: ReturnType<typeof getStudentRelatedLogs>[0]) => {
    let isPending = false;
    let isHighRisk = false;

    if (log.type === 'feedback') {
      const fb = getFeedbackById(log.targetId);
      isPending = fb?.status === 'pending';
    } else if (log.type === 'renewal') {
      const rn = renewal;
      isPending = rn?.status === 'pending';
      isHighRisk = rn?.riskLevel === 'high' && rn.status !== 'signed' && rn.status !== 'lost';
    } else if (log.type === 'exception') {
      const ex = getExceptionById(log.targetId);
      isPending = ex?.status === 'pending';
      isHighRisk = ex?.priority === 'high' && ex.status !== 'resolved';
    }

    return { isPending, isHighRisk };
  };

  const logItems = logs.map((log) => {
    const flags = getStatusFlags(log);
    return {
      id: log.id,
      type: log.type,
      targetName: log.targetName,
      action: log.action,
      operator: log.operator,
      timestamp: log.timestamp,
      details: log.details,
      isPending: flags.isPending,
      isHighRisk: flags.isHighRisk,
      onClick: () => {
        if (log.type === 'feedback') {
          navigate(`/feedback/${log.targetId}`);
        } else if (log.type === 'renewal') {
          navigate(`/renewal/${log.targetId}`);
        } else if (log.type === 'student') {
          navigate(`/student/${log.targetId}`);
        } else if (log.type === 'exception') {
          navigate(`/exception/${log.targetId}`);
        }
      },
    };
  });

  // 按类型筛选
  const filteredLogItems = logFilter === 'all'
    ? logItems
    : logItems.filter(item => item.type === logFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-ink-600 hover:text-wine-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回学员列表
      </button>

      {/* 学员信息卡片 */}
      <div className="card-base p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} size="xl" gender={student.gender} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-semibold text-ink-900">
                  {student.name}
                </h1>
                {renewal && renewal.status !== 'signed' && renewal.status !== 'lost' && (
                  <StatusBadge type="risk" value={renewal.riskLevel} />
                )}
              </div>
              <p className="text-ink-500 mt-1">
                {student.className} · {student.level}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-ink-500">{student.age} 岁</span>
                <span className="text-ink-300">|</span>
                <span className="text-ink-500">入学 {formatDate(student.joinDate)}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 md:max-w-sm">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-ink-500">课时剩余</span>
              <span className={cn(
                'font-medium',
                isLow ? 'text-wine-600' : 'text-ink-700'
              )}>
                {student.remainingClasses} / {student.totalClasses} 课时
              </span>
            </div>
            <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  isLow ? 'bg-gradient-to-r from-wine-500 to-wine-600' : 'bg-gradient-to-r from-gold-400 to-gold-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            {isLow && renewal && (
              <Link
                to={`/renewal/${renewal.id}`}
                className="inline-flex items-center gap-1 mt-2 text-sm text-wine-600 hover:text-wine-700"
              >
                课时不足，前往续费跟进
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {student.phone}
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              微信
            </button>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="card-base overflow-hidden">
        <div className="flex border-b border-cream-100 px-2">
          {tabOptions.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'text-wine-700'
                    : 'text-ink-500 hover:text-ink-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-wine-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* 课堂反馈 Tab */}
          {activeTab === 'feedback' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-500">
                  共 {feedbackList.length} 条反馈记录
                </p>
                <button
                  onClick={() => setShowAddFeedback(true)}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  新增反馈
                </button>
              </div>

              {feedbackList.length > 0 ? (
                <Timeline items={feedbackTimeline} />
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                  <p className="text-ink-400 text-sm">暂无课堂反馈</p>
                </div>
              )}
            </div>
          )}

          {/* 续费记录 Tab */}
          {activeTab === 'renewal' && (
            <div>
              {renewal ? (
                <div className="space-y-4">
                  <div className="p-4 bg-cream-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-ink-800">
                        {renewal.packageType}
                      </span>
                      <StatusBadge type="renewal" value={renewal.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-ink-500">套餐价格</span>
                        <p className="font-medium text-ink-800 mt-0.5">
                          ¥{renewal.packagePrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-ink-500">到期时间</span>
                        <p className="font-medium text-ink-800 mt-0.5">
                          {formatDate(renewal.expirationDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-ink-500">跟进次数</span>
                        <p className="font-medium text-ink-800 mt-0.5">
                          {renewal.followUpRecords.length} 次
                        </p>
                      </div>
                      <div>
                        <span className="text-ink-500">风险等级</span>
                        <p className="mt-0.5">
                          <StatusBadge type="risk" value={renewal.riskLevel} />
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/renewal/${renewal.id}`}
                      className="mt-4 btn-primary w-full flex items-center justify-center gap-2"
                    >
                      查看跟进详情
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setShowAddException(true)}
                      className="mt-2 btn-secondary w-full flex items-center justify-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      登记异常
                    </button>
                  </div>

                  {renewal.followUpRecords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-ink-700 mb-3">
                        跟进记录
                      </p>
                      <div className="space-y-3">
                        {renewal.followUpRecords.map((record) => (
                          <div
                            key={record.id}
                            className="p-3 bg-white rounded-lg border border-cream-100"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-ink-700">
                                {record.operator}
                              </span>
                              <span className="text-xs text-ink-400">
                                {formatDate(record.date)}
                              </span>
                            </div>
                            <p className="text-sm text-ink-600">
                              {record.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                  <p className="text-ink-400 text-sm mb-4">暂无续费记录</p>
                  <button
                    onClick={() => setShowAddException(true)}
                    className="btn-secondary text-sm flex items-center gap-1.5 mx-auto text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    登记异常
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 考级进度 Tab */}
          {activeTab === 'exam' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cream-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-gold-600" />
                    </div>
                    <div>
                      <p className="text-sm text-ink-500">当前级别</p>
                      <p className="font-medium text-ink-800">{student.examLevel}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-cream-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm text-ink-500">下次考级</p>
                      <p className="font-medium text-ink-800">2026年秋季</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-ink-700 mb-3">
                  考级历史
                </p>
                <div className="space-y-2">
                  {student.level === '五级' && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-ink-700">中国舞四级</span>
                        <span className="text-xs text-ink-500 ml-auto">2025年12月</span>
                        <span className="text-xs text-emerald-600">已通过</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-ink-700">中国舞三级</span>
                        <span className="text-xs text-ink-500 ml-auto">2025年6月</span>
                        <span className="text-xs text-emerald-600">已通过</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 服装尺码 Tab */}
          {activeTab === 'costume' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cream-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Shirt className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-ink-500">练功服尺码</p>
                      <p className="font-medium text-ink-800">{student.costumeSize} 码</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-cream-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-ink-500">身高参考</p>
                      <p className="font-medium text-ink-800">
                        {student.costumeSize === 'S' ? '120-130cm' :
                         student.costumeSize === 'M' ? '130-145cm' :
                         '145-160cm'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gold-50 rounded-lg border border-gold-100">
                <p className="text-sm font-medium text-gold-800 mb-2">
                  💡 温馨提示
                </p>
                <p className="text-sm text-gold-700">
                  孩子正在发育期，建议每学期检查一次服装尺码是否合适。如需更换，请提前通知前台。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 最近变更摘要 */}
      <div className="card-base p-6 border-l-4 border-l-sky-400">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-serif text-lg font-semibold text-ink-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-sky-500" />
            最近变更摘要
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 类型筛选 */}
            <div className="flex items-center gap-1 bg-cream-50 rounded-lg p-1">
              {logFilterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setLogFilter(opt.value);
                    setShowAllLogs(false);
                  }}
                  className={cn(
                    'text-xs font-medium px-2.5 py-1.5 rounded-md transition-all',
                    logFilter === opt.value
                      ? opt.color + ' shadow-sm'
                      : 'text-ink-500 hover:text-ink-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-ink-400">
              共 {filteredLogItems.length} 条
            </span>
          </div>
        </div>

        {filteredLogItems.length > 0 ? (
          <div className="space-y-3">
            {(showAllLogs ? filteredLogItems : filteredLogItems.slice(0, 5)).map((item) => {
              const typeLabel =
                item.type === 'feedback' ? '课堂反馈' :
                item.type === 'renewal' ? '续费跟进' :
                item.type === 'exception' ? '异常处理' :
                item.type === 'student' ? '学员管理' : '系统';
              const typeColor =
                item.type === 'feedback' ? 'text-sky-600 bg-sky-50' :
                item.type === 'renewal' ? 'text-gold-600 bg-gold-50' :
                item.type === 'exception' ? 'text-rose-600 bg-rose-50' :
                item.type === 'student' ? 'text-emerald-600 bg-emerald-50' : 'text-ink-600 bg-ink-50';
              const hasAlert = item.isPending || item.isHighRisk;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group',
                    hasAlert
                      ? 'bg-rose-50/50 hover:bg-rose-50 border border-rose-100'
                      : 'hover:bg-cream-50'
                  )}
                  onClick={item.onClick}
                >
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5',
                    typeColor
                  )}>
                    {typeLabel}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink-800">
                        {item.operator}
                      </span>
                      <span className="text-sm text-ink-500">
                        {item.action}
                      </span>
                      {item.isPending && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          待处理
                        </span>
                      )}
                      {item.isHighRisk && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <Flame className="w-3 h-3" />
                          高风险
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink-600 mt-0.5 line-clamp-1">
                      {item.details}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-ink-400">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-wine-500 transition-colors" />
                  </div>
                </div>
              );
            })}

            {filteredLogItems.length > 5 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllLogs(!showAllLogs);
                }}
                className="w-full mt-2 py-2 text-sm text-ink-500 hover:text-ink-700 flex items-center justify-center gap-1 rounded-lg hover:bg-cream-50 transition-colors"
              >
                {showAllLogs ? (
                  <>
                    收起 <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    查看全部 {filteredLogItems.length} 条记录 <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-400 text-center py-6">
            暂无变更记录
          </p>
        )}
      </div>

      {/* 完整操作轨迹 */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-ink-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-ink-400" />
            完整操作轨迹
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ink-400" />
            <span className="text-xs text-ink-500">
              当前显示：{logFilterOptions.find(o => o.value === logFilter)?.label} · {filteredLogItems.length} 条
            </span>
          </div>
        </div>
        {filteredLogItems.length > 0 ? (
          <Timeline items={filteredLogItems} />
        ) : (
          <p className="text-sm text-ink-400 text-center py-8">
            暂无操作记录
          </p>
        )}
      </div>

      {/* 弹窗 */}
      <AddFeedbackModal
        isOpen={showAddFeedback}
        onClose={() => setShowAddFeedback(false)}
        defaultStudentId={id}
        onSuccess={(newId) => navigate(`/feedback/${newId}`)}
      />
      <AddExceptionModal
        isOpen={showAddException}
        onClose={() => setShowAddException(false)}
        defaultStudentId={id}
        onSuccess={(newId) => navigate(`/exception/${newId}`)}
      />
    </div>
  );
};

export default StudentDetail;
