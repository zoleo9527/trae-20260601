package com.medical.aesthetic.common;

import lombok.Getter;

@Getter
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权访问"),
    FORBIDDEN(403, "权限不足"),
    NOT_FOUND(404, "资源不存在"),
    INVALID_STATUS_TRANSITION(4001, "无效的状态流转"),
    MATERIAL_INSUFFICIENT(4002, "耗材库存不足"),
    INVALID_OPERATION(4003, "无效操作"),
    DATA_CONFLICT(4009, "数据冲突"),
    SYSTEM_ERROR(5000, "系统内部错误");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
