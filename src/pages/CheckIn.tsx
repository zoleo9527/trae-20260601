import { useEffect, useState } from 'react';
import { Plus, Play, Square, MapPin, Phone, Package, User } from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStore } from '../store/appStore';
import type { UnloadRecord, Dock, RecordStatus } from '../../shared/types';

export default function CheckIn() {
  const [records, setRecords] = useState<UnloadRecord[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');
  const { currentUser } = useAppStore();

  const [form, setForm] = useState({
    plateNumber: '',
    driverName: '',
    driverPhone: '',
    cargoType: '',
    plannedQuantity: '',
    dockId: '',
  });

  async function loadData() {
    setLoading(true);
    try {
      const [recordsData, docksData] = await Promise.all([
        api.getRecords(),
        api.getDocks(),
      ]);
      setRecords(recordsData);
      setDocks(docksData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = filter === 'all'
    ? records
    : records.filter(r => r.status === filter);

  const canCheckIn = (r: UnloadRecord) => r.status === 'pending' || r.status === 'checkin';
  const canStartUnload = (r: UnloadRecord) => r.status === 'checkin';
  const canFinishUnload = (r: UnloadRecord) => r.status === 'unloading';

  async function handleCheckIn(record: UnloadRecord) {
    if (!canCheckIn(record)) return;
    try {
      await api.updateStatus(record.id, {
        status: 'checkin',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: '司机签到',
      });
      loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleStartUnload(record: UnloadRecord) {
    if (!canStartUnload(record)) return;
    try {
      await api.updateStatus(record.id, {
        status: 'unloading',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: '开始卸货',
      });
      loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleFinishUnload(record: UnloadRecord) {
    if (!canFinishUnload(record)) return;
    try {
      await api.updateStatus(record.id, {
        status: 'finished',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: '卸货完成',
      });
      loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createRecord({
        plateNumber: form.plateNumber,
        driverName: form.driverName,
        driverPhone: form.driverPhone,
        cargoType: form.cargoType,
        plannedQuantity: parseInt(form.plannedQuantity) || 0,
        dockId: form.dockId || undefined,
      });
      setForm({
        plateNumber: '',
        driverName: '',
        driverPhone: '',
        cargoType: '',
        plannedQuantity: '',
        dockId: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const statusFilters: { key: RecordStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待签到' },
    { key: 'checkin', label: '已签到' },
    { key: 'unloading', label: '卸货中' },
    { key: 'finished', label: '卸货完成' },
    { key: 'discrepancy', label: '差异中' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">卸货签到</h1>
          <p className="text-slate-400 text-sm mt-1">管理车辆签到和卸货进度</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新增到车计划
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="font-semibold mb-4">新增到车计划</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">车牌号 *</label>
              <input
                type="text"
                value={form.plateNumber}
                onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="如：京A12345"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">司机姓名 *</label>
              <input
                type="text"
                value={form.driverName}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">联系电话 *</label>
              <input
                type="tel"
                value={form.driverPhone}
                onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">货品类型 *</label>
              <input
                type="text"
                value={form.cargoType}
                onChange={(e) => setForm({ ...form, cargoType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="如：电子产品、食品"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">计划件数 *</label>
              <input
                type="number"
                value={form.plannedQuantity}
                onChange={(e) => setForm({ ...form, plannedQuantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">分配月台（可选）</label>
              <select
                value={form.dockId}
                onChange={(e) => setForm({ ...form, dockId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">暂不分配</option>
                {docks.filter(d => d.status === 'idle').map(d => (
                  <option key={d.id} value={d.id}>{d.number} 号月台</option>
                ))}
              </select>
            </div>
            <div className="col-span-3 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
              >
                创建计划
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-400">暂无记录</div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg text-slate-100">
                          {record.plateNumber}
                        </span>
                        <StatusBadge status={record.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {record.driverName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {record.driverPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {record.cargoType} · {record.plannedQuantity}件
                        </span>
                        {record.dockNumber && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {record.dockNumber} 号月台
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCheckIn(record) && record.status === 'pending' && (
                      <button
                        onClick={() => handleCheckIn(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        签到
                      </button>
                    )}
                    {canStartUnload(record) && (
                      <button
                        onClick={() => handleStartUnload(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        开始卸货
                      </button>
                    )}
                    {canFinishUnload(record) && (
                      <button
                        onClick={() => handleFinishUnload(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Square className="w-3.5 h-3.5" />
                        卸货完成
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
