import { Card, CardContent } from '@/components/ui/Card';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useUserStore } from '@/store/useUserStore';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  Plus,
  Flame,
  Timer,
  Droplets,
  Wrench,
  FileCheck,
  CalendarDays,
  Truck,
  History,
  ShieldCheck,
  UserCheck,
  FileText,
  Zap,
} from 'lucide-react';
import { statusMap, priorityMap, roleMap } from '@/utils/status';
import { formatRelativeTime, formatDateTime } from '@/utils/date';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const roleActionMap: Record<string, string> = {
  manager: '待确认审核',
  dispatcher: '待分配调度',
  technician: '待验机处理',
  driver: '待签收确认',
};

const roleQuickActions: Record<string, { label: string; icon: typeof Plus; path: string; color: string; bgColor: string }[]> = {
  manager: [
    { label: '新建验机单', icon: Plus, path: '/inspections?action=create', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: '查看争议', icon: ShieldCheck, path: '/inspections?status=disputed', color: 'text-rose-600', bgColor: 'bg-rose-50' },
    { label: '审核待办', icon: FileCheck, path: '/inspections?status=pending_manager', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ],
  dispatcher: [
    { label: '待分配设备', icon: Truck, path: '/inspections?status=pending_dispatch', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: '调度日历', icon: CalendarDays, path: '/inspections', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  ],
  technician: [
    { label: '待验机设备', icon: FileText, path: '/inspections?status=pending_inspection', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: '维修工单', icon: Wrench, path: '/inspections?status=pending_repair', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ],
  driver: [
    { label: '待签收设备', icon: FileCheck, path: '/inspections?status=pending_sign', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { label: '签收记录', icon: History, path: '/inspections?status=completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  ],
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentRole, currentUser } = useUserStore();
  const { getTodoCount, getExceptionCount, getCompletedCount, inspections, getEquipmentById, getContractById } =
    useInspectionStore();

  const todoCount = getTodoCount(currentRole);
  const exceptionCount = getExceptionCount();
  const completedCount = getCompletedCount();
  const todayCount = inspections.filter((i) => {
    const today = new Date().toDateString();
    return new Date(i.createdAt).toDateString() === today;
  }).length;

  const myTodos = inspections
    .filter((i) => i.currentRole === currentRole && i.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);

  const overdueInspections = inspections.filter((i) => {
    if (i.status === 'completed') return false;
    const contract = getContractById(i.contractId);
    if (!contract) return false;
    return new Date(contract.endDate) < new Date();
  });

  const disputedInspections = inspections.filter((i) => i.status === 'disputed');

  const repairInspections = inspections.filter((i) => i.status === 'pending_repair');

  const exceptionCategories = [
    {
      type: '设备超期未还',
      icon: Timer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      items: overdueInspections,
    },
    {
      type: '油耗争议',
      icon: Droplets,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      items: disputedInspections,
    },
    {
      type: '维修责任争议',
      icon: Wrench,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      items: repairInspections,
    },
  ];

  const completed = inspections
    .filter((i) => i.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const quickActions = roleQuickActions[currentRole] || [];

  const statCards = [
    {
      label: '我的待办',
      value: todoCount,
      icon: ClipboardList,
      gradient: 'from-blue-500 to-blue-700',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      trend: '+2 较昨日',
    },
    {
      label: '异常提醒',
      value: exceptionCount,
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-rose-700',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-600',
      trend: '需关注',
    },
    {
      label: '已完成',
      value: completedCount,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-700',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      trend: '+5 本周',
    },
    {
      label: '今日新增',
      value: todayCount,
      icon: TrendingUp,
      gradient: 'from-amber-500 to-amber-700',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      trend: '平稳',
    },
  ];

  const getInspectionInfo = (inspection: any) => {
    const equipment = getEquipmentById(inspection.equipmentId);
    const contract = getContractById(inspection.contractId);
    return { equipment, contract };
  };

  const getLastHandler = (inspection: any) => {
    if (inspection.signature) {
      return { name: inspection.signature.driverName, action: '签收确认', time: inspection.signature.signedAt };
    }
    if (inspection.timeline && inspection.timeline.length > 0) {
      const last = inspection.timeline[inspection.timeline.length - 1];
      return { name: last.handler, action: last.action, time: last.timestamp };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            你好，{currentUser.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            <span className={cn('font-medium', roleMap[currentRole].color)}>
              {roleMap[currentRole].label}
            </span>
            {' · '}
            今天有 {todoCount} 项待处理任务，{exceptionCount} 项异常需要关注
          </p>
        </div>
        {currentRole === 'manager' && (
          <button
            onClick={() => navigate('/inspections?action=create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            新建验机单
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                    <p className={cn('text-xs mt-2', card.textColor)}>{card.trend}</p>
                  </div>
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg',
                      card.gradient
                    )}
                  >
                    <Icon size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">我的待办</h3>
            <button
              onClick={() => navigate('/inspections')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              查看全部
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {myTodos.length > 0 ? (
              myTodos.map((inspection) => {
                const { equipment, contract } = getInspectionInfo(inspection);
                const statusInfo = statusMap[inspection.status];
                const priorityInfo = priorityMap[inspection.priority];
                return (
                  <div
                    key={inspection.id}
                    onClick={() => navigate(`/inspections/${inspection.id}`)}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'w-1.5 self-stretch rounded-full flex-shrink-0',
                          inspection.priority === 'urgent'
                            ? 'bg-rose-500'
                            : inspection.priority === 'high'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-medium text-slate-900 text-sm">
                            {equipment?.name || '未知设备'}
                          </span>
                          {equipment?.plateNumber && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {equipment.plateNumber}
                            </span>
                          )}
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded-md border',
                              statusInfo.bgColor,
                              statusInfo.color
                            )}
                          >
                            {statusInfo.label}
                          </span>
                          {inspection.priority !== 'normal' && (
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-xs font-medium rounded',
                                priorityInfo.bgColor,
                                priorityInfo.color
                              )}
                            >
                              {priorityInfo.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                          <span>{inspection.inspectionNo}</span>
                          {contract && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span>{contract.contractNo}</span>
                              <span className="text-slate-300">|</span>
                              <span>{contract.lessee}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {inspection.siteAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatRelativeTime(inspection.updatedAt)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            <ChevronRight size={10} />
                            {roleActionMap[currentRole] || '待处理'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-2"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无待办事项</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Flame size={16} className="text-rose-500" />
                异常提醒
              </h3>
              <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                {exceptionCount} 项
              </span>
            </div>
            <div>
              {exceptionCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={category.type} className="border-b border-slate-100 last:border-b-0">
                    <div className="px-5 py-3 flex items-center justify-between bg-slate-25">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', category.bgColor)}>
                          <CategoryIcon size={13} className={category.color} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{category.type}</span>
                      </div>
                      <span className={cn('text-xs font-semibold', category.color)}>
                        {category.items.length}
                      </span>
                    </div>
                    {category.items.slice(0, 2).map((inspection) => {
                      const { equipment } = getInspectionInfo(inspection);
                      return (
                        <div
                          key={inspection.id}
                          onClick={() => navigate(`/inspections/${inspection.id}`)}
                          className="px-5 py-2.5 hover:bg-rose-50 cursor-pointer transition-colors flex items-center gap-3"
                        >
                          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', category.bgColor)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {equipment?.name || '未知设备'}
                            </p>
                            <p className="text-[11px] text-slate-400">{inspection.inspectionNo}</p>
                          </div>
                          <span className="text-[11px] text-slate-400 flex-shrink-0">
                            {formatRelativeTime(inspection.updatedAt)}
                          </span>
                        </div>
                      );
                    })}
                    {category.items.length === 0 && (
                      <div className="px-5 py-2">
                        <p className="text-xs text-slate-400">暂无此类异常</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                快捷入口
              </h3>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl transition-colors hover:shadow-sm',
                        action.bgColor
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.bgColor)}>
                        <ActionIcon size={20} className={action.color} />
                      </div>
                      <span className={cn('text-xs font-medium', action.color)}>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">最近完成</h3>
          <button
            onClick={() => navigate('/inspections?status=completed')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            更多
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {completed.length > 0 ? (
            completed.map((inspection) => {
              const { equipment, contract } = getInspectionInfo(inspection);
              const lastHandler = getLastHandler(inspection);
              return (
                <div
                  key={inspection.id}
                  onClick={() => navigate(`/inspections/${inspection.id}`)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {equipment?.name || '未知设备'}
                      </span>
                      {equipment?.plateNumber && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {equipment.plateNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{inspection.inspectionNo}</span>
                      {contract && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>{contract.lessee}</span>
                        </>
                      )}
                    </div>
                    {lastHandler && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <UserCheck size={11} />
                        <span>
                          {lastHandler.name} · {lastHandler.action} · {formatDateTime(lastHandler.time)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatRelativeTime(inspection.updatedAt)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400">
              <p className="text-sm">暂无已完成记录</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
