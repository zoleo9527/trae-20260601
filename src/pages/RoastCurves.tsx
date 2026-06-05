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
                    <td>v{curve.currentVersion}</td>
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
  const [beanType, setBeanType] = useState('');
  const [roastLevel, setRoastLevel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[480px] p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display font-semibold text-roast-text mb-5">新建烘焙曲线</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">创建</button>
          </div>
        </form>
      </div>
    </div>
  );
}
