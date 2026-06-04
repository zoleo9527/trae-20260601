package com.eyeclinic.surgerycenter.enums;

public enum CheckItemType {
    VISION_ACUITY("视力检查"),
    INTRAOCULAR_PRESSURE("眼压检查"),
    CORNEA_THICKNESS("角膜厚度"),
    EYE_AXIS("眼轴长度"),
    FUNDUS("眼底检查"),
    CORNEA_TOPOGRAPHY("角膜地形图"),
    BLOOD_TEST("血液检查"),
    MEDICAL_HISTORY("病史评估");

    private final String description;

    CheckItemType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
