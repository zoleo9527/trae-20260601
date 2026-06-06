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
import { useState, useMemo } from 'react';
import type { StatusLog } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const {
    currentUser,
    detentions,
    appeals,
    setSelectedDetentionId,
    setSelectedAppealId,
    getRoleStats,
    getRoleTodos,
    getRolePermissions,
    getNextLoadingTask,
  } = useStore();

  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingDetentionId, setLoadingDetentionId] = useState('');

  const stats = getRoleStats(currentUser.role);
  const todos = getRoleTodos();
  const permissions = getRolePermissions(currentUser.role);
  const nextLoadingTask = getNextLoadingTask();

  const inProgressLoading = useMemo(
    () => detentions.find((d) => d.startLoadingTime && !d.endLoadingTime),
    [detentions]
  );

  const hasInProgressLoading = !!inProgressLoading;

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

  const statCards = useMemo(() => {
    const role = currentUser.role;
    const cards = [];

    if (role === 'forklift_foreman') {
      cards.push(
        {
          label: '今日装卸任务',
          value: stats.todayDetentionCount,
          icon: <Truck className="w-5 h-5" />,
          color: 'bg-blue-50 text-blue-600',
        },
        {
          label: '待开始装卸',
          value: detentions.filter((d) => !d.startLoadingTime && !d.endLoadingTime).length,
          icon: <Clock className="w-5 h-5" />,
          color: 'bg-orange-50 text-orange-600',
        },
        {
          label: '进行中装卸',
          value: detentions.filter((d) => d.startLoadingTime && !d.endLoadingTime).length,
          icon: <Play className="w-5 h-5" />,
          color: 'bg-purple-50 text-purple-600',
        },
        {
          label: '待处理异常',
          value: stats.pendingAppealCount,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'bg-red-50 text-red-600',
        }
      );
    } else if (role === 'dispatcher') {
      cards.push(
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
          label: '待异常复核',
          value: stats.pendingAppealCount,
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'bg-purple-50 text-purple-600',
        },
        {
          label: '预计费用',
          value: formatCurrency(stats.totalFeeAmount),
          icon: <DollarSign className="w-5 h-5" />,
          color: 'bg-green-50 text-green-600',
        }
      );
    } else {
      cards.push(
        {
          label: '今日滞留单',
          value: stats.todayDetentionCount,
          icon: <Truck className="w-5 h-5" />,
          color: 'bg-blue-50 text-blue-600',
        },
        {
          label: '待处理事项',
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
        }
      );
    }

    return cards;
  }, [currentUser.role, stats, detentions]);

  const allQuickActions = useMemo(() => {
    const actions = [
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
    ];

    if (permissions.canRecordLoading) {
      if (nextLoadingTask && !nextLoadingTask.startLoadingTime) {
        actions.push({
          label: '开始装卸',
          icon: <Play className="w-5 h-5" />,
          onClick: () => {
            setLoadingDetentionId(nextLoadingTask.id);
            setShowLoadingModal(true);
          },
          show: true,
        });
      }

      if (hasInProgressLoading) {
        actions.push({
          label: '结束装卸',
          icon: <Square className="w-5 h-5" />,
          onClick: () => {
            if (inProgressLoading) {
              setLoadingDetentionId(inProgressLoading.id);
              setShowLoadingModal(true);
            }
          },
          show: true,
        });

        actions.push({
          label: '记录异常',
          icon: <AlertTriangle className="w-5 h-5" />,
          onClick: () => {
            if (inProgressLoading) {
              setLoadingDetentionId(inProgressLoading.id);
              setShowLoadingModal(true);
            }
          },
          show: true,
        });
      }
    }

    actions.push({
      label: '系统设置',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => {},
      show: true,
    });

    return actions.filter((a) => a.show);
  }, [permissions, nextLoadingTask, hasInProgressLoading, inProgressLoading, navigate]);

  const getLatestTime = (record: { statusLogs?: StatusLog[]; updatedAt?: string; feeUpdatedAt?: string; submittedAt?: string }) => {
    const times: string[] = [];
    if (record.statusLogs && record.statusLogs.length > 0) {
      times.push(...record.statusLogs.map((l) => l.operateTime));
    }
    if (record.feeUpdatedAt) times.push(record.feeUpdatedAt);
    if (record.updatedAt) times.push(record.updatedAt);
    if (record.submittedAt) times.push(record.submittedAt);
    if (times.length === 0) return '';
    return times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  };

  const recentActivities = useMemo(() => {
    const role = currentUser.role;

    const activityMap = new Map<
      string,
      {
        id: string;
        type: 'detention' | 'appeal';
        title: string;
        desc: string;
        status: string;
        time: string;
      }
    >();

    if (role === 'forklift_foreman') {
      detentions
        .filter((d) => !d.endLoadingTime)
        .forEach((d) => {
          const key = `detention-${d.id}`;
          activityMap.set(key, {
            id: d.id,
            type: 'detention',
            title: `装卸作业 ${d.orderNo}`,
            desc: `${d.plateNumber} 月台${d.platformNo} - ${
              d.startLoadingTime ? '进行中' : '待开始'
            }${d.hasException ? ' · 有异常' : ''}`,
            status: d.status,
            time: getLatestTime(d),
          });
        });
    }

    if (role === 'dispatcher' || role === 'warehouse_clerk') {
      detentions
        .filter((d) => d.status === 'pending')
        .forEach((d) => {
          const key = `detention-${d.id}`;
          const existing = activityMap.get(key);
          const time = getLatestTime(d);
          if (!existing || new Date(time).getTime() > new Date(existing.time).getTime()) {
            activityMap.set(key, {
              id: d.id,
              type: 'detention',
              title: d.hasException ? `待复核 ${d.orderNo}` : `待确认 ${d.orderNo}`,
              desc: `${d.plateNumber} ${d.driverName} 超时${d.detentionHours}小时${
                d.hasException ? ' · 有异常' : ''
              }`,
              status: d.status,
              time,
            });
          }
        });
    }

    if (role === 'warehouse_clerk') {
      appeals
        .filter((a) => a.status === 'pending' || a.status === 'processing')
        .forEach((a) => {
          const key = `appeal-${a.id}`;
          activityMap.set(key, {
            id: a.id,
            type: 'appeal',
            title: `待处理申诉 #${a.id}`,
            desc: `${a.driverName} 申请减免 ${formatCurrency(a.requestedAdjustment)}${
              a.hasFeeUpdate ? ' · 费用已更新' : ''
            }`,
            status: a.status,
            time: getLatestTime(a),
          });
        });
    }

    const allLogs: Array<{
      id: string;
      type: 'detention' | 'appeal';
      title: string;
      desc: string;
      status: string;
      time: string;
      recordKey: string;
    }> = [];

    detentions.forEach((d) => {
      d.statusLogs.forEach((log) => {
        if (log.operatorRole === role) {
          allLogs.push({
            id: `${d.id}-${log.id}`,
            type: 'detention',
            title: `${d.orderNo} - ${log.remark || '状态变更'}`,
            desc: `${d.plateNumber}`,
            status: log.toStatus,
            time: log.operateTime,
            recordKey: `detention-${d.id}`,
          });
        }
      });
    });

    appeals.forEach((a) => {
      a.statusLogs.forEach((log) => {
        if (log.operatorRole === role) {
          allLogs.push({
            id: `${a.id}-${log.id}`,
            type: 'appeal',
            title: `申诉 #${a.id} - ${log.remark || '状态变更'}`,
            desc: `${a.driverName}`,
            status: log.toStatus,
            time: log.operateTime,
            recordKey: `appeal-${a.id}`,
          });
        }
      });
    });

    allLogs
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .forEach((log) => {
        if (!activityMap.has(log.recordKey)) {
          activityMap.set(log.recordKey, {
            id: log.id,
            type: log.type,
            title: log.title,
            desc: log.desc,
            status: log.status,
            time: log.time,
          });
        }
      });

    return Array.from(activityMap.values())
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [currentUser.role, detentions, appeals]);

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

  const pendingAppeals = appeals.filter((a) => a.status === 'pending' || a.status === 'processing');

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
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">暂无动态</p>
              ) : (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
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
                      <StatusTag
                        status={activity.status as 'pending' | 'confirmed' | 'appealed' | 'adjusted' | 'closed'}
                        type={activity.type}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(activity.time)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </WorkbenchCard>
        </div>

        <div className="space-y-6">
          <WorkbenchCard title="快捷操作" icon={<Settings className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-3">
              {allQuickActions.map((action, index) => (
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

                {inProgressLoading && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-800 mb-1">装卸进行中</p>
                    <p className="text-xs text-blue-600 mb-2">
                      {inProgressLoading.plateNumber} - 月台{inProgressLoading.platformNo}
                    </p>
                    <p className="text-xs text-blue-500 mb-2">
                      开始: {formatDateTime(inProgressLoading.startLoadingTime)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setLoadingDetentionId(inProgressLoading.id);
                          setShowLoadingModal(true);
                        }}
                        className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        结束装卸
                      </button>
                      <button
                        onClick={() => {
                          setLoadingDetentionId(inProgressLoading.id);
                          setShowLoadingModal(true);
                        }}
                        className="flex-1 text-xs py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                      >
                        记录异常
                      </button>
                    </div>
                  </div>
                )}

                {!nextLoadingTask && !hasInProgressLoading && (
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
