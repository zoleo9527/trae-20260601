import { useEffect, useState } from 'react';
import { X, AlertTriangle, Clock, User, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import type { Anomaly, AnomalyTimelineItem } from '@/lib/api';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-farm-green/20 text-farm-green',
  medium: 'bg-farm-yellow/20 text-farm-yellow',
  high: 'bg-farm-orange/20 text-farm-orange',
  critical: 'bg-farm-red/20 text-farm-red animate-pulse-overdue',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  assigned: '已指派',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export default function AnomalyDrawer() {
  const { anomalyDrawerOpen, currentAnomaly, closeAnomalyDrawer } = useAppStore();
  const { user } = useAuthStore();
  const [timeline, setTimeline] = useState<AnomalyTimelineItem[]>([]);

  useEffect(() => {
    if (currentAnomaly && anomalyDrawerOpen) {
      api.anomalies.timeline(currentAnomaly.id).then((res) => {
        setTimeline(res.data || []);
      }).catch(() => setTimeline([]));
    }
  }, [currentAnomaly, anomalyDrawerOpen]);

  if (!anomalyDrawerOpen || !currentAnomaly) return null;

  const isManager = user?.role === 'manager';

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    if (!currentAnomaly) return;
    try {
      await api.anomalies.update(currentAnomaly.id, { ...data, action } as Partial<Anomaly>);
      closeAnomalyDrawer();
    } catch {
      // error handled silently
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={closeAnomalyDrawer} />
      <div className="relative w-[460px] bg-farm-darker border-l border-farm-border flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-farm-border">
          <h3 className="text-farm-text font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-farm-red" />
            异常详情
          </h3>
          <button onClick={closeAnomalyDrawer} className="text-farm-muted hover:text-farm-text">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-farm-card rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_COLORS[currentAnomaly.severity]}`}>
                {SEVERITY_LABELS[currentAnomaly.severity]}
              </span>
              <span className="text-farm-muted text-xs">{STATUS_LABELS[currentAnomaly.status]}</span>
            </div>
            <p className="text-farm-text text-sm">{currentAnomaly.description}</p>
            <div className="flex items-center gap-4 text-xs text-farm-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {new Date(currentAnomaly.created_at * 1000).toLocaleString('zh-CN')}
              </span>
              <span className="flex items-center gap-1">
                <User size={12} />
                {currentAnomaly.reporter_name || '未知'}
              </span>
            </div>
          </div>

          {currentAnomaly.source_type && (
            <div className="bg-farm-card rounded-lg p-4">
              <h4 className="text-farm-muted text-xs mb-2">来源信息</h4>
              <div className="flex items-center gap-2 text-sm text-farm-text">
                <span className="text-farm-orange">
                  {currentAnomaly.source_type === 'inspection' ? '巡检卡' : '产蛋记录'}
                </span>
                <ChevronRight size={14} className="text-farm-muted" />
                <span>#{currentAnomaly.source_id}</span>
              </div>
              <div className="text-xs text-farm-muted mt-1">鸡舍: {currentAnomaly.coop_code}</div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-farm-muted text-xs font-bold">处理操作</h4>
            {isManager ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('assign', { assignee_id: user?.id })}
                  className="bg-farm-orange/20 text-farm-orange px-3 py-2 rounded text-sm hover:bg-farm-orange/30 transition-colors"
                >
                  指派处理
                </button>
                <button
                  onClick={() => handleAction('escalate')}
                  className="bg-farm-red/20 text-farm-red px-3 py-2 rounded text-sm hover:bg-farm-red/30 transition-colors"
                >
                  升级催办
                </button>
                <button
                  onClick={() => handleAction('close')}
                  className="bg-farm-green/20 text-farm-green px-3 py-2 rounded text-sm hover:bg-farm-green/30 transition-colors"
                >
                  关闭异常
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="bg-farm-card text-farm-muted px-3 py-2 rounded text-sm hover:bg-farm-border transition-colors"
                >
                  驳回
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleAction('update_progress')}
                className="w-full bg-farm-orange/20 text-farm-orange px-3 py-2 rounded text-sm hover:bg-farm-orange/30 transition-colors"
              >
                更新处理进度
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-farm-muted text-xs font-bold">处理时间线</h4>
            {timeline.length === 0 ? (
              <p className="text-farm-muted text-xs">暂无处理记录</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-2 h-2 bg-farm-orange rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-farm-text text-xs font-bold">{item.action}</span>
                        <span className="text-farm-muted text-[10px] font-mono">
                          {new Date(item.created_at * 1000).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {item.content && <p className="text-farm-muted text-xs mt-0.5">{item.content}</p>}
                      <span className="text-farm-muted text-[10px]">{item.operator_name || `用户#${item.operator_id}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
