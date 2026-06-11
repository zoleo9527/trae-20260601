package com.security.survey.entity;

import com.security.survey.enums.ConfirmStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "plan_confirms")
public class PlanConfirm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private PointSurvey survey;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String projectCode;

    @Column(length = 3000)
    private String planContent;

    @Column(length = 2000)
    private String equipmentList;

    private Double estimatedCost;

    private Integer constructionDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConfirmStatus status = ConfirmStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "sourceId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Remark> remarks = new ArrayList<>();

    @OneToMany(mappedBy = "sourceId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Remark> inheritedRemarks = new ArrayList<>();

    private LocalDateTime planDate;

    private LocalDateTime deadline;

    private LocalDateTime confirmedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private Boolean stuck = false;

    private String stuckReason;

    private LocalDateTime stuckAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addRemark(Remark remark) {
        remark.setSourceType("PLAN");
        remark.setSourceId(this.id);
        this.remarks.add(remark);
    }

    public void addInheritedRemark(Remark remark) {
        remark.setSourceType("PLAN");
        remark.setSourceId(this.id);
        remark.setInherited(true);
        this.inheritedRemarks.add(remark);
    }
}
