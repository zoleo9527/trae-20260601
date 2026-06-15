import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Wrench, ShieldAlert, ChevronRight, ArrowRight, UserX, AlertTriangle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import StatusBadge, { getResponsibilityWarnings } from '@/components/StatusBadge';
import type { Order, OrderStatus } from '@shared/types';
import { STATUS_LABEL, ROLE_DEFAULT_ENTRY } from '@shared/types';

type StatusFilter = 'ALL' | OrderStatus;

interface QuickFilter {
  key: StatusFilter | 'UNCLOSED';
  label: string;
  sublabel?: string;
  color: string;
  icon: typeof Wrench;
  match: (o: Order) => boolean;
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: '全部' },
  { value: 'PENDING_SELECTION', label: '待选型' },
  { value: 'IN_SELECTION', label: '选型中' },
  { value: 'PENDING_QUOTE', label: '待报价' },
  { value: 'QUOTE_REJECTED', label: '报价驳回' },
  { value: 'QUOTE_CONFIRMED', label: '已确认' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const statusParam = searchParams.get('status') || '';
  const respParam = searchParams.get('responsibility') || '';
  const keywordParam = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(keywordParam);

  const hasExplicitFilter = statusParam !== '' || respParam !== '';

  const activeFilter: StatusFilter | 'UNCLOSED' = useMemo(() => {
    if (respParam === 'unclosed') return 'UNCLOSED';
    if (statusParam) return statusParam as StatusFilter;
    if (user) return ROLE_DEFAULT_ENTRY[user.role].statusFilter as StatusFilter;
    return 'ALL';
  }, [statusParam, respParam, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!hasExplicitFilter) {
      const defaultStatus = ROLE_DEFAULT_ENTRY[user.role].statusFilter;
      const params: Record<string, string> = {};
      if (defaultStatus !== 'ALL') params.status = defaultStatus as string;
      setSearchParams(params, { replace: true });
    }
  }, [user, navigate, hasExplicitFilter, setSearchParams]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      setLoading(true);
      const res = await api.listOrders(undefined);
      if (res.code === 0 && res.data) {
        setOrders(res.data as unknown as Order[]);
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (keyword !== keywordParam) {
        const params = new URLSearchParams(searchParams);
        if (keyword) {
          params.set('q', keyword);
        } else {
          params.delete('q');
        }
        setSearchParams(params, { replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [keyword, keywordParam, searchParams, setSearchParams]);

  const quickFilters: QuickFilter[] = useMemo(() => {
    const base: QuickFilter[] = [
      { key: 'ALL', label: '全部工单', sublabel: '所有状态总览', color: '#8B7355', icon: Filter, match: () => true },
      { key: 'PENDING_SELECTION', label: '待选型', sublabel: '等待技师领取', color: '#8B2500', icon: Wrench, match: (o) => o.status === 'PENDING_SELECTION' },
      { key: 'IN_SELECTION', label: '选型中', sublabel: '技师正在处理', color: '#c2410c', icon: Clock, match: (o) => o.status === 'IN_SELECTION' },
      { key: 'PENDING_QUOTE', label: '待报价', sublabel: '店长待审核', color: '#2C2C2C', icon: ShieldAlert, match: (o) => o.status === 'PENDING_QUOTE' },
      { key: 'QUOTE_REJECTED', label: '报价驳回', sublabel: '需重新选型', color: '#dc2626', icon: AlertTriangle, match: (o) => o.status === 'QUOTE_REJECTED' },
      { key: 'QUOTE_CONFIRMED', label: '已确认', sublabel: '闭环台账', color: '#15803d', icon: Eye, match: (o) => o.status === 'QUOTE_CONFIRMED' },
      { key: 'UNCLOSED', label: '责任未闭环', sublabel: '风险预警工单', color: '#991b1b', icon: UserX, match: (o) => getResponsibilityWarnings(o).length > 0 },
    ];
    return base;
  }, []);

  const setFilterToUrl = (key: StatusFilter | 'UNCLOSED') => {
    const params = new URLSearchParams();
    if (key === 'UNCLOSED') {
      params.set('responsibility', 'unclosed');
    } else if (key !== 'ALL') {
      params.set('status', key as string);
    }
    if (keywordParam) params.set('q', keywordParam);
    setSearchParams(params, { replace: true });
  };

  const filtered = useMemo(() => {
    const byFilter = orders.filter((o) => {
      const f = quickFilters.find((q) => q.key === activeFilter);
      return f ? f.match(o) : true;
    });
    if (!keywordParam) return byFilter;
    const kw = keywordParam.toLowerCase();
    return byFilter.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(kw) ||
        o.customerName.includes(keywordParam) ||
        o.vehiclePlate.toLowerCase().includes(kw),
    );
  }, [orders, activeFilter, keywordParam, quickFilters]);

  const quickFiltersWithCount = useMemo(() => {
    return quickFilters.map((q) => ({ ...q, count: orders.filter(q.match).length }));
  }, [orders, quickFilters]);

  const currentFilterLabel = useMemo(() => {
    if (activeFilter === 'ALL') return '全部工单';
    if (activeFilter === 'UNCLOSED') return '责任未闭环';
    return STATUS_LABEL[activeFilter as keyof typeof STATUS_LABEL] || '全部';
  }, [activeFilter]);

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
          <p className="font-mono text-sm text-ochre-700 mt-3">
            当前筛选：<span className="font-semibold">{currentFilterLabel}</span>
            <span className="text-carbon-500 ml-2">· 共 {filtered.length} 条结果</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {quickFiltersWithCount.map((q, idx) => {
          const Icon = q.icon;
          const active = activeFilter === q.key;
          return (
            <button
              key={q.key}
              onClick={() => setFilterToUrl(q.key)}
              className={`card p-4 text-left flex items-start gap-3 transition-all hover:-translate-y-0.5 group ${
                active ? 'ring-2 ring-ochre-700 border-ochre-700' : ''
              }`}
              style={{
                animationDelay: `${idx * 40}ms`,
                borderTopColor: q.color,
                borderTopWidth: '4px',
              }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: q.color }}
              >
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[13px] font-semibold text-carbon-800 uppercase tracking-wider leading-tight">
                  {q.label}
                </div>
                {q.sublabel && (
                  <div className="font-mono text-[10px] text-carbon-500 mt-0.5">{q.sublabel}</div>
                )}
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span
                    className={`font-display text-2xl tracking-wider ${
                      active ? 'text-ochre-700' : 'text-carbon-700'
                    }`}
                  >
                    {q.count}
                  </span>
                  <ArrowRight
                    size={14}
                    strokeWidth={2}
                    className="ml-auto text-carbon-400 group-hover:text-ochre-700 group-hover:translate-x-1 transition-all shrink-0"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

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
            {STATUS_FILTERS.map((f) => {
              const btnFilter: StatusFilter = (f.value || 'ALL') as StatusFilter;
              const active = activeFilter === btnFilter;
              return (
                <button
                  key={f.value || 'all'}
                  onClick={() => setFilterToUrl(btnFilter)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border-2 transition-colors ${
                    active
                      ? 'bg-ochre-800 border-ochre-800 text-white'
                      : 'bg-white border-carbon-300 text-carbon-600 hover:border-carbon-500'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
            <button
              onClick={() => setFilterToUrl('UNCLOSED')}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border-2 transition-colors ${
                activeFilter === 'UNCLOSED'
                  ? 'bg-red-700 border-red-700 text-white'
                  : 'bg-white border-red-300 text-red-700 hover:border-red-500'
              }`}
            >
              责任未闭环
            </button>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr>
                  <th className="table-header w-44">状态 / 预警</th>
                  <th className="table-header">工单号</th>
                  <th className="table-header">客户 / 车牌</th>
                  <th className="table-header">车型</th>
                  <th className="table-header">选型责任</th>
                  <th className="table-header">报价责任</th>
                  <th className="table-header">更新时间</th>
                  <th className="table-header text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  const warnings = getResponsibilityWarnings(o);
                  const hasUnclosed = warnings.length > 0;
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-carbon-50 transition-colors animate-slide-up ${
                        idx % 2 === 1 ? 'bg-carbon-50/50' : ''
                      } ${hasUnclosed ? 'bg-red-50/20' : ''}`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td className="table-cell py-3">
                        <StatusBadge status={o.status} warnings={warnings} />
                      </td>
                      <td className="table-cell font-semibold">
                        <div className="flex items-center gap-2">
                          {o.orderNo}
                          {hasUnclosed && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 border border-red-300 text-red-700 font-mono text-[9px] uppercase tracking-wider shrink-0"
                              title={warnings.map((w) => w.label).join('，')}
                            >
                              <AlertTriangle size={10} strokeWidth={2} />
                              {warnings.length}项风险
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold">{o.customerName}</div>
                        <div className="text-xs text-carbon-400">{o.vehiclePlate}</div>
                      </td>
                      <td className="table-cell text-xs">{o.vehicleModel}</td>
                      <td className="table-cell">
                        {o.selectionResponsibleName ? (
                          <span className="text-xs px-2 py-0.5 bg-ochre-50 border border-ochre-200 text-ochre-800">
                            {o.selectionResponsibleName}
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 inline-flex items-center gap-1">
                            <UserX size={11} strokeWidth={2} />
                            未分配
                          </span>
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
                        {new Date(o.updatedAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          <Link
                            to={`/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border-2 border-carbon-300 text-carbon-700 hover:border-ochre-700 hover:text-ochre-800 font-mono text-[11px] uppercase tracking-wider transition-colors"
                          >
                            <Eye size={13} strokeWidth={2} />
                            详情
                          </Link>
                          {user?.role === 'TECHNICIAN' &&
                            (o.status === 'PENDING_SELECTION' || o.status === 'QUOTE_REJECTED') && (
                              <Link
                                to={`/orders/${o.id}/selection`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border-2 border-ochre-800 bg-ochre-800 text-white hover:bg-ochre-700 font-mono text-[11px] uppercase tracking-wider transition-colors"
                              >
                                <Wrench size={13} strokeWidth={2} />
                                {o.status === 'QUOTE_REJECTED' ? '重选型' : '去选型'}
                              </Link>
                            )}
                          {user?.role === 'TECHNICIAN' && o.status === 'IN_SELECTION' && (
                            <Link
                              to={`/orders/${o.id}/selection`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border-2 border-ochre-800 bg-ochre-800 text-white hover:bg-ochre-700 font-mono text-[11px] uppercase tracking-wider transition-colors"
                            >
                              <Wrench size={13} strokeWidth={2} />
                              继续选型
                            </Link>
                          )}
                          {user?.role === 'MANAGER' && o.status === 'PENDING_QUOTE' && (
                            <Link
                              to={`/orders/${o.id}/quote`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border-2 border-carbon-800 bg-carbon-800 text-white hover:bg-carbon-700 font-mono text-[11px] uppercase tracking-wider transition-colors"
                            >
                              <ShieldAlert size={13} strokeWidth={2} />
                              审核报价
                            </Link>
                          )}
                          {(o.status === 'PENDING_QUOTE' || o.status === 'QUOTE_CONFIRMED' || o.status === 'QUOTE_REJECTED') && (
                            <Link
                              to={`/orders/${o.id}/quote`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border-2 border-brass-600 text-brass-700 hover:bg-brass-50 font-mono text-[11px] uppercase tracking-wider transition-colors"
                            >
                              <ChevronRight size={13} strokeWidth={2} />
                              报价回看
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
