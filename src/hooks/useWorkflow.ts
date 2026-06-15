import { message } from 'antd';
import { useApi } from '@/services/api';
import {
  getAvailableActions,
  printScheduleTransitions,
  customerDraftTransitions,
  materialPickupTransitions,
  installationTransitions,
} from '@/utils/stateMachine';
import type {
  PrintScheduleStatus,
  CustomerDraftStatus,
  MaterialPickupStatus,
  InstallationStatus,
} from '@/types';
import type { StateTransition } from '@/utils/stateMachine';

export function useWorkflow() {
  const api = useApi();
  const currentUser = api.getCurrentUser();

  const getScheduleAvailableActions = (
    currentStatus: PrintScheduleStatus
  ): StateTransition[] => {
    return getAvailableActions(
      printScheduleTransitions,
      currentStatus,
      currentUser.role
    );
  };

  const getDraftAvailableActions = (
    currentStatus: CustomerDraftStatus
  ): StateTransition[] => {
    return getAvailableActions(
      customerDraftTransitions,
      currentStatus,
      currentUser.role
    );
  };

  const getMaterialPickupAvailableActions = (
    currentStatus: MaterialPickupStatus
  ): StateTransition[] => {
    return getAvailableActions(
      materialPickupTransitions,
      currentStatus,
      currentUser.role
    );
  };

  const getInstallationAvailableActions = (
    currentStatus: InstallationStatus
  ): StateTransition[] => {
    return getAvailableActions(
      installationTransitions,
      currentStatus,
      currentUser.role
    );
  };

  const transitionSchedule = (
    scheduleId: string,
    targetStatus: PrintScheduleStatus,
    remark?: string
  ): boolean => {
    const success = api.updateScheduleStatus(scheduleId, targetStatus, remark);
    if (success) {
      message.success('操作成功');
    } else {
      message.error('操作失败：无权执行此操作或状态转换无效');
    }
    return success;
  };

  const transitionDraft = (
    draftId: string,
    targetStatus: CustomerDraftStatus,
    remark?: string
  ): boolean => {
    const success = api.updateDraftStatus(draftId, targetStatus, remark);
    if (success) {
      message.success('操作成功');
    } else {
      message.error('操作失败：无权执行此操作或状态转换无效');
    }
    return success;
  };

  const transitionMaterialPickup = (
    pickupId: string,
    targetStatus: MaterialPickupStatus
  ): boolean => {
    const success = api.updateMaterialPickupStatus(pickupId, targetStatus);
    if (success) {
      message.success('操作成功');
    } else {
      message.error('操作失败：无权执行此操作或状态转换无效');
    }
    return success;
  };

  const transitionInstallation = (
    installationId: string,
    targetStatus: InstallationStatus,
    updates?: Parameters<typeof api.updateInstallationStatus>[2]
  ): boolean => {
    const success = api.updateInstallationStatus(
      installationId,
      targetStatus,
      updates
    );
    if (success) {
      message.success('操作成功');
    } else {
      message.error('操作失败：无权执行此操作或状态转换无效');
    }
    return success;
  };

  const submitScheduleFromDraft = (
    draftId: string,
    quantity: number,
    priority: 'normal' | 'urgent' | 'emergency' = 'normal'
  ): boolean => {
    const draft = api.getDraftById(draftId);
    if (!draft) {
      message.error('稿件不存在');
      return false;
    }
    if (draft.status !== 'approved') {
      message.error('稿件未审核通过，无法提交排产');
      return false;
    }
    if (currentUser.role === 'processor') {
      message.error('处理人员不能提交排产，请联系前台或店长');
      return false;
    }

    api.createSchedule({
      draftId: draft.id,
      orderNo: draft.orderNo,
      customerName: draft.customerName,
      content: draft.content,
      width: draft.width,
      height: draft.height,
      unit: draft.unit,
      materialType: draft.materialType,
      colorRequirement: draft.colorRequirement,
      quantity,
      installationAddress: draft.installationAddress,
      scheduledInstallDate: draft.scheduledInstallDate,
      priority,
      submittedBy: currentUser.id,
      remark: draft.remark,
    });

    message.success('排产已提交');
    return true;
  };

  const createMaterialPickupForSchedule = (
    scheduleId: string,
    items: Array<{
      materialType: string;
      specification: string;
      unit: string;
      quantity: number;
      unitPrice: number;
    }>
  ): boolean => {
    const schedule = api.getScheduleById(scheduleId);
    if (!schedule) {
      message.error('排产不存在');
      return false;
    }
    if (schedule.status !== 'submitted') {
      message.error('只有已提交的排产才能登记材料领用');
      return false;
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    api.createMaterialPickup({
      scheduleId,
      scheduleNo: schedule.scheduleNo,
      pickedBy: currentUser.id,
      items: items.map((item) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      totalAmount,
    });

    message.success('材料领用已登记');
    return true;
  };

  const reportSizeIssue = (draftId: string, description: string): boolean => {
    const draft = api.getDraftById(draftId);
    if (!draft) return false;

    const success = transitionDraft(draftId, 'size_issue', description);
    if (success) {
      api.createException({
        scheduleId: '',
        scheduleNo: '',
        type: 'size_error',
        description,
        reportedBy: currentUser.id,
      });
    }
    return success;
  };

  const reportColorIssue = (draftId: string, description: string): boolean => {
    const draft = api.getDraftById(draftId);
    if (!draft) return false;

    const success = transitionDraft(draftId, 'color_issue', description);
    if (success) {
      api.createException({
        scheduleId: '',
        scheduleNo: '',
        type: 'color_complaint',
        description,
        reportedBy: currentUser.id,
      });
    }
    return success;
  };

  const reportColorComplaint = (
    scheduleId: string,
    description: string
  ): boolean => {
    const schedule = api.getScheduleById(scheduleId);
    if (!schedule) return false;

    api.createException({
      scheduleId,
      scheduleNo: schedule.scheduleNo,
      type: 'color_complaint',
      description,
      reportedBy: currentUser.id,
    });

    message.success('色差投诉已记录');
    return true;
  };

  const changeInstallTime = (
    installationId: string,
    newDate: string,
    reason: string
  ): boolean => {
    const installation = api.getInstallationById(installationId);
    if (!installation) return false;

    const success = transitionInstallation(installationId, 'time_changed', {
      scheduledDate: newDate,
      remark: reason,
    });

    if (success) {
      api.createException({
        scheduleId: installation.scheduleId,
        scheduleNo: installation.scheduleNo,
        type: 'install_time_change',
        description: `安装时间变更为 ${newDate}，原因：${reason}`,
        reportedBy: currentUser.id,
      });
    }

    return success;
  };

  return {
    getScheduleAvailableActions,
    getDraftAvailableActions,
    getMaterialPickupAvailableActions,
    getInstallationAvailableActions,
    transitionSchedule,
    transitionDraft,
    transitionMaterialPickup,
    transitionInstallation,
    submitScheduleFromDraft,
    createMaterialPickupForSchedule,
    reportSizeIssue,
    reportColorIssue,
    reportColorComplaint,
    changeInstallTime,
  };
}
