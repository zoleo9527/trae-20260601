package com.medical.aesthetic.enums;

import lombok.Getter;

@Getter
public enum ExportType {
    PROJECTS("项目排期表", "项目排期表.xlsx"),
    MATERIALS("耗材预留记录", "耗材预留记录.xlsx"),
    ORDERS("分期款项明细", "分期款项明细.xlsx");

    private final String displayName;
    private final String defaultFileName;

    ExportType(String displayName, String defaultFileName) {
        this.displayName = displayName;
        this.defaultFileName = defaultFileName;
    }
}
