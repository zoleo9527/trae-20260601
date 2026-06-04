package com.medical.aesthetic.entity;

import com.medical.aesthetic.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "installment_plans")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstallmentPlan extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private Integer period;

    private LocalDate dueDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal principalAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal interestAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal paidAmount;

    private LocalDate paidDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PaymentStatus status;

    @Column(columnDefinition = "TEXT")
    private String remark;
}
