package com.medical.aesthetic.repository;

import com.medical.aesthetic.entity.Employee;
import com.medical.aesthetic.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByUsername(String username);

    List<Employee> findByRole(RoleType role);
}
