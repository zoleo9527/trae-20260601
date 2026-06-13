
package com.example.recruitment.enums;

public enum PositionStatusEnum {
    DRAFT(1, "草稿"),
    PUBLISHED(2, "已发布"),
    EXPIRED(3, "已过期"),
    CLOSED(4, "已关闭");

    private final int code;
    private final String desc;

    PositionStatusEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static PositionStatusEnum fromCode(int code) {
        for (PositionStatusEnum status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        return null;
    }
}
