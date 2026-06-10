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

    @Column(nullable = false)
    private String plateNumber;

    @Column(nullable = false)
    private String eventType;

    private LocalDateTime eventTime = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String detail;
}
