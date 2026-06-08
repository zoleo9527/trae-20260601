import { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  CalendarCheck,
  Clock,
  Filter,
  ArrowRight,
  Package,
  AlertTriangle,
  SearchX,
} from 'lucide-react';
import { api } from '../api';
import type { TimelineResponse, TimelineEntry } from '../types';
import { STATUS_LABELS, ROLE_LABELS, ENTITY_LABELS } from '../types';
import StatusBadge from './StatusBadge';

const ENTITY_COLORS: Record<string, string> = {
  cargo_order: 'border-blue-400 bg-blue-50',
  location_allocation: 'border-emerald-400 bg-emerald-50',
  pickup_appointment: 'border-teal-400 bg-teal-50',
};

const ENTITY_DOT_COLORS: Record<string, string> = {
  cargo_order: 'bg-blue-500',
  location_allocation: 'bg-emerald-500',
  pickup_appointment: 'bg-teal-500',
};

const ROLE_FILTER_OPTIONS = [
  { value: '', label: '全部角色' },
  { value: 'system', label: '系统' },
  { value: 'cargo_acceptor', label: '货站受理' },
  { value: 'security_inspector', label: '安检员' },
  { value: 'warehouse_dispatcher', label: '库区调度' },
];

const ENTITY_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'cargo_order', label: '货单' },
  { value: 'location_allocation', label: '库位' },
  { value: 'pickup_appointment', label: '预约' },
];

interface OrderDrawerProps {
  orderId: number | null;
  onClose: () => void;
}

export default function OrderDrawer({ orderId, onClose }: OrderDrawerProps) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    if (orderId === null) return;
    setLoading(true);
    setRoleFilter('');
    setEntityFilter('');
    api.orders.timeline(orderId).then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId]);

  if (orderId === null) return null;

  const filteredEntries: TimelineEntry[] = (data?.entries ?? []).filter((e) => {
    if (roleFilter && e.role !== roleFilter) return false;
    if (entityFilter && e.entity_type !== entityFilter) return false;
    return true;
  });

  const formatTime = (d: string) =>
    new Date(d).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[560px] max-w-full bg-white shadow-2xl z-50 flex flex-col">
        {loading || !data ? (
          <div className="flex-1 flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-bold text-slate-800">{data.order.order_no}</h2>
                  <StatusBadge status={data.order.status} />
                  {data.order.is_urgent && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" /> 催办
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {data.order.flight_no} · {data.order.goods_name} · {data.order.weight_kg}kg
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 grid grid-cols-3 gap-4 text-sm shrink-0">
              <div>
                <span className="text-slate-400">收货方</span>
                <div className="font-medium text-slate-700">{data.order.consignee}</div>
              </div>
              <div>
                <span className="text-slate-400">货物类型</span>
                <div className="font-medium text-slate-700">{data.order.goods_type}</div>
              </div>
              <div>
                <span className="text-slate-400">联系电话</span>
                <div className="font-medium text-slate-700">{data.order.contact_phone}</div>
              </div>
            </div>

            {(data.allocation || data.appointments.length > 0) && (
              <div className="px-6 py-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-4 flex-wrap">
                  {data.allocation && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-emerald-700">{data.allocation.full_location}</span>
                      {data.allocation.version > 1 && (
                        <span className="text-xs text-emerald-500">v{data.allocation.version}</span>
                      )}
                    </div>
                  )}
                  {data.appointments.map((appt) => (
                    <div key={appt.id} className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-sm">
                      <CalendarCheck className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-teal-700">{appt.appointee}</span>
                      <StatusBadge status={appt.status} />
                      {appt.allocation_changed && (
                        <span className="text-xs text-orange-600 font-medium">库位已变动</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 py-3 border-b border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">角色</span>
                {ROLE_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRoleFilter(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      roleFilter === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-xs text-slate-500">类型</span>
                {ENTITY_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEntityFilter(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      entityFilter === opt.value
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-auto">{filteredEntries.length} 条</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <SearchX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">无匹配记录</p>
                  <p className="text-slate-300 text-xs mt-1">
                    当前筛选条件下没有对应的时间轴条目
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200" />
                  <div className="space-y-0">
                    {filteredEntries.map((entry, i) => {
                      const dotColor = ENTITY_DOT_COLORS[entry.entity_type] || 'bg-slate-400';
                      const lineColor = ENTITY_COLORS[entry.entity_type] || 'border-slate-300 bg-slate-50';

                      return (
                        <div key={`${entry.entity_type}-${entry.entity_id}-${i}`} className="relative pl-8 pb-5">
                          <div className={`absolute left-0 top-1 w-[18px] h-[18px] rounded-full border-2 border-white ${dotColor} z-10`} />
                          <div className={`rounded-lg border p-3 ${lineColor}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.5 bg-white/80 rounded text-[10px] font-medium text-slate-500">
                                    {ENTITY_LABELS[entry.entity_type] || entry.entity_type}
                                  </span>
                                  <span className="font-semibold text-sm text-slate-800">
                                    {entry.action_label}
                                  </span>
                                  {entry.from_status && (
                                    <>
                                      <StatusBadge status={entry.from_status} />
                                      <ArrowRight className="w-3 h-3 text-slate-300" />
                                    </>
                                  )}
                                  {entry.to_status && <StatusBadge status={entry.to_status} />}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                                  <span className="font-medium text-slate-600">{entry.changed_by}</span>
                                  <span className="px-1.5 py-0.5 bg-white/60 rounded">
                                    {ROLE_LABELS[entry.role] || entry.role}
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-3 whitespace-nowrap">
                                {formatTime(entry.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
