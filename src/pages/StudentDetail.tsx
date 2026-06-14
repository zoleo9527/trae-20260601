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
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { Timeline } from '@/components/Timeline';
import { useStudentStore } from '@/store/useStudentStore';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { useRenewalStore } from '@/store/useRenewalStore';
import { useOperationLogStore } from '@/store/useOperationLogStore';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

type TabType = 'feedback' | 'renewal' | 'exam' | 'costume';

const tabOptions: { value: TabType; label: string; icon: typeof BookOpen }[] = [
  { value: 'feedback', label: '课堂反馈', icon: BookOpen },
  { value: 'renewal', label: '续费记录', icon: BarChart3 },
  { value: 'exam', label: '考级进度', icon: Award },
  { value: 'costume', label: '服装尺码', icon: Shirt },
];

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudentById } = useStudentStore();
  const { getFeedbackByStudentId } = useFeedbackStore();
  const { getRenewalByStudentId } = useRenewalStore();
  const { getLogsByTarget } = useOperationLogStore();

  const [activeTab, setActiveTab] = useState<TabType>('feedback');

  const student = getStudentById(id || '');
  const feedbackList = id ? getFeedbackByStudentId(id) : [];
  const renewal = id ? getRenewalByStudentId(id) : undefined;
  const logs = id ? getLogsByTarget('student', id) : [];

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

  const logItems = logs.map((log) => ({
    id: log.id,
    type: log.type,
    targetName: log.targetName,
    action: log.action,
    operator: log.operator,
    timestamp: log.timestamp,
    details: log.details,
  }));

  const allTimelineItems = [...feedbackTimeline, ...logItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

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
                <button className="btn-ghost text-sm">
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
                  <p className="text-ink-400 text-sm">暂无续费记录</p>
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

      {/* 完整操作轨迹 */}
      <div className="card-base p-6">
        <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-ink-400" />
          完整操作轨迹
        </h3>
        {allTimelineItems.length > 0 ? (
          <Timeline items={allTimelineItems.slice(0, 15)} />
        ) : (
          <p className="text-sm text-ink-400 text-center py-8">
            暂无操作记录
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;
