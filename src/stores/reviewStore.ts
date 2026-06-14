import { create } from 'zustand';
import type { RejectNode } from '@/types';
import { REVIEW_CHECKLIST } from '@/data/reviewChecklist';
import { useCaseStore } from '@/stores/caseStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { rejectNodeToStage, rejectNodeToTargetHandlerRole } from '@/utils/flowUtils';
import { uid } from '@/utils/timeUtils';

interface ReviewStore {
  activeCaseId: string | null;
  activeOpinionId: string | null;
  checkedItems: string[];
  rejectedItems: string[];
  rejectDialogOpen: boolean;
  selectedRejectNode: RejectNode | null;
  rejectReason: string;
  submittedOnce: boolean;
  reviewMode: 'none' | 'reviewing' | 'rejecting';
  setActiveCase: (caseId: string | null) => void;
  startReview: () => void;
  toggleCheckItem: (itemId: string) => void;
  markRejected: (itemId: string) => void;
  openRejectDialog: () => void;
  closeRejectDialog: () => void;
  selectRejectNode: (node: RejectNode | null) => void;
  setRejectReason: (reason: string) => void;
  submitReject: () => void;
  submitPass: () => void;
  reset: () => void;
  initFromCase: () => void;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  activeCaseId: null,
  activeOpinionId: null,
  checkedItems: [],
  rejectedItems: [],
  rejectDialogOpen: false,
  selectedRejectNode: null,
  rejectReason: '',
  submittedOnce: false,
  reviewMode: 'none',

  setActiveCase: (caseId) => {
    set({ activeCaseId: caseId });
    get().initFromCase();
  },

