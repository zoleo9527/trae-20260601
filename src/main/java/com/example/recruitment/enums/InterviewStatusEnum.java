
package com.example.recruitment.enums;

public enum InterviewStatusEnum {
    PENDING(1, "待确认"),
    CONFIRMED(2, "已确认"),
    NO_SHOW(3, "爽约"),
    COMPLETED(4, "已完成"),
    REJECTED(5, "已拒绝"),
    EXPIRED(6, "已过期");

    private final int code;
    private final String desc;

    InterviewStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static InterviewStatusEnum fromCode(int code) {
        for (InterviewStatusEnum status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        return null;
    }
}
