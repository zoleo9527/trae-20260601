package com.medical.aesthetic.config;

import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.entity.Employee;
import com.medical.aesthetic.enums.RoleType;
import com.medical.aesthetic.repository.EmployeeRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
@RequiredArgsConstructor
public class WebConfig {

    private final EmployeeRepository employeeRepository;

    @Bean
    public Filter userContextFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, ServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                try {
                    String roleHeader = request.getHeader("X-User-Role");
                    String usernameHeader = request.getHeader("X-Username");

                    if (usernameHeader != null && !usernameHeader.isEmpty()) {
                        Employee employee = employeeRepository.findByUsername(usernameHeader)
                                .orElseGet(() -> {
                                    Employee emp = new Employee();
                                    emp.setUsername(usernameHeader);
                                    emp.setName(usernameHeader);
                                    emp.setRole(roleHeader != null ? RoleType.valueOf(roleHeader) : RoleType.CONSULTANT);
                                    return emp;
                                });
                        UserContext.setCurrentUser(employee);
                    } else {
                        Employee defaultEmployee = employeeRepository.findByRole(RoleType.CONSULTANT)
                                .stream().findFirst()
                                .orElseGet(() -> {
                                    Employee emp = new Employee();
                                    emp.setUsername("system");
                                    emp.setName("系统默认");
                                    emp.setRole(RoleType.CONSULTANT);
                                    return emp;
                                });
                        UserContext.setCurrentUser(defaultEmployee);
                    }

                    filterChain.doFilter(request, response);
                } finally {
                    UserContext.clear();
                }
            }
        };
    }
}
