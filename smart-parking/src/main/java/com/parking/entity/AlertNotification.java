package com.parking.entity;

import com.parking.enums.AlertType;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alert_notifications")
public class AlertNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertType alertType;

    private Long relatedFaultId;

    private Long relatedReleaseId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private Boolean acknowledged = false;

    private String acknowledgedBy;

    private LocalDateTime acknowledgedAt;

    private LocalDateTime createdAt = LocalDateTime.now();

    public static AlertNotification faultTimeout(GateFault fault) {
        AlertNotification alert = new AlertNotification();
        alert.setAlertType(AlertType.FAULT_TIMEOUT);
        alert.setRelatedFaultId(fault.getId());
        alert.setMessage("道闸故障[" + fault.getId() + "]超时未处理，类型：" + fault.getFaultType() + "，请尽快处理");
        return alert;
    }

    public static AlertNotification abnormalFrequency(Long gateId, int count) {
        AlertNotification alert = new AlertNotification();
        alert.setAlertType(AlertType.ABNORMAL_FREQUENCY);
        alert.setMessage("道闸[" + gateId + "]近期故障频发（" + count + "次），建议现场排查");
        return alert;
    }

    public static AlertNotification releaseRejected(RemoteRelease release) {
        AlertNotification alert = new AlertNotification();
        alert.setAlertType(AlertType.RELEASE_REJECTED);
        alert.setRelatedFaultId(release.getGateFault().getId());
        alert.setRelatedReleaseId(release.getId());
        alert.setMessage("远程放行[" + release.getId() + "]已驳回，车牌：" + release.getPlateNumber() + "，原因：" + release.getReviewRemark());
        return alert;
    }

    public static AlertNotification supplementNeeded(RemoteRelease release) {
        AlertNotification alert = new AlertNotification();
        alert.setAlertType(AlertType.RELEASE_SUPPLEMENT_NEEDED);
        alert.setRelatedFaultId(release.getGateFault().getId());
        alert.setRelatedReleaseId(release.getId());
        alert.setMessage("远程放行[" + release.getId() + "]需要补录信息，车牌：" + release.getPlateNumber());
        return alert;
    }

    public void acknowledge(String operator) {
        this.acknowledged = true;
        this.acknowledgedBy = operator;
        this.acknowledgedAt = LocalDateTime.now();
    }
}
