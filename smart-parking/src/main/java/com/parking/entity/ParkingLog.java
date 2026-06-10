package com.parking.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "parking_logs")
public class ParkingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @Column(name = "gate_fault_id")
    private Long gateFaultId;

    @Column(name = "remote_release_id")
    private Long remoteReleaseId;

    @Column(name = "operator_name")
    private String operatorName;

    @Column(name = "operator_role")
    private String operatorRole;

    @Column(nullable = false)
    private String plateNumber;

    @Column(nullable = false)
    private String eventType;

    private LocalDateTime eventTime = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String detail;
}
