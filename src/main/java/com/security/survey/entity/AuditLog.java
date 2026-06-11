package com.security.survey.entity;

import com.security.survey.enums.AuditAction;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Column(nullable = false)
    private String targetType;

    @Column(nullable = false)
    private Long targetId;

    @Column(length = 2000)
    private String oldValue;

    @Column(length = 2000)
    private String newValue;

    @Column(length = 1000)
    private String detail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    private LocalDateTime performedAt;

    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        performedAt = LocalDateTime.now();
    }
}
