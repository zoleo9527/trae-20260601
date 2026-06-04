import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import type { FillingSchedule } from '../types';

export default function PackagingCreate() {
  const { currentUser, triggerRefresh } = useContext(AppContext);
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<FillingSchedule[]>([]);
  const [form, setForm] = useState({
    scheduleId: '',
    bottleType: '330ml透明瓶',
    bottleCount: '',
    labelType: '',
    cartonType: '12瓶装彩色纸箱',
    requiredDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/filling-schedules')
      .then(r => r.json())
      .then(data => setSchedules(data.filter((s: FillingSchedule) => s.status !== 'COMPLETED' && s.status !== 'DRAFT')));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);

    try {
      await fetch('/api/packaging-requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdById: currentUser.id })
      });
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
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">关联灌装排产 *</label>
            <select
              required
              value={form.scheduleId}
              onChange={e => setForm({ ...form, scheduleId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
            >
              <option value="">请选择关联的灌装排产</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {s.batchNo} - {s.productName} ({s.beerType}, {s.volume}L)
                </option>
              ))}
            </select>
          </div>
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
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? '创建中...' : '创建领用申请'}
          </button>
        </div>
      </form>
    </div>
  );
}
