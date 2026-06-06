import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Truck,
  Users,
  DollarSign,
  ClipboardList,
  Settings,
  Play,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { WorkbenchCard } from '@/components/common/WorkbenchCard';
import { StatusTag } from '@/components/common/StatusTag';
import { userRoleMap, formatDateTime, formatCurrency } from '@/utils/format';
import { LoadingOperationModal } from '@/components/detention/LoadingOperationModal';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const {
    currentUser,
    detentions,
    appeals,
    setSelectedDetentionId,
    setSelectedAppealId,
    getStats,
    getRoleTodos,
    getRolePermissions,
    getNextLoadingTask,
  } = useStore();

  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingDetentionId, setLoadingDetentionId] = useState('');

  const stats = getStats();
  const todos = getRoleTodos();
  const permissions = getRolePermissions(currentUser.role);
  const nextLoadingTask = getNextLoadingTask();

  const pendingDetentions = detentions.filter((d) => d.status === 'pending');
  const pendingAppeals = appeals.filter((a) => a.status === 'pending' || a.status === 'processing');

  const roleWelcome: Record<string, { title: string; subtitle: string; tips: string[] }> = {
    dispatcher: {
      title: '调度员工作台',
      subtitle: '负责车辆调度、月台分配、滞留费用确认',
      tips: [
        '及时确认待处理的滞留费用记录',
        '关注司机申诉中的月台调度问题',
        '协调叉车班长保障装卸效率',
      ],
    },
    forklift_foreman: {
      title: '叉车班长工作台',
      subtitle: '负责装卸作业记录、效率监控',
      tips: [
        '车辆到位后及时记录开始装卸时间',
        '装卸完成后立即记录结束时间',
        '遇到异常情况及时记录并上报',
      ],
    },
    warehouse_clerk: {
      title: '仓库文员工作台',
      subtitle: '负责费用核算、申诉处理、数据统计',
      tips: [
        '及时处理司机申诉，保障公正透明',
        '核对滞留费用计算准确性',
        '做好费用调整的记录和备注',
      ],
    },
  };

  const welcome = roleWelcome[currentUser.role] || roleWelcome.warehouse_clerk;

  const statCards = [
    {
      label: '今日滞留单',
      value: stats.todayDetentionCount,
      icon: <Truck className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: '待确认费用',
      value: stats.pendingConfirmationCount,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: '待处理申诉',
      value: stats.pendingAppealCount,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: '累计费用',
      value: formatCurrency(stats.totalFeeAmount),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
    },
  ];

  const allQuickActions = [
    {
      label: '滞留费用管理',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => navigate('/detention'),
      show: permissions.canViewAll,
    },
    {
      label: '司机申诉处理',
      icon: <Users className="w-5 h-5" />,
      onClick: () => navigate('/appeal'),
      show: permissions.canProcessAppeal || permissions.canViewAll,
    },
    {
      label: '开始装卸',
      icon: <Play className="w-5 h-5" />,
      onClick: () => {
        if (nextLoadingTask) {
          setLoadingDetentionId(nextLoadingTask.id);
          setShowLoadingModal(true);
        }
      },
      show: permissions.canRecordLoading && !!nextLoadingTask && !nextLoadingTask.startLoadingTime,
    },
    {
      label: '结束装卸',
      icon: <Square className="w-5 h-5" />,
      onClick: () => {
        const inProgress = detentions.find((d) => d.startLoadingTime && !d.endLoadingTime);
        if (inProgress) {
          setLoadingDetentionId(inProgress.id);
          setShowLoadingModal(true);
        }
      },
      show: permissions.canRecordLoading && detentions.some((d) => d.startLoadingTime && !d.endLoadingTime),
    },
    {
      label: '记录异常',
      icon: <AlertTriangle className="w-5 h-5" />,
      onClick: () => {
        const inProgress = detentions.find((d) => d.startLoadingTime && !d.endLoadingTime);
        if (inProgress) {
          setLoadingDetentionId(inProgress.id);
          setShowLoadingModal(true);
        }
      },
      show: permissions.canRecordLoading,
    },
    {
      label: '系统设置',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => {},
      show: true,
    },
  ];

  const quickActions = allQuickActions.filter((a) => a.show);

  const recentActivities = [
    ...detentions.slice(0, 5).map((d) => ({
      id: d.id,
      type: 'detention' as const,
      title: `滞留单 ${d.orderNo}`,
      desc: `${d.plateNumber} ${d.driverName} 超时${d.detentionHours}小时`,
      status: d.status,
      time: d.updatedAt,
    })),
    ...appeals.slice(0, 5).map((a) => ({
      id: a.id,
      type: 'appeal' as const,
      title: `申诉 #${a.id}`,
      desc: `${a.driverName} 申请减免 ${formatCurrency(a.requestedAdjustment)}`,
      status: a.status,
      time: a.submittedAt,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  const handleTodoClick = (todo: typeof todos[0]) => {
    if (todo.type === 'loading_record') {
      setLoadingDetentionId(todo.relatedId);
      setShowLoadingModal(true);
    } else if (todo.type === 'appeal_process') {
      setSelectedAppealId(todo.relatedId);
      navigate('/appeal');
    } else {
      setSelectedDetentionId(todo.relatedId);
      navigate('/detention');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">{welcome.title}</h2>
            <p className="text-blue-100 text-sm mb-4">
              {currentUser.name}，{welcome.subtitle}
            </p>
            <div className="space-y-1">
              {welcome.tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-blue-100">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">当前角色</p>
            <p className="text-lg font-medium">{userRoleMap[currentUser.role]}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <WorkbenchCard
            title="待办任务"
            count={todos.length}
            icon={<ClipboardList className="w-4 h-4" />}
          >
            <div className="space-y-3">
              {todos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">暂无待办任务</p>
              ) : (
                todos.slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleTodoClick(todo)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{todo.title}</p>
                        <p className="text-xs text-gray-500">{todo.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </WorkbenchCard>

          <WorkbenchCard
            title="最近动态"
            icon={<Clock className="w-4 h-4" />}
          >
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'detention' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}
                    >
                      {activity.type === 'detention' ? (
                        <Truck className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Users className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusTag status={activity.status} type={activity.type} />
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(activity.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </WorkbenchCard>
        </div>

        <div className="space-y-6">
          <WorkbenchCard title="快捷操作" icon={<Settings className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600">
                    {action.icon}
                  </div>
                  <span className="text-xs text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </WorkbenchCard>

          <WorkbenchCard
            title="待处理申诉"
            count={pendingAppeals.length}
            icon={<AlertCircle className="w-4 h-4" />}
          >
            <div className="space-y-3">
              {pendingAppeals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">暂无待处理申诉</p>
              ) : (
                pendingAppeals.slice(0, 3).map((appeal) => (
                  <div
                    key={appeal.id}
                    className="p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                    onClick={() => {
                      setSelectedAppealId(appeal.id);
                      navigate('/appeal');
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {appeal.driverName}
                      </span>
                      <StatusTag status={appeal.status} type="appeal" />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {appeal.appealReason}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-600 font-medium">
                        申请减免 {formatCurrency(appeal.requestedAdjustment)}
                      </span>
                      <span className="text-gray-400">
                        {formatDateTime(appeal.submittedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {pendingAppeals.length > 0 && (
                <button
                  onClick={() => navigate('/appeal')}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 py-2 text-center"
                >
                  处理全部申诉 →
                </button>
              )}
            </div>
          </WorkbenchCard>

          {permissions.canRecordLoading && (
            <WorkbenchCard
              title="装卸作业"
              icon={<ClipboardList className="w-4 h-4" />}
            >
              <div className="space-y-3">
                {nextLoadingTask && !nextLoadingTask.startLoadingTime && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-sm font-medium text-green-800 mb-1">待开始装卸</p>
                    <p className="text-xs text-green-600 mb-2">
                      {nextLoadingTask.plateNumber} - 月台{nextLoadingTask.platformNo}
                    </p>
                    <button
                      onClick={() => {
                        setLoadingDetentionId(nextLoadingTask.id);
                        setShowLoadingModal(true);
                      }}
                      className="w-full text-xs py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      开始装卸
                    </button>
                  </div>
                )}

                {(() => {
                  const inProgress = detentions.filter((d) => d.startLoadingTime && !d.endLoadingTime);
                  return inProgress.map((d) => (
                    <div key={d.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-blue-800 mb-1">装卸进行中</p>
                      <p className="text-xs text-blue-600 mb-2">
                        {d.plateNumber} - 月台{d.platformNo}
                      </p>
                      <p className="text-xs text-blue-500 mb-2">
                        开始: {formatDateTime(d.startLoadingTime)}
                      </p>
                      <button
                        onClick={() => {
                          setLoadingDetentionId(d.id);
                          setShowLoadingModal(true);
                        }}
                        className="w-full text-xs py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        结束装卸
                      </button>
                    </div>
                  ));
                })()}

                {!nextLoadingTask && !detentions.some((d) => d.startLoadingTime && !d.endLoadingTime) && (
                  <p className="text-sm text-gray-500 text-center py-4">暂无装卸作业</p>
                )}
              </div>
            </WorkbenchCard>
          )}
        </div>
      </div>

      <LoadingOperationModal
        isOpen={showLoadingModal}
        onClose={() => setShowLoadingModal(false)}
        detentionId={loadingDetentionId}
      />
    </div>
  );
}
