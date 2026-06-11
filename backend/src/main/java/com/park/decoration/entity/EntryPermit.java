package com.park.decoration.entity;

import com.park.decoration.enums.PermitStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "entry_permits")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntryPermit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String permitNo;

    @Column(name = "application_id", nullable = false, insertable = false, updatable = false)
    private Long applicationId;

    @Column(nullable = false, length = 50)
    private String applicationNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private DecorationApplication application;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PermitStatus status;

    @Column(nullable = false)
    private LocalDateTime validFrom;

    @Column(nullable = false)
    private LocalDateTime validTo;

    @Column(length = 500)
    private String permittedScope;

    @Column(length = 200)
    private String permittedWorkTypes;

    @Column(length = 500)
    private String safetyRequirements;

    @Column(length = 500)
    private String responsibleParty;

    @Column(length = 500)
    private String managementRequirements;

    @Column(nullable = false, length = 50)
    private String issuedBy;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    @Column(length = 500)
    private String revokeReason;

    private LocalDateTime revokedAt;

    @Column(length = 50)
    private String revokedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
