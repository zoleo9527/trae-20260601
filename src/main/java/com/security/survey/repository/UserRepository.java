package com.security.survey.repository;

import com.security.survey.entity.User;
import com.security.survey.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByRole(RoleType role);
    boolean existsByUsername(String username);
}
