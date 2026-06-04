package com.eyeclinic.surgerycenter.enums;

public enum RoleType {
    RECEPTIONIST("接待人员"),
    SPECIALIST("专业人员"),
    SUPERVISOR("审核主管");

    private final String description;

    RoleType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
