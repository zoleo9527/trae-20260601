import { useState, useEffect, useMemo } from 'react';
import type { Case } from '@/types';
import { useCaseStore } from '@/stores/caseStore';
import { useReviewStore } from '@/stores/reviewStore';
import ReviewPanel from '@/components/review/ReviewPanel';
import DispatchModule from '@/components/dispatch/DispatchModule';
import CorrectionTaskCard from '@/components/common/CorrectionTaskCard';
import StatusBadge from '@/components/case/StatusBadge';
import RoleAvatar from '@/components/common/RoleAvatar';
import { STAGE_META, ROLE_META } from '@/data/constants';
import {
  FileBadge,
  TestTube,
  Scale,
  Package,
  ClipboardCheck,
  History,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
} from 'lucide-react';
import { formatDateTime } from '@/utils/timeUtils';

type TabKey = 'overview' | 'review' | 'dispatch' | 'corrections' | 'flow';

export default function CaseDetailPanel() {
  const caseId = useCaseStore((s) => s.activeCaseId);
  const cases = useCaseStore((s) => s.cases);
  const caseData = useMemo(() => cases.find((c) => c.id === caseId), [cases, caseId]);
  const selectCase = useCaseStore((s) => s.selectCase);
  const setActiveCase = useReviewStore((s) => s.setActiveCase);
  const [tab, setTab] = useState<TabKey>('overview');
  const [logsOpen, setLogsOpen] = useState(true);

  useEffect(() => {
    if (caseData) {
      if (caseData.currentStage === 'quality_review') setTab('review');
      else if (['dispatch_notice', 'dispatch_sign', 'archived'].includes(caseData.currentStage))
        setTab('dispatch');
      else if (caseData.corrections.length > 0) setTab('corrections');
      else setTab('overview');
    }
  }, [caseId]);

  useEffect(() => {
    return () => {
      setActiveCase(null);
    };
  }, [caseId, setActiveCase]);

  if (!caseData || !caseId) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/60">
        <div className="text-center text-slate-400">
          <Eye className="mx-auto mb-2 h-10 w-10 opacity-50" />
          <div className="text-sm font-medium">选择案件查看详情</div>
          <div className="mt-1 text-[11px] text-slate-400">
            从左侧案件列表点击卡片，查看审核/发放/补录/流转
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500">
              {caseData.caseNo}
            </span>
            <StatusBadge
              stage={caseData.currentStage}
              status={caseData.status}
              stuckHours={caseData.stuckHours}
              arrivedAt={caseData.flowLogs[caseData.flowLogs.length - 1]?.timestamp}
            />
            {caseData.hasException && caseData.exceptionTypes.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-medium text-rose-700 ring-1 ring-rose-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                异常标记 ×{caseData.exceptionTypes.length}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-[14px] font-bold leading-tight text-slate-900 line-clamp-2">
            {caseData.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
            <span>
              委托方：<span className="font-medium text-slate-700">{caseData.entrustParty}</span>
            </span>
            <span>
              受理：
              <span className="font-mono">{formatDateTime(caseData.entrustDate).slice(0, 10)}</span>
            </span>
            <div className="inline-flex items-center gap-1">
              当前处理：
              <RoleAvatar
                name={caseData.currentHandler}
                role={caseData.currentHandlerRole}
                size="sm"
                showName
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => selectCase(null)}
          className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="关闭详情"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="flex shrink-0 items-stretch gap-px border-b border-slate-200 bg-slate-100/70 px-1 pt-1">
        {(
          [
            ['overview', '概览', FileBadge],
            ['review', '意见书审核', Scale],
            ['dispatch', '发放登记', Package],
            ['corrections', `补录任务${caseData.corrections.length > 0 ? ` (${caseData.corrections.length})` : ''}`, ClipboardCheck],
            ['flow', `流转记录(${caseData.flowLogs.length})`, History],
          ] as const
        ).map(([key, label, Icon]) => {
          const active = tab === key;
          const showBadge =
            key === 'corrections' &&
            caseData.corrections.some((c) => c.status !== 'completed');
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 border-t-2 px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                active
                  ? 'border-t-[#1e3a5f] bg-white text-slate-900 -mb-px'
                  : 'border-t-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {showBadge && (
                <span className="ml-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'overview' && <OverviewTab caseData={caseData} logsOpen={logsOpen} setLogsOpen={setLogsOpen} />}
        {tab === 'review' && <ReviewPanel caseId={caseId} />}
        {tab === 'dispatch' && <DispatchModule caseData={caseData} />}
        {tab === 'corrections' && (
          <div className="h-full overflow-y-auto p-4">
            <CorrectionTaskCard caseData={caseData} />
          </div>
        )}
        {tab === 'flow' && (
          <div className="h-full overflow-y-auto p-4">
            <FlowLogList caseData={caseData} />
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewTab({
  caseData,
  logsOpen,
  setLogsOpen,
}: {
  caseData: Case;
  logsOpen: boolean;
  setLogsOpen: (v: boolean) => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-700">
            <TestTube className="h-3.5 w-3.5" />
            样本信息
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{caseData.samples.length}</div>
          <div className="mt-0.5 text-[10.5px] text-slate-500">
            异常：{caseData.samples.filter((s) => s.exceptionNote).length}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
            <Scale className="h-3.5 w-3.5" />
            审核轮次
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{caseData.reviews.length}</div>
          <div className="mt-0.5 text-[10.5px] text-slate-500">
            驳回总数：{caseData.reviews.reduce((n, r) => n + r.rejectedItems.length, 0)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
            <Package className="h-3.5 w-3.5" />
            发放状态
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            {caseData.dispatch ? (STAGE_META[caseData.currentStage].label) : '未开始'}
          </div>
          <div className="mt-0.5 text-[10.5px] text-slate-500">
            阻塞：{caseData.dispatch?.blockReasons.length || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {caseData.samples.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-700">样本明细</span>
              <span className="text-[10.5px] text-slate-500">{caseData.samples.length} 份</span>
            </div>
            <div className="space-y-1.5">
              {caseData.samples.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-md p-2 text-[11px] ${
                    s.exceptionNote
                      ? 'border-l-2 border-amber-500 bg-amber-50/60'
                      : 'bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-800">{s.sampleNo}</span>
                    <span className="text-slate-500">{s.sampleType}</span>
                  </div>
                  {s.exceptionNote && (
                    <div className="mt-0.5 text-[10.5px] text-amber-800">⚠ {s.exceptionNote}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-700">意见书版本</span>
            <span className="text-[10.5px] text-slate-500">{caseData.opinions.length} 版</span>
          </div>
          <div className="space-y-1.5">
            {caseData.opinions.slice().reverse().map((o, i) => (
              <div
                key={o.id}
                className={`rounded-md p-2 text-[11px] ${
                  i === 0 ? 'border-l-2 border-emerald-500 bg-emerald-50/60' : 'bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">V{o.version}</span>
                  <span className="font-mono text-slate-500">
                    {formatDateTime(o.submitDate).slice(5, 16)}
                  </span>
                </div>
                <div className="text-slate-600">起草：{o.draftBy} · {o.status === 'completed' ? '已提交' : '处理中'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {caseData.corrections.length > 0 && (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 text-[12px] font-semibold text-slate-700">补录任务概览</div>
          <CorrectionTaskCard caseData={caseData} />
        </div>
      )}

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <button
          onClick={() => setLogsOpen(!logsOpen)}
          className="flex w-full items-center justify-between gap-2 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
        >
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
            <History className="h-3.5 w-3.5" />
            流转记录（{caseData.flowLogs.length}）
          </span>
          {logsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {logsOpen && (
          <div className="p-3">
            <FlowLogList caseData={caseData} compact />
          </div>
        )}
      </div>
    </div>
  );
}

function FlowLogList({ caseData, compact = false }: { caseData: Case; compact?: boolean }) {
  return (
    <div className="relative">
      {!compact && (
        <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-slate-200" />
      )}
      <div className={compact ? 'space-y-1' : 'space-y-2.5'}>
        {[...caseData.flowLogs].reverse().map((log, idx) => {
          const isLatest = idx === 0;
          const meta = STAGE_META[log.stage];
          return (
            <div
              key={log.id}
              className={`relative ${compact ? 'flex items-start gap-2' : 'flex gap-3 pl-6'}`}
            >
              {!compact && (
                <span
                  className={`absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white text-[10px] font-bold ${
                    isLatest
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 animate-pulse'
                      : 'bg-white border-2 border-slate-200 text-slate-500'
                  }`}
                >
                  {caseData.flowLogs.length - idx}
                </span>
              )}
              {compact && (
                <span
                  className={`mt-0.5 inline-block w-1.5 self-stretch shrink-0 rounded-sm ${meta.borderColor.replace('border-', 'bg-')}`}
                />
              )}
              <div
                className={`flex-1 min-w-0 ${
                  compact ? 'rounded bg-slate-50/60 p-1.5' : ''
                }`}
              >
                <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'text-[10.5px]' : 'text-[11.5px]'}`}>
                  <span className={`font-semibold ${meta.color}`}>{log.action}</span>
                  <span className="text-slate-400">→</span>
                  <span className={`${ROLE_META[log.operatorRole].color} font-medium`}>
                    {log.operator}
                  </span>
                  <span className="font-mono text-slate-400 ml-auto">
                    {compact ? formatDateTime(log.timestamp).slice(5, 16) : formatDateTime(log.timestamp)}
                  </span>
                </div>
                <div className={`mt-0.5 text-slate-600 ${compact ? 'text-[10.5px]' : 'text-[11px]'}`}>
                  {log.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
