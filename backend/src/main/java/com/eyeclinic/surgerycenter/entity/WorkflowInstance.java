package com.eyeclinic.surgerycenter.entity;

import com.eyeclinic.surgerycenter.enums.SurgeryType;
import com.eyeclinic.surgerycenter.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "workflow_instance")
public class WorkflowInstance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String workflowNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SurgeryType surgeryType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WorkflowStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_handler_id")
    private User currentHandler;

    @Column(length = 500)
    private String blockReason;

    @Column(length = 1000)
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime statusUpdatedAt;

    @Column(length = 30)
    private String currentNodeName;
}
