package com.parking.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "gates")
public class Gate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String gateCode;

    @Column(nullable = false)
    private String gateName;

    @Column(nullable = false)
    private String direction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    private ParkingLot parkingLot;

    @Column(nullable = false)
    private Boolean online = true;
}
