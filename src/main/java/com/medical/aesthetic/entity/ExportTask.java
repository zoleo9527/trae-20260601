package com.medical.aesthetic.entity;

import com.medical.aesthetic.enums.ExportTaskStatus;
import com.medical.aesthetic.enums.ExportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "export_task")
public class ExportTask extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExportType exportType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExportTaskStatus status;

    @Column(columnDefinition = "TEXT")
    private String filterCriteria;

    @Column(length = 500)
    private String fileName;

    @Lob
    @Column(columnDefinition = "BLOB")
    private byte[] fileContent;

    @Column
    private Long fileSize;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(columnDefinition = "TEXT")
    private String errorStackTrace;

    @Column
    private Integer recordCount;

    @Column(length = 500)
    private String remark;
}
