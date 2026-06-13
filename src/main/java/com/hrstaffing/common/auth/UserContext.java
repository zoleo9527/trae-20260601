package com.hrstaffing.common.auth;

import com.hrstaffing.common.exception.BizException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.List;

public class UserContext {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_ROLE = "X-Role";

    @Data
    public static class CurrentUser {
        private Long userId;
        private String userName;
        private Role role;
    }

    public static CurrentUser getCurrent() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            CurrentUser u = new CurrentUser();
            u.setUserId(1L);
            u.setUserName("系统模拟用户");
            u.setRole(Role.RECRUITER);
            return u;
        }
        HttpServletRequest req = attrs.getRequest();
        String roleStr = req.getHeader(HEADER_ROLE);
        String userIdStr = req.getHeader(HEADER_USER_ID);

        CurrentUser u = new CurrentUser();
        try {
            u.setUserId(userIdStr != null ? Long.parseLong(userIdStr) : 1L);
        } catch (NumberFormatException e) {
            u.setUserId(1L);
        }
        u.setUserName(req.getHeader("X-User-Name") != null ? req.getHeader("X-User-Name") : "模拟用户");
        if (roleStr != null && !roleStr.isEmpty()) {
            try {
                u.setRole(Role.valueOf(roleStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BizException(401, "无效的角色: " + roleStr);
            }
        } else {
            u.setRole(Role.RECRUITER);
        }
        return u;
    }

    public static boolean hasAnyRole(Role... roles) {
        Role current = getCurrent().getRole();
        List<Role> allowed = Arrays.asList(roles);
        return allowed.contains(current);
    }
}
