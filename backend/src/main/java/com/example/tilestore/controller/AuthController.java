package com.example.tilestore.controller;

import com.example.tilestore.common.ApiResponse;
import com.example.tilestore.dto.request.LoginRequest;
import com.example.tilestore.dto.response.LoginResponse;
import com.example.tilestore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ApiResponse.success("登录成功", response);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        userService.logout();
        return ApiResponse.success("退出成功", null);
    }
}