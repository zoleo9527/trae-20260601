package com.hrstaffing.repository;

import com.hrstaffing.entity.AttendanceException;
import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ExceptionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AttendanceExceptionRepository extends JpaRepository<AttendanceException, Long> {

    List<AttendanceException> findByScheduleId(Long scheduleId);

    List<AttendanceException> findByEmployeeIdAndExceptionDateBetween(Long employeeId, LocalDate start, LocalDate end);

    @Query("SELECT e FROM AttendanceException e WHERE " +
            "(:recruiterId IS NULL OR e.recruiterId = :recruiterId) " +
            "AND (:supervisorId IS NULL OR e.supervisorId = :supervisorId) " +
            "AND (:employeeId IS NULL OR e.employeeId = :employeeId) " +
            "AND (:status IS NULL OR e.status = :status) " +
            "AND (:exceptionType IS NULL OR e.exceptionType = :exceptionType) " +
            "AND (:startDate IS NULL OR e.exceptionDate >= :startDate) " +
            "AND (:endDate IS NULL OR e.exceptionDate <= :endDate) " +
            "AND (:keyword IS NULL OR e.employeeName LIKE %:keyword% OR e.employeeNo LIKE %:keyword%)")
    Page<AttendanceException> searchPage(@Param("recruiterId") Long recruiterId,
                                         @Param("supervisorId") Long supervisorId,
                                         @Param("employeeId") Long employeeId,
                                         @Param("status") ExceptionStatus status,
                                         @Param("exceptionType") ExceptionType exceptionType,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate,
                                         @Param("keyword") String keyword,
                                         Pageable pageable);

    @Query("SELECT e FROM AttendanceException e WHERE " +
            "e.status = :status " +
            "AND e.rejectDeadline <= :deadline")
    List<AttendanceException> findDeadlineExceeded(@Param("status") ExceptionStatus status,
                                                    @Param("deadline") LocalDateTime deadline);

    List<AttendanceException> findByStatus(ExceptionStatus status);

    long countByStatus(ExceptionStatus status);

    long countByRecruiterIdAndStatus(Long recruiterId, ExceptionStatus status);

    long countBySupervisorIdAndStatus(Long supervisorId, ExceptionStatus status);
}
