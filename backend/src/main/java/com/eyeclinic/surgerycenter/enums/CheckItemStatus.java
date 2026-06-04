package com.eyeclinic.surgerycenter.enums;

public enum CheckItemStatus {
    PENDING("待检查"),
    IN_PROGRESS("检查中"),
    COMPLETED("已完成"),
    ABNORMAL("异常");

    private final String description;

    CheckItemStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
