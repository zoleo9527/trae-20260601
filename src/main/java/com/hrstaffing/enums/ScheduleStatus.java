package com.hrstaffing.enums;

import java.util.Arrays;
import java.util.List;

public enum ScheduleStatus {

    DRAFT("DRAFT", "草稿", "排班初始状态，可编辑删除"),
    SUBMITTED("SUBMITTED", "已提交", "已提交给驻场主管确认"),
    CONFIRMED("CONFIRMED", "已确认", "驻场主管已确认，可进入薪酬核算"),
    EXCEPTION("EXCEPTION", "异常中", "存在异常，走异常确认流程");

    private final String code;
    private final String label;
    private final String description;

    ScheduleStatus(String code, String label, String description) {
        this.code = code;
        this.label = label;
        this.description = description;
    }

    public String getCode() { return code; }
    public String getLabel() { return label; }
    public String getDescription() { return description; }

    public static List<ScheduleStatus> transitionableFrom(ScheduleStatus current) {
        return switch (current) {
            case DRAFT -> Arrays.asList(SUBMITTED);
            case SUBMITTED -> Arrays.asList(CONFIRMED, EXCEPTION);
            case EXCEPTION -> Arrays.asList(CONFIRMED, SUBMITTED);
            case CONFIRMED -> List.of();
        };
    }

    public boolean canTransitionTo(ScheduleStatus target) {
        return transitionableFrom(this).contains(target);
    }
}
