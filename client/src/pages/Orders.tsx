import { useEffect, useState } from 'react';
import {
  Package,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { api } from '../api';
import type { CargoOrder, StatusChangeLog } from '../types';
import { STATUS_LABELS, ROLE_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';

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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<StatusChangeLog[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

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

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    try {
      const data = await api.orders.logs(id);
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

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
      if (expandedId === orderId) {
        const data = await api.orders.logs(orderId);
        setLogs(data);
      }
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

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const transitions = VALID_TRANSITIONS[order.status] || [];
            const orderLogs = logs.filter((l) => l.entity_type === 'cargo_order' && l.entity_id === order.id);

            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div
                  className="px-5 py-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
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
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="px-5 py-3 bg-slate-50 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">货物类型</span>
                        <div className="font-medium text-slate-700">{order.goods_type}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">收货方</span>
                        <div className="font-medium text-slate-700">{order.consignee}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">联系电话</span>
                        <div className="font-medium text-slate-700">{order.contact_phone}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">创建时间</span>
                        <div className="font-medium text-slate-700">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>

                    {transitions.length > 0 && (
                      <div className="px-5 py-3 border-t border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> 可执行操作
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
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
                        </div>
                      </div>
                    )}

                    <div className="px-5 py-3 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> 处理记录
                      </div>
                      <div className="space-y-2">
                        {orderLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 text-xs py-1.5 border-l-2 border-blue-200 pl-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">{log.changed_by}</span>
                                <span className="text-slate-400">
                                  ({ROLE_LABELS[log.role] || log.role})
                                </span>
                                {log.from_status && (
                                  <>
                                    <StatusBadge status={log.from_status} />
                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                  </>
                                )}
                                <StatusBadge status={log.to_status} />
                              </div>
                              {log.notes && <p className="text-slate-500 mt-0.5">{log.notes}</p>}
                            </div>
                            <span className="text-slate-400 shrink-0">
                              {new Date(log.created_at).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
