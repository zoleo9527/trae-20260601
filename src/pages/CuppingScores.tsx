import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store';

export default function CuppingScores() {
  const navigate = useNavigate();
  const { cuppingScores, loading, cuppingFilters, setCuppingFilters, fetchCuppingScores, fetchCurvesForSelect, curvesForSelect, createCuppingScore } = useStore();
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    fetchCuppingScores();
    fetchCurvesForSelect();
  }, [fetchCuppingScores, fetchCurvesForSelect]);

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
  const { curvesForSelect, createCuppingScore } = useStore();
  const [form, setForm] = useState({
    curveId: '',
    batchCode: '',
    cupper: '李杯测',
    cuppingDate: new Date().toISOString().slice(0, 10),
    dryAroma: '7.5',
    wetAroma: '7.5',
    acidity: '7.5',
    body: '7.5',
    aftertaste: '7.5',
    balance: '7.5',
    overall: '7.5',
    flavorAnomaly: false,
    anomalyDescription: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.curveId || !form.batchCode) return;
    setSubmitting(true);
    try {
      await createCuppingScore({
        curve_id: Number(form.curveId),
        batch_code: form.batchCode,
        dry_aroma: Number(form.dryAroma),
        wet_aroma: Number(form.wetAroma),
        acidity: Number(form.acidity),
        body: Number(form.body),
        aftertaste: Number(form.aftertaste),
        balance: Number(form.balance),
        overall: Number(form.overall),
        flavor_anomaly: form.flavorAnomaly,
        anomaly_description: form.anomalyDescription || undefined,
        cupper_name: form.cupper,
        cupped_at: form.cuppingDate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCurve = curvesForSelect.find((c) => c.id === form.curveId);
  const totalScore = [form.dryAroma, form.wetAroma, form.acidity, form.body, form.aftertaste, form.balance, form.overall]
    .reduce((sum, v) => sum + (Number(v) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-[460px] h-full shadow-xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-display font-semibold text-roast-text">录入杯测评分</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">关联烘焙曲线 <span className="text-risk-red">*</span></label>
            <select
              className="filter-input w-full"
              value={form.curveId}
              onChange={(e) => handleChange('curveId', e.target.value)}
            >
              <option value="">请选择曲线</option>
              {curvesForSelect.map((c) => (
                <option key={c.id} value={c.id}>{c.beanType} · {c.roastLevel} (v{c.currentVersion})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">批次号 <span className="text-risk-red">*</span></label>
              <input
                className="filter-input w-full"
                value={form.batchCode}
                onChange={(e) => handleChange('batchCode', e.target.value)}
                placeholder="如：BATCH-2024-011"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">杯测员</label>
              <input
                className="filter-input w-full"
                value={form.cupper}
                onChange={(e) => handleChange('cupper', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">杯测日期</label>
            <input
              type="date"
              className="filter-input w-full"
              value={form.cuppingDate}
              onChange={(e) => handleChange('cuppingDate', e.target.value)}
            />
          </div>

          {selectedCurve && (
            <div className="bg-roast-cream rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">已选曲线</div>
              <div className="text-sm font-medium text-roast-text">
                {selectedCurve.beanType} · {selectedCurve.roastLevel}
                <span className="ml-2 text-xs text-gray-500">v{selectedCurve.currentVersion} · {selectedCurve.status === 'active' ? '启用' : selectedCurve.status === 'draft' ? '草稿' : '已弃用'}</span>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">评分 (0-10)</h3>
              <span className="text-sm font-bold text-roast-orange">总分: {totalScore.toFixed(1)}</span>
            </div>
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
                    value={form[key as keyof Omit<typeof form, 'flavorAnomaly'>] as string}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mb-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-risk-red focus:ring-risk-red"
                checked={form.flavorAnomaly}
                onChange={(e) => handleChange('flavorAnomaly', e.target.checked)}
              />
              <span className="font-medium">标记风味异常</span>
            </label>
            {form.flavorAnomaly && (
              <textarea
                className="filter-input w-full"
                rows={3}
                value={form.anomalyDescription}
                onChange={(e) => handleChange('anomalyDescription', e.target.value)}
                placeholder="描述异常风味，如：焦苦味明显、酸质尖锐不愉悦..."
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>取消</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !form.curveId || !form.batchCode}
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
