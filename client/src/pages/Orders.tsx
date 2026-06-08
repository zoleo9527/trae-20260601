import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { api } from '../api';
import type { CargoOrder } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
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

export default function Orders() {
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const filteredAndSortedOrders = useMemo(() => {
    let result = orders;
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    result = [...result].sort((a, b) => {
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [orders, statusFilter]);

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

      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-2 flex-wrap">
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
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {statusFilter
              ? `没有状态为「${STATUS_LABELS[statusFilter] || statusFilter}」的货单`
              : '暂无货单'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedOrders.map((order) => {
            const transitions = VALID_TRANSITIONS[order.status] || [];

            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">{order.order_no}</span>
                        <StatusBadge status={order.status} />
                        {order.is_urgent && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" /> 催办
                          </span>
                        )}
                        <span className="text-sm text-slate-500">{order.flight_no}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span>{order.goods_name}</span>
                        <span>{order.weight_kg}kg</span>
                        <span>{order.consignee}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(order.arrival_time).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
