package com.elevator.smartparking.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fault_report")
public class FaultReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_no", nullable = false, unique = true, length = 30)
    private String reportNo;

    @Column(name = "elevator_id", nullable = false)
    private Long elevatorId;

    @Column(name = "fault_type", length = 50)
    private String faultType;

    @Column(name = "fault_description", length = 1000)
    private String faultDescription;

    @Column(name = "reporter_name", length = 50)
    private String reporterName;

    @Column(name = "reporter_phone", length = 20)
    private String reporterPhone;

    @Column(name = "report_source", length = 30)
    private String reportSource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FaultStatus status;

    @Column(name = "handler_id")
    private Long handlerId;

    @Column(name = "accept_time")
    private LocalDateTime acceptTime;

    @Column(name = "complete_time")
    private LocalDateTime completeTime;

    @Column(name = "fault_result", length = 1000)
    private String faultResult;

    @Column(name = "solution", length = 1000)
    private String solution;

    @Column(name = "has_entrapment")
    private Boolean hasEntrapment;

    @Column(name = "entrapment_count")
    private Integer entrapmentCount;

    @Column(name = "transfer_rescue_id")
    private Long transferRescueId;

    @Column(name = "remark", length = 500)
    private String remark;

    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
