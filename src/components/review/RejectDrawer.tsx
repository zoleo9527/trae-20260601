import { useEffect, useMemo } from 'react';
import { useReviewStore } from '@/stores/reviewStore';
import { useCaseStore } from '@/stores/caseStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { REJECT_NODE_META } from '@/data/constants';
import { REVIEW_CHECKLIST, SEVERITY_META } from '@/data/reviewChecklist';
import type { RejectNode } from '@/types';
import { X, Send, ArrowLeftCircle, AlertTriangle, FileWarning } from 'lucide-react';
import { uid } from '@/utils/timeUtils';

export default function RejectDrawer({ caseId }: { caseId: string }) {
  const open = useReviewStore((s) => s.rejectDialogOpen);
  const close = useReviewStore((s) => s.closeRejectDialog);
  const selectedRejectNode = useReviewStore((s) => s.selectedRejectNode);
  const selectRejectNode = useReviewStore((s) => s.selectRejectNode);
  const rejectReason = useReviewStore((s) => s.rejectReason);
  const setRejectReason = useReviewStore((s) => s.setRejectReason);
  const rejectedItems = useReviewStore((s) => s.rejectedItems);
  const submitReject = useReviewStore((s) => s.submitReject);

  const cases = useCaseStore((s) => s.cases);
  const caseData = useMemo(() => cases.find((x) => x.id === caseId), [cases, caseId]);
  const rejectedLabels = rejectedItems
    .map((id) => REVIEW_CHECKLIST.find((i) => i.id === id))
    .filter(Boolean) as typeof REVIEW_CHECKLIST;

  useEffect(() => {
    if (open) {
      selectRejectNode(null);
      setRejectReason('');
    }
  }, [open, selectRejectNode, setRejectReason]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!selectedRejectNode) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '请选择退回节点',
        message: '驳回前必须明确退回到哪个环节',
      });
      return;
    }
    if (rejectedItems.length === 0) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '无驳回条目',
        message: '请先在审核清单中勾选需要驳回的项',
      });
      return;
    }
    if (!rejectReason.trim()) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '请填写驳回说明',
        message: '必须说明具体理由以便责任人理解修改要求',
      });
      return;
    }
    submitReject();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        onClick={close}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-[680px] max-w-[92vw] translate-x-0 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-rose-50 to-white px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100 text-rose-700 ring-1 ring-rose-200">
              <FileWarning className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">意见书驳回操作</div>
              <div className="text-[11px] text-slate-500">
                {caseData?.caseNo} · 选择退回节点 · 勾选问题 · 填写说明 → 生成补录任务单
              </div>
            </div>
          </div>
          <button
            onClick={close}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden bg-slate-200">
          <div className="flex flex-col overflow-hidden bg-white">
            <div className="border-b border-slate-100 px-4 py-2">
              <div className="text-[12px] font-semibold text-slate-700">
                步骤 1：选择退回节点
              </div>
              <div className="text-[10.5px] text-slate-500">
                决定此意见书被退回到哪个处理环节
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {(Object.keys(REJECT_NODE_META) as RejectNode[]).map((node) => {
                const meta = REJECT_NODE_META[node];
                const active = selectedRejectNode === node;
                return (
                  <button
                    key={node}
                    onClick={() => selectRejectNode(active ? null : node)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                      active
                        ? 'border-rose-500 bg-rose-50/60 shadow-sm shadow-rose-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowLeftCircle
                          className={`h-4 w-4 ${
                            active ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`text-[13px] font-semibold ${
                            active ? 'text-rose-800' : 'text-slate-800'
                          }`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          active
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        → {meta.targetRole === 'receptionist' ? '受理员' : '鉴定人'}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                      {meta.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden bg-white">
            <div className="border-b border-slate-100 px-4 py-2">
              <div className="text-[12px] font-semibold text-slate-700">
                步骤 2：确认驳回条目 ({rejectedLabels.length})
              </div>
              <div className="text-[10.5px] text-slate-500">
                以下是已勾选的问题项，将随补录单发送给责任人
              </div>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
              {rejectedLabels.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-400">
                  <AlertTriangle className="mb-1.5 h-8 w-8 opacity-50" />
                  <div className="text-[12px]">请先在审核清单中勾选问题项</div>
                </div>
              ) : (
                rejectedLabels.map((item, idx) => {
                  const sev = SEVERITY_META[item.severity];
                  return (
                    <div
                      key={item.id}
                      className="rounded-md border-l-[3px] border-slate-200 bg-slate-50/60 p-2"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-md bg-slate-800 text-center font-mono text-[10px] font-bold leading-5 text-white">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-sm px-1 text-[9.5px] font-semibold text-white ${sev.color}`}
                            >
                              {item.severity === 'critical'
                                ? '严重'
                                : item.severity === 'major'
                                  ? '重要'
                                  : '一般'}
                            </span>
                            <span className="text-[12px] font-medium text-slate-800">
                              {item.label}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[10.5px] text-slate-600">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-2 text-[11.5px] font-semibold text-slate-700">
            步骤 3：填写驳回说明（必填，将附在补录任务单中）
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={`请详细说明驳回原因和修改建议，例如：
1. 鉴定结论部分缺少排除性论证，请补充；
2. 检验过程中仪器型号未注明，请补充AVS工作站参数配置；
3. ...`}
            className="h-24 w-full resize-none rounded-md border border-slate-300 bg-white p-2.5 text-[12px] text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {selectedRejectNode ? (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  将生成补录任务单 → 通知{' '}
                  <span className="font-semibold text-slate-700">
                    {REJECT_NODE_META[selectedRejectNode].targetRole === 'receptionist' ? '受理员' : '鉴定人'}
                  </span>
                </span>
              ) : (
                <span className="text-amber-600">请先选择退回节点</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={close}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedRejectNode || rejectedItems.length === 0 || !rejectReason.trim()}
                className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[12px] font-semibold text-white transition-all ${
                  !selectedRejectNode || rejectedItems.length === 0 || !rejectReason.trim()
                    ? 'cursor-not-allowed bg-slate-300'
                    : 'border-l-[3px] border-rose-800 bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                确认驳回并生成补录单
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
