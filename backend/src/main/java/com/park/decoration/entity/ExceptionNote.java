package com.park.decoration.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "exception_notes")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExceptionNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false, insertable = false, updatable = false)
    private Long applicationId;

    @Column(nullable = false, length = 50)
    private String applicationNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private DecorationApplication application;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(length = 500)
    private String impact;

    @Column(length = 500)
    private String resolution;

    @Column(length = 2000)
    private String attachmentUrls;

    @Column(nullable = false, length = 50)
    private String reportedBy;

    @Column(nullable = false)
    private LocalDateTime reportedAt;

    @Column(length = 50)
    private String resolvedBy;

    private LocalDateTime resolvedAt;

    @Column(nullable = false)
    private Boolean resolved;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.resolved == null) {
            this.resolved = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
