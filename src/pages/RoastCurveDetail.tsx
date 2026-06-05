import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { useStore } from '@/store';

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'badge-draft' },
  active: { label: '启用', cls: 'badge-active' },
  deprecated: { label: '已弃用', cls: 'badge-deprecated' },
};

export default function RoastCurveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCurve, loading, fetchRoastCurveDetail, activateVersion, newVersion } = useStore();
  const [showNewVersion, setShowNewVersion] = useState(false);

  useEffect(() => {
    if (id) fetchRoastCurveDetail(id);
  }, [id, fetchRoastCurveDetail]);

  if (loading.selectedCurve || !selectedCurve) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-5">
            <div className="card h-48 bg-gray-100" />
            <div className="card h-48 bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  const curve = selectedCurve;
  const activeVersion = curve.versions?.find((v) => v.version === curve.currentVersion);
  const sortedVersions = [...(curve.versions || [])].sort((a, b) => b.version - a.version);

  const handleActivate = async (ver: number) => {
    if (!id) return;
    await activateVersion(id, ver, '王烘焙');
  };

  return (
    <div className="p-8">
      <button
        className="flex items-center gap-1 text-gray-500 hover:text-roast-brown text-sm mb-4 transition-colors"
        onClick={() => navigate('/roast-curves')}
      >
        <ArrowLeft className="w-4 h-4" />返回列表
      </button>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold text-roast-text">{curve.beanType} · {curve.roastLevel}</h1>
        <span className={statusMap[curve.status]?.cls}>{statusMap[curve.status]?.label}</span>
        <span className="text-sm text-gray-400">v{curve.currentVersion}</span>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">当前版本参数 (v{curve.currentVersion})</h3>
          {activeVersion ? (
            <div className="grid grid-cols-2 gap-4">
              <ParamItem label="入豆温" value={`${activeVersion.chargeTemp}°C`} />
              <ParamItem label="回温点" value={`${activeVersion.turningPoint}°C`} />
              <ParamItem label="回温点时间" value={`${activeVersion.turningPointTime}s`} />
              <ParamItem label="一爆温" value={`${activeVersion.firstCrackTemp}°C`} />
              <ParamItem label="一爆时间" value={`${activeVersion.firstCrackTime}s`} />
              <ParamItem label="发展期" value={`${activeVersion.developmentTime}s`} />
              <ParamItem label="出豆温" value={`${activeVersion.dropTemp}°C`} />
            </div>
          ) : (
            <p className="text-gray-400 text-sm">暂无版本参数</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500">版本历史</h3>
            <button className="btn-primary text-xs py-1.5 px-3" onClick={() => setShowNewVersion(true)}>
              <Plus className="w-3.5 h-3.5" />新建版本
            </button>
          </div>
          {sortedVersions.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无版本</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200" />
              {sortedVersions.map((v) => (
                <div key={v.version} className="relative pb-4 last:pb-0">
                  <div className={`absolute -left-4 top-1 w-4 h-4 rounded-full border-2 ${v.version === curve.currentVersion ? 'bg-roast-orange border-roast-orange' : 'bg-white border-gray-300'}`} />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-roast-text">v{v.version}</span>
                        <span className={statusMap[v.status]?.cls}>{statusMap[v.status]?.label}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{v.createdBy} · {new Date(v.createdAt).toLocaleDateString('zh-CN')}</div>
                    </div>
                    {v.status === 'draft' && v.version !== curve.currentVersion && (
                      <button
                        className="flex items-center gap-1 text-xs text-roast-orange hover:text-roast-brown transition-colors"
                        onClick={() => handleActivate(v.version)}
                      >
                        <Check className="w-3.5 h-3.5" />启用
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {curve.relatedScores && curve.relatedScores.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">关联杯测评分</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>批次号</th>
                  <th>总分</th>
                  <th>风味异常</th>
                  <th>杯测员</th>
                  <th>杯测日期</th>
                </tr>
              </thead>
              <tbody>
                {curve.relatedScores!.map((s) => (
                  <tr key={s.id} className="cursor-pointer" onClick={() => navigate(`/cupping-scores/${s.id}`)}>
                    <td className="font-medium">{s.batchCode}</td>
                    <td>{s.totalScore}</td>
                    <td>{s.isAnomaly ? <span className="badge-risk">异常</span> : <span className="text-gray-400">正常</span>}</td>
                    <td>{s.cupper}</td>
                    <td className="text-xs text-gray-500">{new Date(s.cuppingDate).toLocaleDateString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {curve.relatedBatches && curve.relatedBatches.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">关联库存批次</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>批次号</th>
                  <th>豆种</th>
                  <th>剩余/总量</th>
                  <th>烘焙日期</th>
                  <th>到期日</th>
                  <th>FIFO状态</th>
                </tr>
              </thead>
              <tbody>
                {curve.relatedBatches!.map((b) => (
                  <tr key={b.id} className={b.fifoStatus === 'expired' ? 'bg-red-50' : b.fifoStatus === 'warning' ? 'bg-amber-50' : ''}>
                    <td className="font-medium">{b.batchCode}</td>
                    <td>{b.beanType}</td>
                    <td>{b.remaining}/{b.quantity}</td>
                    <td className="text-xs text-gray-500">{new Date(b.roastDate).toLocaleDateString('zh-CN')}</td>
                    <td className="text-xs text-gray-500">{new Date(b.expiryDate).toLocaleDateString('zh-CN')}</td>
                    <td>
                      {b.fifoStatus === 'expired' ? <span className="badge-risk">已过期</span> :
                       b.fifoStatus === 'warning' ? <span className="badge-draft">临近过期</span> :
                       <span className="badge-active">正常</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewVersion && (
        <NewVersionModal
          curve={curve}
          onClose={() => setShowNewVersion(false)}
          onCreated={() => setShowNewVersion(false)}
        />
      )}
    </div>
  );
}

function NewVersionModal({ curve, onClose, onCreated }: {
  curve: any;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { newVersion } = useStore();
  const lastVersion = curve.versions?.[curve.versions.length - 1] || {};
  const [chargeTemp, setChargeTemp] = useState(String(lastVersion.chargeTemp ?? 200));
  const [turnPointTemp, setTurnPointTemp] = useState(String(lastVersion.turningPoint ?? 100));
  const [turnPointTime, setTurnPointTime] = useState(String(lastVersion.turningPointTime ?? 1.5));
  const [firstCrackTemp, setFirstCrackTemp] = useState(String(lastVersion.firstCrackTemp ?? 198));
  const [firstCrackTime, setFirstCrackTime] = useState(String(lastVersion.firstCrackTime ?? 6.5));
  const [developmentTime, setDevelopmentTime] = useState(String(lastVersion.developmentTime ?? 4.0));
  const [dropTemp, setDropTemp] = useState(String(lastVersion.dropTemp ?? 200));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await newVersion(curve.id, {
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
        created_by: '王烘焙',
      });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[560px] max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display font-semibold text-roast-text mb-5">
          新建版本 · {curve.beanType} · v{curve.currentVersion + 1}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-600">版本参数</h3>
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
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">版本说明</label>
            <textarea className="filter-input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="本次调整说明..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>取消</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '创建中...' : '创建新版本'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ParamItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-roast-cream rounded-lg px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-roast-text">{value}</div>
    </div>
  );
}
