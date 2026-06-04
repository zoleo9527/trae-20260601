package com.medical.aesthetic.entity;

import com.medical.aesthetic.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_projects")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerProject extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    private Employee consultant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Employee doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_assistant_id")
    private Employee doctorAssistant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProjectStatus status;

    @Column(precision = 10, scale = 2)
    private BigDecimal quotedPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal finalPrice;

    private LocalDateTime scheduledTime;

    @Column(length = 50)
    private String operatingRoom;

    @Column(columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(columnDefinition = "TEXT")
    private String promiseContent;

    @Column(columnDefinition = "TEXT")
    private String preOperationNote;

    @Column(columnDefinition = "TEXT")
    private String postOperationNote;

    @Column(columnDefinition = "TEXT")
    private String internalRemark;
}
