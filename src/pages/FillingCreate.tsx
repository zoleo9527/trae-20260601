import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';

export default function FillingCreate() {
  const { currentUser, triggerRefresh } = useContext(AppContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    productName: '',
    beerType: 'WHEAT',
    volume: '',
    fillingDate: new Date().toISOString().split('T')[0],
    targetBottles: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);

    try {
      await fetch('/api/filling-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdById: currentUser.id })
      });
      triggerRefresh();
      navigate('/filling');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate('/filling')} className="text-gray-500 hover:text-gray-700">
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">新建灌装排产</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
            <input
              type="text"
              required
              value={form.productName}
              onChange={e => setForm({ ...form, productName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
              placeholder="如：春日小麦啤"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">啤酒类型 *</label>
            <select
              value={form.beerType}
              onChange={e => setForm({ ...form, beerType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
            >
              <option value="WHEAT">小麦啤 (Wheat)</option>
              <option value="IPA">IPA</option>
              <option value="STOUT">世涛 (Stout)</option>
              <option value="LAGER">拉格 (Lager)</option>
              <option value="PALE_ALE">淡色艾尔 (Pale Ale)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">酒液量 (L) *</label>
            <input
              type="number"
              required
              value={form.volume}
              onChange={e => setForm({ ...form, volume: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
              placeholder="如：2000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标瓶数 *</label>
            <input
              type="number"
              required
              value={form.targetBottles}
              onChange={e => setForm({ ...form, targetBottles: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
              placeholder="如：8000"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">计划灌装日期 *</label>
            <input
              type="date"
              required
              value={form.fillingDate}
              onChange={e => setForm({ ...form, fillingDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/filling')}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? '创建中...' : '创建排产单'}
          </button>
        </div>
      </form>
    </div>
  );
}
