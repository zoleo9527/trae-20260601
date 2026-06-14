package com.example.bank.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "export_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_no", nullable = false, unique = true)
    private String taskNo;

    @Column(name = "export_type", nullable = false)
    private String exportType;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(nullable = false)
    private String status;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "record_count")
    private Integer recordCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}