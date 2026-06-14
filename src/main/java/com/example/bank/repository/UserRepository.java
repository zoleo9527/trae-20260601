package com.example.bank.repository;

import com.example.bank.entity.User;
import com.example.bank.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByRole(RoleType role);

    List<User> findByEnabled(Boolean enabled);
}