  initFromCase: () => {
    const { activeCaseId } = get();
    if (!activeCaseId) return;
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === activeCaseId);
    if (!c) return;
    const latestOpinion = c.opinions[c.opinions.length - 1];
    const latestReview = c.reviews[c.reviews.length - 1];
    set({
      activeOpinionId: latestOpinion?.id || null,
      checkedItems: latestReview?.checkedItems || [],
      rejectedItems: latestReview?.rejectedItems || [],
      reviewMode: c.currentStage === 'quality_review' ? 'reviewing' : 'none',
      submittedOnce: false,
    });
  },

  startReview: () => set({ reviewMode: 'reviewing' }),

  toggleCheckItem: (itemId) =>
    set((s) => {
      const has = s.checkedItems.includes(itemId);
      return {
        checkedItems: has ? s.checkedItems.filter((i) => i !== itemId) : [...s.checkedItems, itemId],
        rejectedItems: s.rejectedItems.filter((i) => i !== itemId),
      };
    }),

  markRejected: (itemId) =>
    set((s) => {
      const inChecked = s.checkedItems.includes(itemId);
      const inRejected = s.rejectedItems.includes(itemId);
      return {
        checkedItems: inChecked ? s.checkedItems.filter((i) => i !== itemId) : s.checkedItems,
        rejectedItems: inRejected
          ? s.rejectedItems.filter((i) => i !== itemId)
          : [...s.rejectedItems, itemId],
      };
    }),

  openRejectDialog: () => set({ rejectDialogOpen: true, reviewMode: 'rejecting' }),
  closeRejectDialog: () => set({ rejectDialogOpen: false, reviewMode: 'reviewing' }),

  selectRejectNode: (node) => set({ selectedRejectNode: node }),
  setRejectReason: (reason) => set({ rejectReason: reason }),

  submitReject: () => {
    const { activeCaseId, activeOpinionId, checkedItems, rejectedItems, selectedRejectNode, rejectReason } = get();
    if (!activeCaseId || !activeOpinionId) return;
    if (!selectedRejectNode) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '请选择退回节点',
        message: '驳回前必须选择退回给受理员/鉴定人/样本环节',
      });
      return;
    }
    if (rejectedItems.length === 0) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '请勾选问题条目',
        message: '驳回操作需至少勾选1条存在问题的审核项',
      });
      return;
    }
    if (!rejectReason.trim()) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '请填写驳回说明',
        message: '必须说明驳回的具体理由，以便责任人修改',
      });
      return;
    }
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === activeCaseId);
    if (!c) return;

    const newStage = rejectNodeToStage(selectedRejectNode);
    const targetRole = rejectNodeToTargetHandlerRole(selectedRejectNode);
    const targetHandler =
      selectedRejectNode === 'back_to_expert' ? (c.opinions[c.opinions.length - 1]?.draftBy || '鉴定人') : '刘受理';

    const reviewId = uid('r');
    cs.pushReview(activeCaseId, {
      id: reviewId,
      caseId: activeCaseId,
      opinionId: activeOpinionId,
      reviewer: '张审（质控）',
      checkedItems: [...checkedItems],
      rejectedItems: [...rejectedItems],
      rejectNode: selectedRejectNode,
      rejectReason,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    const rejectLabels = rejectedItems
      .map((id) => REVIEW_CHECKLIST.find((i) => i.id === id)?.label || id)
      .filter(Boolean);

    cs.pushCorrection(activeCaseId, {
      id: uid('co'),
      caseId: activeCaseId,
      sourceReviewId: reviewId,
      targetRole,
      requiredItems: rejectLabels,
      status: 'in_progress',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    cs.updateCaseStage(
      activeCaseId,
      newStage,
      targetHandler,
      targetRole,
      `质控驳回：${rejectLabels.length}项问题 → 退回${selectedRejectNode === 'back_to_expert' ? '鉴定人' : selectedRejectNode === 'back_to_sample' ? '样本接收' : '受理员'}`,
    );

    cs.markException(activeCaseId, 'opinion_rejected');

    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'error',
      title: '已驳回并生成补录任务单',
      message: `共${rejectLabels.length}项问题，已通知${targetHandler}`,
    });
    useNotificationStore.getState().showBannerAlert({
      id: uid('b'),
      type: 'warning',
      title: `意见书已驳回：${c.caseNo}`,
      message: `退回节点：${selectedRejectNode === 'back_to_expert' ? '鉴定人' : selectedRejectNode === 'back_to_sample' ? '样本异常' : '受理员'}，问题项：${rejectLabels.join('、')}`,
      caseIds: [activeCaseId],
      actionLabel: '查看补录任务',
      actionCaseId: activeCaseId,
    });

    set({
      rejectDialogOpen: false,
      reviewMode: 'none',
      selectedRejectNode: null,
      rejectReason: '',
      submittedOnce: true,
    });
  },

  submitPass: () => {
    const { activeCaseId, activeOpinionId, checkedItems, rejectedItems } = get();
    if (!activeCaseId || !activeOpinionId) return;
    if (rejectedItems.length > 0) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '存在未处理的问题项',
        message: `还有${rejectedItems.length}项标记为有问题，请先处理或使用驳回`,
      });
      return;
    }
    const total = REVIEW_CHECKLIST.length;
    if (checkedItems.length < total) {
      useNotificationStore.getState().pushToast({
        id: uid('t'),
        type: 'warning',
        title: '审核项未完成',
        message: `已通过${checkedItems.length}/${total}项，请完成全部审核后再通过`,
      });
      return;
    }
    const cs = useCaseStore.getState();
    const c = cs.cases.find((x) => x.id === activeCaseId);
    if (!c) return;

    cs.pushReview(activeCaseId, {
      id: uid('r'),
      caseId: activeCaseId,
      opinionId: activeOpinionId,
      reviewer: '张审（质控）',
      checkedItems: [...checkedItems],
      rejectedItems: [],
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    cs.clearException(activeCaseId, 'opinion_rejected');
    cs.clearException(activeCaseId, 'correction_missed');

    cs.setDispatch(activeCaseId, {
      status: 'in_progress',
      blockReasons: [],
    });

    cs.updateCaseStage(activeCaseId, 'dispatch_notice', '王发放', 'receptionist', '质控审核全票通过 → 进入发放登记，待发送领取通知');

    useNotificationStore.getState().pushToast({
      id: uid('t'),
      type: 'success',
      title: '审核通过',
      message: `${c.caseNo} 全部${checkedItems.length}项审核通过，已进入发放登记流程`,
    });

    set({ reviewMode: 'none', submittedOnce: true });
  },

  reset: () =>
    set({
      checkedItems: [],
      rejectedItems: [],
      rejectDialogOpen: false,
      selectedRejectNode: null,
      rejectReason: '',
      reviewMode: 'none',
    }),
}));
