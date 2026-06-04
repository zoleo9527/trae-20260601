package com.medical.aesthetic.enums;

import lombok.Getter;

@Getter
public enum MaterialStatus {
    AVAILABLE("可使用", "库存充足，可正常领用"),
    RESERVED("已预留", "已被项目锁定，不可挪用"),
    USED("已使用", "已在手术中消耗"),
    EXPIRED("已过期", "超过有效期，不可使用"),
    DAMAGED("已损坏", "运输或存储中损坏");

    private final String displayName;
    private final String description;

    MaterialStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
