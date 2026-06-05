import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store';

export default function CuppingScores() {
  const navigate = useNavigate();
  const { cuppingScores, loading, cuppingFilters, setCuppingFilters, fetchCuppingScores } = useStore();
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    fetchCuppingScores();
  }, [fetchCuppingScores]);

  const filtered = cuppingScores.filter((s) => {
    if (cuppingFilters.beanType && s.beanType !== cuppingFilters.beanType) return false;
    if (cuppingFilters.anomalyOnly && !s.isAnomaly) return false;
    if (cuppingFilters.dateFrom && s.cuppingDate < cuppingFilters.dateFrom) return false;
    if (cuppingFilters.dateTo && s.cuppingDate > cuppingFilters.dateTo) return false;
    return true;
  });

  const beanTypes = [...new Set(cuppingScores.map((s) => s.beanType))];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-roast-text">杯测评分</h1>
        <button className="btn-primary" onClick={() => setShowDrawer(true)}>
          <Plus className="w-4 h-4" />录入杯测
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <select
          className="filter-input"
          value={cuppingFilters.beanType}
          onChange={(e) => setCuppingFilters({ beanType: e.target.value })}
        >
          <option value="">全部豆种</option>
          {beanTypes.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-roast-orange focus:ring-roast-orange"
            checked={cuppingFilters.anomalyOnly}
            onChange={(e) => setCuppingFilters({ anomalyOnly: e.target.checked })}
          />
          仅看异常
        </label>
        <input
          type="date"
          className="filter-input"
          value={cuppingFilters.dateFrom}
          onChange={(e) => setCuppingFilters({ dateFrom: e.target.value })}
        />
        <span className="text-gray-400 text-sm">至</span>
        <input
          type="date"
          className="filter-input"
          value={cuppingFilters.dateTo}
          onChange={(e) => setCuppingFilters({ dateTo: e.target.value })}
        />
      </div>

      {loading.cuppingScores ? (
        <div className="table-container animate-pulse">
          <table><thead><tr>{[1,2,3,4,5,6,7].map(i=><th key={i}><div className="h-4 bg-gray-200 rounded" /></th>)}</tr></thead></table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>豆种</th>
                <th>批次号</th>
                <th>总分</th>
                <th>风味异常</th>
                <th>杯测员</th>
                <th>杯测日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">暂无数据</td></tr>
              ) : (
                filtered.map((score) => (
                  <tr
                    key={score.id}
                    className={`cursor-pointer ${score.isAnomaly ? 'bg-red-50/50' : ''}`}
                    onClick={() => navigate(`/cupping-scores/${score.id}`)}
                  >
                    <td className="font-medium">{score.beanType}</td>
                    <td>{score.batchCode}</td>
                    <td className="font-semibold">{score.totalScore}</td>
                    <td>
                      {score.isAnomaly ? (
                        <span className="badge-risk flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />异常
                        </span>
                      ) : (
                        <span className="text-gray-400">正常</span>
                      )}
                    </td>
                    <td>{score.cupper}</td>
                    <td className="text-xs text-gray-500">{new Date(score.cuppingDate).toLocaleDateString('zh-CN')}</td>
                    <td>
                      <button
                        className="text-roast-orange hover:text-roast-brown text-sm font-medium transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/cupping-scores/${score.id}`); }}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDrawer && (
        <CuppingDrawer onClose={() => setShowDrawer(false)} />
      )}
    </div>
  );
}

function CuppingDrawer({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    beanType: '', batchCode: '', cupper: '', cuppingDate: new Date().toISOString().slice(0, 10),
    dryAroma: '', wetAroma: '', acidity: '', body: '', aftertaste: '', balance: '', overall: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-[420px] h-full shadow-xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-display font-semibold text-roast-text">录入杯测评分</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">豆种</label>
            <input className="filter-input w-full" value={form.beanType} onChange={(e) => handleChange('beanType', e.target.value)} placeholder="如：哥伦比亚蕙兰" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">批次号</label>
            <input className="filter-input w-full" value={form.batchCode} onChange={(e) => handleChange('batchCode', e.target.value)} placeholder="如：B2024-001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">杯测员</label>
              <input className="filter-input w-full" value={form.cupper} onChange={(e) => handleChange('cupper', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">杯测日期</label>
              <input type="date" className="filter-input w-full" value={form.cuppingDate} onChange={(e) => handleChange('cuppingDate', e.target.value)} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">评分 (0-10)</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['dryAroma', '干香'], ['wetAroma', '湿香'], ['acidity', '酸质'],
                ['body', '醇厚'], ['aftertaste', '余韵'], ['balance', '平衡'], ['overall', '整体'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    type="number" min="0" max="10" step="0.5"
                    className="filter-input w-full"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">提交</button>
          </div>
        </form>
      </div>
    </div>
  );
}
