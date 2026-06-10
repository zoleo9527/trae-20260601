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

        actions.add(buildFaultAction("accept", "受理", "受理并派单给处理人",
                status, FaultStatus.PENDING, role, List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER),
                "当前状态不支持受理", "当前角色无受理权限"));

        actions.add(buildFaultAction("process", "处理", "更新处理进度和备注",
                status, FaultStatus.PROCESSING, role, List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER),
                "当前状态不支持处理", "当前角色无处理权限"));

        actions.add(buildFaultAction("transfer_rescue", "转困人处置", "发现有人被困，转困人处置工单",
                status, FaultStatus.PROCESSING, role, List.of(UserRole.CUSTOMER_SERVICE, UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER),
                "仅处理中可转困人", "当前角色无转单权限"));

        actions.add(buildFaultAction("complete", "完成", "处理完成，关闭工单",
                status, FaultStatus.PROCESSING, role, List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER),
                "仅处理中可完成", "当前角色无完成权限"));

        actions.add(buildFaultAction("cancel", "取消", "取消工单",
                status, null, role, List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER),
                "当前状态不支持取消", "当前角色无取消权限",
                List.of(FaultStatus.PENDING, FaultStatus.PROCESSING)));

        return actions;
    }

    public List<ActionItemVO> getRescueNextActions(RescueStatus status, UserRole role) {
        List<ActionItemVO> actions = new ArrayList<>();

        actions.add(buildRescueAction("start", "开始救援", "救援人员到场，开始救援",
                status, RescueStatus.PENDING_RESCUE, role, List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER),
                "当前状态不支持开始救援", "当前角色无救援权限"));

        actions.add(buildRescueAction("progress", "更新进度", "更新救援进度和备注",
                status, null, role, List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER),
                "当前状态不支持更新进度", "当前角色无更新权限",
                List.of(RescueStatus.RESCUING, RescueStatus.RESCUED)));

        actions.add(buildRescueAction("rescue_success", "解救成功", "被困人员成功救出",
                status, RescueStatus.RESCUING, role, List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER),
                "仅救援中可标记解救成功", "当前角色无操作权限"));

        actions.add(buildRescueAction("complete", "完成处置", "后续处理完成，关闭工单",
                status, RescueStatus.RESCUED, role, List.of(UserRole.MAINTENANCE_TECHNICIAN, UserRole.PROJECT_MANAGER),
                "仅已解救状态可完成", "当前角色无完成权限"));

        actions.add(buildRescueAction("cancel", "取消", "取消工单",
                status, null, role, List.of(UserRole.CUSTOMER_SERVICE, UserRole.PROJECT_MANAGER),
                "当前状态不支持取消", "当前角色无取消权限",
                List.of(RescueStatus.PENDING_RESCUE, RescueStatus.RESCUING)));

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

    private ActionItemVO buildFaultAction(String action, String name, String description,
                                     FaultStatus currentStatus, FaultStatus requiredStatus,
                                     UserRole role, List<UserRole> allowedRoles,
                                     String statusDisabledReason, String roleDisabledReason) {

        boolean statusOk = requiredStatus == null || currentStatus == requiredStatus;
        boolean roleOk = allowedRoles.contains(role);
        boolean available = statusOk && roleOk;

        String disabledReason = null;
        if (!statusOk) {
            disabledReason = statusDisabledReason;
        } else if (!roleOk) {
            disabledReason = roleDisabledReason;
        }

        return buildAction(action, name, description, available, disabledReason);
    }

    private ActionItemVO buildFaultAction(String action, String name, String description,
                                     FaultStatus currentStatus, FaultStatus requiredStatus,
                                     UserRole role, List<UserRole> allowedRoles,
                                     String statusDisabledReason, String roleDisabledReason,
                                     List<FaultStatus> allowedStatuses) {

        boolean statusOk = allowedStatuses.contains(currentStatus);
        boolean roleOk = allowedRoles.contains(role);
        boolean available = statusOk && roleOk;

        String disabledReason = null;
        if (!statusOk) {
            disabledReason = statusDisabledReason;
        } else if (!roleOk) {
            disabledReason = roleDisabledReason;
        }

        return buildAction(action, name, description, available, disabledReason);
    }

    private ActionItemVO buildRescueAction(String action, String name, String description,
                                      RescueStatus currentStatus, RescueStatus requiredStatus,
                                      UserRole role, List<UserRole> allowedRoles,
                                      String statusDisabledReason, String roleDisabledReason) {

        boolean statusOk = requiredStatus == null || currentStatus == requiredStatus;
        boolean roleOk = allowedRoles.contains(role);
        boolean available = statusOk && roleOk;

        String disabledReason = null;
        if (!statusOk) {
            disabledReason = statusDisabledReason;
        } else if (!roleOk) {
            disabledReason = roleDisabledReason;
        }

        return buildAction(action, name, description, available, disabledReason);
    }

    private ActionItemVO buildRescueAction(String action, String name, String description,
                                      RescueStatus currentStatus, RescueStatus requiredStatus,
                                      UserRole role, List<UserRole> allowedRoles,
                                      String statusDisabledReason, String roleDisabledReason,
                                      List<RescueStatus> allowedStatuses) {

        boolean statusOk = allowedStatuses.contains(currentStatus);
        boolean roleOk = allowedRoles.contains(role);
        boolean available = statusOk && roleOk;

        String disabledReason = null;
        if (!statusOk) {
            disabledReason = statusDisabledReason;
        } else if (!roleOk) {
            disabledReason = roleDisabledReason;
        }

        return buildAction(action, name, description, available, disabledReason);
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
