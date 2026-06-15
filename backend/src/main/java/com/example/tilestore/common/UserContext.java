package com.example.tilestore.common;

import com.example.tilestore.entity.SysUser;

public class UserContext {

    private static final ThreadLocal<SysUser> currentUser = new ThreadLocal<>();

    public static void setCurrentUser(SysUser user) {
        currentUser.set(user);
    }

    public static SysUser getCurrentUser() {
        return currentUser.get();
    }

    public static void clear() {
        currentUser.remove();
    }

    public static Long getCurrentUserId() {
        SysUser user = currentUser.get();
        return user != null ? user.getId() : null;
    }

    public static String getCurrentUserRole() {
        SysUser user = currentUser.get();
        return user != null ? user.getRole() : null;
    }
}