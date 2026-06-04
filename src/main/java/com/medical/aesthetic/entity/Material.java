package com.medical.aesthetic.entity;

import com.medical.aesthetic.enums.MaterialStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "materials")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String category;

    @Column(length = 100)
    private String specification;

    @Column(length = 50)
    private String batchNumber;

    private LocalDate productionDate;

    private LocalDate expiryDate;

    @Column(length = 100)
    private String manufacturer;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;

    private Integer stockQuantity;

    @Column(length = 50)
    private String storageCondition;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MaterialStatus status;
}
