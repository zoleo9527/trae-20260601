import { useState, useMemo } from 'react';
import { useCaseStore } from '@/stores/caseStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDispatchStore } from '@/stores/dispatchStore';
import { validateSampleReject } from '@/utils/flowUtils';
import type { Sample } from '@/types';
import { TestTubeDiagonal, AlertTriangle, Send, X } from 'lucide-react';
import { uid } from '@/utils/timeUtils';
import { ROLE_META } from '@/data/constants';

export default function SampleExceptionButton({ caseId }: { caseId: string }) {
  const cases = useCaseStore((s) => s.cases);
  const caseData = useMemo(() => cases.find((c) => c.id === caseId), [cases, caseId]);
  const [open, setOpen] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (!caseData) return null;

  const abnormalSamples = caseData.samples.filter((s) => s.exceptionNote);
  const canTrigger = ['quality_review', 'expert_examine', 'opinion_draft'].includes(
    caseData.currentStage,
  );

  const trigger = () => {
    if (!canTrigger) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '当前阶段不可退回',
        message: '样本异常退回仅可在检验、起草、审核阶段触发',
      });
      return;
    }
    setSelectedSampleId(abnormalSamples[0]?.id || caseData.samples[0]?.id || null);
    setNote(abnormalSamples[0]?.exceptionNote || '');
    setOpen(true);
  };

  const confirm = () => {
    const cs = useCaseStore.getState();
    const cs_cases = useCaseStore.getState().cases;
    const c = cs_cases.find((x) => x.id === caseId);
    if (!c || !selectedSampleId) return;
    const sample = c.samples.find((s) => s.id === selectedSampleId);
    const valid = validateSampleReject(sample?.status || 'pending', c.currentStage);
    if (!valid.valid) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'error',
        title: '退回失败',
        message: valid.reason || '样本状态异常',
      });
      return;
    }

    cs.updateSample(caseId, selectedSampleId, {
      status: 'overdue',
      exceptionNote: note || sample?.exceptionNote || '样本异常退回',
    });

    cs.markException(caseId, 'sample_abnormal');

    cs.updateCaseStage(
      caseId,
      'sample_receive',
      '刘受理',
      'receptionist',
      `样本异常退回：${sample?.sampleNo} → 通知委托方重新取样`,
    );

    cs.pushCorrection(caseId, {
      id: uid('co'),
      caseId,
      targetRole: 'receptionist',
      requiredItems: [
        `联系委托方说明样本异常情况：${sample?.sampleNo}`,
        `安排委托方重新取样并送检：${note || sample?.exceptionNote || ''}`,
        '完成新样本的接收登记并同步台账',
      ],
      status: 'in_progress',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    useNotificationStore.getState().showBannerAlert({
      id: uid('b'),
      type: 'error',
      title: `样本异常退回：${c.caseNo}`,
      message: `${sample?.sampleNo}（${sample?.sampleType}）已触发异常退回，受理员刘受理已收到样本退回单，请立即联系委托方`,
      caseIds: [caseId],
      actionLabel: '查看退回单',
      actionCaseId: caseId,
    });

    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'error',
      title: '样本异常退回已触发',
      message: `生成样本退回单 + 补录任务，通知受理员`,
    });

    setOpen(false);
  };

  return (
    <>
      <button
        onClick={trigger}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all ${
          abnormalSamples.length > 0
            ? 'border-l-[3px] border-amber-600 bg-amber-50 text-amber-800 hover:bg-amber-100 ring-1 ring-amber-200 animate-pulse-amber'
            : canTrigger
              ? 'border border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50'
              : 'cursor-not-allowed bg-slate-50 text-slate-400 border border-slate-100'
        }`}
        title={canTrigger ? '触发样本异常退回流程' : '当前阶段不可触发'}
      >
        <TestTubeDiagonal className="h-3.5 w-3.5" />
        样本异常退回
        {abnormalSamples.length > 0 && (
          <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-600 px-1 text-[9.5px] font-bold text-white">
            {abnormalSamples.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[520px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white shadow-2xl animate-modal-in">
            <div className="flex items-center justify-between border-b border-rose-100 bg-gradient-to-r from-rose-50 via-amber-50 to-white px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 ring-1 ring-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-rose-800">确认样本异常退回</div>
                  <div className="text-[11px] text-rose-600">
                    触发后将生成样本退回单 + 补录任务，案件回退至样本接收阶段
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <div className="mb-1.5 text-[11.5px] font-semibold text-slate-700">
                  选择异常样本
                </div>
                <div className="space-y-1.5">
                  {caseData.samples.map((s) => (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border-2 p-2.5 transition-all ${
                        selectedSampleId === s.id
                          ? 'border-rose-400 bg-rose-50/60'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        className="mt-1 accent-rose-600"
                        checked={selectedSampleId === s.id}
                        onChange={() => {
                          setSelectedSampleId(s.id);
                          if (s.exceptionNote) setNote(s.exceptionNote);
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold text-slate-800">
                            {s.sampleNo}
                          </span>
                          <span className="text-[11px] text-slate-600">{s.sampleType}</span>
                          {s.exceptionNote && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
                              已有异常记录
                            </span>
                          )}
                        </div>
                        {s.exceptionNote && (
                          <div className="mt-1 rounded bg-white/70 p-1.5 text-[10.5px] text-amber-800 ring-1 ring-amber-100">
                            ⚠ {s.exceptionNote}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-slate-700">
                    异常说明（将写入样本退回单）
                  </span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="描述样本异常情况：污染、溶血、量不足、编号不符、损坏等"
                  className="h-20 w-full resize-none rounded-md border border-slate-300 bg-white p-2.5 text-[12px] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-[11px] leading-relaxed text-amber-900">
                <div className="font-semibold mb-1">触发后将自动执行：</div>
                <ol className="space-y-0.5 list-decimal list-inside text-amber-800">
                  <li>样本状态标记为异常，写入退回说明</li>
                  <li>
                    案件阶段回退至「样本接收」，交由受理员（
                    <span className={ROLE_META.receptionist.color}>刘受理</span>）处理
                  </li>
                  <li>生成补录任务单，含联系委托方、重新取样等事项</li>
                  <li>顶部横幅 + Toast 同步通知，持续显示至问题解决</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 p-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={confirm}
                disabled={!selectedSampleId}
                className={`flex items-center gap-1.5 rounded-md border-l-[3px] border-rose-800 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-rose-200 ${
                  !selectedSampleId ? 'cursor-not-allowed bg-slate-400' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                确认退回并通知受理员
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
