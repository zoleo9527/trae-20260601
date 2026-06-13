package com.hrstaffing.common.auth;

public enum Role {

    RECRUITER("RECRUITER", "招聘专员"),
    SUPERVISOR("SUPERVISOR", "驻场主管"),
    ACCOUNTANT("ACCOUNTANT", "薪酬会计");

    private final String code;
    private final String label;

    Role(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }
}
