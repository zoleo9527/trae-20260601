import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABELS, type UserRole } from '@/types';
import { AlertTriangle, ArrowRight, BedDouble, Check, ClipboardList, FileCheck, HeartPulse, MessageSquare, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roleEntries: Record<UserRole, { icon: typeof BedDouble; label: string; desc: string; path: string; color: string; primary?: boolean }[]> = {
  nursing_supervisor: [
    { icon: BedDouble, label: '床位总览', desc: '查看全部床位状态与安排', path: '/beds', color: 'text-indigo-600 bg-indigo-50', primary: true },
    { icon: HeartPulse, label: '护理等级审批', desc: '审批待确认的护理等级', path: '/nursing-levels?status=pending', color: 'text-rose-600 bg-rose-50', primary: true },
    { icon: AlertTriangle, label: '异常退回处理', desc: '处理异常标记与退回', path: '/nursing-levels?status=anomaly', color: 'text-amber-600 bg-amber-50', primary: true },
  ],
  care_worker: [
    { icon: ClipboardList, label: '负责床位任务', desc: '查看分配的床位与任务', path: '/beds?status=occupied', color: 'text-emerald-600 bg-emerald-50', primary: true },
    { icon: FileCheck, label: '护理记录录入', desc: '录入护理评估记录', path: '/nursing-levels?status=pending', color: 'text-sky-600 bg-sky-50', primary: true },
    { icon: AlertTriangle, label: '异常上报', desc: '上报异常情况', path: '/nursing-levels?status=anomaly', color: 'text-amber-600 bg-amber-50', primary: true },
  ],
  social_worker: [
    { icon: MessageSquare, label: '家属沟通记录', desc: '记录与家属的沟通', path: '/beds?status=occupied', color: 'text-violet-600 bg-violet-50', primary: true },
    { icon: Users, label: '社会评估', desc: '进行社会评估', path: '/nursing-levels?status=pending', color: 'text-teal-600 bg-teal-50', primary: true },
    { icon: ArrowRight, label: '转介跟进', desc: '跟进出院与转介', path: '/beds?status=pending_adjustment', color: 'text-orange-600 bg-orange-50', primary: true },
  ],
};

const roleColors: Record<UserRole, { bg: string; text: string; border: string; dot: string }> = {
  nursing_supervisor: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  care_worker: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  social_worker: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
};

export default function Workbench() {
  const { currentRole, nursingLevels, beds, residents, notifications, confirmNursingLevel } = useAppStore();
  const navigate = useNavigate();
  const entries = roleEntries[currentRole];
  const colors = roleColors[currentRole];

  const pendingLevels = nursingLevels.filter((nl) => nl.status === 'pending');
  const anomalyLevels = nursingLevels.filter((nl) => nl.status === 'anomaly');
  const returnedLevels = nursingLevels.filter((nl) => nl.status === 'returned');
  const pendingAdjBeds = beds.filter((b) => b.status === 'pending_adjustment');
  const unread = notifications.filter((n) => !n.read);

  function getResidentName(residentId: string) {
    return residents.find((r) => r.id === residentId)?.name || '未知';
  }

  type TaskItem = {
    id: string;
    type: 'anomaly' | 'return' | 'pending_level' | 'pending_bed';
    label: string;
    priority: 'high' | 'medium' | 'low';
    targetPath: string;
  };

  const taskItems: TaskItem[] = [
    ...anomalyLevels.map((nl) => ({
      id: nl.id,
      type: 'anomaly' as const,
      label: `${getResidentName(nl.residentId)} 护理等级异常`,
      priority: 'high' as const,
      targetPath: `/nursing-levels?focus=${nl.id}&status=anomaly`,
    })),
    ...returnedLevels.map((nl) => ({
      id: nl.id,
      type: 'return' as const,
      label: `${getResidentName(nl.residentId)} 等级评估已退回`,
      priority: 'high' as const,
      targetPath: `/nursing-levels?focus=${nl.id}&status=returned`,
    })),
    ...pendingAdjBeds.map((b) => ({
      id: b.id,
      type: 'pending_bed' as const,
      label: `${b.roomNumber}房${b.bedNumber}床 待调整`,
      priority: 'medium' as const,
      targetPath: `/beds?focus=${b.id}&status=pending_adjustment`,
    })),
    ...pendingLevels.map((nl) => ({
      id: nl.id,
      type: 'pending_level' as const,
      label: `${getResidentName(nl.residentId)} 护理等级待评估`,
      priority: 'low' as const,
      targetPath: `/nursing-levels?focus=${nl.id}&status=pending`,
    })),
  ];

  const quickActions = currentRole === 'nursing_supervisor' ? [
    pendingLevels.length > 0 && { label: `批量确认 (${pendingLevels.length})`, onClick: () => pendingLevels.slice(0, 3).forEach((nl) => confirmNursingLevel(nl.id)), icon: Check, color: 'bg-emerald-500' },
  ].filter(Boolean) : [];

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-slate-300',
  };

  const taskTypeLabels: Record<string, string> = {
    anomaly: '异常',
    return: '退回',
    pending_level: '待评估',
    pending_bed: '待调整',
  };

  const taskTypeBadgeColors: Record<string, string> = {
    anomaly: 'bg-red-100 text-red-700',
    return: 'bg-amber-100 text-amber-700',
    pending_level: 'bg-sky-100 text-sky-700',
    pending_bed: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="p-5 space-y-5">
      <div className={cn('p-4 rounded-lg border', colors.bg, colors.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg, colors.border, 'border')}>
              <span className={cn('w-3 h-3 rounded-full', colors.dot)} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {ROLE_LABELS[currentRole]}工作台
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {unread.length > 0 ? `${unread.length} 条未读通知` : '暂无未读通知'}
              </p>
            </div>
          </div>
          {quickActions.length > 0 && (
            <div className="flex items-center gap-2">
              {quickActions.map((action, i) => action && (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-md transition-colors', action.color, 'hover:opacity-90')}
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {entries.map((entry) => (
          <button
            key={entry.label}
            onClick={() => navigate(entry.path)}
            className={cn(
              'flex flex-col items-start gap-2 p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all text-left group'
            )}
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', entry.color)}>
              <entry.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">{entry.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{entry.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <button onClick={() => navigate('/nursing-levels?status=pending')} className="text-left">
          <StatCard label="待评估" value={pendingLevels.length} color="text-sky-600" bg="bg-sky-50" />
        </button>
        <button onClick={() => {
          const first = anomalyLevels[0];
          navigate(first ? `/nursing-levels?focus=${first.id}&status=anomaly` : '/nursing-levels?status=anomaly');
        }} className="text-left">
          <StatCard label="异常标记" value={anomalyLevels.length} color="text-red-600" bg="bg-red-50" />
        </button>
        <button onClick={() => {
          const first = returnedLevels[0];
          navigate(first ? `/nursing-levels?focus=${first.id}&status=returned` : '/nursing-levels?status=returned');
        }} className="text-left">
          <StatCard label="已退回" value={returnedLevels.length} color="text-amber-600" bg="bg-amber-50" />
        </button>
        <button onClick={() => {
          const first = pendingAdjBeds[0];
          navigate(first ? `/beds?focus=${first.id}&status=pending_adjustment` : '/beds?status=pending_adjustment');
        }} className="text-left">
          <StatCard label="待调整床位" value={pendingAdjBeds.length} color="text-slate-600" bg="bg-slate-100" />
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">待处理事项</h3>
          <span className="text-[10px] text-slate-400">{taskItems.length} 项</span>
        </div>
        {taskItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">暂无待处理事项</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {taskItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.targetPath)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left',
                  item.priority === 'high' && 'bg-red-50/30'
                )}
              >
                <span className={cn('w-1.5 h-5 rounded-full shrink-0', priorityColors[item.priority])} />
                <span className={cn('text-xs', item.priority === 'high' ? 'font-semibold text-slate-800' : 'text-slate-600')}>
                  {item.label}
                </span>
                <span className={cn(
                  'ml-auto text-[10px] px-1.5 py-0.5 rounded',
                  taskTypeBadgeColors[item.type]
                )}>
                  {taskTypeLabels[item.type]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={cn('rounded-lg border border-slate-200 p-3', bg)}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
    </div>
  );
}
