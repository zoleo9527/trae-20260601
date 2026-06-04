package com.eyeclinic.surgerycenter.entity;

import com.eyeclinic.surgerycenter.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_log")
public class OperationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id")
    private WorkflowInstance workflow;

    @Column(length = 50)
    private String workflowNo;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private WorkflowStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private WorkflowStatus newStatus;

    @Column(length = 100)
    private String operationType;

    @Column(length = 500)
    private String operationDesc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private User operator;

    @Column(length = 100)
    private String operatorName;

    @Column(length = 1000)
    private String remarks;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
