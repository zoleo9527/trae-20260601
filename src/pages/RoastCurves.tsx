import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useStore } from '@/store';

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'badge-draft' },
  active: { label: '启用', cls: 'badge-active' },
  deprecated: { label: '已弃用', cls: 'badge-deprecated' },
};

export default function RoastCurves() {
  const navigate = useNavigate();
  const { roastCurves, loading, curveFilters, setCurveFilters, fetchRoastCurves } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRoastCurves();
  }, [fetchRoastCurves]);

  const filtered = roastCurves.filter((c) => {
    if (curveFilters.beanType && c.beanType !== curveFilters.beanType) return false;
    if (curveFilters.status && c.status !== curveFilters.status) return false;
    if (curveFilters.keyword && !c.beanType.includes(curveFilters.keyword) && !c.roastLevel.includes(curveFilters.keyword)) return false;
    return true;
  });

  const beanTypes = [...new Set(roastCurves.map((c) => c.beanType))];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-roast-text">烘焙曲线</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />新建曲线
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <select
          className="filter-input"
          value={curveFilters.beanType}
          onChange={(e) => setCurveFilters({ beanType: e.target.value })}
        >
          <option value="">全部豆种</option>
          {beanTypes.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          className="filter-input"
          value={curveFilters.status}
          onChange={(e) => setCurveFilters({ status: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="active">启用</option>
          <option value="deprecated">已弃用</option>
        </select>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="filter-input pl-9"
            placeholder="搜索豆种或烘焙度..."
            value={curveFilters.keyword}
            onChange={(e) => setCurveFilters({ keyword: e.target.value })}
          />
        </div>
      </div>

      {loading.roastCurves ? (
        <div className="table-container animate-pulse">
          <table><thead><tr><th className="w-1/5"><div className="h-4 bg-gray-200 rounded" /></th><th className="w-1/6"><div className="h-4 bg-gray-200 rounded" /></th><th className="w-1/6"><div className="h-4 bg-gray-200 rounded" /></th><th className="w-1/6"><div className="h-4 bg-gray-200 rounded" /></th><th className="w-1/6"><div className="h-4 bg-gray-200 rounded" /></th><th><div className="h-4 bg-gray-200 rounded" /></th></tr></thead></table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>豆种</th>
                <th>烘焙度</th>
                <th>当前版本</th>
                <th>状态</th>
                <th>创建人</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">暂无数据</td></tr>
              ) : (
                filtered.map((curve) => (
                  <tr
                    key={curve.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/roast-curves/${curve.id}`)}
                  >
                    <td className="font-medium">{curve.beanType}</td>
                    <td>{curve.roastLevel}</td>
                    <td>
                      {curve.activeVersion > 0 ? (
                        <span className="font-medium text-roast-brown">v{curve.activeVersion}</span>
                      ) : (
                        <span className="text-gray-400">未启用</span>
                      )}
                      {curve.latestVersion > curve.activeVersion && (
                        <span className="text-xs text-amber-600 ml-2">(最新 v{curve.latestVersion})</span>
                      )}
                    </td>
                    <td><span className={statusMap[curve.status]?.cls}>{statusMap[curve.status]?.label}</span></td>
                    <td>{curve.createdBy}</td>
                    <td className="text-gray-500 text-xs">{new Date(curve.updatedAt).toLocaleString('zh-CN')}</td>
                    <td>
                      <button
                        className="text-roast-orange hover:text-roast-brown text-sm font-medium transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/roast-curves/${curve.id}`); }}
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

      {showCreateModal && (
        <CreateCurveModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateCurveModal({ onClose }: { onClose: () => void }) {
  const { createCurve } = useStore();
  const [beanType, setBeanType] = useState('');
  const [roastLevel, setRoastLevel] = useState('');
  const [chargeTemp, setChargeTemp] = useState('200');
  const [turnPointTemp, setTurnPointTemp] = useState('100');
  const [turnPointTime, setTurnPointTime] = useState('1.5');
  const [firstCrackTemp, setFirstCrackTemp] = useState('198');
  const [firstCrackTime, setFirstCrackTime] = useState('6.5');
  const [developmentTime, setDevelopmentTime] = useState('4.0');
  const [dropTemp, setDropTemp] = useState('200');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beanType || !roastLevel) return;
    setSubmitting(true);
    try {
      await createCurve({
        bean_type: beanType,
        roast_level: roastLevel,
        created_by: '王烘焙',
        version: {
          charge_temp: Number(chargeTemp),
          turn_point_temp: Number(turnPointTemp),
          turn_point_time: Number(turnPointTime),
          first_crack_temp: Number(firstCrackTemp),
          first_crack_time: Number(firstCrackTime),
          development_time: Number(developmentTime),
          drop_temp: Number(dropTemp),
          notes: notes || undefined,
        },
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[560px] max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display font-semibold text-roast-text mb-5">新建烘焙曲线</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">豆种</label>
              <input className="filter-input w-full" value={beanType} onChange={(e) => setBeanType(e.target.value)} placeholder="如：埃塞俄比亚耶加雪菲" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">烘焙度</label>
              <select className="filter-input w-full" value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)}>
                <option value="">请选择</option>
                <option value="浅烘">浅烘</option>
                <option value="中浅烘">中浅烘</option>
                <option value="中烘">中烘</option>
                <option value="中深烘">中深烘</option>
                <option value="深烘">深烘</option>
              </select>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">初始版本参数</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">入豆温 (°C)</label>
                <input type="number" className="filter-input w-full" value={chargeTemp} onChange={(e) => setChargeTemp(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">回温点 (°C)</label>
                <input type="number" className="filter-input w-full" value={turnPointTemp} onChange={(e) => setTurnPointTemp(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">回温时间 (分)</label>
                <input type="number" step="0.1" className="filter-input w-full" value={turnPointTime} onChange={(e) => setTurnPointTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">一爆温 (°C)</label>
                <input type="number" className="filter-input w-full" value={firstCrackTemp} onChange={(e) => setFirstCrackTemp(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">一爆时间 (分)</label>
                <input type="number" step="0.1" className="filter-input w-full" value={firstCrackTime} onChange={(e) => setFirstCrackTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">发展期 (分)</label>
                <input type="number" step="0.1" className="filter-input w-full" value={developmentTime} onChange={(e) => setDevelopmentTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">出豆温 (°C)</label>
                <input type="number" className="filter-input w-full" value={dropTemp} onChange={(e) => setDropTemp(e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">备注</label>
            <textarea className="filter-input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="曲线说明..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>取消</button>
            <button type="submit" className="btn-primary" disabled={submitting || !beanType || !roastLevel}>
              {submitting ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
