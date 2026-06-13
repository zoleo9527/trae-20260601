package com.hrstaffing.repository;

import com.hrstaffing.entity.AttendanceSchedule;
import com.hrstaffing.enums.ScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceScheduleRepository extends JpaRepository<AttendanceSchedule, Long> {

    Optional<AttendanceSchedule> findByEmployeeIdAndScheduleDate(Long employeeId, LocalDate scheduleDate);

    List<AttendanceSchedule> findByEmployeeIdAndScheduleDateBetween(Long employeeId, LocalDate start, LocalDate end);

    @Query("SELECT s FROM AttendanceSchedule s WHERE " +
            "(:recruiterId IS NULL OR s.recruiterId = :recruiterId) " +
            "AND (:supervisorId IS NULL OR s.supervisorId = :supervisorId) " +
            "AND (:employeeId IS NULL OR s.employeeId = :employeeId) " +
            "AND (:status IS NULL OR s.status = :status) " +
            "AND (:startDate IS NULL OR s.scheduleDate >= :startDate) " +
            "AND (:endDate IS NULL OR s.scheduleDate <= :endDate) " +
            "AND (:keyword IS NULL OR s.employeeName LIKE %:keyword% OR s.employeeNo LIKE %:keyword%)")
    Page<AttendanceSchedule> searchPage(@Param("recruiterId") Long recruiterId,
                                        @Param("supervisorId") Long supervisorId,
                                        @Param("employeeId") Long employeeId,
                                        @Param("status") ScheduleStatus status,
                                        @Param("startDate") LocalDate startDate,
                                        @Param("endDate") LocalDate endDate,
                                        @Param("keyword") String keyword,
                                        Pageable pageable);

    @Query("SELECT s FROM AttendanceSchedule s WHERE " +
            "(:supervisorId IS NULL OR s.supervisorId = :supervisorId) " +
            "AND s.status IN :statuses " +
            "AND (:startDate IS NULL OR s.scheduleDate >= :startDate) " +
            "AND (:endDate IS NULL OR s.scheduleDate <= :endDate)")
    List<AttendanceSchedule> findForSupervisorReview(@Param("supervisorId") Long supervisorId,
                                                      @Param("statuses") List<ScheduleStatus> statuses,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate);

    long countByStatus(ScheduleStatus status);

    long countByRecruiterIdAndStatus(Long recruiterId, ScheduleStatus status);

    long countBySupervisorIdAndStatus(Long supervisorId, ScheduleStatus status);
}
