package com.elevator.smartparking.service;

import com.elevator.smartparking.dto.ActionItemVO;
import com.elevator.smartparking.entity.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RoleActionService {

    public String getRoleName(UserRole role) {
        return switch (role) {
            case CUSTOMER_SERVICE -> "客服";
            case MAINTENANCE_TECHNICIAN -> "维保技师";
            case PROJECT_MANAGER -> "项目主管";
        };
    }

    public List<ActionItemVO> getFaultNextActions(FaultStatus status, UserRole role) {
        List<ActionItemVO> actions = new ArrayList<>();

        ActionItemVO accept = buildAction("accept", "受理", "受理并派单给处理人",
                canAccept(status, role), status == FaultStatus.PENDING ? null : "当前状态不支持受理");
        actions.add(accept);

        ActionItemVO process = buildAction("process", "处理", "更新处理进度和备注",
                canProcess(status, role), status == FaultStatus.PROCESSING ? null : "当前状态不支持处理");
        actions.add(process);

        ActionItemVO transfer = buildAction("transfer_rescue", "转困人处置", "发现有人被困，转困人处置工单",
                canTransferRescue(status, role), status == FaultStatus.PROCESSING ? null : "仅处理中可转困人");
        actions.add(transfer);

        ActionItemVO complete = buildAction("complete", "完成", "处理完成，关闭工单",
                canComplete(status, role), status == FaultStatus.PROCESSING ? null : "仅处理中可完成");
        actions.add(complete);

        ActionItemVO cancel = buildAction("cancel", "取消", "取消工单",
                canCancel(status, role), (status == FaultStatus.PENDING || status == FaultStatus.PROCESSING) ? null : "当前状态不支持取消");
        actions.add(cancel);

        return actions;
    }

    public List<ActionItemVO> getRescueNextActions(RescueStatus status, UserRole role) {
        List<ActionItemVO> actions = new ArrayList<>();

        ActionItemVO start = buildAction("start", "开始救援", "救援人员到场，开始救援",
                canStartRescue(status, role), status == RescueStatus.PENDING_RESCUE ? null : "当前状态不支持开始救援");
        actions.add(start);

        ActionItemVO progress = buildAction("progress", "更新进度", "更新救援进度和备注",
                canUpdateProgress(status, role), (status == RescueStatus.RESCUING || status == RescueStatus.RESCUED) ? null : "当前状态不支持更新进度");
        actions.add(progress);

        ActionItemVO rescueSuccess = buildAction("rescue_success", "解救成功", "被困人员成功救出",
                canRescueSuccess(status, role), status == RescueStatus.RESCUING ? null : "仅救援中可标记解救成功");
        actions.add(rescueSuccess);

        ActionItemVO complete = buildAction("complete", "完成处置", "后续处理完成，关闭工单",
                canCompleteRescue(status, role), status == RescueStatus.RESCUED ? null : "仅已解救状态可完成");
        actions.add(complete);

        ActionItemVO cancel = buildAction("cancel", "取消", "取消工单",
                canCancelRescue(status, role), (status == RescueStatus.PENDING_RESCUE || status == RescueStatus.RESCUING) ? null : "当前状态不支持取消");
        actions.add(cancel);

        return actions;
    }

    public boolean canViewFault(FaultStatus status, UserRole role) {
        return true;
    }

    public boolean canAccept(FaultStatus status, UserRole role) {
        if (status != FaultStatus.PENDING) return false;
        return role == UserRole.CUSTOMER_SERVICE || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canProcess(FaultStatus status, UserRole role) {
        if (status != FaultStatus.PROCESSING) return false;
        return role == UserRole.MAINTENANCE_TECHNICIAN || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canTransferRescue(FaultStatus status, UserRole role) {
        if (status != FaultStatus.PROCESSING) return false;
        return role == UserRole.MAINTENANCE_TECHNICIAN || role == UserRole.PROJECT_MANAGER || role == UserRole.CUSTOMER_SERVICE;
    }

    public boolean canComplete(FaultStatus status, UserRole role) {
        if (status != FaultStatus.PROCESSING) return false;
        return role == UserRole.MAINTENANCE_TECHNICIAN || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canCancel(FaultStatus status, UserRole role) {
        if (status != FaultStatus.PENDING && status != FaultStatus.PROCESSING) return false;
        return role == UserRole.CUSTOMER_SERVICE || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canStartRescue(RescueStatus status, UserRole role) {
        if (status != RescueStatus.PENDING_RESCUE) return false;
        return role == UserRole.MAINTENANCE_TECHNICIAN || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canUpdateProgress(RescueStatus status, UserRole role) {
        if (status != RescueStatus.RESCUING && status != RescueStatus.RESCUED) return false;
        return role == UserRole.MAINTENANCE_TECHNICIAN || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canRescueSuccess(RescueStatus status, UserRole role) {
        if (status != RescueStatus.RESCUING) return false;
        return role == UserRole.MAINTENANCE_TECHNICIAN || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canCompleteRescue(RescueStatus status, UserRole role) {
        if (status != RescueStatus.RESCUED) return false;
        return role == UserRole.MAINTENANCE_TECHNICIAN || role == UserRole.PROJECT_MANAGER;
    }

    public boolean canCancelRescue(RescueStatus status, UserRole role) {
        if (status != RescueStatus.PENDING_RESCUE && status != RescueStatus.RESCUING) return false;
        return role == UserRole.CUSTOMER_SERVICE || role == UserRole.PROJECT_MANAGER;
    }

    public List<FaultStatus> getFaultVisibleStatuses(UserRole role) {
        return List.of(FaultStatus.values());
    }

    public List<FaultStatus> getFaultTodoStatuses(UserRole role) {
        return switch (role) {
            case CUSTOMER_SERVICE -> List.of(FaultStatus.PENDING, FaultStatus.TRANSFERRED_TO_RESCUE);
            case MAINTENANCE_TECHNICIAN -> List.of(FaultStatus.PROCESSING);
            case PROJECT_MANAGER -> List.of(FaultStatus.PENDING, FaultStatus.PROCESSING, FaultStatus.TRANSFERRED_TO_RESCUE);
        };
    }

    public List<RescueStatus> getRescueTodoStatuses(UserRole role) {
        return switch (role) {
            case CUSTOMER_SERVICE -> List.of(RescueStatus.PENDING_RESCUE);
            case MAINTENANCE_TECHNICIAN -> List.of(RescueStatus.PENDING_RESCUE, RescueStatus.RESCUING, RescueStatus.RESCUED);
            case PROJECT_MANAGER -> List.of(RescueStatus.PENDING_RESCUE, RescueStatus.RESCUING, RescueStatus.RESCUED);
        };
    }

    private ActionItemVO buildAction(String action, String name, String description, boolean available, String disabledReason) {
        ActionItemVO vo = new ActionItemVO();
        vo.setAction(action);
        vo.setActionName(name);
        vo.setDescription(description);
        vo.setAvailable(available);
        vo.setDisabledReason(disabledReason);
        return vo;
    }
}
