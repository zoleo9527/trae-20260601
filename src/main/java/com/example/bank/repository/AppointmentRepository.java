package com.example.bank.repository;

import com.example.bank.entity.Appointment;
import com.example.bank.enums.AppointmentStatus;
import com.example.bank.enums.BusinessType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByBusinessType(BusinessType businessType);

    List<Appointment> findByAssignedUserId(Long userId);

    List<Appointment> findByAppointmentTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    List<Appointment> findByStatusIn(List<AppointmentStatus> statuses);

    Appointment findByAppointmentNo(String appointmentNo);

    @Query("SELECT a FROM Appointment a WHERE a.status IN :statuses ORDER BY a.urgentLevel DESC, a.appointmentTime ASC")
    List<Appointment> findByStatusInOrderByPriority(@Param("statuses") List<AppointmentStatus> statuses);

    @Query("SELECT a FROM Appointment a WHERE a.createdAt >= :startTime ORDER BY a.createdAt DESC")
    List<Appointment> findRecentAppointments(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT a FROM Appointment a WHERE a.materialStatus LIKE %:keyword% OR a.dueDiligenceStatus LIKE %:keyword% OR a.complaintStatus LIKE %:keyword%")
    List<Appointment> findByIssueKeyword(@Param("keyword") String keyword);
}