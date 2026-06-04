package com.medical.aesthetic.enums;

import lombok.Getter;

@Getter
public enum ExportTaskStatus {
    PENDING("待处理"),
    PROCESSING("处理中"),
    COMPLETED("已完成"),
    FAILED("失败");

    private final String displayName;

    ExportTaskStatus(String displayName) {
        this.displayName = displayName;
    }
}
