package com.ktv.controller;

import com.ktv.common.Result;
import com.ktv.dto.LoginDTO;
import com.ktv.entity.SysUser;
import com.ktv.service.SysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private SysUserService sysUserService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginDTO dto) {
        SysUser user = sysUserService.login(dto.getUsername(), dto.getPassword());
        if (user == null) {
            return Result.error("用户名或密码错误");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("realName", user.getRealName());
        data.put("role", user.getRole());
        data.put("token", "token_" + user.getId());
        return Result.success(data);
    }
}
