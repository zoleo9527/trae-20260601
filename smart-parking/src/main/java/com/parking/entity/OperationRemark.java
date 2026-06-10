package com.parking.entity;

import com.parking.enums.RemarkSource;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_remarks")
public class OperationRemark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long gateFaultId;

    private Long remoteReleaseId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RemarkSource source;

    @Column(nullable = false)
    private String operatorName;

    @Column(nullable = false)
    private String operatorRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt = LocalDateTime.now();

    public static OperationRemark fromFault(GateFault fault, String content) {
        OperationRemark remark = new OperationRemark();
        remark.setGateFaultId(fault.getId());
        remark.setSource(RemarkSource.GATE_FAULT);
        remark.setOperatorName(fault.getResolvedBy());
        remark.setOperatorRole("MAINTENANCE");
        remark.setContent(content);
        return remark;
    }

    public static OperationRemark fromRelease(RemoteRelease release, String operatorName, String content) {
        OperationRemark remark = new OperationRemark();
        remark.setRemoteReleaseId(release.getId());
        remark.setGateFaultId(release.getGateFault().getId());
        remark.setSource(RemarkSource.REMOTE_RELEASE);
        remark.setOperatorName(operatorName);
        remark.setOperatorRole("CUSTOMER_SERVICE");
        remark.setContent(content);
        return remark;
    }
}
