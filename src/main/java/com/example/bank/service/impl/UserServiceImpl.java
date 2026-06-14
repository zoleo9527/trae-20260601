package com.example.bank.service.impl;

import com.example.bank.dto.request.LoginRequest;
import com.example.bank.dto.response.UserResponse;
import com.example.bank.entity.User;
import com.example.bank.repository.UserRepository;
import com.example.bank.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        if (!user.getEnabled()) {
            throw new RuntimeException("用户已禁用");
        }
        
        return convertToResponse(user);
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    private UserResponse convertToResponse(User user) {
        String roleName = switch (user.getRole()) {
            case LOBBY_MANAGER -> "大堂经理";
            case ACCOUNT_MANAGER -> "客户经理";
            case OPERATION_SUPERVISOR -> "运营主管";
        };
        
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .role(user.getRole())
                .roleName(roleName)
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}