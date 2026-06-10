package com.parking.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "supplement_records")
public class SupplementRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_fault_id", nullable = false)
    private GateFault gateFault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remote_release_id", nullable = false)
    private RemoteRelease remoteRelease;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @Column(nullable = false)
    private String plateNumber;

    @Column(nullable = false)
    private String supplementType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String operatorName;

    @Column(nullable = false)
    private String operatorRole;

    private LocalDateTime createdAt = LocalDateTime.now();

    public static SupplementRecord fromRemoteRelease(RemoteRelease release, String operatorName, String content) {
        SupplementRecord record = new SupplementRecord();
        record.setGateFault(release.getGateFault());
        record.setRemoteRelease(release);
        record.setGate(release.getGate());
        record.setPlateNumber(release.getPlateNumber());
        record.setSupplementType("REMOTE_RELEASE");
        record.setContent(content);
        record.setOperatorName(operatorName);
        record.setOperatorRole("CUSTOMER_SERVICE");
        return record;
    }
}
