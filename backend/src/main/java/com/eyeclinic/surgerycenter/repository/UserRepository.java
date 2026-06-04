package com.eyeclinic.surgerycenter.repository;

import com.eyeclinic.surgerycenter.entity.User;
import com.eyeclinic.surgerycenter.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    List<User> findByRole(RoleType role);
    List<User> findByActiveTrue();
}
