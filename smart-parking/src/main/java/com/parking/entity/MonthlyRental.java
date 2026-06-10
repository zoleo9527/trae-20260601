package com.parking.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "monthly_rentals", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"plateNumber", "parkingLotId"})
})
public class MonthlyRental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String plateNumber;

    @Column(nullable = false)
    private Long parkingLotId;

    @Column(nullable = false)
    private String ownerName;

    @Column(nullable = false)
    private String ownerPhone;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();
}
