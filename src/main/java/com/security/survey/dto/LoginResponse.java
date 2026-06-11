package com.security.survey.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String type;
    private Long userId;
    private String username;
    private String realName;
    private String role;
}
