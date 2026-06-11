package com.elevator.maintenance.controller;

import com.elevator.maintenance.common.Result;
import com.elevator.maintenance.dto.LoginRequest;
import com.elevator.maintenance.entity.User;
import com.elevator.maintenance.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result<User> login(@RequestBody LoginRequest request) {
        User user = userService.login(request.getUsername(), request.getPassword());
        if (user != null) {
            return Result.success(user);
        }
        return Result.error("用户名或密码错误");
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }
}
