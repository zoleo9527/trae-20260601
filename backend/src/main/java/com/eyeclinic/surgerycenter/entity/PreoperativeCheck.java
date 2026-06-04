package com.eyeclinic.surgerycenter.entity;

import com.eyeclinic.surgerycenter.enums.CheckItemStatus;
import com.eyeclinic.surgerycenter.enums.CheckItemType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "preoperative_check")
public class PreoperativeCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private WorkflowInstance workflow;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CheckItemType checkType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CheckItemStatus status;

    @Column(length = 2000)
    private String checkResult;

    @Column(length = 500)
    private String measurementValue;

    @Column(length = 500)
    private String referenceRange;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by")
    private User checkedBy;

    private LocalDateTime checkedAt;

    @Column(length = 1000)
    private String remarks;

    @Column(length = 500)
    private String attachmentUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
