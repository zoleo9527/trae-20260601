package com.medical.aesthetic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "follow_up_records")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpRecord extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_project_id", nullable = false)
    private CustomerProject customerProject;

    @Column(length = 50)
    private String followUpType;

    private LocalDateTime followUpTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followed_by")
    private Employee followedBy;

    @Column(columnDefinition = "TEXT")
    private String customerCondition;

    @Column(columnDefinition = "TEXT")
    private String guidance;

    @Column(columnDefinition = "TEXT")
    private String customerFeedback;

    private Integer satisfactionScore;

    @Column(columnDefinition = "TEXT")
    private String nextStep;

    private LocalDateTime nextFollowUpTime;
}
