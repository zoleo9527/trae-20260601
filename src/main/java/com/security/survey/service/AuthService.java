package com.security.survey.service;

import com.security.survey.dto.LoginRequest;
import com.security.survey.dto.LoginResponse;
import com.security.survey.entity.User;
import com.security.survey.repository.UserRepository;
import com.security.survey.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        String token = jwtTokenProvider.generateToken(authentication);
        User user = (User) authentication.getPrincipal();

        return new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getRealName(),
                user.getRole().name()
        );
    }

    public User getCurrentUser() {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }
}
