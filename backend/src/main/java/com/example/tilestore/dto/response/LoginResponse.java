package com.example.tilestore.dto.response;

import lombok.Data;

@Data
public class LoginResponse {

    private Long userId;

    private String username;

    private String realName;

    private String role;

    private String phone;

    private String token;
}