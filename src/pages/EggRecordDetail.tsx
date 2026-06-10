import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Link2, Clock, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app';
import type { EggRecord, Anomaly } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: '待完成',
  completed: '已完成',
  anomaly: '异常',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-farm-orange/20 text-farm-orange',
  completed: 'bg-farm-green/20 text-farm-green',
  anomaly: 'bg-farm-red/20 text-farm-red',
};

export default function EggRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openAnomalyDrawer } = useAppStore();
  const [record, setRecord] = useState<EggRecord | null>(null);
  const [anomaly, setAnomaly] = useState<Anomaly | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.eggRecords.get(Number(id));
      setRecord(res.data);
      if (res.data.has_anomaly) {
        try {
          const anomalyRes = await api.anomalies.list({ source_type: 'egg_record', source_id: id });
          if (anomalyRes.data && anomalyRes.data.length > 0) {
            setAnomaly(anomalyRes.data[0]);
          }
        } catch {
          // no anomaly found
        }
      }
    } catch {
      // silently handle
    }
  }, [id]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  if (!record) {
    return (
      <div className="text-center text-farm-muted py-16">加载中...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/egg-records')}
        className="flex items-center gap-2 text-farm-muted hover:text-farm-text mb-4 text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        返回列表
      </button>

      <div className={`bg-farm-card border rounded-lg p-5 mb-4 ${record.has_anomaly ? 'border-farm-red' : 'border-farm-border'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-farm-text font-bold text-lg">
              {record.coop_code || `鸡舍#${record.coop_id}`}
            </h2>
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[record.status]}`}>
              {STATUS_LABELS[record.status]}
            </span>
            {record.has_anomaly && (
              <span className="flex items-center gap-1 text-farm-red text-xs animate-pulse-overdue">
                <AlertTriangle size={12} />
                异常
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-farm-muted text-xs">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date(record.created_at * 1000).toLocaleString('zh-CN')}
          </span>
          {record.sorter_name && (
            <span className="flex items-center gap-1">
              <User size={12} />
              {record.sorter_name}
            </span>
          )}
        </div>
      </div>

      <div className="bg-farm-card border border-farm-border rounded-lg p-5 mb-4">
        <h3 className="text-farm-text font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-farm-orange rounded-full" />
          产蛋数据
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-farm-darker rounded-lg p-4 text-center">
            <div className="text-farm-text font-mono font-bold text-2xl">{record.total_eggs}</div>
            <div className="text-farm-muted text-xs mt-1">总产蛋</div>
          </div>
          <div className="bg-farm-darker rounded-lg p-4 text-center">
            <div className="text-farm-red font-mono font-bold text-2xl">{record.broken_eggs}</div>
            <div className="text-farm-muted text-xs mt-1">破蛋</div>
          </div>
          <div className="bg-farm-darker rounded-lg p-4 text-center">
            <div className="text-farm-yellow font-mono font-bold text-2xl">{record.dirty_eggs}</div>
            <div className="text-farm-muted text-xs mt-1">脏蛋</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-farm-darker rounded-lg p-4 text-center">
            <div className="text-farm-green font-mono font-bold text-2xl">{record.grade_a}</div>
            <div className="text-farm-muted text-xs mt-1">A级</div>
          </div>
          <div className="bg-farm-darker rounded-lg p-4 text-center">
            <div className="text-farm-text font-mono font-bold text-2xl">{record.grade_b}</div>
            <div className="text-farm-muted text-xs mt-1">B级</div>
          </div>
          <div className="bg-farm-darker rounded-lg p-4 text-center">
            <div className="text-farm-muted font-mono font-bold text-2xl">{record.grade_c}</div>
            <div className="text-farm-muted text-xs mt-1">C级</div>
          </div>
        </div>
        {record.notes && (
          <div className="mt-4 bg-farm-darker rounded-lg p-3">
            <span className="text-farm-muted text-xs">备注: </span>
            <span className="text-farm-text text-sm">{record.notes}</span>
          </div>
        )}
      </div>

      {record.inspection_id && (
        <div className="bg-farm-card border border-farm-border rounded-lg p-5 mb-4">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />
            关联巡检卡
          </h3>
          <button
            onClick={() => navigate(`/inspection/${record.inspection_id}`)}
            className="flex items-center gap-2 text-farm-orange hover:text-farm-orange/80 text-sm transition-colors"
          >
            <Link2 size={14} />
            巡检卡 #{record.inspection_id}
          </button>
        </div>
      )}

      {anomaly && (
        <div className="bg-farm-red/10 border border-farm-red/30 rounded-lg p-5">
          <h3 className="text-farm-red font-bold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            异常信息
          </h3>
          <p className="text-farm-text text-sm mb-3">{anomaly.description}</p>
          <div className="flex items-center gap-4 text-xs text-farm-muted mb-3">
            <span>严重程度: {anomaly.severity}</span>
            <span>状态: {anomaly.status}</span>
          </div>
          <button
            onClick={() => openAnomalyDrawer(anomaly)}
            className="bg-farm-red/20 text-farm-red px-4 py-2 rounded text-sm hover:bg-farm-red/30 transition-colors"
          >
            处理异常
          </button>
        </div>
      )}
    </div>
  );
}
