import { useEffect, useState, useMemo } from 'react';
import type { Case, BlockReason } from '@/types';
import { useDispatchStore } from '@/stores/dispatchStore';
import DispatchTimeline from '@/components/dispatch/DispatchTimeline';
import BlockDiagnosisPanel from '@/components/dispatch/BlockDiagnosisPanel';
import ReplayControls from '@/components/dispatch/ReplayControls';
import { useCaseStore } from '@/stores/caseStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Package, UserCheck, Archive, Bell, Send, User, IdCard } from 'lucide-react';
import { uid } from '@/utils/timeUtils';

interface Props {
  caseData: Case;
}

export default function DispatchModule({ caseData }: Props) {
  const dispatch = caseData.dispatch;
  const caseId = caseData.id;
  const setDispatchCaseId = useDispatchStore((s) => s.setDispatchCaseId);
  const diagnoseBlockReason = useDispatchStore((s) => s.diagnoseBlockReason);
  const markNoticeSent = useDispatchStore((s) => s.markNoticeSent);
  const markSignReceived = useDispatchStore((s) => s.markSignReceived);
  const markArchived = useDispatchStore((s) => s.markArchived);
  const escalateDelay = useDispatchStore((s) => s.escalateDelay);
  const markBlockReasonResolved = useDispatchStore((s) => s.markBlockReasonResolved);
  const diagnosisOpen = useDispatchStore((s) => s.diagnosisOpen);
  const toggleDiagnosis = useDispatchStore((s) => s.toggleDiagnosis);
  const replayMode = useDispatchStore((s) => s.replayMode);
  const toggleReplayMode = useDispatchStore((s) => s.toggleReplayMode);

  const [receiver, setReceiver] = useState(dispatch?.receiver || '');
  const [idCard, setIdCard] = useState(dispatch?.receiverIdCard || '');

  useEffect(() => {
    setDispatchCaseId(caseId);
    return () => setDispatchCaseId(null);
  }, [caseId, setDispatchCaseId]);

  useEffect(() => {
    if (dispatch) {
      diagnoseBlockReason(caseId);
    }
  }, [caseId, dispatch, diagnoseBlockReason]);

  useEffect(() => {
    setReceiver(dispatch?.receiver || '');
    setIdCard(dispatch?.receiverIdCard || '');
  }, [dispatch?.receiver, dispatch?.receiverIdCard]);

  const canDispatch = ['dispatch_notice', 'dispatch_sign', 'archived'].includes(caseData.currentStage);
  const hasPassed =
    caseData.reviews.some((r) => r.status === 'completed' && r.rejectedItems.length === 0) ||
    canDispatch;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">发放登记与回看</div>
            <div className="text-[11px] text-slate-500">
              审核通过 → 通知 → 签收 → 归档 · 支持回看模式
            </div>
          </div>
        </div>
        <ReplayControls caseData={caseData} />
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-[55%] flex flex-col border-r border-slate-200 overflow-hidden">
          <DispatchTimeline caseData={caseData} />
        </div>

        <div className="w-[45%] flex flex-col overflow-hidden bg-slate-50/40">
          <div className="border-b border-slate-200 bg-white/80 px-4 py-2">
            <div className="text-[12px] font-semibold text-slate-700">发放操作区</div>
            <div className="text-[10.5px] text-slate-500">
              按顺序执行发放步骤，每步操作均写入流转记录
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!hasPassed ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-[11.5px] text-slate-500">
                <Bell className="mx-auto mb-1.5 h-6 w-6 text-slate-400" />
                <div className="font-medium">尚未进入发放阶段</div>
                <div className="mt-0.5 text-[10.5px] text-slate-400">
                  请先完成意见书审核（全部通过）
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-sky-600" />
                    <span className="text-[11.5px] font-semibold text-slate-700">步骤1：发送领取通知</span>
                    {dispatch?.noticeDate && (
                      <span className="ml-auto rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        已完成
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-[10.5px] text-slate-500">
                    电话/短信通知委托方领取意见书，记录通知时间
                  </p>
                  <button
                    onClick={() => markNoticeSent(caseId)}
                    disabled={!!dispatch?.noticeDate || replayMode}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium ${
                      dispatch?.noticeDate || replayMode
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : 'bg-sky-600 text-white hover:bg-sky-700'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {dispatch?.noticeDate ? '已发送领取通知' : '发送通知并记录时间'}
                  </button>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-[11.5px] font-semibold text-slate-700">步骤2：签收确认</span>
                    {dispatch?.receiverIdCard && (
                      <span className="ml-auto rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        已完成
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-[10.5px] text-slate-500">
                    核验领取人身份，登记姓名和身份证号
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="签收人姓名"
                        disabled={!!dispatch?.receiverIdCard || replayMode}
                        className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-[11.5px] outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IdCard className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        value={idCard}
                        onChange={(e) => setIdCard(e.target.value)}
                        placeholder="身份证号（建议记录后8位或脱敏）"
                        disabled={!!dispatch?.receiverIdCard || replayMode}
                        className="flex-1 rounded-md border border-slate-200 px-2 py-1 font-mono text-[11.5px] outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <button
                      onClick={() => markSignReceived(caseId, receiver, idCard)}
                      disabled={!!dispatch?.receiverIdCard || replayMode || !dispatch?.noticeDate}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium ${
                        dispatch?.receiverIdCard || replayMode || !dispatch?.noticeDate
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {dispatch?.receiverIdCard ? `签收人：${dispatch.receiver}` : '确认签收并登记'}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5 text-slate-700" />
                    <span className="text-[11.5px] font-semibold text-slate-700">步骤3：归档结案</span>
                    {caseData.currentStage === 'archived' && (
                      <span className="ml-auto rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        已归档
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-[10.5px] text-slate-500">
                    完成全部发放步骤，案卷正式归档
                  </p>
                  <button
                    onClick={() => markArchived(caseId)}
                    disabled={
                      caseData.currentStage === 'archived' ||
                      replayMode ||
                      !dispatch?.receiverIdCard
                    }
                    className={`flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium ${
                      caseData.currentStage === 'archived' ||
                      replayMode ||
                      !dispatch?.receiverIdCard
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : 'bg-slate-800 text-white hover:bg-slate-900'
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {caseData.currentStage === 'archived' ? '案卷已归档' : '归档并结案'}
                  </button>
                </div>

                {dispatch?.noticeDate &&
                  !dispatch?.receiverIdCard &&
                  caseData.stuckHours > 48 && (
                    <button
                      onClick={() => escalateDelay(caseId)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border-l-[3px] border-rose-800 bg-rose-50 px-3 py-1.5 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                    >
                      <span className="animate-pulse">⚠</span>
                      发放超 {Math.round(caseData.stuckHours / 24)} 天，升级延迟警报
                    </button>
                  )}
              </>
            )}

            {dispatch && dispatch.blockReasons.length > 0 && (
              <BlockDiagnosisPanel
                reasons={dispatch.blockReasons}
                onResolve={(r) => markBlockReasonResolved(caseId, r)}
                open={diagnosisOpen}
                onToggle={() => toggleDiagnosis()}
                replayMode={replayMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
