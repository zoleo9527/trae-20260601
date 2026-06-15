package com.example.tilestore.interceptor;

import com.example.tilestore.common.UserContext;
import com.example.tilestore.entity.SysUser;
import com.example.tilestore.mapper.SysUserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthInterceptor implements HandlerInterceptor {

    private final SysUserMapper sysUserMapper;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        UserContext.clear();
        
        String token = extractToken(request);
        
        if (token != null && !token.isEmpty()) {
            try {
                Long userId = com.example.tilestore.common.JwtUtil.getUserIdFromToken(token);
                SysUser user = sysUserMapper.selectById(userId);
                if (user != null && user.getStatus() == 1) {
                    UserContext.setCurrentUser(user);
                    log.debug("User context set for user: {}", user.getUsername());
                }
            } catch (Exception e) {
                log.warn("Failed to parse token: {}", e.getMessage());
            }
        }
        
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserContext.clear();
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}