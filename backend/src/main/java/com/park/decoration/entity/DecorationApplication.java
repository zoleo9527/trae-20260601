package com.park.decoration.entity;

import com.park.decoration.enums.ApplicationStatus;
import com.park.decoration.enums.PriorityLevel;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "decoration_applications")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DecorationApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String applicationNo;

    @Column(nullable = false, length = 100)
    private String idempotentKey;

    @Column(nullable = false, length = 100)
    private String companyName;

    @Column(nullable = false, length = 50)
    private String contactPerson;

    @Column(nullable = false, length = 30)
    private String contactPhone;

    @Column(nullable = false, length = 100)
    private String parkName;

    @Column(nullable = false, length = 50)
    private String buildingNo;

    @Column(nullable = false, length = 50)
    private String roomNo;

    @Column(nullable = false)
    private Double decorationArea;

    @Column(length = 500)
    private String decorationScope;

    @Column(nullable = false)
    private LocalDateTime plannedStartDate;

    @Column(nullable = false)
    private LocalDateTime plannedEndDate;

    @Column(length = 500)
    private String constructionCompany;

    @Column(length = 50)
    private String constructionContact;

    @Column(length = 30)
    private String constructionPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApplicationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PriorityLevel priority;

    @Column(length = 1000)
    private String remark;

    @Column(length = 50)
    private String assignedHandler;

    @Column(length = 500)
    private String reviewOpinion;

    private LocalDateTime reviewedAt;

    @Column(length = 50)
    private String reviewedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 50)
    private String createdBy;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(length = 50)
    private String updatedBy;

    @Column(nullable = false)
    private Integer version;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EntryPermit> permits = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExceptionNote> exceptions = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OperationLog> operationLogs = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = ApplicationStatus.DRAFT;
        }
        if (this.priority == null) {
            this.priority = PriorityLevel.MEDIUM;
        }
        if (this.version == null) {
            this.version = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.version = this.version + 1;
    }
}
