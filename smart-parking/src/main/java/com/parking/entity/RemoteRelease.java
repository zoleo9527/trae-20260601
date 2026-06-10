package com.parking.entity;

import com.parking.enums.ReleaseStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "remote_releases")
public class RemoteRelease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_fault_id", nullable = false)
    private GateFault gateFault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @Column(nullable = false)
    private String plateNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReleaseStatus status = ReleaseStatus.PENDING;

    @Column(nullable = false)
    private String requestedBy;
    private LocalDateTime requestedAt = LocalDateTime.now();

    private String reviewedBy;
    private LocalDateTime reviewedAt;

    @Column(columnDefinition = "TEXT")
    private String reviewRemark;

    @Column(columnDefinition = "TEXT")
    private String supplementInfo;

    private LocalDateTime supplementAt;

    @Column(columnDefinition = "TEXT")
    private String inheritedRemark;

    public void inheritFaultRemark(String remark) {
        this.inheritedRemark = remark;
    }

    public void approve(String reviewer, String remark) {
        this.status = ReleaseStatus.APPROVED;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.reviewRemark = remark;
    }

    public void reject(String reviewer, String remark) {
        this.status = ReleaseStatus.REJECTED;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.reviewRemark = remark;
    }

    public void supplement(String info) {
        this.status = ReleaseStatus.SUPPLEMENTED;
        this.supplementInfo = info;
        this.supplementAt = LocalDateTime.now();
    }
}
