package com.medical.aesthetic.enums;

import lombok.Getter;

@Getter
public enum RoleType {
    CONSULTANT("咨询师", "负责客户咨询、方案制定、报价"),
    DOCTOR_ASSISTANT("医生助理", "负责手术排期、耗材准备、术中协助"),
    CUSTOMER_SERVICE("客服", "负责术后回访、投诉处理、款项核对");

    private final String displayName;
    private final String description;

    RoleType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
