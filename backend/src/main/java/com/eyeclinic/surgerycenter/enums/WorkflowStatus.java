package com.eyeclinic.surgerycenter.enums;

public enum WorkflowStatus {
    PENDING_REGISTRATION("待登记", "接待人员"),
    PREOP_IN_PROGRESS("术前检查进行中", "专业人员"),
    PREOP_REVIEW("术前检查待审核", "审核主管"),
    PREOP_APPROVED("术前检查通过", "系统"),
    PREOP_REJECTED("术前检查驳回", "审核主管"),
    SCHEDULING("手术排期中", "接待人员"),
    SCHEDULE_REVIEW("排期待审核", "审核主管"),
    SCHEDULE_CONFIRMED("已排期确认", "审核主管"),
    SCHEDULE_REJECTED("排期驳回", "审核主管"),
    COMPLETED("流程完成", "系统"),
    CANCELLED("流程取消", "系统");

    private final String description;
    private final String responsibleRole;

    WorkflowStatus(String description, String responsibleRole) {
        this.description = description;
        this.responsibleRole = responsibleRole;
    }

    public String getDescription() {
        return description;
    }

    public String getResponsibleRole() {
        return responsibleRole;
    }
}
