package com.example.tilestore.service;

import com.example.tilestore.common.BusinessException;
import com.example.tilestore.common.ErrorCode;
import com.example.tilestore.common.UserContext;
import com.example.tilestore.dto.request.LoginRequest;
import com.example.tilestore.dto.response.LoginResponse;
import com.example.tilestore.entity.SysUser;
import com.example.tilestore.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final SysUserMapper sysUserMapper;

    public LoginResponse login(LoginRequest request) {
        SysUser user = sysUserMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (!user.getPassword().equals(request.getPassword())) {
            throw new BusinessException(ErrorCode.USER_PASSWORD_ERROR);
        }
        if (user.getStatus() != 1) {
            throw new BusinessException(ErrorCode.USER_DISABLED);
        }
        UserContext.setCurrentUser(user);
        LoginResponse response = new LoginResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setRole(user.getRole());
        response.setPhone(user.getPhone());
        return response;
    }

    public void logout() {
        UserContext.clear();
    }

    public SysUser getCurrentUser() {
        SysUser user = UserContext.getCurrentUser();
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_LOGIN);
        }
        return user;
    }

    public void checkPermission(String... allowedRoles) {
        SysUser user = getCurrentUser();
        List<String> roles = Arrays.asList(allowedRoles);
        if (!roles.contains(user.getRole())) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED);
        }
    }

    public SysUser getUserById(Long userId) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    public List<SysUser> getUsersByRole(String role) {
        return sysUserMapper.findByRole(role);
    }
}