package com.hrstaffing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reject_record", indexes = {
        @Index(name = "idx_rr_exception", columnList = "exceptionId")
})
public class RejectRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long exceptionId;

    @Column(nullable = false, length = 1024)
    private String rejectReason;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Column(nullable = false)
    private Long rejectedBy;

    @Column(length = 64)
    private String rejectedByName;

    private Long attachmentId;

    @Column(length = 256)
    private String siteSnapshot;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
