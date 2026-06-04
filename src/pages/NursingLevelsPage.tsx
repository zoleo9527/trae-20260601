import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { ANOMALY_TYPE_LABELS, NURSING_LEVEL_COLORS, NURSING_LEVEL_LABELS, NURSING_LEVEL_STATUS_LABELS, ROLE_LABELS, type AnomalyType, type NursingLevel, type NursingLevelStatus } from '@/types';
import { AlertTriangle, Check, ChevronDown, ChevronRight, Keyboard, RotateCcw, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function NursingLevelsPage() {
  const { nursingLevels, residents, beds, currentRole, confirmNursingLevel, markAnomaly, returnNursingLevel, triggerAlert, addNoteToNursingLevel, selectNursingLevel, selectedNursingLevelId } = useAppStore();
  const [urlParams, setUrlParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<NursingLevelStatus | null>(null);
  const [returnModal, setReturnModal] = useState<{ id: string; residentName: string } | null>(null);
  const [anomalyModal, setAnomalyModal] = useState<{ id: string; residentName: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [pendingStatusFilter, setPendingStatusFilter] = useState<NursingLevelStatus | null>(null);
  const [autoExpandDone, setAutoExpandDone] = useState(false);

  const filteredLevels = useMemo(() => {
    return nursingLevels.filter((nl) => {
      if (statusFilter !== null && nl.status !== statusFilter) return false;
      if (searchQuery) {
        const res = residents.find((r) => r.id === nl.residentId);
        const q = searchQuery.toLowerCase();
        if (!(res && res.name.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [nursingLevels, statusFilter, searchQuery, residents]);

  function getResidentName(residentId: string) {
    return residents.find((r) => r.id === residentId)?.name || '未知';
  }

  function getBedForResident(residentId: string) {
    const bed = beds.find((b) => b.residentId === residentId);
    return bed ? `${bed.roomNumber}房${bed.bedNumber}床` : '—';
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    if (e.key === 'ArrowDown' && filteredLevels.length > 0) {
      e.preventDefault();
      setFocusedRowIndex((prev) => Math.min(prev + 1, filteredLevels.length - 1));
    } else if (e.key === 'ArrowUp' && filteredLevels.length > 0) {
      e.preventDefault();
      setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredLevels[focusedRowIndex]) {
      e.preventDefault();
      const id = filteredLevels[focusedRowIndex].id;
      setDetailId(detailId === id ? null : id);
    } else if (e.key === 'Escape') {
      setDetailId(null);
      setReturnModal(null);
      setAnomalyModal(null);
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const firstPending = filteredLevels.find((nl) => nl.status === 'pending');
      if (firstPending && currentRole === 'nursing_supervisor') {
        confirmNursingLevel(firstPending.id);
      }
    }
  }, [filteredLevels, focusedRowIndex, detailId, currentRole, confirmNursingLevel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (focusedRowIndex >= filteredLevels.length) {
      setFocusedRowIndex(Math.max(0, filteredLevels.length - 1));
    }
  }, [filteredLevels.length, focusedRowIndex]);

  useEffect(() => {
    if (autoExpandDone || nursingLevels.length === 0) return;
    const focusId = urlParams.get('focus');
    const statusParam = urlParams.get('status') as NursingLevelStatus | null;
    
    if (statusParam && ['pending', 'confirmed', 'anomaly', 'returned'].includes(statusParam)) {
      setPendingStatusFilter(statusParam);
      setStatusFilter(statusParam);
    }
    
    if (focusId) {
      setPendingFocusId(focusId);
    } else if (statusParam === 'anomaly') {
      const firstAnomaly = nursingLevels.find((nl) => nl.status === 'anomaly');
      if (firstAnomaly) {
        setPendingFocusId(firstAnomaly.id);
      }
    }
    
    setAutoExpandDone(true);
    urlParams.delete('focus');
    urlParams.delete('status');
    setUrlParams(urlParams, { replace: true });
  }, [autoExpandDone, nursingLevels, urlParams, setUrlParams]);

  useEffect(() => {
    if (!pendingFocusId || filteredLevels.length === 0) return;
    
    const targetInFiltered = filteredLevels.find((nl) => nl.id === pendingFocusId);
    if (targetInFiltered) {
      setDetailId(pendingFocusId);
      const idx = filteredLevels.findIndex((nl) => nl.id === pendingFocusId);
      if (idx >= 0) setFocusedRowIndex(idx);
      setTimeout(() => {
        const row = document.querySelector(`[data-nursing-level-id="${pendingFocusId}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      setPendingFocusId(null);
    }
  }, [pendingFocusId, filteredLevels]);

  const sourceLabels: Record<string, string> = {
    bed_arrangement: '床位安排',
    periodic_assessment: '定期评估',
    anomaly_report: '异常上报',
  };

  const sourceColors: Record<string, string> = {
    bed_arrangement: 'bg-sky-100 text-sky-700',
    periodic_assessment: 'bg-emerald-100 text-emerald-700',
    anomaly_report: 'bg-orange-100 text-orange-700',
  };

  const statusColors: Record<NursingLevelStatus, string> = {
    pending: 'bg-sky-50 text-sky-700 border-sky-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    anomaly: 'bg-red-50 text-red-700 border-red-200',
    returned: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const timelineSourceColors: Record<string, string> = {
    bed_arrangement: 'bg-sky-500',
    periodic_assessment: 'bg-emerald-500',
    anomaly_report: 'bg-orange-500',
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">护理等级</h2>
          <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
            <Keyboard size={10} />
            <span>↑↓ 选择 · Enter 详情 · Ctrl+A 快速确认</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {(['pending', 'confirmed', 'anomaly', 'returned'] as NursingLevelStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={cn('w-1.5 h-1.5 rounded-full', s === 'pending' ? 'bg-sky-500' : s === 'confirmed' ? 'bg-emerald-500' : s === 'anomaly' ? 'bg-red-500' : 'bg-amber-500')} />
              {NURSING_LEVEL_STATUS_LABELS[s]} {nursingLevels.filter((nl) => nl.status === s).length}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索老人姓名"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center gap-1">
          {([null, 'pending', 'confirmed', 'anomaly', 'returned'] as (NursingLevelStatus | null)[]).map((s) => (
            <button
              key={s ?? 'all'}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-1.5 text-[11px] rounded-md border transition-colors',
                statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {s === null ? '全部' : NURSING_LEVEL_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-20">姓名</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-16">床位</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-14">等级</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-16">来源</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600 w-14">状态</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">异常说明</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-600 w-40">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredLevels.map((nl, index) => {
                const resName = getResidentName(nl.residentId);
                const bedLabel = getBedForResident(nl.residentId);
                const isAnomaly = nl.status === 'anomaly';
                const isReturned = nl.status === 'returned';
                const isFocused = focusedRowIndex === index;

                return (
                  <tr
                    key={nl.id}
                    data-nursing-level-id={nl.id}
                    className={cn(
                      'border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors',
                      isAnomaly && 'border-l-2 border-l-red-400 bg-red-50/20',
                      isReturned && 'border-l-2 border-l-amber-400 bg-amber-50/20',
                      detailId === nl.id && 'bg-sky-50/30',
                      isFocused && detailId !== nl.id && 'bg-slate-100/60 ring-1 ring-inset ring-slate-300'
                    )}
                    onClick={() => { setDetailId(detailId === nl.id ? null : nl.id); setFocusedRowIndex(index); }}
                    onMouseEnter={() => setFocusedRowIndex(index)}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800">{resName}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono">{bedLabel}</td>
                    <td className="px-3 py-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', NURSING_LEVEL_COLORS[nl.level])}>
                        {NURSING_LEVEL_LABELS[nl.level]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', sourceColors[nl.source])}>
                        {sourceLabels[nl.source]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border', statusColors[nl.status])}>
                        {NURSING_LEVEL_STATUS_LABELS[nl.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 truncate max-w-[180px]">
                      {nl.anomalyDetail ? nl.anomalyDetail.description : '—'}
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {nl.status === 'pending' && currentRole === 'nursing_supervisor' && (
                          <button
                            onClick={() => confirmNursingLevel(nl.id)}
                            className="px-2 py-1 text-[10px] bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center gap-0.5"
                          >
                            <Check size={10} /> 确认
                          </button>
                        )}
                        {(nl.status === 'pending' || nl.status === 'confirmed') && currentRole === 'care_worker' && (
                          <button
                            onClick={() => setAnomalyModal({ id: nl.id, residentName: resName })}
                            className="px-2 py-1 text-[10px] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex items-center gap-0.5"
                          >
                            <AlertTriangle size={10} /> 异常
                          </button>
                        )}
                        {nl.status === 'anomaly' && currentRole === 'nursing_supervisor' && (
                          <>
                            <button
                              onClick={() => triggerAlert(nl.id)}
                              className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-0.5"
                            >
                              <AlertTriangle size={10} /> 提醒
                            </button>
                            <button
                              onClick={() => setReturnModal({ id: nl.id, residentName: resName })}
                              className="px-2 py-1 text-[10px] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex items-center gap-0.5"
                            >
                              <RotateCcw size={10} /> 退回
                            </button>
                          </>
                        )}
                        {nl.status === 'returned' && currentRole === 'nursing_supervisor' && (
                          <button
                            onClick={() => confirmNursingLevel(nl.id)}
                            className="px-2 py-1 text-[10px] bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center gap-0.5"
                          >
                            <Check size={10} /> 重新确认
                          </button>
                        )}
                        <button
                          onClick={() => setDetailId(detailId === nl.id ? null : nl.id)}
                          className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-slate-600"
                        >
                          {detailId === nl.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {detailId && (
          <DetailPanel
            nursingLevel={nursingLevels.find((nl) => nl.id === detailId)!}
            residentName={getResidentName(nursingLevels.find((nl) => nl.id === detailId)!.residentId)}
            bedLabel={getBedForResident(nursingLevels.find((nl) => nl.id === detailId)!.residentId)}
            onClose={() => setDetailId(null)}
            timelineSourceColors={timelineSourceColors}
            sourceLabels={sourceLabels}
            sourceColors={sourceColors}
          />
        )}
      </div>

      {returnModal && (
        <ReturnModal
          residentName={returnModal.residentName}
          onClose={() => setReturnModal(null)}
          onReturn={(reason) => { returnNursingLevel(returnModal.id, reason); setReturnModal(null); }}
        />
      )}

      {anomalyModal && (
        <AnomalyModal
          residentName={anomalyModal.residentName}
          onClose={() => setAnomalyModal(null)}
          onMark={(detail) => { markAnomaly(anomalyModal.id, detail); setAnomalyModal(null); }}
        />
      )}
    </div>
  );
}

function DetailPanel({ nursingLevel, residentName, bedLabel, onClose, timelineSourceColors, sourceLabels, sourceColors }: {
  nursingLevel: NursingLevel;
  residentName: string;
  bedLabel: string;
  onClose: () => void;
  timelineSourceColors: Record<string, string>;
  sourceLabels: Record<string, string>;
  sourceColors: Record<string, string>;
}) {
  const { addNoteToNursingLevel, beds, residents } = useAppStore();
  const [noteText, setNoteText] = useState('');

  const statusSteps = [
    { label: '床位安排', status: 'done' as const },
    { 
      label: '护理评估', 
      status: nursingLevel.status === 'confirmed' ? 'done' as const : 
              nursingLevel.status === 'pending' ? 'current' as const : 
              nursingLevel.status === 'anomaly' ? 'error' as const :
              nursingLevel.status === 'returned' ? 'warning' as const : 'current' as const
    },
    { 
      label: '已确认', 
      status: nursingLevel.status === 'confirmed' ? 'current' as const : 'pending' as const
    },
  ];

  const getStepStyle = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'current': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'error': return 'bg-red-50 text-red-700 border-red-300';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-300';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  const getStepDotStyle = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500';
      case 'current': return 'bg-sky-500 animate-pulse';
      case 'error': return 'bg-red-500 animate-pulse';
      case 'warning': return 'bg-amber-500 animate-pulse';
      default: return 'bg-slate-300';
    }
  };

  const getLineStyle = (status: string) => {
    return status === 'done' ? 'bg-emerald-300' : 'bg-slate-200';
  };

  const fullTimeline = useMemo(() => {
    const events: Array<{
      id: string;
      type: 'level_change' | 'note' | 'status' | 'anomaly';
      title: string;
      description?: string;
      time: string;
      source: string;
      createdBy: string;
      color: string;
    }> = [];

    events.push({
      id: 'init-' + nursingLevel.id,
      type: 'status',
      title: '床位安排登记',
      description: `入住${bedLabel}，初始等级：${NURSING_LEVEL_LABELS[nursingLevel.level]}`,
      time: nursingLevel.createdAt,
      source: 'bed_arrangement',
      createdBy: 'nursing_supervisor',
      color: timelineSourceColors['bed_arrangement'],
    });

    nursingLevel.history.forEach((h) => {
      events.push({
        id: h.id,
        type: 'level_change',
        title: `等级变更：${NURSING_LEVEL_LABELS[h.fromLevel]} → ${NURSING_LEVEL_LABELS[h.toLevel]}`,
        description: h.note,
        time: h.changedAt,
        source: h.source,
        createdBy: h.changedBy,
        color: timelineSourceColors[h.source] || 'bg-slate-500',
      });
    });

    if (nursingLevel.anomalyDetail) {
      events.push({
        id: 'anomaly-' + nursingLevel.id,
        type: 'anomaly',
        title: nursingLevel.anomalyDetail.action === 'return'
          ? `退回：${ANOMALY_TYPE_LABELS[nursingLevel.anomalyDetail.type]}`
          : `异常标记：${ANOMALY_TYPE_LABELS[nursingLevel.anomalyDetail.type]}`,
        description: nursingLevel.anomalyDetail.description + 
          (nursingLevel.anomalyDetail.returnReason ? `\n退回原因：${nursingLevel.anomalyDetail.returnReason}` : ''),
        time: nursingLevel.anomalyDetail.occurredAt,
        source: 'anomaly_report',
        createdBy: 'care_worker',
        color: nursingLevel.anomalyDetail.action === 'return' ? 'bg-amber-500' : 'bg-red-500',
      });
    }

    nursingLevel.notes.forEach((note) => {
      events.push({
        id: note.id,
        type: 'note',
        title: `${sourceLabels[note.source] || '异常退回'}备注`,
        description: note.content,
        time: note.createdAt,
        source: note.source,
        createdBy: note.createdBy,
        color: note.source === 'bed_arrangement' ? 'bg-sky-500' :
               note.source === 'nursing_level' ? 'bg-emerald-500' : 'bg-amber-500',
      });
    });

    if (nursingLevel.confirmedAt) {
      events.push({
        id: 'confirm-' + nursingLevel.id,
        type: 'status',
        title: '护理等级已确认',
        description: `最终等级：${NURSING_LEVEL_LABELS[nursingLevel.level]}`,
        time: nursingLevel.confirmedAt,
        source: 'nursing_level',
        createdBy: 'nursing_supervisor',
        color: 'bg-emerald-500',
      });
    }

    return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [nursingLevel, bedLabel, timelineSourceColors, sourceLabels]);

  return (
    <div className="w-80 bg-white rounded-lg border border-slate-200 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">{residentName}</h3>
          <p className="text-[10px] text-slate-400">{bedLabel}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={14} className="text-slate-400" /></button>
      </div>

      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider">状态流转</p>
        <div className="flex items-center gap-1">
          {statusSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border',
                getStepStyle(step.status)
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  getStepDotStyle(step.status)
                )} />
                {step.label}
              </div>
              {i < statusSteps.length - 1 && (
                <div className={cn('w-4 h-px', getLineStyle(statusSteps[i].status))} />
              )}
            </div>
          ))}
        </div>
        {nursingLevel.anomalyDetail && (
          <div className="mt-2 p-2 rounded bg-red-50 border border-red-100">
            <div className="flex items-center gap-1 mb-0.5">
              <AlertTriangle size={10} className="text-red-500" />
              <span className="text-[10px] font-medium text-red-700">
                {ANOMALY_TYPE_LABELS[nursingLevel.anomalyDetail.type]}
              </span>
            </div>
            <p className="text-[10px] text-red-600 line-clamp-2">{nursingLevel.anomalyDetail.description}</p>
            {nursingLevel.anomalyDetail.returnReason && (
              <p className="text-[10px] text-amber-600 mt-1">
                <RotateCcw size={8} className="inline mr-0.5" />
                退回：{nursingLevel.anomalyDetail.returnReason}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-b border-slate-100 flex-1 overflow-y-auto">
        <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">完整时间线</p>
        {fullTimeline.length === 0 && (
          <p className="text-[11px] text-slate-400 text-center py-2">暂无记录</p>
        )}
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200" />
          {fullTimeline.map((event, i) => (
            <div key={event.id} className="relative pl-5 pb-3">
              <div className={cn(
                'absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 border-white shrink-0',
                event.color
              )} />
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn(
                  'px-1 py-0.5 rounded text-[8px] font-medium',
                  event.source === 'bed_arrangement' ? 'bg-sky-100 text-sky-700' :
                  event.source === 'nursing_level' ? 'bg-emerald-100 text-emerald-700' :
                  event.source === 'periodic_assessment' ? 'bg-teal-100 text-teal-700' :
                  event.source === 'anomaly_report' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                )}>
                  {event.type === 'level_change' ? '等级变更' :
                   event.type === 'anomaly' && event.title.startsWith('退回') ? '退回' :
                   event.type === 'anomaly' ? '异常' :
                   event.type === 'note' ? '备注' : '状态'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(event.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-700">{event.title}</p>
              {event.description && (
                <p className="text-[10px] text-slate-500 mt-0.5 whitespace-pre-line">{event.description}</p>
              )}
              <p className="text-[9px] text-slate-400 mt-0.5">
                {ROLE_LABELS[event.createdBy as keyof typeof ROLE_LABELS] || event.createdBy}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">流转备注摘要</p>
        <div className="space-y-1.5 max-h-24 overflow-y-auto">
          {nursingLevel.notes.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center py-1">暂无流转备注</p>
          )}
          {nursingLevel.notes.slice(-5).reverse().map((note) => (
            <div key={note.id} className={cn(
              'rounded border px-2 py-1',
              note.source === 'anomaly_return' ? 'border-amber-200 bg-amber-50/50' : 
              note.source === 'bed_arrangement' ? 'border-sky-100 bg-sky-50/30' :
              'border-slate-100'
            )}>
              <div className="flex items-center gap-1 mb-0.5">
                <span className={cn(
                  'text-[8px] px-1 py-0.5 rounded font-medium',
                  note.source === 'bed_arrangement' ? 'bg-sky-100 text-sky-700' :
                  note.source === 'nursing_level' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-amber-100 text-amber-700'
                )}>
                  {sourceLabels[note.source] || '异常退回'}
                </span>
                <span className="text-[8px] text-slate-400 ml-auto">
                  {new Date(note.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 line-clamp-2">{note.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="添加护理等级备注..."
          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md resize-none h-14 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <button
          onClick={() => { if (noteText.trim()) { addNoteToNursingLevel(nursingLevel.id, noteText.trim()); setNoteText(''); } }}
          disabled={!noteText.trim()}
          className="w-full mt-1.5 px-3 py-1.5 text-xs bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          添加备注
        </button>
      </div>
    </div>
  );
}

function ReturnModal({ residentName, onClose, onReturn }: { residentName: string; onClose: () => void; onReturn: (reason: string) => void; }) {
  const [reason, setReason] = useState('');
  const presets = ['护理等级评估不足，需重新安排', '信息填写有误，需更正后重新提交', '老人状况变化，需重新评估'];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[400px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">
            <RotateCcw size={14} className="inline mr-1.5 text-amber-500" />
            退回：{residentName}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={16} className="text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-3">退回后，床位安排环节将收到通知并携带退回原因。</p>
        <div className="space-y-1.5 mb-3">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setReason(p)}
              className={cn(
                'w-full text-left px-3 py-2 text-xs rounded-md border transition-colors',
                reason === p ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="或输入自定义退回原因..."
          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md resize-none h-16 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md">取消</button>
          <button
            onClick={() => { if (reason.trim()) onReturn(reason.trim()); }}
            disabled={!reason.trim()}
            className="px-4 py-1.5 text-xs bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            确认退回
          </button>
        </div>
      </div>
    </div>
  );
}

function AnomalyModal({ residentName, onClose, onMark }: { residentName: string; onClose: () => void; onMark: (detail: import('@/types').AnomalyDetail) => void; }) {
  const [type, setType] = useState<AnomalyType>('health_change');
  const [desc, setDesc] = useState('');
  const [action, setAction] = useState<'alert' | 'return'>('alert');

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[400px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">
            <AlertTriangle size={14} className="inline mr-1.5 text-red-500" />
            标记异常：{residentName}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">异常类型</label>
            <div className="flex gap-1">
              {(['health_change', 'behavior_change', 'family_complaint', 'other'] as AnomalyType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded border transition-colors',
                    type === t ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-200 text-slate-600'
                  )}
                >
                  {ANOMALY_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">异常描述</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="描述异常情况..."
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md resize-none h-16 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">处理方式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAction('alert')}
                className={cn('flex-1 py-2 text-xs rounded-md border font-medium transition-colors',
                  action === 'alert' ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-200 text-slate-600'
                )}
              >
                <AlertTriangle size={10} className="inline mr-1" />
                触发提醒
              </button>
              <button
                onClick={() => setAction('return')}
                className={cn('flex-1 py-2 text-xs rounded-md border font-medium transition-colors',
                  action === 'return' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-200 text-slate-600'
                )}
              >
                <RotateCcw size={10} className="inline mr-1" />
                退回床位安排
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">
              {action === 'alert' ? '将立即通知护理主管，并在床位和护理等级中同步记录' :
               action === 'return' ? '将直接退回床位安排环节，并同步退回原因' : ''}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md">取消</button>
          <button
            onClick={() => {
              if (desc.trim()) {
                onMark({ type, description: desc.trim(), action, occurredAt: new Date().toISOString() });
                onClose();
              }
            }}
            disabled={!desc.trim()}
            className="px-4 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            确认标记
          </button>
        </div>
      </div>
    </div>
  );
}
