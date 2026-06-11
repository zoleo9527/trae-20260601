package com.park.decoration.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_logs")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private DecorationApplication application;

    @Column(nullable = false, length = 50)
    private String operationType;

    @Column(length = 100)
    private String fieldName;

    @Column(length = 2000)
    private String oldValue;

    @Column(length = 2000)
    private String newValue;

    @Column(length = 500)
    private String remark;

    @Column(nullable = false, length = 50)
    private String operator;

    @Column(nullable = false)
    private LocalDateTime operatedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.operatedAt == null) {
            this.operatedAt = LocalDateTime.now();
        }
    }
}
