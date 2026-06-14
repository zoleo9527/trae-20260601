import { useMemo } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import { formatDateTime, roleMap, statusMap, riskLevelMap, riskCategoryMap } from '../utils/format';
import type { HistoryRecord, RiskRecord } from '../../shared/types';

interface Props {
  history: HistoryRecord[];
  risks?: RiskRecord[];
}

export default function HistoryTimeline({ history, risks = [] }: Props) {
  const allRecords = useMemo(() => {
    const hRecords = history.map((h) => ({
      id: h.id,
      type: 'history' as const,
      data: h,
      createdAt: h.createdAt,
    }));
    const rRecords = risks.map((r) => ({
      id: r.id,
      type: 'risk' as const,
      data: r,
      createdAt: r.resolved ? (r.resolvedAt || r.markedAt) : r.markedAt,
    }));
    return [...hRecords, ...rRecords].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [history, risks]);

  const riskStats = useMemo(() => {
    const total = risks.length;
    const active = risks.filter((r) => !r.resolved).length;
    const resolved = risks.filter((r) => r.resolved).length;
    return { total, active, resolved };
  }, [risks]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 flex-wrap">
        <span className="w-1 h-4 bg-accent rounded-sm" />
        处理历史（{allRecords.length}条记录）
        {riskStats.total > 0 && (
          <div className="flex items-center gap-2 ml-2">
            {riskStats.active > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 border border-red-200">
                {riskStats.active} 项待处理
              </span>
            )}
            {riskStats.resolved > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 border border-emerald-200">
                {riskStats.resolved} 项已解除
              </span>
            )}
          </div>
        )}
      </h4>
      <div className="space-y-0">
        {allRecords.map((record, idx) => {
          const isLast = idx === allRecords.length - 1;
          if (record.type === 'history') {
            const h = record.data;
            const dotColor = statusMap[h.status]?.dotClass || 'bg-slate-400';
            return (
              <div key={h.id} className={`flex gap-3 ${isLast ? '' : 'timeline-line'}`}>
                <div className={`timeline-dot ${dotColor} mt-0.5 ${idx === 0 ? 'animate-pulse-dot' : ''}`} />
                <div className="flex-1 pb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">{h.action}</span>
                    <StatusBadge status={h.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <Avatar name={h.operatorName} role={h.operatorRole} size="sm" />
                    <span className="text-slate-700 font-medium">{h.operatorName}</span>
                    <span className={`px-1.5 py-0.5 rounded-sm ${roleMap[h.operatorRole].className}`}>
                      {roleMap[h.operatorRole].label}
                    </span>
                    <span className="ml-auto tabular-nums">{formatDateTime(h.createdAt)}</span>
                  </div>
                  {h.remark && (
                    <div className="mt-2 ml-9 pl-3 py-2 pr-3 bg-slate-50 border-l-2 border-slate-200 text-xs text-slate-600 leading-relaxed rounded-sm">
                      {h.remark}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          const r = record.data;
          const dotColor = r.resolved ? 'bg-emerald-400' : riskLevelMap[r.level]?.dotClass || 'bg-slate-400';
          return (
            <div key={`risk-${r.id}`} className={`flex gap-3 ${isLast ? '' : 'timeline-line'}`}>
              <div className={`timeline-dot ${dotColor} mt-0.5 flex items-center justify-center`}>
                {r.resolved ? <ShieldCheck size={8} className="text-white" /> : <ShieldAlert size={8} className="text-white" />}
              </div>
              <div className="flex-1 pb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${r.resolved ? 'text-emerald-700' : 'text-orange-700'}`}>
                    {r.resolved ? '风险解除' : '责任风险标记'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-sm border font-medium ${
                    r.resolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : riskLevelMap[r.level]?.badgeClass || ''
                  }`}>
                    {r.resolved ? '已解除' : riskLevelMap[r.level]?.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {riskCategoryMap[r.category]?.label || r.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <Avatar name={r.resolved ? (r.resolvedByName || r.markedByName) : r.markedByName} size="sm" />
                  <span className="text-slate-700 font-medium">
                    {r.resolved ? (r.resolvedByName || r.markedByName) : r.markedByName}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-sm ${
                    roleMap[r.resolved ? (r.markedByRole as any) : r.markedByRole]?.className || 'bg-slate-100 text-slate-600'
                  }`}>
                    {roleMap[r.resolved ? (r.markedByRole as any) : r.markedByRole]?.label || r.markedByRole}
                  </span>
                  <span className="ml-auto tabular-nums">
                    {formatDateTime(r.resolved ? (r.resolvedAt || r.markedAt) : r.markedAt)}
                  </span>
                </div>
                <div className="mt-2 ml-9 pl-3 py-2 pr-3 bg-slate-50 border-l-2 border-slate-200 text-xs text-slate-600 leading-relaxed rounded-sm">
                  <div className="text-slate-700">
                    <span className="font-medium">{r.resolved ? '原风险原因：' : '风险原因：'}</span>
                    {r.reason}
                  </div>
                  {r.resolved && r.resolveRemark && (
                    <div className="mt-1.5 text-emerald-700">
                      <span className="font-medium">解除说明：</span>
                      {r.resolveRemark}
                      {r.resolvedByName && (
                        <span className="text-slate-400 ml-1">— {r.resolvedByName} 处理</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
