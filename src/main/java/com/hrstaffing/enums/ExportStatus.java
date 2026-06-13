package com.hrstaffing.enums;

public enum ExportStatus {

    PENDING("PENDING", "待生成"),
    PROCESSING("PROCESSING", "生成中"),
    SUCCESS("SUCCESS", "生成成功"),
    FAILED("FAILED", "生成失败");

    private final String code;
    private final String label;

    ExportStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() { return code; }
    public String getLabel() { return label; }
}
