import { create } from 'zustand';
import type { BlockReason } from '@/types';
import { useCaseStore } from '@/stores/caseStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { uid } from '@/utils/timeUtils';
import { BLOCK_REASON_META } from '@/data/constants';

interface DispatchStore {
  dispatchCaseId: string | null;
  replayMode: boolean;
  replayStepIndex: number;
  diagnosisOpen: boolean;
  setDispatchCaseId: (id: string | null) => void;
  toggleReplayMode: () => void;
  setReplayStepIndex: (idx: number) => void;
  toggleDiagnosis: (open?: boolean) => void;
  diagnoseBlockReason: (caseId: string) => BlockReason[];
  markNoticeSent: (caseId: string) => void;
  markSignReceived: (caseId: string, receiver: string, idCard: string) => void;
  markArchived: (caseId: string) => void;
  markBlockReasonResolved: (caseId: string, reason: BlockReason) => void;
  escalateDelay: (caseId: string) => void;
}

export const useDispatchStore = create<DispatchStore>((set, get) => ({
  dispatchCaseId: null,
  replayMode: false,
  replayStepIndex: 0,
  diagnosisOpen: true,

  setDispatchCaseId: (id) => set({ dispatchCaseId: id, replayStepIndex: 0, replayMode: false }),
  toggleReplayMode: () => set((s) => ({ replayMode: !s.replayMode, replayStepIndex: s.replayMode ? 0 : 3 })),
  setReplayStepIndex: (idx) => set({ replayStepIndex: idx }),
  toggleDiagnosis: (open) => set((s) => ({ diagnosisOpen: typeof open === 'boolean' ? open : !s.diagnosisOpen })),

  diagnoseBlockReason: (caseId) => {
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === caseId);
    if (!c || !c.dispatch) return [];
    if (c.dispatch.status === 'completed') return [];
    const d = c.dispatch;
    const reasons: BlockReason[] = [];

    if (d.noticeDate && !d.pickupDate) {
      reasons.push('awaiting_pickup');
    }

    if (d.pickupDate && !d.receiverIdCard) {
      reasons.push('sign_missing');
    }

    const hasUnfinCorrection = c.corrections.some((co) => co.status !== 'completed');
    if (hasUnfinCorrection) {
      reasons.push('correction_unfinished');
    }

    const latestReviewForLatestOpinion = (() => {
      const latestOpinion = c.opinions[c.opinions.length - 1];
      if (!latestOpinion) return null;
      return [...c.reviews].reverse().find((r) => r.opinionId === latestOpinion.id) || null;
    })();
    const hasRejectionOnLatestOpinion =
      latestReviewForLatestOpinion &&
      latestReviewForLatestOpinion.rejectedItems.length > 0;
    if (hasRejectionOnLatestOpinion) {
      reasons.push('recorrection_needed');
    }

    if (!d.receiver && !d.pickupDate && d.noticeDate && c.stuckHours >= 168) {
      reasons.push('approval_pending');
    }

    const uniq = Array.from(new Set(reasons));
    cs.setDispatch(caseId, { blockReasons: uniq });
    return uniq;
  },

  markNoticeSent: (caseId) => {
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === caseId);
    if (!c) return;
    cs.setDispatch(caseId, { noticeDate: new Date().toISOString() });
    cs.updateCaseStage(caseId, 'dispatch_notice', '王发放', 'receptionist', '已发送领取通知，等待委托方领取');
    get().diagnoseBlockReason(caseId);
    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'info',
      title: '通知已发送',
      message: `${c.caseNo} 发放通知已登记，等待委托方领取`,
    });
  },

  markSignReceived: (caseId, receiver, idCard) => {
    const cs = useCaseStore.getState();
    if (!receiver.trim() || !idCard.trim()) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '签收信息不完整',
        message: '请填写签收人姓名及身份证号',
      });
      return;
    }
    const c = cs.cases.find((x) => x.id === caseId);
    if (!c) return;
    cs.setDispatch(caseId, {
      pickupDate: new Date().toISOString(),
      receiver: receiver.trim(),
      receiverIdCard: idCard.trim(),
    });
    cs.updateCaseStage(caseId, 'dispatch_sign', '王发放', 'receptionist', `签收确认完成，签收人：${receiver.trim()}`);
    cs.clearException(caseId, 'dispatch_delay');
    get().diagnoseBlockReason(caseId);
    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'success',
      title: '签收已登记',
      message: `签收人：${receiver}，可进行归档`,
    });
  },

  markArchived: (caseId) => {
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === caseId);
    if (!c || !c.dispatch?.receiverIdCard) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '签收信息未完成',
        message: '请先完成签收确认后再归档',
      });
      return;
    }
    cs.setDispatch(caseId, { archiveDate: new Date().toISOString(), status: 'completed', blockReasons: [] });
    cs.updateCaseStage(caseId, 'archived', '档案室', 'receptionist', '发放完成，案卷归档');
    cs.updateCase(caseId, { status: 'completed' });
    cs.clearException(caseId, 'dispatch_delay');
    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'success',
      title: '已归档',
      message: `${c.caseNo} 发放登记流程全部完成`,
    });
  },

  markBlockReasonResolved: (caseId, reason) => {
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === caseId);
    if (!c || !c.dispatch) return;
    cs.setDispatch(caseId, {
      blockReasons: c.dispatch.blockReasons.filter((r) => r !== reason),
    });
    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'success',
      title: '阻塞问题已标记解决',
      message: BLOCK_REASON_META[reason].label,
    });
  },

  escalateDelay: (caseId) => {
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === caseId);
    if (!c) return;
    cs.markException(caseId, 'dispatch_delay');
    cs.appendFlowLog(
      caseId,
      c.currentStage,
      '发放延迟升级',
      '王发放',
      'receptionist',
      '超过15日未领取，升级发放延迟警报',
    );
    useNotificationStore.getState().showBannerAlert({
      id: uid('b'),
      type: 'error',
      title: `发放延迟警报：${c.caseNo}`,
      message: '已超过15日未领取，建议所领导批准后改为邮寄送达或再次催促',
      caseIds: [caseId],
      actionLabel: '立即处理',
      actionCaseId: caseId,
    });
    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'error',
      title: '已升级发放延迟警报',
      message: '案件将在顶部横幅持续显示直至解决',
    });
  },
}));
