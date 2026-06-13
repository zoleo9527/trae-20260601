package com.hrstaffing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "status_transition_log", indexes = {
        @Index(name = "idx_stl_biz", columnList = "bizType, bizId"),
        @Index(name = "idx_stl_operator", columnList = "operatorId")
})
public class StatusTransitionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String bizType;

    @Column(nullable = false)
    private Long bizId;

    @Column(length = 32)
    private String fromStatus;

    @Column(nullable = false, length = 32)
    private String toStatus;

    @Column(length = 512)
    private String transitionReason;

    @Column(nullable = false)
    private Long operatorId;

    @Column(length = 64)
    private String operatorName;

    @Column(length = 32)
    private String operatorRole;

    @Column(length = 1024)
    private String snapshotBefore;

    @Column(length = 1024)
    private String snapshotAfter;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
