package com.hrstaffing.enums;

public enum ExceptionType {

    MISSING_PUNCH("MISSING_PUNCH", "缺打卡"),
    LATE("LATE", "迟到"),
    EARLY_LEAVE("EARLY_LEAVE", "早退"),
    OVERTIME_UNAPPROVED("OVERTIME_UNAPPROVED", "加班未审批"),
    LEAVE_UNAPPROVED("LEAVE_UNAPPROVED", "请假未审批"),
    SCHEDULE_MISMATCH("SCHEDULE_MISMATCH", "排班不符"),
    OTHER("OTHER", "其他");

    private final String code;
    private final String label;

    ExceptionType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() { return code; }
    public String getLabel() { return label; }
}
