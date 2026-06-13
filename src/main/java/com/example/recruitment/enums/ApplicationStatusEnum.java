
package com.example.recruitment.enums;

public enum ApplicationStatusEnum {
    PENDING(1, "待审核"),
    CONFIRMED(2, "已确认"),
    REJECTED(3, "已拒绝"),
    INTERVIEWING(4, "面试中"),
    HIRED(5, "已入职"),
    ABANDONED(6, "已放弃");

    private final int code;
    private final String desc;

    ApplicationStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static ApplicationStatusEnum fromCode(int code) {
        for (ApplicationStatusEnum status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        return null;
    }
}
