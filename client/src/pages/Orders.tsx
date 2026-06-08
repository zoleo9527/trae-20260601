import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  RefreshCw,
  AlertTriangle,
  Eye,
  Search,
  XCircle,
  Clock,
} from 'lucide-react';
import { api } from '../api';
import type { CargoOrder } from '../types';
import { STATUS_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';
import OrderDrawer from '../components/OrderDrawer';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'created', label: '新建' },
  { value: 'accepting', label: '受理中' },
  { value: 'supplementing', label: '补材料' },
  { value: 'pending_security', label: '待安检' },
  { value: 'allocated', label: '已分配' },
  { value: 'appointed', label: '已预约' },
  { value: 'picked_up', label: '已提货' },
];

const VALID_TRANSITIONS: Record<string, { to: string; label: string; role: string }[]> = {
  created: [{ to: 'accepting', label: '开始受理', role: 'cargo_acceptor' }],
  accepting: [
    { to: 'pending_security', label: '移交安检', role: 'cargo_acceptor' },
    { to: 'supplementing', label: '需补材料', role: 'cargo_acceptor' },
  ],
  supplementing: [{ to: 'accepting', label: '材料补齐，恢复受理', role: 'cargo_acceptor' }],
  pending_security: [{ to: 'inspecting', label: '开始安检', role: 'security_inspector' }],
  inspecting: [
    { to: 'pending_allocation', label: '安检通过，移交库区', role: 'security_inspector' },
    { to: 'security_rejected', label: '安检退回', role: 'security_inspector' },
  ],
  security_rejected: [
    { to: 'supplementing', label: '补材料', role: 'cargo_acceptor' },
    { to: 'inspecting', label: '重新安检', role: 'security_inspector' },
  ],
  pending_allocation: [{ to: 'allocated', label: '分配库位', role: 'warehouse_dispatcher' }],
  allocated: [
    { to: 'allocation_changed', label: '库位变动', role: 'warehouse_dispatcher' },
  ],
  allocation_changed: [{ to: 'appointed', label: '确认预约', role: 'cargo_acceptor' }],
  appointed: [{ to: 'picked_up', label: '确认提货', role: 'cargo_acceptor' }],
};

const ROLE_USERS: Record<string, { name: string; role: string }[]> = {
  cargo_acceptor: [
    { name: '张受理', role: 'cargo_acceptor' },
    { name: '李受理', role: 'cargo_acceptor' },
  ],
  security_inspector: [{ name: '陈安检', role: 'security_inspector' }],
  warehouse_dispatcher: [
    { name: '王建国', role: 'warehouse_dispatcher' },
    { name: '李明', role: 'warehouse_dispatcher' },
  ],
};

function matchKeyword(order: CargoOrder, keyword: string): boolean {
  const kw = keyword.toLowerCase();
  return (
    order.order_no.toLowerCase().includes(kw) ||
    order.flight_no.toLowerCase().includes(kw) ||
    order.consignee.toLowerCase().includes(kw) ||
    order.goods_name.toLowerCase().includes(kw)
  );
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200/70 text-inherit rounded-sm px-0.5">
        {text.slice(idx, idx + keyword.length)}
      </mark>
      {text.slice(idx + keyword.length)}
    </>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (diffMs < 0) return '刚刚';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

export default function Orders() {
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.list();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const hasFilter = keyword !== '' || statusFilter !== '';

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
  };

  const filteredAndSortedOrders = useMemo(() => {
    let result = orders;
    if (keyword) {
      result = result.filter((o) => matchKeyword(o, keyword));
    }
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    result = [...result].sort((a, b) => {
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [orders, keyword, statusFilter]);

  const handleTransition = async (orderId: number, to: string, role: string) => {
    const users = ROLE_USERS[role] || [];
    const user = users[0];
    if (!user) return;

    setActionLoading(true);
    try {
      await api.orders.transition({
        order_id: orderId,
        to_status: to,
        changed_by: user.name,
        role: user.role,
        notes: notes || undefined,
      });
      setNotes('');
      await loadOrders();
    } catch (e: any) {
      alert(e.message);
    }
    setActionLoading(false);
  };

  const buildEmptyMessage = () => {
    const parts: string[] = [];
    if (keyword) parts.push(`关键字「${keyword}」`);
    if (statusFilter) parts.push(`状态「${STATUS_LABELS[statusFilter] || statusFilter}」`);
    if (parts.length > 0) return `没有匹配 ${parts.join(' + ')} 的货单`;
    return '暂无货单';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">货单管理</h1>
          <p className="text-sm text-slate-500 mt-1">货站受理 → 安检 → 库区调度 → 提货全流程</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索货单号、航班号、收货方、货物名称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            const count = opt.value
              ? orders.filter((o) => o.status === opt.value).length
              : orders.length;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-500 text-blue-100' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
          {hasFilter && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors ml-1"
            >
              <XCircle className="w-3 h-3" /> 重置
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{buildEmptyMessage()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedOrders.map((order) => {
            const transitions = VALID_TRANSITIONS[order.status] || [];

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  order.is_urgent ? 'border-rose-300 border-l-4 border-l-rose-500' : 'border-slate-200'
                }`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">
                          <HighlightText text={order.order_no} keyword={keyword} />
                        </span>
                        <StatusBadge status={order.status} />
                        {order.is_urgent && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" /> 紧急
                          </span>
                        )}
                        <span className="text-sm text-slate-500">
                          <HighlightText text={order.flight_no} keyword={keyword} />
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span><HighlightText text={order.goods_name} keyword={keyword} /></span>
                        <span>{order.weight_kg}kg</span>
                        <span><HighlightText text={order.consignee} keyword={keyword} /></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400">
                        {new Date(order.arrival_time).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(order.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {transitions.map((t) => (
                      <button
                        key={t.to}
                        disabled={actionLoading}
                        onClick={() => handleTransition(order.id, t.to, t.role)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {t.label}
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="处理备注..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => setDrawerOrderId(order.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700"
                    >
                      <Eye className="w-3 h-3" /> 详情
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderDrawer
        orderId={drawerOrderId}
        onClose={() => setDrawerOrderId(null)}
      />
    </div>
  );
}
