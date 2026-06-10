package com.parking.entity;

import com.parking.enums.FaultStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "gate_faults")
public class GateFault {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @Column(nullable = false)
    private String faultType;

    @Column(columnDefinition = "TEXT")
    private String faultDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FaultStatus status = FaultStatus.PENDING;

    @Column(nullable = false)
    private String reportedBy;

    private LocalDateTime reportedAt = LocalDateTime.now();

    private String resolvedBy;
    private LocalDateTime resolvedAt;

    @Column(columnDefinition = "TEXT")
    private String handlingRemark;

    private LocalDateTime handedOverAt;

    public void markProcessing(String handler) {
        this.status = FaultStatus.PROCESSING;
        this.resolvedBy = handler;
    }

    public void markResolved(String remark) {
        this.status = FaultStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        this.handlingRemark = remark;
    }

    public void markHandedOver() {
        this.status = FaultStatus.HANDED_OVER;
        this.handedOverAt = LocalDateTime.now();
    }
}
