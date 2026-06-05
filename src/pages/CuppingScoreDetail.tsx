import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store';

const dimensions = [
  { key: 'dryAroma', label: '干香' },
  { key: 'wetAroma', label: '湿香' },
  { key: 'acidity', label: '酸质' },
  { key: 'body', label: '醇厚' },
  { key: 'aftertaste', label: '余韵' },
  { key: 'balance', label: '平衡' },
  { key: 'overall', label: '整体' },
] as const;

export default function CuppingScoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedScore, loading, fetchCuppingScoreDetail } = useStore();

  useEffect(() => {
    if (id) fetchCuppingScoreDetail(id);
  }, [id, fetchCuppingScoreDetail]);

  if (loading.selectedScore || !selectedScore) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="card h-64 bg-gray-100" />
        </div>
      </div>
    );
  }

  const score = selectedScore;

  return (
    <div className="p-8">
      <button
        className="flex items-center gap-1 text-gray-500 hover:text-roast-brown text-sm mb-4 transition-colors"
        onClick={() => navigate('/cupping-scores')}
      >
        <ArrowLeft className="w-4 h-4" />返回列表
      </button>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold text-roast-text">{score.beanType} · {score.batchCode}</h1>
        {score.isAnomaly && <span className="badge-risk flex items-center gap-1"><AlertTriangle className="w-3 h-3" />风味异常</span>}
      </div>

      {score.isAnomaly && score.anomalyDescription && (
        <div className="card border-l-4 border-risk-red bg-red-50 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-risk-red" />
            <span className="font-medium text-sm text-risk-red">异常说明</span>
          </div>
          <p className="text-sm text-gray-700">{score.anomalyDescription}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="card col-span-2">
          <h3 className="text-sm font-semibold text-gray-500 mb-5">评分细项</h3>
          <div className="space-y-4">
            {dimensions.map((dim) => {
              const val = score[dim.key];
              const pct = (val / 10) * 100;
              const color = val < 5 ? 'bg-risk-red' : val < 7 ? 'bg-pending-amber' : 'bg-done-green';
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{dim.label}</span>
                    <span className="text-sm font-semibold text-roast-text">{val}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card flex flex-col items-center justify-center">
          <div className="text-sm text-gray-500 mb-2">总分</div>
          <div className="text-5xl font-display font-bold text-roast-brown">{score.totalScore}</div>
          <div className="text-xs text-gray-400 mt-2">满分 100</div>
          <div className="mt-4 text-sm text-gray-500">
            杯测员: <span className="text-roast-text font-medium">{score.cupper}</span>
          </div>
          <div className="text-sm text-gray-500">
            日期: <span className="text-roast-text">{new Date(score.cuppingDate).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </div>

      {score.relatedCurve && (
        <div className="card mb-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">关联烘焙曲线</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <ParamItem label="豆种" value={score.relatedCurve!.beanType} />
            <ParamItem label="烘焙度" value={score.relatedCurve!.roastLevel} />
            <ParamItem label="当前版本" value={`v${score.relatedCurve!.currentVersion}`} />
            <ParamItem label="状态" value={score.relatedCurve!.status === 'active' ? '启用' : score.relatedCurve!.status === 'draft' ? '草稿' : '已弃用'} />
          </div>
          {score.curveVersion && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-medium text-gray-500 mb-3">关联版本参数 (v{score.curveVersion.version_number})</h4>
              <div className="grid grid-cols-4 gap-3">
                <ParamItem label="入豆温" value={`${score.curveVersion.charge_temp}°C`} />
                <ParamItem label="回温点" value={`${score.curveVersion.turn_point_temp}°C`} />
                <ParamItem label="一爆温" value={`${score.curveVersion.first_crack_temp}°C`} />
                <ParamItem label="出豆温" value={`${score.curveVersion.drop_temp}°C`} />
                <ParamItem label="回温时间" value={`${score.curveVersion.turn_point_time}分`} />
                <ParamItem label="一爆时间" value={`${score.curveVersion.first_crack_time}分`} />
                <ParamItem label="发展期" value={`${score.curveVersion.development_time}分`} />
              </div>
              {score.curveVersion.notes && (
                <div className="mt-3 text-xs text-gray-500 bg-roast-cream rounded p-2">
                  <span className="font-medium">版本备注：</span>{score.curveVersion.notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {score.relatedBatch && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">关联库存批次</h3>
          <div className="grid grid-cols-4 gap-4">
            <ParamItem label="批次号" value={score.relatedBatch!.batchCode} />
            <ParamItem label="剩余/总量" value={`${score.relatedBatch!.remaining}/${score.relatedBatch!.quantity} kg`} />
            <ParamItem label="烘焙日期" value={new Date(score.relatedBatch!.roastDate).toLocaleDateString('zh-CN')} />
            <ParamItem label="到期日" value={new Date(score.relatedBatch!.expiryDate).toLocaleDateString('zh-CN')} />
          </div>
          <div className="mt-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              score.relatedBatch!.fifoStatus === 'expired' ? 'bg-red-100 text-red-700' :
              score.relatedBatch!.fifoStatus === 'warning' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {score.relatedBatch!.fifoStatus === 'expired' ? '已过期' :
               score.relatedBatch!.fifoStatus === 'warning' ? '临近过期' : '库存正常'}
            </span>
          </div>
        </div>
      )}
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
