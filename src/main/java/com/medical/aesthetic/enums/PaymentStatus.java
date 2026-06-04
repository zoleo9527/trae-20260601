package com.medical.aesthetic.enums;

import lombok.Getter;

@Getter
public enum PaymentStatus {
    UNPAID("未付款", "客户尚未支付任何款项"),
    DEPOSIT_PAID("已付定金", "客户已支付部分定金"),
    INSTALLMENT_PAID("分期中", "客户按分期计划支付中"),
    FULL_PAID("已付清", "客户已结清全部款项"),
    OVERDUE("已逾期", "分期付款出现逾期"),
    REFUNDED("已退款", "项目取消，款项已退还");

    private final String displayName;
    private final String description;

    PaymentStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
