package com.example.bank.entity;

import com.example.bank.enums.AppointmentStatus;
import com.example.bank.enums.BusinessType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_no", nullable = false, unique = true)
    private String appointmentNo;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    private String customerPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusinessType businessType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    @Column(name = "appointment_time", nullable = false)
    private LocalDateTime appointmentTime;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "start_process_time")
    private LocalDateTime startProcessTime;

    @Column(name = "complete_time")
    private LocalDateTime completeTime;

    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Column(name = "window_no")
    private String windowNo;

    @Column(name = "estimated_wait_time")
    private Integer estimatedWaitTime;

    @Column(name = "actual_process_time")
    private Integer actualProcessTime;

    @Column(name = "material_status")
    private String materialStatus;

    @Column(name = "due_diligence_status")
    private String dueDiligenceStatus;

    @Column(name = "complaint_status")
    private String complaintStatus;

    @Column(name = "urgent_level")
    private Integer urgentLevel;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = AppointmentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}