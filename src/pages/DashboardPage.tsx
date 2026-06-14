import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  FileText,
  TrendingUp,
  Clock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/stores/appStore';
import { STUDENT_STATUS_LABELS, USER_ROLE_LABELS } from '@/types';
export function DashboardPage() {
  const { currentUser, getDashboardStats, loadStudents, users, getArchiveByStudentId, getLogsByStudentId } = useStore();

  useEffect(() => {
    loadStudents();
  }, []);

  const stats = getDashboardStats();

  const statCards = [
    {
      label: '总学员数',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      href: '/enrollment',
    },
    {
      label: '卡单预警',
      value: stats.overdueCount,
      icon: AlertTriangle,
      color: stats.overdueCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-gray-500',
      href: '/enrollment',
      urgent: stats.overdueCount > 0,
    },
    {
      label: '缺件待补',
      value: stats.missingDocumentsCount,
      icon: FileText,
      color: stats.missingDocumentsCount > 0 ? 'bg-purple-500' : 'bg-gray-500',
      href: '/archive',
    },
    {
      label: '培训中',
      value: stats.statusCounts['TRAINING'] || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/coach',
    },
  ];

  const stuckOrdersWithDetails = stats.stuckOrders.map((order) => {
    const archive = getArchiveByStudentId(order.studentId);
    const logs = getLogsByStudentId(order.studentId);
    const lastLog = logs[0];
    const operator = users.find((u) => u.id === lastLog?.operatorId);
    return {
      ...order,
      archive,
      lastOperator: operator?.name,
      lastOperationTime: lastLog?.operatedAt,
      changeReason: lastLog?.changeReason,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">驾驶台</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，{currentUser?.name} ({USER_ROLE_LABELS[currentUser?.role as keyof typeof USER_ROLE_LABELS]})</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">当前日期</div>
          <div className="text-lg font-medium">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.href}
              className="card p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
                  {card.urgent && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      需要处理
                    </p>
                  )}
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">卡单预警</h2>
              {stats.stuckOrders.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  {stats.stuckOrders.length} 条待处理
                </span>
              )}
            </div>
            <Link to="/enrollment" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
          
          {stats.stuckOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-success-500 opacity-50" />
              <p className="text-lg font-medium">暂无卡单</p>
              <p className="text-sm mt-1">所有学员流程正常推进中</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stuckOrdersWithDetails.map((order) => (
                <div
                  key={order.studentId}
                  className="p-4 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold">
                          {order.studentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{order.studentName}</div>
                          <div className="text-sm text-gray-500">{order.studentNo}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            已卡 {order.stuckDays} 天
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{order.consultantName}</span>
                        </div>
                      </div>

                      {order.changeReason && (
                        <div className="mt-2 text-sm text-amber-700 bg-amber-100 px-3 py-2 rounded">
                          <span className="font-medium">最后操作：</span>{order.changeReason}
                        </div>
                      )}

                      {order.archive?.missingDocuments && order.archive.missingDocuments.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">缺件：</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {order.archive.missingDocuments.map((doc, i) => (
                              <span key={i} className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded text-xs">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        order.currentStatus === 'PENDING_REVIEW' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-accent-100 text-accent-700'
                      }`}>
                        {STUDENT_STATUS_LABELS[order.currentStatus as keyof typeof STUDENT_STATUS_LABELS]}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {order.stuckReason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">工作负载</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">招生顾问</span>
                  <span className="text-gray-400 text-xs">{stats.consultantWorkload.length}人</span>
                </div>
                <div className="space-y-2">
                  {stats.consultantWorkload.map((w) => (
                    <div key={w.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{w.userName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">待处理: {w.pendingCount}</span>
                        {w.overdueCount > 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                            超时: {w.overdueCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">教练</span>
                  <span className="text-gray-400 text-xs">{stats.coachWorkload.length}人</span>
                </div>
                <div className="space-y-2">
                  {stats.coachWorkload.map((w) => (
                    <div key={w.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{w.userName}</span>
                      </div>
                      <span className="text-xs text-gray-500">在训: {w.pendingCount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">考试专员</span>
                  <span className="text-gray-400 text-xs">{stats.specialistWorkload.length}人</span>
                </div>
                <div className="space-y-2">
                  {stats.specialistWorkload.map((w) => (
                    <div key={w.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{w.userName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">待审核: {w.pendingCount}</span>
                        {w.overdueCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                            过期: {w.overdueCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">学员状态分布</h2>
            <div className="space-y-2">
              {Object.entries(stats.statusCounts)
                .filter(([_, count]) => count > 0)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        status === 'COMPLETED' ? 'bg-gray-400' :
                        status === 'TRAINING' ? 'bg-green-500' :
                        status === 'PENDING_REVIEW' ? 'bg-primary-500' :
                        status === 'PENDING_EXAM' ? 'bg-accent-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {STUDENT_STATUS_LABELS[status as keyof typeof STUDENT_STATUS_LABELS] || status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[80px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            status === 'COMPLETED' ? 'bg-gray-400' :
                            status === 'TRAINING' ? 'bg-green-500' :
                            status === 'PENDING_REVIEW' ? 'bg-primary-500' :
                            status === 'PENDING_EXAM' ? 'bg-accent-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${(count / stats.totalStudents) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">处理流程概览</h2>
        <div className="flex items-center justify-between">
          {[
            { status: 'DRAFT', label: '草稿', count: stats.statusCounts['DRAFT'] || 0 },
            { status: 'PENDING_REVIEW', label: '待审核', count: stats.statusCounts['PENDING_REVIEW'] || 0 },
            { status: 'REVIEW_PASSED', label: '审核通过', count: stats.statusCounts['REVIEW_PASSED'] || 0 },
            { status: 'PENDING_EXAM', label: '待体检', count: stats.statusCounts['PENDING_EXAM'] || 0 },
            { status: 'EXAM_PASSED', label: '体检合格', count: stats.statusCounts['EXAM_PASSED'] || 0 },
            { status: 'ARCHIVED', label: '已建档', count: stats.statusCounts['ARCHIVED'] || 0 },
            { status: 'COACH_ASSIGNED', label: '已分配', count: stats.statusCounts['COACH_ASSIGNED'] || 0 },
            { status: 'TRAINING', label: '培训中', count: stats.statusCounts['TRAINING'] || 0 },
            { status: 'PENDING_EXAM_BOOKING', label: '待考试', count: stats.statusCounts['PENDING_EXAM_BOOKING'] || 0 },
            { status: 'EXAM_PASSED_FINAL', label: '考试通过', count: stats.statusCounts['EXAM_PASSED_FINAL'] || 0 },
            { status: 'COMPLETED', label: '结业', count: stats.statusCounts['COMPLETED'] || 0 },
          ].map((step, index) => (
            <div key={step.status} className="flex flex-col items-center">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
                  step.count > 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.count}
                </div>
                {index < 10 && (
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 text-gray-300" size={20} />
                )}
              </div>
              <div className="mt-2 text-xs text-center text-gray-600 max-w-[60px]">
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}