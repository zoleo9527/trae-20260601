package com.hrstaffing.repository;

import com.hrstaffing.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeNo(String employeeNo);

    List<Employee> findByRecruiterId(Long recruiterId);

    List<Employee> findBySupervisorId(Long supervisorId);

    @Query("SELECT e FROM Employee e WHERE " +
            "(:keyword IS NULL OR e.name LIKE %:keyword% OR e.employeeNo LIKE %:keyword%) " +
            "AND (:recruiterId IS NULL OR e.recruiterId = :recruiterId) " +
            "AND (:supervisorId IS NULL OR e.supervisorId = :supervisorId)")
    List<Employee> search(@Param("keyword") String keyword,
                          @Param("recruiterId") Long recruiterId,
                          @Param("supervisorId") Long supervisorId);
}
