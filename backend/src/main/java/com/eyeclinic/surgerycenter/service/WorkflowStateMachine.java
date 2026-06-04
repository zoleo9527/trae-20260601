package com.eyeclinic.surgerycenter.service;

import com.eyeclinic.surgerycenter.enums.ErrorCode;
import com.eyeclinic.surgerycenter.enums.RoleType;
import com.eyeclinic.surgerycenter.enums.WorkflowStatus;
import com.eyeclinic.surgerycenter.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class WorkflowStateMachine {

    public boolean canTransition(WorkflowStatus currentStatus, WorkflowStatus targetStatus, RoleType userRole) {
        return switch (currentStatus) {
            case PENDING_REGISTRATION -> canTransitionFromPendingRegistration(targetStatus, userRole);
            case PREOP_IN_PROGRESS -> canTransitionFromPreopInProgress(targetStatus, userRole);
            case PREOP_REVIEW -> canTransitionFromPreopReview(targetStatus, userRole);
            case PREOP_APPROVED -> canTransitionFromPreopApproved(targetStatus, userRole);
            case PREOP_REJECTED -> canTransitionFromPreopRejected(targetStatus, userRole);
            case SCHEDULING -> canTransitionFromScheduling(targetStatus, userRole);
            case SCHEDULE_REVIEW -> canTransitionFromScheduleReview(targetStatus, userRole);
            case SCHEDULE_CONFIRMED -> canTransitionFromScheduleConfirmed(targetStatus, userRole);
            case SCHEDULE_REJECTED -> canTransitionFromScheduleRejected(targetStatus, userRole);
            case COMPLETED, CANCELLED -> false;
        };
    }

    private boolean canTransitionFromPendingRegistration(WorkflowStatus target, RoleType role) {
        return target == WorkflowStatus.PREOP_IN_PROGRESS && role == RoleType.RECEPTIONIST;
    }

    private boolean canTransitionFromPreopInProgress(WorkflowStatus target, RoleType role) {
        return target == WorkflowStatus.PREOP_REVIEW && role == RoleType.SPECIALIST;
    }

    private boolean canTransitionFromPreopReview(WorkflowStatus target, RoleType role) {
        if (role != RoleType.SUPERVISOR) return false;
        return target == WorkflowStatus.PREOP_APPROVED || target == WorkflowStatus.PREOP_REJECTED;
    }

    private boolean canTransitionFromPreopApproved(WorkflowStatus target, RoleType role) {
        return target == WorkflowStatus.SCHEDULING && role == RoleType.RECEPTIONIST;
    }

    private boolean canTransitionFromPreopRejected(WorkflowStatus target, RoleType role) {
        return target == WorkflowStatus.PREOP_IN_PROGRESS && role == RoleType.SPECIALIST;
    }

    private boolean canTransitionFromScheduling(WorkflowStatus target, RoleType role) {
        return target == WorkflowStatus.SCHEDULE_REVIEW && role == RoleType.RECEPTIONIST;
    }

    private boolean canTransitionFromScheduleReview(WorkflowStatus target, RoleType role) {
        if (role != RoleType.SUPERVISOR) return false;
        return target == WorkflowStatus.SCHEDULE_CONFIRMED || target == WorkflowStatus.SCHEDULE_REJECTED;
    }

    private boolean canTransitionFromScheduleConfirmed(WorkflowStatus target, RoleType role) {
        return target == WorkflowStatus.COMPLETED;
    }

    private boolean canTransitionFromScheduleRejected(WorkflowStatus target, RoleType role) {
        return target == WorkflowStatus.SCHEDULING && role == RoleType.RECEPTIONIST;
    }

    public void validateTransition(WorkflowStatus current, WorkflowStatus target, RoleType role) {
        if (!canTransition(current, target, role)) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION,
                    String.format("无法从状态[%s]流转到[%s]，当前角色[%s]无权限",
                            current.getDescription(), target.getDescription(), role.getDescription()));
        }
    }

    public Set<WorkflowStatus> getCompletedStatuses() {
        return Set.of(WorkflowStatus.COMPLETED, WorkflowStatus.CANCELLED);
    }

    public String getBlockReason(WorkflowStatus status) {
        return switch (status) {
            case PENDING_REGISTRATION -> "等待接待人员登记并启动检查流程";
            case PREOP_IN_PROGRESS -> "等待专业人员完成术前检查项目";
            case PREOP_REVIEW -> "等待审核主管审核术前检查结果";
            case PREOP_REJECTED -> "术前检查被驳回，需专业人员重新检查";
            case PREOP_APPROVED -> "术前检查通过，等待接待人员安排手术";
            case SCHEDULING -> "等待接待人员完成手术排期";
            case SCHEDULE_REVIEW -> "等待审核主管审核手术排期";
            case SCHEDULE_REJECTED -> "手术排期被驳回，需接待人员重新安排";
            case SCHEDULE_CONFIRMED -> "手术排期已确认，等待手术执行";
            case COMPLETED -> "流程已完成";
            case CANCELLED -> "流程已取消";
        };
    }
}
