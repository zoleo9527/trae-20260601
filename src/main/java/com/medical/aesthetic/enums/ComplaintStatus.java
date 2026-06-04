package com.medical.aesthetic.enums;

import lombok.Getter;

@Getter
public enum ComplaintStatus {
    PENDING("待处理", "投诉刚提交，尚未指派处理人"),
    PROCESSING("处理中", "正在调查核实情况"),
    RESOLVED("已解决", "投诉已妥善处理，客户满意"),
    ESCALATED("已升级", "需要更高层级介入处理"),
    CLOSED("已关闭", "投诉处理完毕，归档");

    private final String displayName;
    private final String description;

    ComplaintStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
