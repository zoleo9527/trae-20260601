package com.hrstaffing.entity;

import com.hrstaffing.enums.ExportStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "export_task", indexes = {
        @Index(name = "idx_exp_creator", columnList = "createdBy"),
        @Index(name = "idx_exp_status", columnList = "status")
})
public class ExportTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String taskName;

    @Column(nullable = false, length = 32)
    private String exportType;

    @Column(length = 2048)
    private String queryParamsJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ExportStatus status = ExportStatus.PENDING;

    @Column(length = 512)
    private String filePath;

    @Column(length = 256)
    private String fileName;

    private Long fileSize;

    @Column(length = 512)
    private String failReason;

    @Column(nullable = false)
    private Long createdBy;

    @Column(length = 64)
    private String createdByName;

    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
