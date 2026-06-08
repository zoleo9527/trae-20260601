import { useEffect, useState } from 'react';
import {
  MapPin,
  RefreshCw,
  Edit3,
  ArrowRightLeft,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api';
import type { LocationAllocation, CargoOrder, StatusChangeLog } from '../types';
import { STATUS_LABELS, ROLE_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function Allocations() {
  const [allocations, setAllocations] = useState<LocationAllocation[]>([]);
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formOrderId, setFormOrderId] = useState('');
  const [formZone, setFormZone] = useState('');
  const [formShelf, setFormShelf] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAllocatedBy, setFormAllocatedBy] = useState('王建国');
  const [showChange, setShowChange] = useState<number | null>(null);
  const [changeZone, setChangeZone] = useState('');
  const [changeShelf, setChangeShelf] = useState('');
  const [changePosition, setChangePosition] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [logs, setLogs] = useState<StatusChangeLog[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allocData, orderData] = await Promise.all([
        api.allocations.list(),
        api.orders.list({ status: 'pending_allocation' }),
      ]);
      setAllocations(allocData);
      setOrders(orderData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formOrderId || !formZone || !formShelf || !formPosition) return;
    try {
      await api.allocations.create({
        order_id: parseInt(formOrderId),
        zone: formZone,
        shelf: formShelf,
        position: formPosition,
        allocated_by: formAllocatedBy,
        notes: formNotes,
      });
      setShowForm(false);
      setFormZone('');
      setFormShelf('');
      setFormPosition('');
      setFormNotes('');
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleChangeLocation = async (allocId: number) => {
    if (!changeZone || !changeShelf || !changePosition) return;
    try {
      await api.allocations.action({
        allocation_id: allocId,
        action: 'change_location',
        changed_by: formAllocatedBy,
        zone: changeZone,
        shelf: changeShelf,
        position: changePosition,
        notes: changeNotes,
      });
      setShowChange(null);
      setChangeZone('');
      setChangeShelf('');
      setChangePosition('');
      setChangeNotes('');
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRelease = async (allocId: number) => {
    try {
      await api.allocations.action({
        allocation_id: allocId,
        action: 'release',
        changed_by: formAllocatedBy,
        notes: '出库释放',
      });
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const loadLogs = async (allocId: number) => {
    if (expandedLogs === allocId) {
      setExpandedLogs(null);
      return;
    }
    setExpandedLogs(allocId);
    try {
      const data = await api.allocations.logs(allocId);
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const getOrderForAlloc = (orderId: number) => {
    return allocations.find((a) => a.order_id === orderId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">库位分配</h1>
          <p className="text-sm text-slate-500 mt-1">
            库区调度分配库位，备注自动传递到提货预约侧
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <MapPin className="w-4 h-4" /> 新增分配
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">新增库位分配</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">选择货单</label>
              <select
                value={formOrderId}
                onChange={(e) => setFormOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">待分配货单</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_no} - {o.goods_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">库区</label>
              <select
                value={formZone}
                onChange={(e) => setFormZone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">选择</option>
                <option value="A">A-普通区</option>
                <option value="B">B-危险品区</option>
                <option value="C">C-冷链区</option>
                <option value="D">D-临时区</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">架号</label>
              <input
                type="text"
                value={formShelf}
                onChange={(e) => setFormShelf(e.target.value)}
                placeholder="如 01"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">位号</label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="如 03"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">分配备注（将传递到提货预约）</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="如：冷链专区，需核对温度记录"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">操作人</label>
              <select
                value={formAllocatedBy}
                onChange={(e) => setFormAllocatedBy(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="王建国">王建国</option>
                <option value="李明">李明</option>
              </select>
            </div>
            <div className="pt-5">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {allocations.map((alloc) => {
            const isChanging = showChange === alloc.id;

            return (
              <div key={alloc.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-800">{alloc.full_location}</span>
                      <StatusBadge status={alloc.status} />
                      {alloc.version > 1 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                          <ArrowRightLeft className="w-3 h-3" /> 变更v{alloc.version}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span>订单ID: {alloc.order_id}</span>
                      <span>分配人: {alloc.allocated_by}</span>
                      <span>
                        分配时间:{' '}
                        {new Date(alloc.allocated_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {alloc.notes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{alloc.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {alloc.status === 'active' && (
                      <>
                        <button
                          onClick={() => {
                            setShowChange(isChanging ? null : alloc.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs hover:bg-orange-100"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> 变更库位
                        </button>
                        <button
                          onClick={() => handleRelease(alloc.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs hover:bg-green-100"
                        >
                          <CheckCircle className="w-3 h-3" /> 释放
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => loadLogs(alloc.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs hover:bg-slate-100"
                    >
                      <FileText className="w-3 h-3" /> 日志
                    </button>
                  </div>
                </div>

                {isChanging && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-orange-700 mb-2">
                      变更库位 — 变更后提货预约侧将收到通知
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">新库区</label>
                        <select
                          value={changeZone}
                          onChange={(e) => setChangeZone(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="">选择</option>
                          <option value="A">A-普通区</option>
                          <option value="B">B-危险品区</option>
                          <option value="C">C-冷链区</option>
                          <option value="D">D-临时区</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">新架号</label>
                        <input
                          type="text"
                          value={changeShelf}
                          onChange={(e) => setChangeShelf(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">新位号</label>
                        <input
                          type="text"
                          value={changePosition}
                          onChange={(e) => setChangePosition(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">变更原因</label>
                        <input
                          type="text"
                          value={changeNotes}
                          onChange={(e) => setChangeNotes(e.target.value)}
                          placeholder="如：冷链仓已满"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleChangeLocation(alloc.id)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                      >
                        确认变更
                      </button>
                      <button
                        onClick={() => setShowChange(null)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {expandedLogs === alloc.id && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">库位分配变更日志</h4>
                    <div className="space-y-2">
                      {logs
                        .filter((l) => l.entity_type === 'location_allocation' && l.entity_id === alloc.id)
                        .map((log) => (
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
                                    <ArrowRightLeft className="w-3 h-3 text-slate-300" />
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
