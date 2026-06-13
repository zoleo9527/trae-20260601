
package com.example.recruitment.enums;

public enum RoleEnum {
    ADMIN(1, "管理员"),
    OPERATOR(2, "运营"),
    RECRUITER(3, "招聘顾问"),
    HR(4, "企业HR");

    private final int code;
    private final String desc;

    RoleEnum(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    public static RoleEnum fromCode(int code) {
        for (RoleEnum role : values()) {
            if (role.code == code) {
                return role;
            }
        }
        return null;
    }
}
