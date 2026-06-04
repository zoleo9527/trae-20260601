import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { FILLING_STATUS_LABELS } from '../types';

interface AvailableSchedule {
  id: number;
  batchNo: string;
  productName: string;
  beerType: string;
  volume: number;
  fillingDate: string;
  targetBottles: number;
  status: string;
  lastAdjustment: {
    action: string;
    remark: string;
    changes: Record<string, { old: any; new: any }> | null;
    createdAt: string;
  } | null;
  hasChangeNotification: boolean;
}

export default function PackagingCreate() {
  const { currentUser, triggerRefresh } = useContext(AppContext);
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<AvailableSchedule[]>([]);
  const [form, setForm] = useState({
    scheduleId: '',
    bottleType: '330ml透明瓶',
    bottleCount: '',
    labelType: '',
    cartonType: '12瓶装彩色纸箱',
    requiredDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetch('/api/filling-schedules/available')
      .then(r => r.json())
      .then(data => setSchedules(data));
  }, []);

  const selectedSchedule = schedules.find(s => s.id === parseInt(form.scheduleId));

  const formatChanges = (changes: Record<string, { old: any; new: any }>) => {
    return Object.entries(changes)
      .map(([key, val]) => `${key}: ${val.old} → ${val.new}`)
      .join('；');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/packaging-requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdById: currentUser.id })
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || '创建失败');
        return;
      }

      triggerRefresh();
      navigate('/packaging');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate('/packaging')} className="text-gray-500 hover:text-gray-700">
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">新建包装领用</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌ {submitError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">关联灌装排产 *</label>
            <select
              required
              value={form.scheduleId}
              onChange={e => { setForm({ ...form, scheduleId: e.target.value }); setSubmitError(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
            >
              <option value="">请选择已通过的灌装排产</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {s.batchNo} - {s.productName} ({s.volume}L, {s.targetBottles}瓶){s.hasChangeNotification ? ' ⚠️有变更' : ''}
                </option>
              ))}
            </select>
            {schedules.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">暂无可用的灌装排产（需已通过或生产中状态）</p>
            )}
          </div>

          {selectedSchedule && (
            <div className="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <div className="flex items-center space-x-3 text-sm">
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                  {FILLING_STATUS_LABELS[selectedSchedule.status as keyof typeof FILLING_STATUS_LABELS]}
                </span>
                <span className="text-gray-600">
                  灌装日期：{new Date(selectedSchedule.fillingDate).toLocaleDateString('zh-CN')}
                </span>
                <span className="text-gray-600">
                  目标：{selectedSchedule.targetBottles}瓶
                </span>
              </div>

              {selectedSchedule.lastAdjustment && (
                <div className="text-sm space-y-1">
                  <div className="text-gray-500">
                    最近排产调整（{new Date(selectedSchedule.lastAdjustment.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}）：
                  </div>
                  <div className="text-orange-700 bg-orange-50 px-2 py-1 rounded">
                    {selectedSchedule.lastAdjustment.changes
                      ? formatChanges(selectedSchedule.lastAdjustment.changes)
                      : selectedSchedule.lastAdjustment.remark}
                  </div>
                </div>
              )}

              {selectedSchedule.hasChangeNotification && (
                <div className="flex items-center space-x-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded border border-orange-200">
                  <span>⚠️</span>
                  <span className="font-medium">该排产已有变更提醒，创建领用时请确认最新排产信息</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">瓶型 *</label>
            <select
              value={form.bottleType}
              onChange={e => setForm({ ...form, bottleType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
            >
              <option value="330ml透明瓶">330ml透明瓶</option>
              <option value="330ml棕色瓶">330ml棕色瓶</option>
              <option value="500ml透明瓶">500ml透明瓶</option>
              <option value="500ml棕色瓶">500ml棕色瓶</option>
              <option value="500ml听装">500ml听装</option>
              <option value="330ml听装">330ml听装</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">瓶子数量 *</label>
            <input
              type="number"
              required
              value={form.bottleCount}
              onChange={e => setForm({ ...form, bottleCount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
              placeholder="如：8200（含2-3%损耗）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签类型 *</label>
            <input
              type="text"
              required
              value={form.labelType}
              onChange={e => setForm({ ...form, labelType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
              placeholder="如：春日小麦专用"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">纸箱类型 *</label>
            <select
              value={form.cartonType}
              onChange={e => setForm({ ...form, cartonType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
            >
              <option value="12瓶装彩色纸箱">12瓶装彩色纸箱</option>
              <option value="24瓶装彩色纸箱">24瓶装彩色纸箱</option>
              <option value="24瓶装牛皮纸箱">24瓶装牛皮纸箱</option>
              <option value="24听装托盘">24听装托盘</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">需求日期 *</label>
            <input
              type="date"
              required
              value={form.requiredDate}
              onChange={e => setForm({ ...form, requiredDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/packaging')}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !form.scheduleId}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? '创建中...' : '创建领用申请'}
          </button>
        </div>
      </form>
    </div>
  );
}
