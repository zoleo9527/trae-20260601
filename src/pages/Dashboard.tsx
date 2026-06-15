import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import StatusBadge from '@/components/StatusBadge';
import type { Order } from '@shared/types';
import { ROLE_LABEL } from '@shared/types';

interface DashboardData {
  pendingCount: number;
  exceptionCount: number;
  completedCount: number;
  pendingList: Order[];
  exceptionList: Order[];
  completedList: Order[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  to,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
  color: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="card p-6 border-l-4 flex items-start gap-5 transition-all hover:-translate-y-0.5 group"
      style={{ borderLeftColor: color }}
    >
      <div
        className="w-12 h-12 flex items-center justify-center shrink-0"
        style={{ backgroundColor: color, color: 'white' }}
      >
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="flex-1">
        <div className="font-mono text-xs uppercase tracking-wider text-carbon-500 mb-1">
          {label}
        </div>
        <div className="font-display text-5xl tracking-wider text-carbon-800 leading-none">
          {value}
        </div>
        <div className="flex items-center gap-1 mt-2 font-mono text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
          查看全部 <ChevronRight size={14} strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

function OrderRow({ order, to }: { order: Order; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-3 border-b border-carbon-100 hover:bg-carbon-50 transition-colors last:border-b-0 group"
    >
      <StatusBadge status={order.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-carbon-800">
            {order.orderNo}
          </span>
          <span className="font-mono text-xs text-carbon-500">
            {order.vehiclePlate} · {order.customerName}
          </span>
        </div>
        <div className="font-mono text-xs text-carbon-400 truncate mt-0.5">
          {order.vehicleModel}
        </div>
      </div>
      {order.isException && (
        <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-red-50 border-2 border-red-200 font-mono text-[10px] uppercase tracking-wider text-red-700">
          <AlertTriangle size={12} strokeWidth={2} />
          异常
        </span>
      )}
      <ChevronRight
        size={16}
        strokeWidth={2}
        className="shrink-0 text-carbon-300 group-hover:text-ochre-700 group-hover:translate-x-1 transition-all"
      />
    </Link>
  );
}

function SectionCard({
  title,
  icon: Icon,
  color,
  actionLabel,
  actionTo,
  children,
  emptyText,
}: {
  title: string;
  icon: typeof ClipboardList;
  color: string;
  actionLabel?: string;
  actionTo?: string;
  children: React.ReactNode;
  emptyText: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-carbon-200 bg-carbon-50">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{ backgroundColor: color, color: 'white' }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
          <h3 className="font-display text-xl tracking-wider text-carbon-800">
            {title}
          </h3>
        </div>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="font-mono text-xs uppercase tracking-wider text-ochre-700 hover:text-ochre-800 flex items-center gap-1"
          >
            {actionLabel} <ChevronRight size={14} strokeWidth={2} />
          </Link>
        )}
      </div>
      {hasChildren ? (
        <div className="divide-y divide-carbon-50">{children}</div>
      ) : (
        <div className="p-8 text-center font-mono text-sm text-carbon-400">
          {emptyText}
        </div>
      )}
    </div>
  );
}

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
        secondary: { label: '处理驳回重选', icon: AlertTriangle, color: '#dc2626', to: '/orders?status=QUOTE_REJECTED' },
      };
    }
    if (user.role === 'MANAGER') {
      return {
        primary: { label: '审核待报价工单', icon: ShieldAlert, color: '#2C2C2C', to: '/orders?status=PENDING_QUOTE' },
        secondary: { label: '已确认报价台账', icon: FileText, color: '#B8860B', to: '/orders?status=QUOTE_CONFIRMED' },
      };
    }
    return {
      primary: { label: '工单管理', icon: ClipboardList, color: '#B8860B', to: '/orders' },
      secondary: { label: '查看报价确认', icon: CircleDollarSign, color: '#8B2500', to: '/orders?status=QUOTE_CONFIRMED' },
    };
  })();

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
      <header className="flex items-start justify-between">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="待办工单"
          value={data.pendingCount}
          icon={ClipboardList}
          color="#8B2500"
          to={
            user?.role === 'TECHNICIAN'
              ? '/orders?status=PENDING_SELECTION'
              : user?.role === 'MANAGER'
              ? '/orders?status=PENDING_QUOTE'
              : '/orders'
          }
        />
        <StatCard
          label="异常告警"
          value={data.exceptionCount}
          icon={AlertTriangle}
          color="#dc2626"
          to={
            user?.role === 'TECHNICIAN'
              ? '/orders?status=QUOTE_REJECTED'
              : '/orders'
          }
        />
        <StatCard
          label="已完成"
          value={data.completedCount}
          icon={CheckCircle2}
          color="#15803d"
          to="/orders?status=QUOTE_CONFIRMED"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SectionCard
            title="待办事项"
            icon={ClipboardList}
            color="#8B2500"
            actionLabel="全部"
            actionTo="/orders"
            emptyText="暂无待办工单"
          >
            {data.pendingList.map((o) => (
              <OrderRow key={o.id} order={o} to={`/orders/${o.id}`} />
            ))}
          </SectionCard>
        </div>

        <div className="lg:col-span-1">
          <SectionCard
            title="异常告警"
            icon={AlertTriangle}
            color="#dc2626"
            actionLabel="全部"
            actionTo="/orders"
            emptyText="暂无异常工单"
          >
            {data.exceptionList.map((o) => (
              <OrderRow key={o.id} order={o} to={`/orders/${o.id}`} />
            ))}
          </SectionCard>
        </div>

        <div className="lg:col-span-1">
          <SectionCard
            title="已完成"
            icon={CheckCircle2}
            color="#15803d"
            actionLabel="全部"
            actionTo="/orders"
            emptyText="暂无已完成工单"
          >
            {data.completedList.map((o) => (
              <OrderRow key={o.id} order={o} to={`/orders/${o.id}`} />
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
