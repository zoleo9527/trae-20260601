package com.example.bank.service;

import com.example.bank.dto.request.LoginRequest;
import com.example.bank.dto.response.UserResponse;
import com.example.bank.entity.User;

import java.util.List;

public interface UserService {

    UserResponse login(LoginRequest request);

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    User findByUsername(String username);
}