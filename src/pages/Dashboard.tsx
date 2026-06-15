import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Wrench,
  ShieldAlert,
  CircleDollarSign,
  FileText,
  UserX,
  Clock,
  Ban,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import StatusBadge, { getResponsibilityWarnings } from '@/components/StatusBadge';
import type { Order, UserRole } from '@shared/types';
import { ROLE_LABEL } from '@shared/types';

interface DashboardData {
  pendingCount: number;
  exceptionCount: number;
  completedCount: number;
  pendingList: Order[];
  exceptionList: Order[];
  completedList: Order[];
}



interface StatCardProps {
  label: string;
  value: number;
  icon: typeof ClipboardList;
  color: string;
  to: string;
  badge?: string;
  urgent?: boolean;
}

function StatCard({ label, value, icon: Icon, color, to, badge, urgent }: StatCardProps) {
  return (
    <Link
      to={to}
      className="card p-5 border-l-4 flex items-start gap-4 transition-all hover:-translate-y-0.5 group relative overflow-hidden"
      style={{ borderLeftColor: color }}
    >
      {urgent && (
        <span className="absolute top-0 right-0 w-10 h-10 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-600" />
      )}
      <div
        className="w-11 h-11 flex items-center justify-center shrink-0"
        style={{ backgroundColor: color, color: 'white' }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-mono text-[11px] uppercase tracking-wider text-carbon-500">
            {label}
          </div>
          {badge && (
            <span className="px-1.5 py-0.5 bg-red-100 border border-red-300 text-red-700 font-mono text-[9px] uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <div className="font-display text-4xl tracking-wider text-carbon-800 leading-none mt-1">
          {value}
        </div>
        <div className="flex items-center gap-1 mt-2 font-mono text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
          进入处理 <ChevronRight size={12} strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

function OrderRow({ order, to }: { order: Order; to: string }) {
  const warnings = useMemo(() => getResponsibilityWarnings(order), [order]);
  return (
    <Link
      to={to}
      className="block p-3.5 border-b border-carbon-100 hover:bg-carbon-50 transition-colors last:border-b-0 group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StatusBadge status={order.status} warnings={warnings} />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-carbon-800">
              {order.orderNo}
            </span>
            <span className="font-mono text-xs text-carbon-500">
              {order.vehiclePlate} · {order.customerName}
            </span>
          </div>
          <div className="font-mono text-[11px] text-carbon-400 truncate mt-0.5">
            {order.vehicleModel}
          </div>
        </div>
        <ChevronRight
          size={16}
          strokeWidth={2}
          className="shrink-0 text-carbon-300 group-hover:text-ochre-700 group-hover:translate-x-1 transition-all mt-4"
        />
      </div>
    </Link>
  );
}

interface SectionCardProps {
  title: string;
  icon: typeof ClipboardList;
  color: string;
  actionLabel?: string;
  actionTo?: string;
  children: React.ReactNode;
  emptyText: string;
  subtitle?: string;
}

function SectionCard({ title, icon: Icon, color, actionLabel, actionTo, children, emptyText, subtitle }: SectionCardProps) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-carbon-200 bg-carbon-50">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center shrink-0"
            style={{ backgroundColor: color, color: 'white' }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg tracking-wider text-carbon-800 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-carbon-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="font-mono text-[11px] uppercase tracking-wider text-ochre-700 hover:text-ochre-800 flex items-center gap-1 shrink-0"
          >
            {actionLabel} <ChevronRight size={13} strokeWidth={2} />
          </Link>
        )}
      </div>
      {hasChildren ? (
        <div className="divide-y divide-carbon-50">{children}</div>
      ) : (
        <div className="p-8 text-center font-mono text-xs text-carbon-400 uppercase tracking-wider">
          {emptyText}
        </div>
      )}
    </div>
  );
}

const roleDefaultSectionPriority: Record<UserRole, { title: string; subtitle: string; icon: typeof ClipboardList; color: string; to: string; filter: (o: Order) => boolean }[]> = {
  RECEPTION: [
    {
      title: '待报价工单',
      subtitle: '店长审核中',
      icon: CircleDollarSign,
      color: '#2563eb',
      to: '/orders?status=PENDING_QUOTE',
      filter: (o) => o.status === 'PENDING_QUOTE',
    },
    {
      title: '已确认报价',
      subtitle: '可联系客户取车',
      icon: CheckCircle2,
      color: '#15803d',
      to: '/orders?status=QUOTE_CONFIRMED',
      filter: (o) => o.status === 'QUOTE_CONFIRMED',
    },
    {
      title: '全量工单台账',
      subtitle: '所有状态工单',
      icon: ClipboardList,
      color: '#B8860B',
      to: '/orders',
      filter: (_o) => true,
    },
  ],
  TECHNICIAN: [
    {
      title: '待选型工单',
      subtitle: '等待技师领取处理',
      icon: Wrench,
      color: '#8B2500',
      to: '/orders?status=PENDING_SELECTION',
      filter: (o) => o.status === 'PENDING_SELECTION',
    },
    {
      title: '我正在处理的',
      subtitle: '选型中 · 需尽快提交',
      icon: Clock,
      color: '#c2410c',
      to: '/orders?status=IN_SELECTION',
      filter: (o) => o.status === 'IN_SELECTION',
    },
    {
      title: '报价驳回需重选',
      subtitle: '被店长驳回的工单',
      icon: Ban,
      color: '#dc2626',
      to: '/orders?status=QUOTE_REJECTED',
      filter: (o) => o.status === 'QUOTE_REJECTED',
    },
  ],
  MANAGER: [
    {
      title: '待审核报价',
      subtitle: '店长商务责任确认',
      icon: ShieldAlert,
      color: '#2C2C2C',
      to: '/orders?status=PENDING_QUOTE',
      filter: (o) => o.status === 'PENDING_QUOTE',
    },
    {
      title: '报价已驳回',
      subtitle: '等待技师重新选型',
      icon: Ban,
      color: '#dc2626',
      to: '/orders?status=QUOTE_REJECTED',
      filter: (o) => o.status === 'QUOTE_REJECTED',
    },
    {
      title: '已确认台账',
      subtitle: '已完成的报价确认',
      icon: FileText,
      color: '#15803d',
      to: '/orders?status=QUOTE_CONFIRMED',
      filter: (o) => o.status === 'QUOTE_CONFIRMED',
    },
  ],
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      setLoading(true);
      const res = await api.getDashboard();
      if (res.code === 0 && res.data) {
        setData(res.data as unknown as DashboardData);
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const roleActions = (() => {
    if (!user) return { primary: null, secondary: null };
    if (user.role === 'TECHNICIAN') {
      return {
        primary: { label: '领取待选型工单', icon: Wrench, color: '#8B2500', to: '/orders?status=PENDING_SELECTION' },
        secondary: { label: '处理驳回重选', icon: Ban, color: '#dc2626', to: '/orders?status=QUOTE_REJECTED' },
      };
    }
    if (user.role === 'MANAGER') {
      return {
        primary: { label: '审核待报价工单', icon: ShieldAlert, color: '#2C2C2C', to: '/orders?status=PENDING_QUOTE' },
        secondary: { label: '已确认报价台账', icon: FileText, color: '#B8860B', to: '/orders?status=QUOTE_CONFIRMED' },
      };
    }
    return {
      primary: { label: '工单管理', icon: ClipboardList, color: '#B8860B', to: '/orders?status=ALL' },
      secondary: { label: '查看报价确认', icon: CircleDollarSign, color: '#8B2500', to: '/orders?status=QUOTE_CONFIRMED' },
    };
  })();

  const allOrders = useMemo<Order[]>(() => {
    if (!data) return [];
    const ids = new Set<string>();
    const merged: Order[] = [];
    for (const o of [...data.pendingList, ...data.exceptionList, ...data.completedList]) {
      if (!ids.has(o.id)) { ids.add(o.id); merged.push(o); }
    }
    return merged;
  }, [data]);

  const responsibilityUnclosed = useMemo(() => {
    return allOrders.filter((o) => {
      const warnings = getResponsibilityWarnings(o);
      return warnings.length > 0;
    });
  }, [allOrders]);

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING_SELECTION: 0, IN_SELECTION: 0, PENDING_QUOTE: 0, QUOTE_REJECTED: 0, QUOTE_CONFIRMED: 0,
    };
    for (const o of allOrders) counts[o.status] = (counts[o.status] || 0) + 1;
    return counts;
  }, [allOrders]);

  const rolePriorityConfigs = user ? roleDefaultSectionPriority[user.role] : [];

  const statCards = user ? [
    {
      key: 'primary',
      label: user.role === 'TECHNICIAN' ? '待选型工单' : user.role === 'MANAGER' ? '待审核报价' : '待办工单',
      value: user.role === 'TECHNICIAN' ? countByStatus.PENDING_SELECTION : user.role === 'MANAGER' ? countByStatus.PENDING_QUOTE : data?.pendingCount ?? 0,
      icon: user.role === 'TECHNICIAN' ? Wrench : user.role === 'MANAGER' ? ShieldAlert : ClipboardList,
      color: user.role === 'TECHNICIAN' ? '#8B2500' : user.role === 'MANAGER' ? '#2C2C2C' : '#B8860B',
      to: user.role === 'TECHNICIAN' ? '/orders?status=PENDING_SELECTION' : user.role === 'MANAGER' ? '/orders?status=PENDING_QUOTE' : '/orders?status=ALL',
      urgent: (user.role === 'TECHNICIAN' && countByStatus.PENDING_SELECTION > 0) || (user.role === 'MANAGER' && countByStatus.PENDING_QUOTE > 0),
    },
    {
      key: 'unclosed',
      label: '责任未闭环',
      value: responsibilityUnclosed.length,
      icon: UserX,
      color: '#dc2626',
      to: '/orders?responsibility=unclosed',
      badge: '风险',
      urgent: responsibilityUnclosed.length > 0,
    },
    {
      key: 'completed',
      label: '已完成确认',
      value: countByStatus.QUOTE_CONFIRMED,
      icon: CheckCircle2,
      color: '#15803d',
      to: '/orders?status=QUOTE_CONFIRMED',
    },
  ] : [];

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="font-mono text-sm text-carbon-500 uppercase tracking-wider animate-pulse">
          加载工作台数据...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-carbon-400 mb-2">
            WORKSTATION · {user ? ROLE_LABEL[user.role] : ''}
          </p>
          <h1 className="font-display text-5xl tracking-wider text-carbon-800 leading-none">
            工作台
          </h1>
          <p className="font-mono text-sm text-carbon-500 mt-3">
            今日 {new Date().toLocaleDateString('zh-CN')} · {user?.name}，请处理下方待办事项
          </p>
        </div>
        <div className="flex gap-3">
          {roleActions.secondary && (
            <Link to={roleActions.secondary.to} className="btn-secondary">
              <roleActions.secondary.icon size={16} strokeWidth={2} className="mr-2" />
              {roleActions.secondary.label}
            </Link>
          )}
          {roleActions.primary && (
            <Link
              to={roleActions.primary.to}
              className="text-white inline-flex items-center justify-center px-5 py-2.5 border-2 font-mono text-sm uppercase tracking-wider transition-all duration-150 active:shadow-press active:translate-y-px"
              style={{ backgroundColor: roleActions.primary.color, borderColor: roleActions.primary.color }}
            >
              <roleActions.primary.icon size={16} strokeWidth={2} className="mr-2" />
              {roleActions.primary.label}
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            icon={s.icon}
            color={s.color}
            to={s.to}
            badge={s.badge}
            urgent={s.urgent}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {rolePriorityConfigs.map((cfg) => (
          <SectionCard
            key={cfg.title}
            title={cfg.title}
            icon={cfg.icon}
            color={cfg.color}
            subtitle={cfg.subtitle}
            actionLabel="查看全部"
            actionTo={cfg.to}
            emptyText="暂无工单"
          >
            {allOrders
              .filter(cfg.filter)
              .slice(0, 4)
              .map((o) => (
                <OrderRow key={o.id} order={o} to={`/orders/${o.id}`} />
              ))}
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="责任未闭环工单"
        icon={AlertTriangle}
        color="#dc2626"
        subtitle="存在责任分配不清、超时未处理的工单"
        actionLabel="全部处理"
        actionTo="/orders?responsibility=unclosed"
        emptyText="所有工单责任均已闭环"
      >
        {responsibilityUnclosed.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-carbon-400 uppercase tracking-wider">
          </div>
        ) : (
          responsibilityUnclosed
            .slice(0, 6)
            .map((o) => (
              <OrderRow key={o.id} order={o} to={`/orders/${o.id}`} />
            ))
        )}
      </SectionCard>
    </div>
  );
}
