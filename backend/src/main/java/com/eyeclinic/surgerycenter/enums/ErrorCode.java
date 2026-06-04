package com.eyeclinic.surgerycenter.enums;

public enum ErrorCode {
    SUCCESS("0000", "操作成功"),
    SYSTEM_ERROR("1000", "系统内部错误"),
    PARAM_ERROR("1001", "参数错误"),
    DATA_NOT_FOUND("1002", "数据不存在"),
    ILLEGAL_STATE_TRANSITION("2001", "非法的状态流转"),
    PERMISSION_DENIED("2002", "权限不足，无法执行此操作"),
    CHECK_ITEM_INCOMPLETE("2003", "术前检查项未全部完成"),
    PATIENT_NOT_FOUND("3001", "患者不存在"),
    WORKFLOW_NOT_FOUND("3002", "工作流实例不存在"),
    ALREADY_IN_PROGRESS("3003", "已有处理中的流程"),
    SCHEDULE_TIME_CONFLICT("4001", "手术时间冲突"),
    SCHEDULE_DATE_INVALID("4002", "手术日期无效"),
    MATERIAL_INSUFFICIENT("4003", "耗材库存不足"),
    REVIEW_REQUIRED("5001", "需要审核主管审批"),
    CANNOT_OPERATE_COMPLETED("5002", "已完成流程不可操作");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
