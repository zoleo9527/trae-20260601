package com.medical.aesthetic.entity;

import com.medical.aesthetic.enums.ComplaintStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_project_id", nullable = false)
    private CustomerProject customerProject;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(length = 100)
    private String complaintType;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ComplaintStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by")
    private Employee handledBy;

    private LocalDateTime handledAt;

    @Column(columnDefinition = "TEXT")
    private String handlingResult;

    @Column(columnDefinition = "TEXT")
    private String customerFeedback;

    private Integer satisfactionScore;
}
