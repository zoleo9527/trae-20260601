package com.hrstaffing.enums;

import java.util.Arrays;
import java.util.List;

public enum ExceptionStatus {

    PENDING("PENDING", "待确认", "驻场主管待处理"),
    REJECTED("REJECTED", "已驳回", "主管驳回，招聘专员需补录，带时效"),
    SUPPLEMENTED("SUPPLEMENTED", "已补录", "招聘专员补录完成，等待主管复审"),
    CONFIRMED("CONFIRMED", "已确认", "异常已确认处理完毕"),
    CLOSED("CLOSED", "已关闭", "会计薪酬核算后归档");

    private final String code;
    private final String label;
    private final String description;

    ExceptionStatus(String code, String label, String description) {
        this.code = code;
        this.label = label;
        this.description = description;
    }

    public String getCode() { return code; }
    public String getLabel() { return label; }
    public String getDescription() { return description; }

    public static List<ExceptionStatus> transitionableFrom(ExceptionStatus current) {
        return switch (current) {
            case PENDING -> Arrays.asList(REJECTED, CONFIRMED);
            case REJECTED -> List.of(SUPPLEMENTED);
            case SUPPLEMENTED -> Arrays.asList(REJECTED, CONFIRMED);
            case CONFIRMED -> List.of(CLOSED);
            case CLOSED -> List.of();
        };
    }

    public boolean canTransitionTo(ExceptionStatus target) {
        return transitionableFrom(this).contains(target);
    }
}
