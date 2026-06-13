package com.hrstaffing.entity;

import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ExceptionType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "attendance_exception", indexes = {
        @Index(name = "idx_exc_schedule", columnList = "scheduleId"),
        @Index(name = "idx_exc_emp_date", columnList = "employeeId, exceptionDate"),
        @Index(name = "idx_exc_status", columnList = "status"),
        @Index(name = "idx_exc_deadline", columnList = "rejectDeadline")
})
public class AttendanceException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long scheduleId;

    @Column(nullable = false)
    private Long employeeId;

    @Column(length = 32)
    private String employeeNo;

    @Column(length = 64)
    private String employeeName;

    @Column(nullable = false)
    private LocalDate exceptionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ExceptionType exceptionType;

    @Column(nullable = false, length = 1024)
    private String description;

    private BigDecimal affectedHours;

    @Column(length = 512)
    private String siteNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ExceptionStatus status = ExceptionStatus.PENDING;

    @Column(nullable = false)
    private Long recruiterId;

    @Column(length = 64)
    private String recruiterName;

    @Column(nullable = false)
    private Long supervisorId;

    @Column(length = 64)
    private String supervisorName;

    private Integer rejectCount = 0;

    private LocalDateTime rejectDeadline;

    @Column(length = 512)
    private String latestRejectReason;

    private LocalDateTime lastRejectedAt;

    private Long lastRejectedBy;

    @Column(length = 64)
    private String lastRejectedByName;

    private LocalDateTime supplementedAt;

    private Long supplementedBy;

    @Column(length = 512)
    private String supplementRemark;

    private LocalDateTime confirmedAt;

    private Long confirmedBy;

    @Column(length = 512)
    private String confirmRemark;

    private LocalDateTime closedAt;

    private Long closedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean isDeadlineExceeded() {
        if (status != ExceptionStatus.REJECTED || rejectDeadline == null) return false;
        return LocalDateTime.now().isAfter(rejectDeadline);
    }

    public boolean isDeadlineApproaching() {
        if (status != ExceptionStatus.REJECTED || rejectDeadline == null) return false;
        long hours = java.time.Duration.between(LocalDateTime.now(), rejectDeadline).toHours();
        return hours >= 0 && hours <= 24;
    }
}
