package com.hrstaffing.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "supplement_record", indexes = {
        @Index(name = "idx_sr_exception", columnList = "exceptionId")
})
public class SupplementRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long exceptionId;

    @Column(nullable = false)
    private Long scheduleId;

    @Column(nullable = false, length = 1024)
    private String supplementContent;

    private BigDecimal correctedHours;

    private java.time.LocalTime correctedPunchIn;

    private java.time.LocalTime correctedPunchOut;

    private Long proofAttachmentId;

    @Column(length = 256)
    private String proofRemark;

    @Column(nullable = false)
    private Long submittedBy;

    @Column(length = 64)
    private String submittedByName;

    @Column(length = 32)
    private String reviewStatus;

    private Long reviewedBy;

    @Column(length = 64)
    private String reviewedByName;

    @Column(length = 512)
    private String reviewRemark;

    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
