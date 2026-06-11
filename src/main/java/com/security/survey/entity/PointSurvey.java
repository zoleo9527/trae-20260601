package com.security.survey.entity;

import com.security.survey.enums.SurveyStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "point_surveys")
public class PointSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String projectCode;

    private String customerName;

    private String address;

    @Column(length = 2000)
    private String pointDescription;

    private Integer pointCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SurveyStatus status = SurveyStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "sourceId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Remark> remarks = new ArrayList<>();

    private LocalDateTime surveyDate;

    private LocalDateTime deadline;

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
        remark.setSourceType("SURVEY");
        remark.setSourceId(this.id);
        this.remarks.add(remark);
    }
}
