import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Wrench, ShieldAlert, ChevronRight, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import StatusBadge from '@/components/StatusBadge';
import type { Order, UserRole } from '@shared/types';
import { STATUS_LABEL } from '@shared/types';

const FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: '全部' },
  { value: 'PENDING_SELECTION', label: '待选型' },
  { value: 'IN_SELECTION', label: '选型中' },
  { value: 'PENDING_QUOTE', label: '待报价' },
  { value: 'QUOTE_REJECTED', label: '报价驳回' },
  { value: 'QUOTE_CONFIRMED', label: '已确认' },
];

const roleQuickActions: Record<UserRole, Array<{ filter: string; label: string; color: string; icon: typeof Wrench }>> = {
  RECEPTION: [
    { filter: '', label: '查看全部工单', color: '#B8860B', icon: Filter },
  ],
  TECHNICIAN: [
    { filter: 'PENDING_SELECTION', label: '领取待选型工单', color: '#8B2500', icon: Wrench },
    { filter: 'QUOTE_REJECTED', label: '处理驳回重选', color: '#dc2626', icon: Eye },
  ],
  MANAGER: [
    { filter: 'PENDING_QUOTE', label: '审核待报价工单', color: '#2C2C2C', icon: ShieldAlert },
  ],
};

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const initialStatus = searchParams.get('status') || '';
  const [filter, setFilter] = useState(initialStatus);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      setLoading(true);
      const res = await api.listOrders(filter || undefined);
      if (res.code === 0 && res.data) {
        setOrders(res.data as unknown as Order[]);
      }
      setLoading(false);
    })();
  }, [user, navigate, filter]);

  const filtered = orders.filter(
    (o) =>
      !keyword ||
      o.orderNo.toLowerCase().includes(keyword.toLowerCase()) ||
      o.customerName.includes(keyword) ||
      o.vehiclePlate.toLowerCase().includes(keyword.toLowerCase()),
  );

  const quickActions = user ? roleQuickActions[user.role] : [];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-carbon-400 mb-2">
            ORDER MANAGEMENT
          </p>
          <h1 className="font-display text-5xl tracking-wider text-carbon-800 leading-none">
            工单列表
          </h1>
          {filter && (
            <p className="font-mono text-sm text-ochre-700 mt-3">
              当前筛选：<span className="font-semibold">{STATUS_LABEL[filter as keyof typeof STATUS_LABEL] || '全部'}</span>
            </p>
          )}
        </div>
      </header>

      {quickActions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            const targetList = orders.filter((o) => !action.filter || o.status === action.filter);
            return (
              <button
                key={action.filter}
                onClick={() => setFilter(action.filter)}
                className={`card p-5 text-left flex items-center gap-4 transition-all hover:-translate-y-0.5 group ${
                  filter === action.filter ? 'ring-2 ring-ochre-700' : ''
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: action.color }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-semibold text-carbon-800 uppercase tracking-wider">
                    {action.label}
                  </div>
                  <div className="font-mono text-xs text-carbon-500 mt-1">
                    共 <span className="font-bold text-ochre-800 text-base">{targetList.length}</span> 条工单待处理
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  className="text-carbon-400 group-hover:text-ochre-700 group-hover:translate-x-1 transition-all shrink-0"
                />
              </button>
            );
          })}
        </div>
      )}

      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索工单号、客户、车牌..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} strokeWidth={2} className="text-carbon-500" />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border-2 transition-colors ${
                  filter === f.value
                    ? 'bg-ochre-800 border-ochre-800 text-white'
                    : 'bg-white border-carbon-300 text-carbon-600 hover:border-carbon-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center font-mono text-sm text-carbon-400 uppercase tracking-wider animate-pulse">
            加载中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center font-mono text-sm text-carbon-400 uppercase tracking-wider">
            暂无匹配工单
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">工单号</th>
                <th className="table-header">客户/车牌</th>
                <th className="table-header">车型</th>
                <th className="table-header">状态</th>
                <th className="table-header">选型责任</th>
                <th className="table-header">报价责任</th>
                <th className="table-header">创建时间</th>
                <th className="table-header text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, idx) => (
                <tr
                  key={o.id}
                  className={`hover:bg-carbon-50 transition-colors animate-slide-up ${
                    idx % 2 === 1 ? 'bg-carbon-50/50' : ''
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="table-cell font-semibold">
                    <div className="flex items-center gap-2">
                      {o.orderNo}
                      {o.isException && (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse-slow" title={o.exceptionReason} />
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="font-semibold">{o.customerName}</div>
                    <div className="text-xs text-carbon-400">{o.vehiclePlate}</div>
                  </td>
                  <td className="table-cell text-xs">{o.vehicleModel}</td>
                  <td className="table-cell">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="table-cell">
                    {o.selectionResponsibleName ? (
                      <span className="text-xs px-2 py-0.5 bg-ochre-50 border border-ochre-200 text-ochre-800">
                        {o.selectionResponsibleName}
                      </span>
                    ) : (
                      <span className="text-xs text-carbon-400">— 未分配 —</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {o.quoteResponsibleName ? (
                      <span className="text-xs px-2 py-0.5 bg-carbon-100 border border-carbon-300 text-carbon-800">
                        {o.quoteResponsibleName}
                      </span>
                    ) : (
                      <span className="text-xs text-carbon-400">— 未处理 —</span>
                    )}
                  </td>
                  <td className="table-cell text-xs">
                    {new Date(o.createdAt).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-carbon-300 text-carbon-700 hover:border-ochre-700 hover:text-ochre-800 font-mono text-xs uppercase tracking-wider transition-colors"
                      >
                        <Eye size={14} strokeWidth={2} />
                        详情
                      </Link>
                      {user?.role === 'TECHNICIAN' &&
                        (o.status === 'PENDING_SELECTION' || o.status === 'QUOTE_REJECTED') && (
                          <Link
                            to={`/orders/${o.id}/selection`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-ochre-800 bg-ochre-800 text-white hover:bg-ochre-700 font-mono text-xs uppercase tracking-wider transition-colors"
                          >
                            <Wrench size={14} strokeWidth={2} />
                            {o.status === 'QUOTE_REJECTED' ? '重选型' : '去选型'}
                          </Link>
                        )}
                      {user?.role === 'TECHNICIAN' && o.status === 'IN_SELECTION' && (
                        <Link
                          to={`/orders/${o.id}/selection`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-ochre-800 bg-ochre-800 text-white hover:bg-ochre-700 font-mono text-xs uppercase tracking-wider transition-colors"
                        >
                          <Wrench size={14} strokeWidth={2} />
                          继续选型
                        </Link>
                      )}
                      {user?.role === 'MANAGER' && o.status === 'PENDING_QUOTE' && (
                        <Link
                          to={`/orders/${o.id}/quote`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-carbon-800 bg-carbon-800 text-white hover:bg-carbon-700 font-mono text-xs uppercase tracking-wider transition-colors"
                        >
                          <ShieldAlert size={14} strokeWidth={2} />
                          审核报价
                        </Link>
                      )}
                      {(o.status === 'PENDING_QUOTE' || o.status === 'QUOTE_CONFIRMED' || o.status === 'QUOTE_REJECTED') && (
                        <Link
                          to={`/orders/${o.id}/quote`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-brass-600 text-brass-700 hover:bg-brass-50 font-mono text-xs uppercase tracking-wider transition-colors"
                        >
                          <ChevronRight size={14} strokeWidth={2} />
                          报价回看
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
