package com.hrstaffing.entity;

import com.hrstaffing.enums.ScheduleStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "attendance_schedule", indexes = {
        @Index(name = "idx_sch_emp_date", columnList = "employeeId, scheduleDate"),
        @Index(name = "idx_sch_status", columnList = "status"),
        @Index(name = "idx_sch_recruiter", columnList = "recruiterId"),
        @Index(name = "idx_sch_supervisor", columnList = "supervisorId")
})
public class AttendanceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employeeId;

    @Column(length = 32)
    private String employeeNo;

    @Column(length = 64)
    private String employeeName;

    @Column(nullable = false)
    private LocalDate scheduleDate;

    @Column(nullable = false)
    private LocalTime shiftStart;

    @Column(nullable = false)
    private LocalTime shiftEnd;

    @Column(nullable = false)
    private BigDecimal scheduledHours;

    private LocalTime actualPunchIn;

    private LocalTime actualPunchOut;

    private BigDecimal actualWorkHours;

    private BigDecimal overtimeHours;

    private BigDecimal leaveHours;

    @Column(length = 256)
    private String scheduleRemark;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ScheduleStatus status = ScheduleStatus.DRAFT;

    @Column(nullable = false)
    private Long recruiterId;

    @Column(length = 64)
    private String recruiterName;

    @Column(nullable = false)
    private Long supervisorId;

    @Column(length = 64)
    private String supervisorName;

    private LocalDateTime submittedAt;

    private LocalDateTime confirmedAt;

    @Column(length = 512)
    private String confirmedRemark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
