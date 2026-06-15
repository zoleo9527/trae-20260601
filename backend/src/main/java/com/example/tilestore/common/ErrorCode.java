package com.example.tilestore.common;

public enum ErrorCode {
    SUCCESS(0, "成功"),
    
    PARAM_ERROR(10001, "参数错误"),
    VALIDATION_ERROR(10002, "校验失败"),
    
    USER_NOT_FOUND(20001, "用户不存在"),
    USER_PASSWORD_ERROR(20002, "密码错误"),
    USER_DISABLED(20003, "用户已禁用"),
    USER_NOT_LOGIN(20004, "用户未登录"),
    PERMISSION_DENIED(20005, "权限不足"),
    
    CUSTOMER_NOT_FOUND(30001, "客户不存在"),
    
    MEASUREMENT_NOT_FOUND(40001, "量房记录不存在"),
    MEASUREMENT_STATUS_ERROR(40002, "量房记录状态错误"),
    
    QUOTATION_NOT_FOUND(50001, "报价单不存在"),
    QUOTATION_STATUS_ERROR(50002, "报价单状态错误"),
    
    PRODUCT_NOT_FOUND(60001, "产品不存在"),
    
    SYSTEM_ERROR(99999, "系统异常");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}