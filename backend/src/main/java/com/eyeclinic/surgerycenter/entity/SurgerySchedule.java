package com.eyeclinic.surgerycenter.entity;

import com.eyeclinic.surgerycenter.enums.SurgeryType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "surgery_schedule")
public class SurgerySchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private WorkflowInstance workflow;

    @Column(nullable = false)
    private LocalDate surgeryDate;

    @Column(nullable = false)
    private LocalTime startTime;

    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SurgeryType surgeryType;

    @Column(length = 20)
    private String operatingRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surgeon_id")
    private User surgeon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anesthesiologist_id")
    private User anesthesiologist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_by")
    private User scheduledBy;

    @Column(length = 500)
    private String materialList;

    @Column(length = 1000)
    private String remarks;

    @Column(length = 500)
    private String rejectionReason;

    private Boolean confirmed = false;

    private LocalDateTime confirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
