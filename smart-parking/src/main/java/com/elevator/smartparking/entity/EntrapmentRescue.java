package com.elevator.smartparking.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "entrapment_rescue")
public class EntrapmentRescue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rescue_no", nullable = false, unique = true, length = 30)
    private String rescueNo;

    @Column(name = "elevator_id", nullable = false)
    private Long elevatorId;

    @Column(name = "fault_report_id")
    private Long faultReportId;

    @Column(name = "trapped_count", nullable = false)
    private Integer trappedCount;

    @Column(name = "trapped_floor", length = 20)
    private String trappedFloor;

    @Column(name = "reporter_name", length = 50)
    private String reporterName;

    @Column(name = "reporter_phone", length = 20)
    private String reporterPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RescueStatus status;

    @Column(name = "report_time")
    private LocalDateTime reportTime;

    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;

    @Column(name = "rescued_time")
    private LocalDateTime rescuedTime;

    @Column(name = "complete_time")
    private LocalDateTime completeTime;

    @Column(name = "rescuer_id")
    private Long rescuerId;

    @Column(name = "assistant_ids", length = 200)
    private String assistantIds;

    @Column(name = "rescue_process", length = 2000)
    private String rescueProcess;

    @Column(name = "entrapment_reason", length = 500)
    private String entrapmentReason;

    @Column(name = "has_injury")
    private Boolean hasInjury;

    @Column(name = "injury_description", length = 500)
    private String injuryDescription;

    @Column(name = "solution", length = 1000)
    private String solution;

    @Column(name = "remark", length = 500)
    private String remark;

    @Column(name = "initial_remark", length = 1000)
    private String initialRemark;

    @Enumerated(EnumType.STRING)
    @Column(name = "export_status", length = 20)
    private ExportStatus exportStatus;

    @Column(name = "attachment_count")
    private Integer attachmentCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_status", length = 20)
    private NotificationStatus notificationStatus;

    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
