package com.medical.aesthetic.enums;

import lombok.Getter;

@Getter
public enum ProjectStatus {
    CONSULTING("咨询中", "客户初步咨询，尚未确定方案"),
    QUOTED("已报价", "咨询师已出具方案和报价"),
    CONFIRMED("已确认", "客户确认方案和价格"),
    SCHEDULED("已排期", "项目已安排手术时间"),
    MATERIAL_RESERVED("耗材已预留", "耗材已从库存锁定预留"),
    IN_PROGRESS("术中", "手术进行中"),
    COMPLETED("已完成", "手术完成，等待术后回访"),
    FOLLOWED_UP("已回访", "术后回访完成"),
    COMPLAINT("有投诉", "客户提出投诉，待处理"),
    CANCELLED("已取消", "项目已取消");

    private final String displayName;
    private final String description;

    ProjectStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
